import { Request, Response } from 'express';
import { db } from '../config/firebase';

// ZONES
export const getZones = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('zones').orderBy('created_at', 'desc').get();
        const zones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, zones });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createZone = async (req: Request, res: Response) => {
    const { name, lat, lng, radius_km } = req.body;
    if (!name || !lat || !lng || !radius_km) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    try {
        const docRef = await db.collection('zones').add({
            name,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            radius_km: parseFloat(radius_km),
            status: 'active',
            created_at: new Date().toISOString()
        });
        res.status(201).json({ success: true, message: 'Zone created successfully', zoneId: docRef.id });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateZone = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, lat, lng, radius_km, status } = req.body;
    try {
        const updateData: any = {};
        if (name) updateData.name = name;
        if (lat) updateData.lat = parseFloat(lat);
        if (lng) updateData.lng = parseFloat(lng);
        if (radius_km) updateData.radius_km = parseFloat(radius_km);
        if (status) updateData.status = status;
        updateData.updated_at = new Date().toISOString();

        await db.collection('zones').doc(id).update(updateData);
        res.json({ success: true, message: 'Zone updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteZone = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await db.collection('zones').doc(id).delete();
        res.json({ success: true, message: 'Zone deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// FIXED ROUTES
export const getFixedRoutes = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('fixed_routes').orderBy('created_at', 'desc').get();
        const fixedRoutes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, fixedRoutes });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createFixedRoute = async (req: Request, res: Response) => {
    const { name, pickup_zone_id, dest_zone_id, fixed_price } = req.body;
    if (!name || !pickup_zone_id || !dest_zone_id || !fixed_price) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    try {
        // Fetch zone names for denormalization (optional but helpful for display)
        const pZone = await db.collection('zones').doc(pickup_zone_id).get();
        const dZone = await db.collection('zones').doc(dest_zone_id).get();

        const docRef = await db.collection('fixed_routes').add({
            name,
            pickup_zone_id,
            dest_zone_id,
            pickup_zone_name: pZone.exists ? pZone.data()?.name : 'Unknown',
            dest_zone_name: dZone.exists ? dZone.data()?.name : 'Unknown',
            fixed_price: parseFloat(fixed_price),
            status: 'active',
            created_at: new Date().toISOString()
        });
        res.status(201).json({ success: true, message: 'Fixed route created successfully', routeId: docRef.id });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateFixedRoute = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, pickup_zone_id, dest_zone_id, fixed_price, status } = req.body;
    try {
        const updateData: any = {};
        if (name) updateData.name = name;
        if (pickup_zone_id) {
            updateData.pickup_zone_id = pickup_zone_id;
            const pZone = await db.collection('zones').doc(pickup_zone_id).get();
            if (pZone.exists) updateData.pickup_zone_name = pZone.data()?.name;
        }
        if (dest_zone_id) {
            updateData.dest_zone_id = dest_zone_id;
            const dZone = await db.collection('zones').doc(dest_zone_id).get();
            if (dZone.exists) updateData.dest_zone_name = dZone.data()?.name;
        }
        if (fixed_price) updateData.fixed_price = parseFloat(fixed_price);
        if (status) updateData.status = status;
        updateData.updated_at = new Date().toISOString();

        await db.collection('fixed_routes').doc(id).update(updateData);
        res.json({ success: true, message: 'Fixed route updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteFixedRoute = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await db.collection('fixed_routes').doc(id).delete();
        res.json({ success: true, message: 'Fixed route deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Unified Fare Config for Mobile
export const getFareConfig = async (req: Request, res: Response) => {
    try {
        // 1. Get standard settings
        const sSnapshot = await db.collection('settings').get();
        const settings: { [key: string]: any } = {};
        sSnapshot.forEach(doc => {
            const data = doc.data();
            settings[doc.id] = data.value;
        });

        // 2. Get active zones
        const zSnapshot = await db.collection('zones').where('status', '==', 'active').get();
        const zones = zSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 3. Get active fixed routes
        const frSnapshot = await db.collection('fixed_routes').where('status', '==', 'active').get();
        const fixedRoutes = frSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({
            success: true,
            settings,
            zones: zones,
            fixedRoutes: fixedRoutes
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
