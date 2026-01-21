import { Router } from 'express';
import { getZones, createZone, updateZone, deleteZone, getFixedRoutes, createFixedRoute, updateFixedRoute, deleteFixedRoute, getFareConfig } from '../controllers/fareController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Public/Authenticated (Mobile App)
router.get('/config', authenticateToken, getFareConfig);

// Admin Routes
router.get('/zones', authenticateToken, isAdmin, getZones);
router.post('/zones', authenticateToken, isAdmin, createZone);
router.put('/zones/:id', authenticateToken, isAdmin, updateZone);
router.delete('/zones/:id', authenticateToken, isAdmin, deleteZone);

router.get('/fixed-routes', authenticateToken, isAdmin, getFixedRoutes);
router.post('/fixed-routes', authenticateToken, isAdmin, createFixedRoute);
router.put('/fixed-routes/:id', authenticateToken, isAdmin, updateFixedRoute);
router.delete('/fixed-routes/:id', authenticateToken, isAdmin, deleteFixedRoute);

export default router;
