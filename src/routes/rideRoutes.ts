import { Router } from 'express';
import { requestRide, getPendingRides, acceptRide, getPassengerRides, getDriverRides, getRideDetails, updateRideStatus } from '../controllers/rideController';

import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/request-ride', authenticateToken, requestRide);
router.get('/pending-rides', authenticateToken, getPendingRides);
router.post('/accept-ride', authenticateToken, acceptRide);
router.post('/update-ride-status', authenticateToken, updateRideStatus);
router.get('/passenger-rides/:id', authenticateToken, getPassengerRides);
router.get('/driver-rides/:id', authenticateToken, getDriverRides);
router.get('/ride/:id', authenticateToken, getRideDetails);

export default router;
