import { Request, Response } from 'express';
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
