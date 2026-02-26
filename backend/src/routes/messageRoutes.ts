import { Router } from 'express';
import { getConversations, getMessages, sendMessage, createConversation, uploadMessageFile, getUnreadCount, markAsRead, getOfficers } from '../controllers/messageController';
import { authenticateToken } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure messages directory exists
const uploadDir = 'uploads/messages/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for message attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `msg-${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

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
