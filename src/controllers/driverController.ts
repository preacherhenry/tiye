import { Request, Response } from 'express';
import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

// Helper to check and update offline status for all drivers
export const checkOfflineStatus = async () => {
    try {
        // Mark drivers as offline if last_seen_at is older than 60 seconds
        // AND they are not currently on a trip (we preserve on_trip status)
        // AND they are not already offline
        const [result] = await pool.execute<any>(`
            UPDATE drivers 
            SET online_status = 'offline', is_online = FALSE 
            WHERE last_seen_at < DATE_SUB(NOW(), INTERVAL 60 SECOND) 
            AND online_status != 'offline' 
            AND online_status != 'on_trip'
        `);

        if (result.affectedRows > 0) {
            console.log(`⚠️  [Auto-Offline] ${result.affectedRows} driver(s) marked offline due to inactivity.`);
        }
    } catch (error) {
        console.error('Error checking offline status:', error);
    }
};

export const heartbeat = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    console.log(`💓 Heartbeat received from User ${userId}`);

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        // Updates:
        // 1. last_seen_at = NOW()
        // 2. online_status = 'online' (IF not 'on_trip')
        // 3. is_online = TRUE (compatibility)

        // We use a conditional update for status to not overwrite 'on_trip'
        await pool.execute(`
            UPDATE drivers 
            SET 
                last_seen_at = NOW(),
                is_online = TRUE,
                online_status = CASE 
                    WHEN online_status = 'on_trip' THEN 'on_trip'
                    ELSE 'online'
                END
            WHERE user_id = ?
        `, [userId]);

        console.log(`✅ Driver ${userId} heartbeat updated.`);
        res.json({ success: true });
    } catch (error: any) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
