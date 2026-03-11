import { Router } from 'express';
import { getFinancialSettings, updateFinancialSettings } from '../controllers/financialSettingsController';
import { authenticateToken, requireFinancialAdmin } from '../middleware/authMiddleware';

const router = Router();

// Any authenticated user can READ settings (drivers need deposit limits)
router.get('/', authenticateToken, getFinancialSettings);
// Only Super Admin / Director can UPDATE settings
router.put('/', authenticateToken, requireFinancialAdmin, updateFinancialSettings);

export default router;
