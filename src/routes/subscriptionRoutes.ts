import { Router } from 'express';
import {
    getPlans,
    submitSubscription,
    adminGetSubscriptions,
    adminVerifySubscription,
    adminCreatePlan,
    adminGetPlans,
    adminUpdatePlan,
    adminDeletePlan,
    adminToggleSubscriptionPause,
    adminDeleteSubscription
} from '../controllers/subscriptionController';
import { authenticateToken } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure Multer for screenshots
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `sub-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Driver Routes
router.get('/plans', authenticateToken, getPlans);
router.post('/subscribe', authenticateToken, upload.single('screenshot'), submitSubscription);

// Admin Routes
router.get('/admin/subscriptions', authenticateToken, adminGetSubscriptions);
router.post('/admin/verify-subscription', authenticateToken, adminVerifySubscription);
router.put('/admin/subscriptions/:id/toggle-pause', authenticateToken, adminToggleSubscriptionPause);
router.delete('/admin/subscriptions/:id', authenticateToken, adminDeleteSubscription);
router.get('/admin/plans', authenticateToken, adminGetPlans);
router.post('/admin/plans', authenticateToken, adminCreatePlan);
router.put('/admin/plans', authenticateToken, adminUpdatePlan);
router.delete('/admin/plans/:id', authenticateToken, adminDeletePlan);

export default router;
