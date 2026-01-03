import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { heartbeat } from '../controllers/driverController';

const router = Router();

router.post('/heartbeat', authenticateToken, heartbeat);

export default router;
