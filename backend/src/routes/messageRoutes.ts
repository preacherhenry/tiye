import { Router } from 'express';
import { getConversations, getMessages, sendMessage, createConversation, uploadMessageFile, getUnreadCount, markAsRead, getOfficers } from '../controllers/messageController';
import { authenticateToken } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Multer for message attachments (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.use(authenticateToken);

router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.get('/officers', getOfficers);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/messages', sendMessage);
router.post('/messages/upload', upload.single('file'), uploadMessageFile);
router.post('/conversations/:conversationId/read', markAsRead);
router.post('/conversations', createConversation);

export default router;
