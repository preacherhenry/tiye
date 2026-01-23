import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const getSettings = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] ⚙️ Fetching settings from Firestore...`);
    try {
        const snapshot = await db.collection('settings').get();
        const settings: { [key: string]: any } = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            settings[doc.id] = data.value;
        });
        res.json({ success: true, settings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    const { settings } = req.body; // Expecting { key: value, ... }

    if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid settings data' });
    }

    try {
        const batch = db.batch();

        for (const [key, value] of Object.entries(settings)) {
            const docRef = db.collection('settings').doc(key);
            batch.set(docRef, { value, updated_at: new Date().toISOString() }, { merge: true });
        }

        await batch.commit();
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
