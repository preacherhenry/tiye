import { Router } from 'express';
import * as MarketplaceController from '../controllers/marketplaceController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import multer from 'multer';


const router = Router();

// Use memory storage — files go directly to Firebase Storage (permanent)
const upload = multer({ storage: multer.memoryStorage() });

// Public routes (Passenger app)
router.get('/posters', MarketplaceController.getPosters);
router.get('/stores', MarketplaceController.getStores);
router.get('/items', MarketplaceController.getItems);

// Protected routes (Needs Authentication)
router.use(authenticateToken);

// Order Management (Passenger)
router.post('/orders', MarketplaceController.createOrder);
router.get('/orders', MarketplaceController.getUserOrders);
router.get('/orders/:id', MarketplaceController.getOrderDetails);

// Admin / Management routes (Needs user:manage permission)
router.use(authorize('user:manage'));

// Poster Management
router.post('/posters/:slotId', upload.single('image'), MarketplaceController.updatePoster);

// Store Management
router.post('/stores', upload.single('logo'), MarketplaceController.createStore);
router.put('/stores/:id', upload.single('logo'), MarketplaceController.updateStore);

// Item Management
router.post('/items', upload.single('image'), MarketplaceController.createItem);
router.put('/items/:id', upload.single('image'), MarketplaceController.updateItem);
router.delete('/items/:id', MarketplaceController.deleteItem);

// Order Management (Admin/Store)
router.patch('/orders/:id/status', MarketplaceController.updateOrderStatus);

export default router;
