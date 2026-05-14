import { Router } from 'express';
import {
    requestDeposit,
    getWalletHistory,
    getWalletBalance,
    adminGetPendingDeposits,
    adminVerifyDeposit
} from '../controllers/walletController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import multer from 'multer';


const router = Router();

// Use memory storage — files go directly to Firebase Storage (permanent)
const upload = multer({ storage: multer.memoryStorage() });

// Driver Routes
router.post('/deposit', authenticateToken, upload.single('proof'), requestDeposit);
router.get('/history', authenticateToken, getWalletHistory);
router.get('/balance', authenticateToken, getWalletBalance);

// Admin Routes (Specific to wallet/finance)
router.get('/admin/pending-deposits', authenticateToken, isAdmin, adminGetPendingDeposits);
router.post('/admin/verify-deposit', authenticateToken, isAdmin, adminVerifyDeposit);

// Allow admin to view a specific driver's history/balance
router.get('/admin/history/:driver_id', authenticateToken, isAdmin, getWalletHistory);
router.get('/admin/balance/:driver_id', authenticateToken, isAdmin, getWalletBalance);

export default router;
