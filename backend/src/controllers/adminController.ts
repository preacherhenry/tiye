import { Request, Response } from 'express';
import { db } from '../config/firebase';
import bcrypt from 'bcryptjs';
import { checkOfflineStatus } from './driverController';

const fixUrl = (url: string | null, req: Request) => {
    if (!url) return null;
    if (url.startsWith('http')) {
        const host = req.get('host') || 'localhost:5000';
        const fixed = url.replace(/(http:\/\/|https:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/g, `${req.protocol}://${host}`);
        return fixed;
    }
    return url;
};

export const getPendingApplications = async (req: Request, res: Response) => {
    try {
        const querySnapshot = await db.collection('driver_applications')
            .where('status', 'in', ['pending', 'resubmitted'])
            .get();

        const applications = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const app = doc.data();
            const userDoc = await db.collection('users').doc(app.user_id).get();
            const userData = userDoc.data() || {};

            return {
                ...app,
                id: doc.id,
                user_name: userData.name,
                user_avatar: fixUrl(userData.profile_photo, req)
            };
        }));

        res.json({ success: true, applications });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getApplicationDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const appDoc = await db.collection('driver_applications').doc(id).get();
        if (!appDoc.exists) return res.json({ success: false, message: 'Application not found' });

        const docSnapshot = await db.collection('driver_documents')
            .where('application_id', '==', id)
            .get();

        const documents = docSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            file_path: fixUrl(doc.data().file_path, req)
        }));

        res.json({
            success: true,
            application: { ...appDoc.data(), id: appDoc.id },
            documents
        });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const verifyDocument = async (req: Request, res: Response) => {
    const { docId } = req.params;
    const { status, reason } = req.body; // 'verified' or 'rejected'
    const adminId = (req as any).user?.id || null;

    try {
        const docRef = db.collection('driver_documents').doc(docId);
        await docRef.update({
            verification_status: status,
            rejection_reason: reason || null,
            verified_by: adminId,
            verified_at: new Date().toISOString()
        });

        // Log to document_audit_logs
        await db.collection('document_audit_logs').add({
            document_id: docId,
            admin_id: adminId,
            action: status === 'verified' ? 'verify' : 'reject',
            notes: reason || null,
            timestamp: new Date().toISOString()
        });

        res.json({ success: true, message: `Document ${status}` });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const approveApplication = async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = (req as any).user?.id || null;

    try {
        const result = await db.runTransaction(async (transaction) => {
            const appRef = db.collection('driver_applications').doc(id);
            const appDoc = await transaction.get(appRef);

            if (!appDoc.exists) {
                throw new Error('Application not found');
            }
            const app = appDoc.data()!;

            // 2. Find user
            const userRef = db.collection('users').doc(app.user_id);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error('Associated user account not found');
            }

            // 3. CHECK if all required documents are verified
            const docsSnapshot = await db.collection('driver_documents')
                .where('application_id', '==', id)
                .get();

            const unverified = docsSnapshot.docs.filter(d => d.data().verification_status !== 'verified');
            if (unverified.length > 0) {
                return { success: false, message: 'Cannot approve: All documents must be verified first.' };
            }

            // 4. Update application status
            transaction.update(appRef, {
                status: 'approved',
                reviewed_by: adminId,
                reviewed_at: new Date().toISOString()
            });

            // 5. Update user status
            transaction.update(userRef, { status: 'approved' });

            // 6. Create/Update driver record
            const driverRef = db.collection('drivers').doc(app.user_id);
            transaction.set(driverRef, {
                user_id: app.user_id,
                car_model: app.vehicle_type + ' ' + app.vehicle_registration_number,
                car_color: app.vehicle_color,
                plate_number: app.vehicle_registration_number,
                rating: 5.0,
                online_status: 'offline',
                is_online: false,
                subscription_status: 'none'
            }, { merge: true });

            // 7. Log the overall approval
            const auditRef = db.collection('audit_logs').doc();
            transaction.set(auditRef, {
                user_id: adminId,
                action: 'approve_driver_application',
                target_type: 'driver_application',
                target_id: id,
                details: JSON.stringify({ userId: app.user_id, email: app.email }),
                timestamp: new Date().toISOString()
            });

            return { success: true };
        });

        if (result.success) {
            res.json({ success: true, message: 'Application approved' });
        } else {
            res.json(result);
        }
    } catch (error: any) {
        console.error('Approve Error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const rejectApplication = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user?.id || null;

    try {
        const appRef = db.collection('driver_applications').doc(id);
        const appDoc = await appRef.get();
        if (!appDoc.exists) return res.json({ success: false, message: 'Application not found' });
        const app = appDoc.data()!;

        await db.runTransaction(async (transaction) => {
            transaction.update(appRef, {
                status: 'rejected',
                rejection_reason: reason,
                reviewed_by: adminId,
                reviewed_at: new Date().toISOString(),
                rejected_at: new Date().toISOString()
            });

            transaction.update(db.collection('users').doc(app.user_id), { status: 'rejected' });

            transaction.set(db.collection('audit_logs').doc(), {
                user_id: adminId,
                action: 'reject_driver_application',
                target_type: 'driver_application',
                target_id: id,
                details: JSON.stringify({ email: app.email, reason }),
                timestamp: new Date().toISOString()
            });
        });

        res.json({ success: true, message: 'Application rejected' });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getRejectedApplications = async (req: Request, res: Response) => {
    try {
        const querySnapshot = await db.collection('driver_applications')
            .where('status', '==', 'rejected')
            .get();

        const applications = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const app = doc.data();
            const userDoc = await db.collection('users').doc(app.user_id).get();
            const userData = userDoc.data() || {};

            return {
                ...app,
                id: doc.id,
                user_name: userData.name,
                user_avatar: fixUrl(userData.profile_photo, req)
            };
        }));

        res.json({ success: true, applications });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getAnalyticsStats = async (req: Request, res: Response) => {
    try {
        // 1. Overview Stats (Fetch all necessary docs for client-side aggregation)
        // Note: For large datasets, this should use Firebase Extensions for aggregation
        // but for this migration we will do it in code.
        const usersSnapshot = await db.collection('users').get();
        const ridesSnapshot = await db.collection('ride_requests').get();
        const appSnapshot = await db.collection('driver_applications').get();

        // 2. Format user distribution
        const users = { total: usersSnapshot.size, passengers: 0, drivers: 0, admins: 0 };
        usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.role === 'passenger') users.passengers++;
            else if (data.role === 'driver') users.drivers++;
            else if (['admin', 'super_admin'].includes(data.role)) users.admins++;
        });

        // 3. Format ride statistics & revenue
        let totalRevenue = 0;
        const rides = { total: ridesSnapshot.size, completed: 0, cancelled: 0, pending: 0 };
        const growthTrendMap: { [key: string]: number } = {};

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        ridesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.status === 'completed') {
                rides.completed++;
                totalRevenue += Number(data.fare || 0);
            } else if (data.status === 'cancelled') {
                rides.cancelled++;
            } else if (['pending', 'accepted', 'arrived', 'picked_up'].includes(data.status)) {
                rides.pending++;
            }

            // Daily Growth (Last 7 days)
            const createdAt = new Date(data.created_at);
            if (createdAt >= sevenDaysAgo) {
                const dateKey = createdAt.toISOString().split('T')[0];
                growthTrendMap[dateKey] = (growthTrendMap[dateKey] || 0) + 1;
            }
        });

        const growthTrend = Object.keys(growthTrendMap).sort().map(date => ({
            date,
            count: growthTrendMap[date]
        }));

        // 4. Format application metrics
        const applications = { total: appSnapshot.size, pending: 0, approved: 0, rejected: 0 };
        appSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (['pending', 'resubmitted'].includes(data.status)) applications.pending++;
            else if (data.status === 'approved') applications.approved++;
            else if (data.status === 'rejected') applications.rejected++;
        });

        res.json({
            success: true,
            stats: {
                users,
                rides,
                applications,
                totalRevenue,
                growthTrend
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Run cleanup
        await checkOfflineStatus();

        // Fetch data for dashboard
        const appSnapshot = await db.collection('driver_applications').get();
        const usersSnapshot = await db.collection('users').get();
        const ridesSnapshot = await db.collection('ride_requests').where('status', '==', 'completed').get();
        const onlineDriversSnapshot = await db.collection('drivers').where('online_status', '!=', 'offline').get();

        let revenue = 0;
        ridesSnapshot.docs.forEach(doc => revenue += Number(doc.data().fare || 0));

        let suspended = 0;
        let passengers = 0;
        let approvedDrivers = 0;
        usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.status === 'suspended') suspended++;
            if (data.role === 'passenger') passengers++;
            if (data.role === 'driver' && (data.status === 'active' || data.status === 'approved')) approvedDrivers++;
        });

        const stats = {
            pending: 0,
            approved: approvedDrivers,
            rejected: 0,
            suspended,
            revenue,
            onlineDrivers: onlineDriversSnapshot.size,
            totalPassengers: passengers,
            totalUsers: usersSnapshot.size
        };

        appSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (['pending', 'resubmitted'].includes(data.status)) stats.pending++;
            else if (data.status === 'rejected') stats.rejected++;
        });

        // Recent Activity (Latest 5 applications)
        const recentAppsSnapshot = await db.collection('driver_applications')
            .orderBy('created_at', 'desc')
            .limit(5)
            .get();

        const recentActivity = await Promise.all(recentAppsSnapshot.docs.map(async (doc) => {
            const app = doc.data();
            const userDoc = await db.collection('users').doc(app.user_id).get();
            const userData = userDoc.data() || {};

            return {
                id: doc.id,
                type: 'application',
                user: userData.name,
                avatar: fixUrl(userData.profile_photo, req),
                details: `submitted a new driver application.`,
                time: app.created_at
            };
        }));

        res.json({ success: true, stats, recentActivity });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllDrivers = async (req: Request, res: Response) => {
    try {
        // Clean up stale online statuses first
        await checkOfflineStatus();

        const usersSnapshot = await db.collection('users')
            .where('role', '==', 'driver')
            .get();

        const drivers = await Promise.all(usersSnapshot.docs.map(async (userDoc) => {
            const userData = userDoc.data();
            const driverRef = db.collection('drivers').doc(userDoc.id);
            const driverDoc = await driverRef.get();
            const driverData = driverDoc.data() || {};

            // Count completed trips
            const tripsSnapshot = await db.collection('ride_requests')
                .where('driver_id', '==', userDoc.id)
                .where('status', '==', 'completed')
                .get();

            return {
                ...userData,
                ...driverData,
                id: userDoc.id,
                profile_photo: fixUrl(userData.profile_photo, req),
                total_trips: tripsSnapshot.size
            };
        }));

        drivers.sort((a, b) => new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime());

        res.json({ success: true, drivers });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleDriverStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'suspended'
    const adminUser = (req as any).user;
    const adminId = adminUser?.id || null;

    if (!['approved', 'suspended', 'rejected'].includes(status)) {
        return res.json({ success: false, message: 'Invalid status' });
    }

    // Only super_admin can activate/approve
    if (status === 'approved' && adminUser?.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Only Super Admin can activate drivers' });
    }

    try {
        const userRef = db.collection('users').doc(id);
        await userRef.update({ status });

        // Log the action
        await db.collection('audit_logs').add({
            user_id: adminId,
            action: 'update_user_status',
            target_type: 'user',
            target_id: id,
            details: JSON.stringify({ status }),
            timestamp: new Date().toISOString()
        });

        res.json({ success: true, message: `Driver status updated to ${status}` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDriverProfile = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`🔍 [GET PROFILE] Fetching driver profile for ID: ${id}`);

    try {
        // Run cleanup to ensure status is accurate
        await checkOfflineStatus();

        // 1. Core Profile
        const userDoc = await db.collection('users').doc(id).get();
        console.log(`🔍 [GET PROFILE] UserDoc exists: ${userDoc.exists}`);

        if (userDoc.exists) {
            console.log(`🔍 [GET PROFILE] User Role: ${userDoc.data()?.role}`);
        }

        if (!userDoc.exists || userDoc.data()?.role !== 'driver') {
            console.warn(`❌ [GET PROFILE] Driver not found or role mismatch`);
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        const driverDoc = await db.collection('drivers').doc(id).get();
        const userData = userDoc.data()!;
        const driverData = driverDoc.data() || {};

        const driver = {
            ...userData,
            ...driverData,
            id: userDoc.id,
            profile_photo: fixUrl(userData.profile_photo, req)
        };

        // Calculate Real-time Status
        let realTimeStatus = (driver as any).is_online ? 'idle' : 'offline';

        // 2. Active Trip Check
        const activeTripSnapshot = await db.collection('ride_requests')
            .where('driver_id', '==', id)
            .where('status', 'in', ['accepted', 'arrived', 'picked_up'])
            .limit(1)
            .get();

        let activeTrip = null;
        if (!activeTripSnapshot.empty) {
            realTimeStatus = 'busy';
            const tripData = activeTripSnapshot.docs[0].data();
            const passengerDoc = await db.collection('users').doc(tripData.passenger_id).get();
            activeTrip = {
                ...tripData,
                id: activeTripSnapshot.docs[0].id,
                passenger_name: passengerDoc.data()?.name
            };
        }

        (driver as any).realTimeStatus = realTimeStatus;

        // 3. Earnings & Trip Counts
        const allTripsSnapshot = await db.collection('ride_requests')
            .where('driver_id', '==', id)
            .get();

        const stats = {
            totalEarnings: 0,
            completedTrips: 0,
            cancelled_trips: 0
        };

        allTripsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.status === 'completed') {
                stats.completedTrips++;
                stats.totalEarnings += Number(data.fare || 0);
            } else if (data.status === 'cancelled') {
                stats.cancelled_trips++;
            }
        });

        // 4. Trip History (re-query for ordering and limit)
        const tripHistorySnapshot = await db.collection('ride_requests')
            .where('driver_id', '==', id)
            .orderBy('created_at', 'desc')
            .limit(50)
            .get();

        const trips = await Promise.all(tripHistorySnapshot.docs.map(async (doc) => {
            const trip = doc.data();
            const passDoc = await db.collection('users').doc(trip.passenger_id).get();
            return {
                ...trip,
                id: doc.id,
                passenger_name: passDoc.data()?.name
            };
        }));

        // 5. Subscription History
        const subSnapshot = await db.collection('driver_subscriptions')
            .where('driver_id', '==', id)
            .orderBy('created_at', 'desc')
            .get();

        const subscriptions = await Promise.all(subSnapshot.docs.map(async (doc) => {
            const sub = doc.data();
            const planDoc = await db.collection('subscription_plans').doc(sub.plan_id).get();
            const plan = planDoc.data() || {};
            return {
                ...sub,
                id: doc.id,
                plan_name: plan.name,
                price: plan.price,
                duration_days: plan.duration_days
            };
        }));

        res.json({
            success: true,
            driver,
            activeTrip,
            stats,
            trips,
            subscriptions
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTripDetails = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const rideRef = db.collection('ride_requests').doc(id);
        const rideDoc = await rideRef.get();

        if (!rideDoc.exists) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }

        const tripData = rideDoc.data()!;
        const passengerDoc = await db.collection('users').doc(tripData.passenger_id).get();
        const passengerData = passengerDoc.data() || {};

        let driverData = {};
        let driverProfileData = {};
        if (tripData.driver_id) {
            const dUserDoc = await db.collection('users').doc(tripData.driver_id).get();
            driverData = dUserDoc.data() || {};
            const dProfileDoc = await db.collection('drivers').doc(tripData.driver_id).get();
            driverProfileData = dProfileDoc.data() || {};
        }

        const trip = {
            ...tripData,
            id: rideDoc.id,
            passenger_name: passengerData.name,
            passenger_phone: passengerData.phone,
            passenger_avatar: fixUrl(passengerData.profile_photo, req),
            driver_name: (driverData as any).name,
            driver_phone: (driverData as any).phone,
            driver_avatar: fixUrl((driverData as any).profile_photo, req),
            car_model: (driverProfileData as any).car_model,
            plate_number: (driverProfileData as any).plate_number
        };

        res.json({ success: true, trip });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllAdmins = async (req: Request, res: Response) => {
    try {
        const querySnapshot = await db.collection('users')
            .where('role', 'in', ['admin', 'super_admin'])
            .get();

        const admins = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            profile_photo: fixUrl(doc.data().profile_photo, req)
        }));

        admins.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        res.json({ success: true, admins });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createAdmin = async (req: Request, res: Response) => {
    const { name, email, phone, password, role } = req.body;

    try {
        // Check if email already exists
        const emailCheck = await db.collection('users').where('email', '==', email).get();
        if (!emailCheck.empty) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const adminRef = db.collection('users').doc();
        await adminRef.set({
            name,
            email,
            phone,
            password: hashedPassword,
            role: role || 'admin',
            status: 'active',
            is_online: false,
            created_at: new Date().toISOString()
        });

        res.status(201).json({ success: true, message: 'Admin created successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleAdminStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await db.collection('users').doc(id).update({ status });
        res.json({ success: true, message: `Admin status updated to ${status}` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAdminRole = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    try {
        await db.collection('users').doc(id).update({ role });
        res.json({ success: true, message: `Admin role updated to ${role}` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAdminProfile = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { name, email, phone } = req.body;

    try {
        // Check if email is already taken by another user
        if (email) {
            const emailCheck = await db.collection('users')
                .where('email', '==', email)
                .get();

            const otherUsers = emailCheck.docs.filter(doc => doc.id !== userId);
            if (otherUsers.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
        }

        // Update profile
        const userRef = db.collection('users').doc(userId);
        await userRef.update({ name, email, phone });

        // Fetch updated user data
        const updatedDoc = await userRef.get();
        const userData = updatedDoc.data();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: { ...userData, id: updatedDoc.id }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;

    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, userDoc.data()?.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userRef.update({ password: hashedPassword });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const uploadAdminProfilePhoto = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
        const host = req.get('host') || 'localhost:5000';
        const photoUrl = `${req.protocol}://${host}/uploads/${req.file.filename}`;

        const userRef = db.collection('users').doc(userId);
        await userRef.update({ profile_photo: photoUrl });

        const updatedDoc = await userRef.get();
        const fixedPhotoUrl = fixUrl(photoUrl, req);

        res.json({
            success: true,
            message: 'Profile photo uploaded successfully',
            photoUrl: fixedPhotoUrl,
            user: { ...updatedDoc.data(), id: updatedDoc.id, profile_photo: fixedPhotoUrl }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getLoginHistory = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    try {
        const querySnapshot = await db.collection('login_history')
            .where('user_id', '==', userId)
            .orderBy('login_time', 'desc')
            .limit(20)
            .get();

        const history = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({ success: true, history });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPassengers = async (req: Request, res: Response) => {
    try {
        const querySnapshot = await db.collection('users')
            .where('role', '==', 'passenger')
            .get();

        const passengers = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const userData = doc.data();
            const tripsSnapshot = await db.collection('ride_requests')
                .where('passenger_id', '==', doc.id)
                .get();

            return {
                ...userData,
                id: doc.id,
                profile_photo: fixUrl(userData.profile_photo, req),
                total_trips: tripsSnapshot.size
            };
        }));

        passengers.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        res.json({ success: true, passengers });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const updateUserStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const adminUser = (req as any).user;
    if (status === 'active' && adminUser?.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Only Super Admin can activate users' });
    }

    try {
        await db.collection('users').doc(id).update({ status });
        res.json({ success: true, message: `User status updated to ${status}` });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getPassengerProfile = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // 1. Get User Details
        const userDoc = await db.collection('users').doc(id).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'passenger') {
            return res.json({ success: false, message: 'Passenger not found' });
        }

        const userData = userDoc.data()!;
        const user = {
            ...userData,
            id: userDoc.id,
            profile_photo: fixUrl(userData.profile_photo, req)
        };

        // 2. Get Ride History
        const ridesSnapshot = await db.collection('ride_requests')
            .where('passenger_id', '==', id)
            .orderBy('created_at', 'desc')
            .get();

        const trips = await Promise.all(ridesSnapshot.docs.map(async (doc) => {
            const trip = doc.data();
            let driverName = 'N/A';
            if (trip.driver_id) {
                const dDoc = await db.collection('users').doc(trip.driver_id).get();
                driverName = dDoc.data()?.name || 'N/A';
            }
            return {
                ...trip,
                id: doc.id,
                driver_name: driverName
            };
        }));

        // 3. Get Stats
        const stats = {
            total_trips: trips.length,
            completed_trips: trips.filter((r: any) => r.status === 'completed').length,
            cancelled_trips: trips.filter((r: any) => r.status === 'cancelled').length,
            total_spent: trips
                .filter((r: any) => r.status === 'completed')
                .reduce((sum, r: any) => sum + Number(r.fare || 0), 0)
        };

        res.json({
            success: true,
            user,
            trips,
            stats
        });

    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};
