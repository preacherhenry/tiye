import { Request, Response } from 'express';
import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';

const fixUrl = (url: string | null, req: Request) => {
    if (!url) return null;
    if (url.startsWith('http')) {
        const host = req.get('host') || 'localhost:5000';
        const fixed = url.replace(/(http:\/\/|https:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/g, `${req.protocol}://${host}`);
        console.log(`[fixUrl] In: ${url} | Out: ${fixed}`);
        return fixed;
    }
    return url;
};

export const getPendingApplications = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.execute<RowDataPacket[]>(`
            SELECT da.*, u.name as user_name, u.profile_photo as user_avatar
            FROM driver_applications da
            JOIN users u ON da.user_id = u.id
            WHERE da.status = "pending" OR da.status = "resubmitted"
        `);

        const fixedApplications = rows.map(app => ({
            ...app,
            user_avatar: fixUrl(app.user_avatar, req)
        }));

        res.json({ success: true, applications: fixedApplications });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getApplicationDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [appRows] = await pool.execute<RowDataPacket[]>('SELECT * FROM driver_applications WHERE id = ?', [id]);
        if (appRows.length === 0) return res.json({ success: false, message: 'Application not found' });

        const [docRows] = await pool.execute<RowDataPacket[]>('SELECT * FROM driver_documents WHERE application_id = ?', [id]);

        const fixedDocs = docRows.map(doc => ({
            ...doc,
            file_path: fixUrl(doc.file_path, req)
        }));

        res.json({
            success: true,
            application: appRows[0],
            documents: fixedDocs
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
        await pool.execute(
            'UPDATE driver_documents SET verification_status = ?, rejection_reason = ?, verified_by = ?, verified_at = NOW() WHERE id = ?',
            [status, reason || null, adminId, docId]
        );

        // Log to document_audit_logs
        await pool.execute(
            'INSERT INTO document_audit_logs (document_id, admin_id, action, notes) VALUES (?, ?, ?, ?)',
            [docId, adminId, status === 'verified' ? 'verify' : 'reject', reason || null]
        );

        res.json({ success: true, message: `Document ${status}` });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const approveApplication = async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = (req as any).user?.id || null;

    try {
        // 1. Get application details
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM driver_applications WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.json({ success: false, message: 'Application not found' });
        }
        const app = rows[0];

        // 2. Find user by email
        const [userRows] = await pool.execute<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [app.email]);
        if (userRows.length === 0) {
            return res.json({ success: false, message: 'Associated user account not found' });
        }
        const userId = userRows[0].id;

        // 3. CHECK if all required documents are verified
        const [unverifiedDocs] = await pool.execute<RowDataPacket[]>(
            'SELECT id FROM driver_documents WHERE application_id = ? AND verification_status != "verified"',
            [id]
        );

        if (unverifiedDocs.length > 0) {
            return res.json({ success: false, message: 'Cannot approve: All documents must be verified first.' });
        }

        // 4. Update application status
        await pool.execute(
            'UPDATE driver_applications SET status = "approved", reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
            [adminId, id]
        );

        // 4. Update user status
        await pool.execute('UPDATE users SET status = "approved" WHERE id = ?', [userId]);

        // 5. Create/Update driver record
        await pool.execute(
            `INSERT INTO drivers (user_id, car_model, car_color, plate_number) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE car_model = VALUES(car_model), car_color = VALUES(car_color), plate_number = VALUES(plate_number)`,
            [userId, app.vehicle_type + ' ' + app.vehicle_registration_number, app.vehicle_color, app.vehicle_registration_number]
        );

        // 6. Log the overall approval
        await pool.execute(
            'INSERT INTO audit_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
            [adminId, 'approve_driver_application', 'driver_application', id, JSON.stringify({ userId, email: app.email })]
        );

        res.json({ success: true, message: 'Application approved' });
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
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT email FROM driver_applications WHERE id = ?', [id]);
        if (rows.length === 0) return res.json({ success: false, message: 'Application not found' });
        const email = rows[0].email;

        await pool.execute(
            'UPDATE driver_applications SET status = "rejected", rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW(), rejected_at = NOW() WHERE id = ?',
            [reason, adminId, id]
        );

        await pool.execute('UPDATE users SET status = "rejected" WHERE email = ?', [email]);

        // Log the overall rejection
        await pool.execute(
            'INSERT INTO audit_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
            [adminId, 'reject_driver_application', 'driver_application', id, JSON.stringify({ email, reason })]
        );

        res.json({ success: true, message: 'Application rejected' });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getRejectedApplications = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.execute<RowDataPacket[]>(`
            SELECT da.*, u.name as user_name, u.profile_photo as user_avatar
            FROM driver_applications da
            JOIN users u ON da.user_id = u.id
            WHERE da.status = "rejected"
        `);

        const fixedApplications = rows.map(app => ({
            ...app,
            user_avatar: fixUrl(app.user_avatar, req)
        }));

        res.json({ success: true, applications: fixedApplications });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getAnalyticsStats = async (req: Request, res: Response) => {
    try {
        // 1. Overview Stats
        const [userStats] = await pool.execute<RowDataPacket[]>('SELECT role, COUNT(*) as count FROM users GROUP BY role');
        const [rideStats] = await pool.execute<RowDataPacket[]>('SELECT status, COUNT(*) as count, SUM(fare) as revenue FROM ride_requests GROUP BY status');
        const [appStats] = await pool.execute<RowDataPacket[]>('SELECT status, COUNT(*) as count FROM driver_applications GROUP BY status');

        // 2. Daily Growth (Last 7 days)
        const [growthStats] = await pool.execute<RowDataPacket[]>(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM ride_requests 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // Format user distribution
        const users = {
            total: 0,
            passengers: 0,
            drivers: 0,
            admins: 0
        };
        userStats.forEach(s => {
            const count = Number(s.count);
            users.total += count;
            if (s.role === 'passenger') users.passengers = count;
            else if (s.role === 'driver') users.drivers = count;
            else if (s.role === 'admin' || s.role === 'super_admin') users.admins += count;
        });

        // Format ride statistics
        let totalRevenue = 0;
        const rides = {
            total: 0,
            completed: 0,
            cancelled: 0,
            pending: 0
        };
        rideStats.forEach(s => {
            const count = Number(s.count);
            rides.total += count;
            if (s.status === 'completed') {
                rides.completed = count;
                totalRevenue = Number(s.revenue || 0);
            } else if (s.status === 'cancelled') {
                rides.cancelled = count;
            } else if (s.status === 'pending' || s.status === 'accepted') {
                rides.pending += count;
            }
        });

        // Format application metrics
        const applications = {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0
        };
        appStats.forEach(s => {
            const count = Number(s.count);
            applications.total += count;
            if (s.status === 'pending' || s.status === 'resubmitted') applications.pending += count;
            else if (s.status === 'approved') applications.approved = count;
            else if (s.status === 'rejected') applications.rejected = count;
        });

        res.json({
            success: true,
            stats: {
                users,
                rides,
                applications,
                totalRevenue,
                growthTrend: growthStats
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

        // 1. Application Stats
        const [appStats] = await pool.execute<RowDataPacket[]>('SELECT status, COUNT(*) as count FROM driver_applications GROUP BY status');

        // 2. User Stats (Suspended)
        const [suspendedCount] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM users WHERE status = "suspended"');

        // 3. Recent Activity (Latest 5 applications)
        const [recentApps] = await pool.execute<RowDataPacket[]>(`
            SELECT da.*, u.name as user_name, u.profile_photo as user_avatar
            FROM driver_applications da
            JOIN users u ON da.user_id = u.id
            ORDER BY da.created_at DESC
            LIMIT 5
        `);

        // 4. Revenue (Total from completed rides)
        const [revenueRow] = await pool.execute<RowDataPacket[]>('SELECT SUM(fare) as total FROM ride_requests WHERE status = "completed"');

        // 5. Online Drivers
        const [onlineDriversRow] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM drivers WHERE online_status != "offline"');

        // 6. Total Passengers
        const [passengersRow] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM users WHERE role = "passenger"');

        // 7. Total Users
        const [totalUsersRow] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');

        const stats = {
            pending: 0,
            approved: 0,
            rejected: 0,
            suspended: Number(suspendedCount[0]?.count || 0),
            revenue: Number(revenueRow[0]?.total || 0),
            onlineDrivers: Number(onlineDriversRow[0]?.count || 0),
            totalPassengers: Number(passengersRow[0]?.count || 0),
            totalUsers: Number(totalUsersRow[0]?.count || 0)
        };

        // Get actual approved/active drivers count
        const [activeDriversCount] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM users WHERE role = "driver" AND (status = "active" OR status = "approved")');

        appStats.forEach(s => {
            if (s.status === 'pending' || s.status === 'resubmitted') stats.pending += Number(s.count);
            else if (s.status === 'rejected') stats.rejected = Number(s.count);
        });

        // Override with users table count
        stats.approved = activeDriversCount[0]?.count || 0;

        res.json({
            success: true,
            stats,
            recentActivity: recentApps.map(app => ({
                id: app.id,
                type: 'application',
                user: app.user_name,
                avatar: fixUrl(app.user_avatar, req),
                details: `submitted a new driver application.`,
                time: app.created_at
            }))
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

import { checkOfflineStatus } from './driverController';

export const getAllDrivers = async (req: Request, res: Response) => {
    try {
        // Clean up stale online statuses first
        await checkOfflineStatus();

        const [rows] = await pool.execute<RowDataPacket[]>(`
            SELECT u.id, u.name, u.email, u.phone, u.profile_photo, u.status, u.created_at,
                   d.car_model, d.car_color, d.plate_number, d.rating, d.is_online, d.online_status, d.last_seen_at,
                   (SELECT COUNT(*) FROM ride_requests WHERE driver_id = u.id AND status = 'completed') as total_trips
            FROM users u
            LEFT JOIN drivers d ON u.id = d.user_id
            WHERE u.role = 'driver'
            ORDER BY u.created_at DESC
        `);

        const fixedDrivers = rows.map(driver => ({
            ...driver,
            profile_photo: fixUrl(driver.profile_photo, req)
        }));

        res.json({ success: true, drivers: fixedDrivers });
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
        await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);

        // Log the action
        await pool.execute(
            'INSERT INTO audit_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
            [adminId, 'update_user_status', 'user', id, JSON.stringify({ status })]
        );

        res.json({ success: true, message: `Driver status updated to ${status}` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDriverProfile = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // Run cleanup to ensure status is accurate
        await checkOfflineStatus();

        // 1. Core Profile
        const [userRows] = await pool.execute<RowDataPacket[]>(`
            SELECT u.id, u.name, u.email, u.phone, u.profile_photo, u.status, u.role, u.created_at,
                   d.car_model, d.car_color, d.plate_number, d.rating, d.is_online
            FROM users u
            LEFT JOIN drivers d ON u.id = d.user_id
            WHERE u.id = ? AND u.role = 'driver'
        `, [id]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        const driver = userRows[0];
        driver.profile_photo = fixUrl(driver.profile_photo, req);

        // Calculate Real-time Status
        let realTimeStatus = driver.is_online ? 'idle' : 'offline';

        // 2. Active Trip Check
        const [activeTripRows] = await pool.execute<RowDataPacket[]>(`
            SELECT rr.id, rr.pickup_location, rr.destination, rr.status, rr.created_at, rr.fare,
                   u.name as passenger_name
            FROM ride_requests rr
            JOIN users u ON rr.passenger_id = u.id
            WHERE rr.driver_id = ? AND rr.status IN ('accepted', 'arrived', 'picked_up')
            LIMIT 1
        `, [id]);

        let activeTrip = null;
        if (activeTripRows.length > 0) {
            realTimeStatus = 'busy';
            activeTrip = activeTripRows[0];
        }

        driver.realTimeStatus = realTimeStatus;

        // 3. Earnings & Trip Counts
        const [statRows] = await pool.execute<RowDataPacket[]>(`
            SELECT 
                SUM(CASE WHEN status = 'completed' THEN fare ELSE 0 END) as total_earnings,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trips,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_trips
            FROM ride_requests 
            WHERE driver_id = ?
        `, [id]);

        const stats = {
            totalEarnings: Number(statRows[0]?.total_earnings || 0),
            completedTrips: Number(statRows[0]?.completed_trips || 0),
            cancelledTrips: Number(statRows[0]?.cancelled_trips || 0)
        };

        // 4. Trip History
        const [tripRows] = await pool.execute<RowDataPacket[]>(`
            SELECT rr.id, rr.fare, rr.status, rr.created_at, u.name as passenger_name
            FROM ride_requests rr
            JOIN users u ON rr.passenger_id = u.id
            WHERE rr.driver_id = ?
            ORDER BY rr.created_at DESC
            LIMIT 50
        `, [id]);

        res.json({
            success: true,
            driver,
            activeTrip,
            stats,
            trips: tripRows
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTripDetails = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.execute<RowDataPacket[]>(`
            SELECT rr.*, 
                   u_p.name as passenger_name, u_p.phone as passenger_phone, u_p.profile_photo as passenger_avatar,
                   u_d.name as driver_name, u_d.phone as driver_phone, u_d.profile_photo as driver_avatar,
                   d.car_model, d.plate_number
            FROM ride_requests rr
            JOIN users u_p ON rr.passenger_id = u_p.id
            LEFT JOIN users u_d ON rr.driver_id = u_d.id
            LEFT JOIN drivers d ON rr.driver_id = d.user_id
            WHERE rr.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }

        const trip = rows[0];
        trip.passenger_avatar = fixUrl(trip.passenger_avatar, req);
        trip.driver_avatar = fixUrl(trip.driver_avatar, req);

        res.json({ success: true, trip });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllAdmins = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.execute<RowDataPacket[]>(`
            SELECT id, name, email, phone, role, is_online, created_at
            FROM users
            WHERE role IN ('admin', 'super_admin')
            ORDER BY created_at DESC
        `);

        res.json({ success: true, admins: rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createAdmin = async (req: Request, res: Response) => {
    const { name, email, phone, password, role } = req.body;

    try {
        // Check if email already exists
        const [existing] = await pool.execute<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone, hashedPassword, role || 'admin', 'active']
        );

        res.status(201).json({ success: true, message: 'Admin created successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleAdminStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await pool.execute('UPDATE users SET status = ? WHERE id = ? AND role IN (\'admin\', \'super_admin\')', [status, id]);
        res.json({ success: true, message: `Admin status updated to ${status}` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAdminRole = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    try {
        await pool.execute('UPDATE users SET role = ? WHERE id = ? AND role IN (\'admin\', \'super_admin\')', [role, id]);
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
            const [existing] = await pool.execute<RowDataPacket[]>(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
        }

        // Update profile
        await pool.execute(
            'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
            [name, email, phone, userId]
        );

        // Fetch updated user data
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT id, name, email, phone, role FROM users WHERE id = ?',
            [userId]
        );

        res.json({ success: true, message: 'Profile updated successfully', user: rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;

    try {
        // Verify current password
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );

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
        const photoUrl = `http://${host}/uploads/${req.file.filename}`;

        await pool.execute(
            'UPDATE users SET profile_photo = ? WHERE id = ?',
            [photoUrl, userId]
        );

        // Fetch updated user data
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT id, name, email, phone, role, profile_photo FROM users WHERE id = ?',
            [userId]
        );

        const fixedPhotoUrl = fixUrl(photoUrl, req);

        res.json({
            success: true,
            message: 'Profile photo uploaded successfully',
            photoUrl: fixedPhotoUrl,
            user: { ...rows[0], profile_photo: fixedPhotoUrl }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getLoginHistory = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    try {
        const [rows] = await pool.execute<RowDataPacket[]>(`
            SELECT id, ip_address, user_agent, login_time
            FROM login_history
            WHERE user_id = ?
            ORDER BY login_time DESC
            LIMIT 20
        `, [userId]);

        res.json({ success: true, history: rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPassengers = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.execute<RowDataPacket[]>(`
            SELECT u.id, u.name, u.email, u.phone, u.profile_photo, u.status, u.created_at, u.last_login_at,
                   (SELECT COUNT(*) FROM ride_requests WHERE passenger_id = u.id) as total_trips
            FROM users u
            WHERE u.role = 'passenger'
            ORDER BY u.created_at DESC
        `);

        // Fix photo URLs
        const fixedRows = rows.map(user => ({
            ...user,
            profile_photo: fixUrl(user.profile_photo, req)
        }));

        res.json({ success: true, passengers: fixedRows });
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
        await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true, message: `User status updated to ${status}` });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getPassengerProfile = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // 1. Get User Details
        const [userRows] = await pool.execute<RowDataPacket[]>(`
            SELECT id, name, email, phone, profile_photo, status, created_at, role
            FROM users 
            WHERE id = ? AND role = 'passenger'
        `, [id]);

        if (userRows.length === 0) {
            return res.json({ success: false, message: 'Passenger not found' });
        }

        const user = userRows[0];
        user.profile_photo = fixUrl(user.profile_photo, req);

        // 2. Get Ride History
        const [rideRows] = await pool.execute<RowDataPacket[]>(`
            SELECT r.*, 
                   d_user.name as driver_name,
                   d.id as driver_id_internal
            FROM ride_requests r
            LEFT JOIN drivers d ON r.driver_id = d.user_id
            LEFT JOIN users d_user ON d.user_id = d_user.id
            WHERE r.passenger_id = ?
            ORDER BY r.created_at DESC
        `, [id]);

        // 3. Get Stats
        const stats = {
            total_trips: rideRows.length,
            completed_trips: rideRows.filter(r => r.status === 'completed').length,
            cancelled_trips: rideRows.filter(r => r.status === 'cancelled').length,
            total_spent: rideRows
                .filter(r => r.status === 'completed')
                .reduce((sum, r) => sum + Number(r.fare || 0), 0)
        };

        res.json({
            success: true,
            user,
            trips: rideRows,
            stats
        });

    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};
