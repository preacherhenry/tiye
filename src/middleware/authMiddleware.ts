import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        return;
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_change_in_prod');
        req.user = verified;
        next();
    } catch (error) {
        res.status(403).json({ success: false, message: 'Invalid token' });
    }
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Super admin privileges required.' });
    }
    next();
};
