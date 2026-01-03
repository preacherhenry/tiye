import { Router } from 'express';
import { getPendingApplications, getRejectedApplications, getAnalyticsStats, getDashboardStats, getAllDrivers, toggleDriverStatus, getDriverProfile, getTripDetails, approveApplication, rejectApplication, getApplicationDetails, verifyDocument, getAllAdmins, createAdmin, toggleAdminStatus, updateAdminRole, updateAdminProfile, changePassword, uploadAdminProfilePhoto, getLoginHistory, getPassengers, updateUserStatus, getPassengerProfile } from '../controllers/adminController';
import { authenticateToken, requireSuperAdmin } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure Multer for profile photos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `admin-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Apply authentication to all admin routes
router.use(authenticateToken);

router.get('/applications', getPendingApplications);
router.get('/rejected', getRejectedApplications);
router.get('/analytics', getAnalyticsStats);
router.get('/dashboard-stats', getDashboardStats);
router.get('/drivers', getAllDrivers);
router.post('/drivers/:id/status', toggleDriverStatus);
router.get('/drivers/:id/profile', getDriverProfile);
router.get('/trips/:id', getTripDetails);
router.get('/applications/:id', getApplicationDetails);
router.post('/applications/:id/approve', approveApplication);
router.post('/applications/:id/reject', rejectApplication);
router.post('/documents/:docId/verify', verifyDocument);

router.get('/passengers', getPassengers);
router.get('/passengers/:id/profile', getPassengerProfile);
router.put('/users/:id/status', updateUserStatus);

// Super Admin only routes
router.get('/admins', requireSuperAdmin, getAllAdmins);
router.post('/admins', requireSuperAdmin, createAdmin);
router.post('/admins/:id/status', requireSuperAdmin, toggleAdminStatus);
router.post('/admins/:id/role', requireSuperAdmin, updateAdminRole);

// Profile & Settings routes
router.put('/profile', updateAdminProfile);
router.post('/change-password', changePassword);
router.post('/profile-photo', upload.single('photo'), uploadAdminProfilePhoto);
router.get('/login-history', getLoginHistory);

export default router;
