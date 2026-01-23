import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { heartbeat } from '../controllers/driverController';
import { getAvailableSubscriptions, switchSubscription } from '../controllers/subscriptionController';

const router = Router();

router.post('/heartbeat', authenticateToken, heartbeat);
router.get('/subscriptions/available', authenticateToken, getAvailableSubscriptions);
router.post('/subscriptions/switch', authenticateToken, switchSubscription);

export default router;
