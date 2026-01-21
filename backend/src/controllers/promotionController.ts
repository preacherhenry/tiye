import { Request, Response } from 'express';
import pool from '../config/db';

export const createPromotion = async (req: Request, res: Response) => {
    const { code, title, description, discount_type, discount_value, expiry_date } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO promotions (code, title, description, discount_type, discount_value, expiry_date) VALUES (?, ?, ?, ?, ?, ?)',
            [code.toUpperCase(), title, description, discount_type, discount_value, expiry_date]
        );
        res.status(201).json({ success: true, message: 'Promotion created successfully', promotionId: (result as any).insertId });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Promocode already exists' });
        }
        console.error('Error creating promotion:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllPromotions = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query('SELECT * FROM promotions ORDER BY created_at DESC');
        res.json({ success: true, promotions: rows });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deletePromotion = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM promotions WHERE id = ?', [id]);
        res.json({ success: true, message: 'Promotion deleted successfully' });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const validatePromocode = async (req: Request, res: Response) => {
    const { code, userId } = req.body;
    try {
        // 1. Check if promotion exists and is active
        const [promotions]: any = await pool.query(
            'SELECT * FROM promotions WHERE code = ? AND status = "active" AND expiry_date > NOW()',
            [code.toUpperCase()]
        );

        if (promotions.length === 0) {
            return res.status(404).json({ success: false, message: 'Invalid or expired promocode' });
        }

        const promo = promotions[0];

        // 2. Check if user already used this promocode
        if (userId) {
            const [usage]: any = await pool.query(
                'SELECT * FROM promotion_usage WHERE promotion_id = ? AND user_id = ?',
                [promo.id, userId]
            );

            if (usage.length > 0) {
                return res.status(400).json({ success: false, message: 'You have already used this promocode' });
            }
        }

        res.json({ success: true, promotion: promo });
    } catch (error) {
        console.error('Error validating promocode:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
