import { Router } from 'express';
import * as MarketplaceController from '../controllers/marketplaceController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure Multer for marketplace assets
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `market-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Public routes (Passenger app)
router.get('/posters', MarketplaceController.getPosters);
router.get('/stores', MarketplaceController.getStores);
router.get('/items', MarketplaceController.getItems);

// Protected routes (Admin management)
router.use(authenticateToken);
router.use(authorize('user:manage')); // Restrict to admins with user:manage permission

// Poster Management
router.post('/posters/:slotId', upload.single('image'), MarketplaceController.updatePoster);

// Store Management
router.post('/stores', upload.single('logo'), MarketplaceController.createStore);
router.put('/stores/:id', upload.single('logo'), MarketplaceController.updateStore);

// Item Management
router.post('/items', upload.single('image'), MarketplaceController.createItem);
router.put('/items/:id', upload.single('image'), MarketplaceController.updateItem);
router.delete('/items/:id', MarketplaceController.deleteItem);

// Order Management (Passenger)
router.post('/orders', MarketplaceController.createOrder);
router.get('/orders', MarketplaceController.getUserOrders);
router.get('/orders/:id', MarketplaceController.getOrderDetails);

// Order Management (Admin/Store)
router.patch('/orders/:id/status', MarketplaceController.updateOrderStatus);

export default router;
