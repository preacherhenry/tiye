import { Router } from 'express';
import { register, login, logout, updateLocation, uploadProfilePhoto, applyDriver, updateProfile, getUserProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware'; import multer from 'multer';
import path from 'path';

const router = Router();

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `user-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

router.post('/register', register);
router.post('/apply-driver', upload.fields([
    { name: 'license_front', maxCount: 1 },
    { name: 'license_back', maxCount: 1 },
    { name: 'nrc_front', maxCount: 1 },
    { name: 'nrc_back', maxCount: 1 },
    { name: 'profile_photo', maxCount: 1 }
]), applyDriver);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.post('/update-location', updateLocation);
router.post('/upload-photo', upload.single('photo'), uploadProfilePhoto);
router.put('/update-profile', authenticateToken, updateProfile);
router.get('/profile', authenticateToken, getUserProfile);

export default router;
