import { Request, Response } from 'express';
import { db } from '../config/firebase';
const fetch = require('node-fetch');

export const searchPlaces = async (req: Request, res: Response): Promise<void> => {
    try {
        const { q } = req.query;

        if (!q) {
            res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
            return;
        }

        // Proper User-Agent is required by Nominatim usage policy
        const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

        const params = new URLSearchParams({
            q: q as string,
            format: 'json',
            addressdetails: '1',
            limit: '5',
            countrycodes: 'zm' // Limit to Zambia
        });

        const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
            headers: {
                'User-Agent': 'TaxiApp/1.0 (dev_test)'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim API Error: ${response.statusText}`);
        }

        const data = await response.json();

        res.json({
            success: true,
            results: data
        });

    } catch (error) {
        console.error('Error fetching places:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch location suggestions',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const reverseGeocode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            res.status(400).json({ success: false, message: 'Parameters "lat" and "lon" are required' });
            return;
        }

        const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
        const params = new URLSearchParams({
            lat: lat as string,
            lon: lon as string,
            format: 'json',
            addressdetails: '1'
        });

        const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
            headers: { 'User-Agent': 'TaxiApp/1.0 (dev_test)' }
        });

        if (!response.ok) {
            throw new Error(`Nominatim API Error: ${response.statusText}`);
        }

        const data = await response.json();

        res.json({
            success: true,
            result: data
        });

    } catch (error) {
        console.error('Error reverse geocoding:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reverse geocode',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
export const getAllPlaces = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('places').orderBy('name').get();
        const places = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, places });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addPlace = async (req: Request, res: Response) => {
    try {
        const { name, latitude, longitude, category, area } = req.body;
        if (!name || !latitude || !longitude) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const placeData = {
            name,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            category: category || 'landmark',
            area: area || '',
            created_at: new Date().toISOString()
        };

        const docRef = await db.collection('places').add(placeData);
        res.json({ success: true, id: docRef.id, message: 'Place added successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePlace = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.latitude) updates.latitude = parseFloat(updates.latitude);
        if (updates.longitude) updates.longitude = parseFloat(updates.longitude);

        await db.collection('places').doc(id).update(updates);
        res.json({ success: true, message: 'Place updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePlace = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.collection('places').doc(id).delete();
        res.json({ success: true, message: 'Place deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
