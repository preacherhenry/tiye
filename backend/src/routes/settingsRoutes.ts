import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Public/Authenticated: Get settings (for mobile app and admin view)
router.get('/', authenticateToken, getSettings);

// Admin only: Update settings
router.put('/', authenticateToken, isAdmin, updateSettings);

export default router;
