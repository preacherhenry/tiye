import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const createPromotion = async (req: Request, res: Response) => {
    const { code, title, description, discount_type, discount_value, expiry_date } = req.body;

    try {
        const promoCodeUpper = code.toUpperCase();

        // Check for duplicate
        const existing = await db.collection('promotions').where('code', '==', promoCodeUpper).get();
        if (!existing.empty) {
            return res.status(400).json({ success: false, message: 'Promocode already exists' });
        }

        const docRef = await db.collection('promotions').add({
            code: promoCodeUpper,
            title,
            description,
            discount_type,
            discount_value: parseFloat(discount_value),
            expiry_date,
            status: 'active',
            created_at: new Date().toISOString()
        });

        res.status(201).json({ success: true, message: 'Promotion created successfully', promotionId: docRef.id });
    } catch (error: any) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

export const getAllPromotions = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('promotions').orderBy('created_at', 'desc').get();
        const promotions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, promotions: promotions });
    } catch (error: any) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

export const deletePromotion = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await db.collection('promotions').doc(id).delete();
        res.json({ success: true, message: 'Promotion deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

export const validatePromocode = async (req: Request, res: Response) => {
    const { code, userId } = req.body;
    try {
        const promoCodeUpper = code.toUpperCase();

        // 1. Check if promotion exists and is active
        const snapshot = await db.collection('promotions')
            .where('code', '==', promoCodeUpper)
            .where('status', '==', 'active')
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: 'Invalid or expired promocode' });
        }

        const promoDoc = snapshot.docs[0];
        const promo = { id: promoDoc.id, ...promoDoc.data() } as any;

        // Check expiry date
        if (new Date(promo.expiry_date) < new Date()) {
            return res.status(404).json({ success: false, message: 'Invalid or expired promocode' });
        }

        // 2. Check if user already used this promocode
        if (userId) {
            const usageSnapshot = await db.collection('promotion_usage')
                .where('promotion_id', '==', promo.id)
                .where('user_id', '==', userId)
                .get();

            if (!usageSnapshot.empty) {
                return res.status(400).json({ success: false, message: 'You have already used this promocode' });
            }
        }

        res.json({ success: true, promotion: promo });
    } catch (error: any) {
        console.error('Error validating promocode:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};
