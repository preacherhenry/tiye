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
import path from 'path';

const router = Router();

// Configure Multer for deposit proof (Disk Storage)
const storage_config = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `deposit-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage_config });

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
