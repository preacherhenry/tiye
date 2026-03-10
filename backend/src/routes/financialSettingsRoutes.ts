import { Router } from 'express';
import { getFinancialSettings, updateFinancialSettings } from '../controllers/financialSettingsController';
import { authenticateToken, requireFinancialAdmin } from '../middleware/authMiddleware';

const router = Router();

// Restricted to Super Admin / Director
router.get('/', authenticateToken, requireFinancialAdmin, getFinancialSettings);
router.put('/', authenticateToken, requireFinancialAdmin, updateFinancialSettings);

export default router;
