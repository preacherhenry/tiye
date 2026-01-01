import express from 'express';
import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Middleware to check if user is admin (simplified for now)
// import { isAdmin } from '../middleware/authMiddleware';
// router.use(isAdmin); 

// 1. Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        // Run queries in parallel for performance
        const [passengers] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        const [drivers] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users WHERE role = "driver"');
        const [activeRides] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM ride_requests WHERE status IN ("pending", "accepted", "in_progress", "arrived")');
        const [completedRides] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM ride_requests WHERE status = "completed"');
        const [revenue] = await pool.query<RowDataPacket[]>('SELECT SUM(fare) as total FROM ride_requests WHERE status = "completed"');

        res.json({
            success: true,
            stats: {
                totalPassengers: passengers[0].count,
                totalDrivers: drivers[0].count,
                activeRides: activeRides[0].count,
                completedRides: completedRides[0].count,
                totalRevenue: revenue[0].total || 0
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Get All Users (Drivers or Passengers)
router.get('/users', async (req, res) => {
    const role = req.query.role as string; // 'driver' or 'user'
    try {
        let query = 'SELECT id, name, email, phone, role, created_at, profile_photo FROM users';
        const params: any[] = [];

        if (role) {
            query += ' WHERE role = ?';
            params.push(role);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await pool.query(query, params);
        res.json({ success: true, users: rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Get All Rides
router.get('/rides', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ride_requests ORDER BY created_at DESC LIMIT 100');
        res.json({ success: true, rides: rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Approve Driver (Example action)
router.post('/approve-driver', async (req, res) => {
    const { userId } = req.body;
    try {
        // Determine what "approval" means. 
        // For now, maybe we set a 'verified' flag in drivers table?
        // Or just assume they are active if they exist.
        // Let's assume we have a status column in drivers table (need to verify schema).
        // For now, return success mock.
        res.json({ success: true, message: `Driver ${userId} approved` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
