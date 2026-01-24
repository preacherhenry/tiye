import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase';
import dotenv from 'dotenv';

dotenv.config();

const fixPhotoUrl = (url: string | null, req: Request) => {
    if (!url) return null;
    const host = req.get('host') || 'localhost:5000';
    return url.replace(/(http:\/\/|https:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/g, `${req.protocol}://${host}`);
};

export const register = async (req: Request, res: Response) => {
    const { username, name, phone, email, password, role, car_model, car_color, plate_number } = req.body;

    if (!username || !name || !phone || !password || !role) {
        return res.json({ success: false, message: 'Missing required fields' });
    }

    try {
        const usernameLower = username.toLowerCase().trim();
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Check if username already exists
        const usernameQuery = await db.collection('users').where('username_lower', '==', usernameLower).get();
        if (!usernameQuery.empty) {
            return res.json({ success: false, message: 'Username is already taken' });
        }

        // 2. Check if email already exists (only if provided)
        if (email) {
            const emailQuery = await db.collection('users').where('email', '==', email).get();
            if (!emailQuery.empty) {
                return res.json({ success: false, message: 'User with this email already exists' });
            }
        }

        const newUserRef = db.collection('users').doc();
        const userId = newUserRef.id;

        const userData: any = {
            id: userId,
            username,
            username_lower: usernameLower,
            name,
            phone,
            password: hashedPassword,
            role,
            status: 'active',
            created_at: new Date().toISOString(),
            is_online: false
        };

        if (email) userData.email = email;

        await newUserRef.set(userData);

        if (role === 'driver') {
            await db.collection('drivers').doc(userId).set({
                user_id: userId,
                car_model: car_model || null,
                car_color: car_color || null,
                plate_number: plate_number || null,
                online_status: 'offline',
                is_online: false,
                subscription_status: 'inactive'
            });
        }

        res.json({ success: true, message: 'User registered successfully', userId });
    } catch (error: any) {
        console.error('Register Error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    console.log(`Login attempt for: ${identifier}`);

    if (!identifier || !password) {
        return res.json({ success: false, message: 'Username/Email and Password are required' });
    }

    try {
        const idLower = identifier.toLowerCase().trim();

        // Try searching by username_lower OR email
        let userQuery = await db.collection('users').where('username_lower', '==', idLower).limit(1).get();

        if (userQuery.empty) {
            // Fallback: check email
            userQuery = await db.collection('users').where('email', '==', identifier).limit(1).get();
        }

        if (userQuery.empty) {
            console.log(`Login failed: User not found for ${identifier}`);
            res.json({ success: false, message: 'Invalid credentials or unauthorized access' });
            return;
        }

        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        const user: any = {
            ...userData,
            id: userData.id || userDoc.id
        };

        if (user && (await bcrypt.compare(password, user.password))) {
            // 1. Check for account suspension
            if (user.status === 'suspended') {
                res.json({ success: false, status: 'suspended', message: 'ACCOUNT SUSPENDED. CONTACT OR VISIT SERVICE PROVIDERS FOR MORE INFORMATION' });
                return;
            }

            // 2. Check application status specifically for drivers
            if (user.role === 'driver') {
                if (user.status === 'pending') {
                    res.json({ success: false, status: 'pending', message: 'Your application has been submitted and is under review. You will be notified once approved.' });
                    return;
                }
                if (user.status === 'rejected') {
                    res.json({ success: false, status: 'rejected', message: 'Your application was rejected. Please contact support for details.' });
                    return;
                }
            }

            let vehicleInfo = {};
            if (user.role === 'driver') {
                const driverDoc = await db.collection('drivers').doc(user.id).get();
                if (driverDoc.exists) {
                    vehicleInfo = driverDoc.data() || {};
                }
            }

            const token = jwt.sign(
                { id: user.id, email: user.email || user.username, role: user.role },
                process.env.JWT_SECRET || 'fallback_secret_key_change_in_prod',
                { expiresIn: '24h' }
            );

            // Update online status
            if (user.role === 'driver') {
                if (user.id) {
                    await db.collection('drivers').doc(user.id).update({
                        is_online: true,
                        online_status: 'online',
                        last_seen_at: new Date().toISOString()
                    });
                }
            } else if (user.role === 'admin' || user.role === 'super_admin') {
                if (user.id) {
                    await db.collection('users').doc(user.id).update({
                        is_online: true
                    });

                    // Log login history
                    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
                    const userAgent = req.get('user-agent') || 'unknown';
                    await db.collection('login_history').add({
                        user_id: user.id,
                        ip_address: ipAddress,
                        user_agent: userAgent,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            console.log(`Login successful for user: ${user.id} (${user.role})`);
            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    email: user.email || null,
                    phone: user.phone,
                    role: user.role,
                    profile_photo: fixPhotoUrl(user.profile_photo, req),
                    ...vehicleInfo
                },
            });
        } else {
            console.log(`Login failed: Invalid credentials for ${identifier}`);
            res.json({ success: false, message: 'Invalid credentials or unauthorized access' });
        }
    } catch (error: any) {
        console.error('Login Error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const updateLocation = async (req: Request, res: Response) => {
    const { userId, lat, lng, heading } = req.body;
    try {
        const updateData: any = {
            current_lat: lat,
            current_lng: lng,
            last_location_update: new Date().toISOString()
        };
        if (heading !== undefined) {
            updateData.heading = heading;
        }

        await db.collection('users').doc(userId).update(updateData);

        // Also update driver collection if role is driver
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists && userDoc.data()?.role === 'driver') {
            await db.collection('drivers').doc(userId).update(updateData);
        }

        res.json({ success: true, message: 'Location updated' });
    } catch (error: any) {
        console.error('Location update error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const logout = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    try {
        if (userId) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const user = userDoc.data();
                if (user?.role === 'driver') {
                    await db.collection('drivers').doc(userId).update({
                        is_online: false,
                        online_status: 'offline'
                    });
                }

                await db.collection('users').doc(userId).update({
                    is_online: false
                });
            }
        }
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
        console.error('Logout error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const applyDriver = async (req: Request, res: Response) => {
    const {
        username, name, phone, email, password,
        national_id, drivers_license_number, license_expiry_date,
        vehicle_type, vehicle_registration_number, vehicle_color,
        driving_experience_years
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    try {
        if (!username || !name || !phone || !password) {
            return res.json({ success: false, message: 'Missing required personal details' });
        }

        const usernameLower = username.toLowerCase().trim();

        // 1. Check if username is already taken
        const usernameQuery = await db.collection('users').where('username_lower', '==', usernameLower).get();
        if (!usernameQuery.empty) {
            return res.json({ success: false, message: 'Username is already taken' });
        }

        // 2. Check if email is already used (if provided)
        if (email) {
            const emailQuery = await db.collection('users').where('email', '==', email).get();
            if (!emailQuery.empty) {
                return res.json({ success: false, message: 'User with this email already exists' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const host = req.get('host') || 'localhost:5000';

        // 3. Create User (Pending)
        const newUserRef = db.collection('users').doc();
        const userId = newUserRef.id;

        const profilePhoto = files?.['profile_photo']
            ? `${req.protocol}://${host}/uploads/${files['profile_photo'][0].filename}`
            : '';

        const userData: any = {
            id: userId,
            username,
            username_lower: usernameLower,
            name,
            phone,
            password: hashedPassword,
            role: 'driver',
            status: 'pending',
            profile_photo: profilePhoto,
            created_at: new Date().toISOString()
        };

        if (email) userData.email = email;

        await newUserRef.set(userData);

        // 4. Map File Paths
        const getFileUrl = (fieldname: string) => {
            if (files && files[fieldname]) {
                return `${req.protocol}://${host}/uploads/${files[fieldname][0].filename}`;
            }
            return '';
        };

        const licenseFront = getFileUrl('license_front');
        const licenseBack = getFileUrl('license_back');
        const nrcFront = getFileUrl('nrc_front');
        const nrcBack = getFileUrl('nrc_back');

        // 5. Create Application
        const appRef = db.collection('driver_applications').doc();
        const applicationId = appRef.id;

        await appRef.set({
            id: applicationId,
            user_id: userId,
            username,
            full_name: name,
            phone,
            email: email || null,
            national_id,
            drivers_license_number,
            license_expiry_date,
            vehicle_type,
            vehicle_registration_number,
            vehicle_color,
            driving_experience_years,
            status: 'pending',
            attempt_count: 1,
            license_front: licenseFront,
            license_back: licenseBack,
            nrc_front: nrcFront,
            nrc_back: nrcBack,
            profile_photo: profilePhoto,
            created_at: new Date().toISOString()
        });

        // 4. Create Document Records
        const docTypes = [
            { type: 'license_front', url: licenseFront },
            { type: 'license_back', url: licenseBack },
            { type: 'nrc_front', url: nrcFront },
            { type: 'nrc_back', url: nrcBack },
            { type: 'profile_photo', url: profilePhoto }
        ];

        for (const doc of docTypes) {
            if (doc.url) {
                await db.collection('driver_documents').add({
                    application_id: applicationId,
                    doc_type: doc.type,
                    file_path: doc.url,
                    verification_status: 'unverified',
                    created_at: new Date().toISOString()
                });
            }
        }

        // Log the action
        await db.collection('audit_logs').add({
            user_id: userId,
            action: 'driver_application_submitted',
            target_type: 'driver_application',
            target_id: applicationId,
            details: JSON.stringify({ name, email, vehicle_type }),
            timestamp: new Date().toISOString()
        });

        res.json({ success: true, message: 'Application submitted successfully' });
    } catch (error: any) {
        console.error('Apply Driver Error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const uploadProfilePhoto = async (req: Request, res: Response) => {
    const { userId } = req.body;
    if (!req.file) {
        res.json({ success: false, message: 'No file uploaded' });
        return;
    }

    try {
        const host = req.get('host') || 'localhost:5000';
        const photoUrl = `${req.protocol}://${host}/uploads/${req.file.filename}`;

        await db.collection('users').doc(userId).update({
            profile_photo: photoUrl
        });

        res.json({ success: true, message: 'Photo uploaded successfully', photoUrl: fixPhotoUrl(photoUrl, req) });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
        res.json({ success: false, message: 'Name, email and phone are required' });
        return;
    }

    try {
        // Check if email or phone is already used by another user in Firestore
        const emailCheck = await db.collection('users').where('email', '==', email).get();
        const phoneCheck = await db.collection('users').where('phone', '==', phone).get();

        const emailExists = emailCheck.docs.some(doc => doc.id !== userId);
        const phoneExists = phoneCheck.docs.some(doc => doc.id !== userId);

        if (emailExists || phoneExists) {
            res.json({ success: false, message: 'Email or phone number already in use' });
            return;
        }

        await db.collection('users').doc(userId).update({
            name,
            email,
            phone
        });

        const userDoc = await db.collection('users').doc(userId).get();
        const user = userDoc.data();

        if (!user) {
            res.json({ success: false, message: 'User not found' });
            return;
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user.id || userDoc.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profile_photo: fixPhotoUrl(user.profile_photo, req),
            }
        });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getUserProfile = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            res.json({ success: false, message: 'User not found' });
            return;
        }

        const user = userDoc.data();
        if (!user) {
            res.json({ success: false, message: 'User data missing' });
            return;
        }

        let driverInfo = {};

        if (user.role === 'driver') {
            const driverDoc = await db.collection('drivers').doc(userId).get();
            if (driverDoc.exists) {
                const driver = driverDoc.data();
                if (driver) {
                    driverInfo = {
                        subscription_status: driver.subscription_status,
                        subscription_expiry: driver.subscription_expiry
                    };
                }
            }
        }

        res.json({
            success: true,
            user: {
                id: user.id || userDoc.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profile_photo: fixPhotoUrl(user.profile_photo, req),
                ...driverInfo
            }
        });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};
