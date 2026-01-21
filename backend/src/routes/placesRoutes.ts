import express from 'express';
import { searchPlaces, reverseGeocode } from '../controllers/placesController';

const router = express.Router();

router.get('/search', searchPlaces);
router.get('/reverse', reverseGeocode);

export default router;
