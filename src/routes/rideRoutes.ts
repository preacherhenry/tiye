import { Router } from 'express';
import { requestRide, getPendingRides, acceptRide, getPassengerRides, getDriverRides, getRideDetails, updateRideStatus } from '../controllers/rideController';

const router = Router();

router.post('/request-ride', requestRide);
router.get('/pending-rides', getPendingRides);
router.post('/accept-ride', acceptRide);
router.post('/update-ride-status', updateRideStatus);
router.get('/passenger-rides/:id', getPassengerRides);
router.get('/driver-rides/:id', getDriverRides);
router.get('/ride/:id', getRideDetails);

export default router;
