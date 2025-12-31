import { Router } from 'express';
import { register, login, updateLocation, uploadProfilePhoto } from '../controllers/authController';
import multer from 'multer';
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
router.post('/login', login);
router.post('/update-location', updateLocation);
router.post('/upload-photo', upload.single('photo'), uploadProfilePhoto);

export default router;
