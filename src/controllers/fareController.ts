import { Request, Response } from 'express';
import pool from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// ZONES
export const getZones = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM zones ORDER BY created_at DESC');
        res.json({ success: true, zones: rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createZone = async (req: Request, res: Response) => {
    const { name, lat, lng, radius_km } = req.body;
    if (!name || !lat || !lng || !radius_km) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO zones (name, lat, lng, radius_km) VALUES (?, ?, ?, ?)',
            [name, lat, lng, radius_km]
        );
        res.status(201).json({ success: true, message: 'Zone created successfully', zoneId: result.insertId });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateZone = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, lat, lng, radius_km, status } = req.body;
    try {
        await pool.execute(
            'UPDATE zones SET name = ?, lat = ?, lng = ?, radius_km = ?, status = ? WHERE id = ?',
            [name, lat, lng, radius_km, status, id]
        );
        res.json({ success: true, message: 'Zone updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteZone = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.execute('DELETE FROM zones WHERE id = ?', [id]);
        res.json({ success: true, message: 'Zone deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// FIXED ROUTES
export const getFixedRoutes = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT fr.*, z1.name as pickup_zone_name, z2.name as dest_zone_name 
            FROM fixed_routes fr
            JOIN zones z1 ON fr.pickup_zone_id = z1.id
            JOIN zones z2 ON fr.dest_zone_id = z2.id
            ORDER BY fr.created_at DESC
        `;
        const [rows] = await pool.execute<RowDataPacket[]>(query);
        res.json({ success: true, fixedRoutes: rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createFixedRoute = async (req: Request, res: Response) => {
    const { name, pickup_zone_id, dest_zone_id, fixed_price } = req.body;
    if (!name || !pickup_zone_id || !dest_zone_id || !fixed_price) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO fixed_routes (name, pickup_zone_id, dest_zone_id, fixed_price) VALUES (?, ?, ?, ?)',
            [name, pickup_zone_id, dest_zone_id, fixed_price]
        );
        res.status(201).json({ success: true, message: 'Fixed route created successfully', routeId: result.insertId });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateFixedRoute = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, pickup_zone_id, dest_zone_id, fixed_price, status } = req.body;
    try {
        await pool.execute(
            'UPDATE fixed_routes SET name = ?, pickup_zone_id = ?, dest_zone_id = ?, fixed_price = ?, status = ? WHERE id = ?',
            [name, pickup_zone_id, dest_zone_id, fixed_price, status, id]
        );
        res.json({ success: true, message: 'Fixed route updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteFixedRoute = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.execute('DELETE FROM fixed_routes WHERE id = ?', [id]);
        res.json({ success: true, message: 'Fixed route deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Unified Fare Config for Mobile
export const getFareConfig = async (req: Request, res: Response) => {
    try {
        // 1. Get standard settings
        const [sRows] = await pool.execute<RowDataPacket[]>('SELECT key_name, value FROM settings');
        const settings: { [key: string]: string } = {};
        sRows.forEach(row => {
            settings[row.key_name] = row.value;
        });

        // 2. Get active zones
        const [zRows] = await pool.execute<RowDataPacket[]>('SELECT * FROM zones WHERE status = "active"');

        // 3. Get active fixed routes
        const [frRows] = await pool.execute<RowDataPacket[]>('SELECT * FROM fixed_routes WHERE status = "active"');

        res.json({
            success: true,
            settings,
            zones: zRows,
            fixedRoutes: frRows
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
