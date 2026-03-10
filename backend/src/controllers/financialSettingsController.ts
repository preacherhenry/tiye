import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const getFinancialSettings = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('settings').get();
        const settings: { [key: string]: any } = {};
        
        // Define which keys are financial
        const financialKeys = [
            'trip_deduction',
            'min_deposit',
            'max_deposit',
            'min_online_balance',
            'low_balance_warning'
        ];

        snapshot.forEach(doc => {
            if (financialKeys.includes(doc.id)) {
                settings[doc.id] = doc.data().value;
            }
        });

        // Ensure defaults if not set
        if (settings['trip_deduction'] === undefined) settings['trip_deduction'] = 3;
        if (settings['min_deposit'] === undefined) settings['min_deposit'] = 20;
        if (settings['max_deposit'] === undefined) settings['max_deposit'] = 500;
        if (settings['min_online_balance'] === undefined) settings['min_online_balance'] = 5;
        if (settings['low_balance_warning'] === undefined) settings['low_balance_warning'] = 10;

        res.json({ success: true, settings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateFinancialSettings = async (req: Request, res: Response) => {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid settings data' });
    }

    try {
        const batch = db.batch();
        const financialKeys = [
            'trip_deduction',
            'min_deposit',
            'max_deposit',
            'min_online_balance',
            'low_balance_warning'
        ];

        for (const [key, value] of Object.entries(settings)) {
            if (financialKeys.includes(key)) {
                const docRef = db.collection('settings').doc(key);
                batch.set(docRef, { value: Number(value), updated_at: new Date().toISOString() }, { merge: true });
            }
        }

        await batch.commit();
        res.json({ success: true, message: 'Financial settings updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
