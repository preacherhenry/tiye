import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { Permission, hasPermission } from '../config/roles';
import { db } from '../config/firebase';

/**
 * Middleware to authorize requests based on permissions.
 * @param requiredPermission The permission required for the operation.
 */
export const authorize = (requiredPermission: Permission) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. User role not found.'
            });
        }

        if (hasPermission(userRole, requiredPermission)) {
            // Log the authorized action for audit trail
            try {
                await logAction(req, requiredPermission);
            } catch (err) {
                console.error('Audit Log Error:', err);
            }
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Access denied. Insufficient permissions for ${requiredPermission}.`
        });
    };
};

/**
 * Internal helper to log sensitive actions.
 */
const logAction = async (req: AuthRequest, action: string) => {
    const userId = req.user?.id;
    if (!userId) return;

    const logData = {
        user_id: userId,
        user_role: req.user?.role,
        action,
        method: req.method,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
    };

    // Skip logging for GET requests to save space, unless it's a specific requirement
    if (req.method !== 'GET') {
        await db.collection('audit_logs').add(logData);
    }
};
