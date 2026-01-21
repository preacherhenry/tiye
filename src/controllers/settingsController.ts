import { Request, Response } from 'express';
import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

export const getSettings = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] ⚙️ Fetching settings...`);
    try {
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT key_name, value FROM settings');
        const settings: { [key: string]: string } = {};
        rows.forEach(row => {
            settings[row.key_name] = row.value;
        });
        res.json({ success: true, settings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    const { settings } = req.body; // Expecting { key: value, ... }

    if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid settings data' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const [key, value] of Object.entries(settings)) {
            await connection.execute(
                'INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
                [key, value, value]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error: any) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};
