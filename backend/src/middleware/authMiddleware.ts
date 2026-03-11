import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db } from '../config/firebase';

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

        // Check for account suspension in Firestore
        // Use the ID from the token data
        const userId = (verified as any).id;

        if (userId) {
            const userDoc = await db.collection('users').doc(userId).get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData?.status === 'suspended') {
                    console.log(`🚫 Blocked request from suspended user: ${userId}`);
                    res.status(403).json({
                        success: false,
                        message: 'ACCOUNT SUSPENDED. CONTACT OR VISIT SERVICE PROVIDERS FOR MORE INFORMATION',
                        status: 'suspended'
                    });
                    return;
                }
            }
        }

        next();
    } catch (error: any) {
        console.error(`❌ Token verification failed: ${error.message}`);
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

import { hasPermission } from '../config/roles';

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!hasPermission(req.user?.role, 'admin:dashboard')) {
        return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }
    next();
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!hasPermission(req.user?.role, 'user:manage')) {
        return res.status(403).json({ success: false, message: 'Access denied. Super admin privileges required.' });
    }
    next();
};
export const requireFinancialAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!hasPermission(req.user?.role, 'financial:manage')) {
        return res.status(403).json({ success: false, message: 'Access denied. Financial administrative privileges required.' });
    }
    next();
};
