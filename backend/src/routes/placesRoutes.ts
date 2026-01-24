import express from 'express';
import { searchPlaces, reverseGeocode, getAllPlaces, addPlace, updatePlace, deletePlace } from '../controllers/placesController';

const router = express.Router();

// Search & Geocoding
router.get('/search', searchPlaces);
router.get('/reverse', reverseGeocode);

// Dynamic Places Management
router.get('/', getAllPlaces);
router.post('/', addPlace);
router.put('/:id', updatePlace);
router.delete('/:id', deletePlace);

export default router;
