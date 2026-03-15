import { Router } from 'express';
import { getPendingApplications, getRejectedApplications, getAnalyticsStats, getDashboardStats, getAllDrivers, toggleDriverStatus, getDriverProfile, getTripDetails, approveApplication, rejectApplication, getApplicationDetails, verifyDocument, getAllAdmins, createAdmin, toggleAdminStatus, updateAdminRole, updateAdminProfile, changePassword, uploadAdminProfilePhoto, getLoginHistory, getPassengers, updateUserStatus, getPassengerProfile, getLiveTrips, getAdminTrips } from '../controllers/adminController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
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

router.get('/applications', authorize('driver:manage'), getPendingApplications);
router.get('/rejected', authorize('driver:manage'), getRejectedApplications);
router.get('/analytics', authorize('report:view_all'), getAnalyticsStats);
router.get('/dashboard-stats', authorize('admin:dashboard'), getDashboardStats);
router.get('/drivers', authorize('driver:manage'), getAllDrivers);
router.post('/drivers/:id/status', authorize('driver:manage'), toggleDriverStatus);
router.get('/drivers/:id/profile', authorize('driver:manage'), getDriverProfile);
router.get('/trips/:id', authorize('ride:monitor'), getTripDetails);
router.get('/live-trips', authorize('ride:monitor'), getLiveTrips);
router.get('/trips', authorize('ride:monitor'), getAdminTrips);
router.get('/applications/:id', authorize('driver:manage'), getApplicationDetails);
router.post('/applications/:id/approve', authorize('driver:approve'), approveApplication);
router.post('/applications/:id/reject', authorize('driver:approve'), rejectApplication);
router.post('/documents/:docId/verify', authorize('driver:manage'), verifyDocument);

router.get('/passengers', authorize('admin:dashboard'), getPassengers);
router.get('/passengers/:id/profile', authorize('admin:dashboard'), getPassengerProfile);
router.put('/users/:id/status', authorize('user:manage'), updateUserStatus);

// Management routes
router.get('/admins', authorize('user:manage'), getAllAdmins);
router.post('/admins', authorize('user:manage'), createAdmin);
router.post('/admins/:id/status', authorize('user:manage'), toggleAdminStatus);
router.post('/admins/:id/role', authorize('user:manage'), updateAdminRole);

// Profile & Settings routes
router.put('/profile', updateAdminProfile);
router.post('/change-password', changePassword);
router.post('/profile-photo', upload.single('photo'), uploadAdminProfilePhoto);
router.get('/login-history', getLoginHistory);

export default router;
