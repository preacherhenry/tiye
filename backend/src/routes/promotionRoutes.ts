import { Router } from 'express';
import { createPromotion, getAllPromotions, deletePromotion, validatePromocode } from '../controllers/promotionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Passenger & Admin routes
router.get('/promotions', authenticateToken, getAllPromotions);
router.post('/promotions/validate', authenticateToken, validatePromocode);

// Admin only routes (could add stricter middleware here if needed)
router.post('/admin/promotions', authenticateToken, createPromotion);
router.delete('/admin/promotions/:id', authenticateToken, deletePromotion);

export default router;
