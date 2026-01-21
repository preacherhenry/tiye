import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

dotenv.config();

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_prod';

        const verified = jwt.verify(token, secret);
        req.user = verified;

        // Check for account suspension in the database
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT status FROM users WHERE id = ?',
            [(verified as any).id]
        );

        if (rows.length > 0 && rows[0].status === 'suspended') {
            console.log(`🚫 Blocked request from suspended user: ${(verified as any).id}`);
            res.status(403).json({
                success: false,
                message: 'ACCOUNT SUSPENDED. CONTACT OR VISIT SERVICE PROVIDERS FOR MORE INFORMATION',
                status: 'suspended'
            });
            return;
        }

        next();
    } catch (error: any) {
        console.error(`❌ Token verification failed: ${error.message}`);
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }
    next();
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Super admin privileges required.' });
    }
    next();
};
