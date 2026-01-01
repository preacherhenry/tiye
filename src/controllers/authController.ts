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
    try {
        await pool.execute(
            'UPDATE users SET current_lat = ?, current_lng = ? WHERE id = ?',
            [lat, lng, userId]
        );
        res.json({ success: true, message: 'Location updated' });
    } catch (error: any) {
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
