import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import dotenv from 'dotenv';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

dotenv.config();

const fixPhotoUrl = (url: string | null, req: Request) => {
    if (!url) return null;
    const host = req.get('host') || 'localhost:5000';
    return url.replace(/(http:\/\/|https:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/g, `${req.protocol}://${host}`);
};

export const register = async (req: Request, res: Response) => {
    const { name, phone, email, password, role, car_model, car_color, plate_number } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction manually or just sequential inserts
        // Sequential for simplicity now. Transaction recommended for production.
        const [userResult] = await pool.execute<ResultSetHeader>(
            'INSERT INTO users (name, phone, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, phone, email, hashedPassword, role]
        );
        const userId = userResult.insertId;

        if (role === 'driver') {
            await pool.execute(
                'INSERT INTO drivers (user_id, car_model, car_color, plate_number) VALUES (?, ?, ?, ?)',
                [userId, car_model || null, car_color || null, plate_number || null]
            );
        }

        res.json({ success: true, message: 'User registered successfully', userId });
    } catch (error: any) {
        console.error('Register Error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (user && (await bcrypt.compare(password, user.password))) {
            // Check status for drivers
            if (user.role === 'driver') {
                if (user.status === 'pending') {
                    res.json({ success: false, status: 'pending', message: 'Your application has been submitted and is under review. You will be notified once approved.' });
                    return;
                }
                if (user.status === 'rejected') {
                    res.json({ success: false, status: 'rejected', message: 'Your application was rejected. Please contact support for details.' });
                    return;
                }
                if (user.status === 'suspended') {
                    res.json({ success: false, status: 'suspended', message: 'ACCOUNT SUSPENDED. CONTACT OR VISIT SERVICE PROVIDERS FOR MORE INFORMATION' });
                    return;
                }
            }

            let vehicleInfo = {};
            if (user.role === 'driver') {
                const [driverRows] = await pool.execute<RowDataPacket[]>('SELECT car_model, car_color, plate_number FROM drivers WHERE user_id = ?', [user.id]);
                if (driverRows.length > 0) {
                    vehicleInfo = driverRows[0];
                }
            }


            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'fallback_secret_key_change_in_prod',
                { expiresIn: '24h' }
            );

            // Update online status
            if (user.role === 'driver') {
                // For drivers, update the drivers table
                // Sync is_online (boolean) with online_status (enum)
                await pool.execute(
                    "UPDATE drivers SET is_online = TRUE, online_status = 'online', last_seen_at = NOW() WHERE user_id = ?",
                    [user.id]
                );
            } else if (user.role === 'admin' || user.role === 'super_admin') {
                // For admins, update the users table
                await pool.execute('UPDATE users SET is_online = TRUE WHERE id = ?', [user.id]);

                // Log login history for admins
                const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
                const userAgent = req.get('user-agent') || 'unknown';
                await pool.execute(
                    'INSERT INTO login_history (user_id, ip_address, user_agent) VALUES (?, ?, ?)',
                    [user.id, ipAddress, userAgent]
                );
            }

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    profile_photo: fixPhotoUrl(user.profile_photo, req),
                    ...vehicleInfo
                },
            });
        } else {
            res.json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const updateLocation = async (req: Request, res: Response) => {
    const { userId, lat, lng } = req.body;
    // console.log(`📍 Updating location for User ${userId}: ${lat}, ${lng}`);
    try {
        await pool.execute(
            'UPDATE users SET current_lat = ?, current_lng = ? WHERE id = ?',
            [lat, lng, userId]
        );
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
            // Query the user's role from the database
            const [userRows] = await pool.execute<RowDataPacket[]>(
                'SELECT role FROM users WHERE id = ?',
                [userId]
            );

            if (userRows.length > 0) {
                const userRole = userRows[0].role;

                if (userRole === 'driver') {
                    // For drivers, update the drivers table
                    await pool.execute(
                        "UPDATE drivers SET is_online = FALSE, online_status = 'offline' WHERE user_id = ?",
                        [userId]
                    );
                } else if (userRole === 'admin' || userRole === 'super_admin') {
                    // For admins, update the users table
                    await pool.execute('UPDATE users SET is_online = FALSE WHERE id = ?', [userId]);
                }
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
        name, phone, email, password,
        national_id, drivers_license_number, license_expiry_date,
        vehicle_type, vehicle_registration_number, vehicle_color,
        driving_experience_years
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const host = req.get('host') || 'localhost:5000';

        // 1. Create User (Pending)
        const [userResult] = await pool.execute<ResultSetHeader>(
            'INSERT INTO users (name, phone, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, phone, email, hashedPassword, 'driver', 'pending']
        );
        const userId = userResult.insertId;

        // 2. Map File Paths
        const getFileUrl = (fieldname: string) => {
            if (files && files[fieldname]) {
                return `http://${host}/uploads/${files[fieldname][0].filename}`;
            }
            return '';
        };

        const licenseDoc = getFileUrl('license_document');
        const nrcDoc = getFileUrl('national_id_document');
        const regDoc = getFileUrl('vehicle_registration_document');
        const profilePhoto = getFileUrl('profile_photo');

        // 3. Create Application
        const [appResult] = await pool.execute<ResultSetHeader>(
            `INSERT INTO driver_applications (
                user_id, full_name, phone, email, national_id, drivers_license_number, 
                license_expiry_date, vehicle_type, vehicle_registration_number, 
                vehicle_color, driving_experience_years, status, attempt_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, name, phone, email, national_id, drivers_license_number,
                license_expiry_date, vehicle_type, vehicle_registration_number,
                vehicle_color, driving_experience_years, 'pending', 1
            ]
        );
        const applicationId = appResult.insertId;

        // 4. Create Document Records
        const docTypes = [
            { field: 'license_document', type: 'license', url: licenseDoc },
            { field: 'national_id_document', type: 'nrc', url: nrcDoc },
            { field: 'vehicle_registration_document', type: 'registration', url: regDoc },
            { field: 'profile_photo', type: 'profile_photo', url: profilePhoto }
        ];

        for (const doc of docTypes) {
            if (doc.url) {
                await pool.execute(
                    'INSERT INTO driver_documents (application_id, doc_type, file_path, verification_status) VALUES (?, ?, ?, ?)',
                    [applicationId, doc.type, doc.url, 'unverified']
                );
            }
        }

        // Update user profile photo immediately if uploaded
        if (profilePhoto) {
            await pool.execute('UPDATE users SET profile_photo = ? WHERE id = ?', [profilePhoto, userId]);
        }

        // Log the action
        await pool.execute(
            'INSERT INTO audit_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
            [userId, 'driver_application_submitted', 'driver_application', applicationId, JSON.stringify({ name, email, vehicle_type })]
        );

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
        const photoUrl = `http://${host}/uploads/${req.file.filename}`;

        await pool.execute(
            'UPDATE users SET profile_photo = ? WHERE id = ?',
            [photoUrl, userId]
        );

        res.json({ success: true, message: 'Photo uploaded successfully', photoUrl: fixPhotoUrl(photoUrl, req) });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};
