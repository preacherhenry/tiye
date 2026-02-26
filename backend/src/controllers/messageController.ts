import { Request, Response } from 'express';
import * as nodeCrypto from 'crypto';
import { db } from '../config/firebase';

export const getConversations = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
        // Find conversations where user is a participant OR it's a department conversation matching user's role
        // For simplicity in this demo, we'll fetch all conversations the user is part of
        const convsSnapshot = await db.collection('conversations')
            .where('participants', 'array-contains', userId)
            .orderBy('updated_at', 'desc')
            .get();

        const conversations = convsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

        // Also fetch department conversations? 
        // A better way: users are automatically added to department conversations on creation or first login.

        res.json({ success: true, conversations });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUnreadCount = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
        const convsSnapshot = await db.collection('conversations')
            .where('participants', 'array-contains', userId)
            .get();

        let totalUnread = 0;
        convsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            totalUnread += (data.unread_counts?.[userId] || 0);
        });

        res.json({ success: true, count: totalUnread });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
        const messagesSnapshot = await db.collection('messages')
            .where('conversation_id', '==', conversationId)
            .orderBy('created_at', 'asc')
            .get();

        const messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        res.json({ success: true, messages });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    const { conversation_id, text, attachments } = req.body;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name || 'Staff';

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
        const messageId = nodeCrypto.randomUUID();
        const now = new Date().toISOString();

        const messageData = {
            id: messageId,
            conversation_id,
            sender_id: userId,
            sender_name: userName,
            text,
            attachments: attachments || [],
            created_at: now
        };

        await db.collection('messages').doc(messageId).set(messageData);

        // Update conversation metadata
        const conversationRef = db.collection('conversations').doc(conversation_id);
        const conversationDoc = await conversationRef.get();
        const conversationDataFromDb = conversationDoc.data();
        
        const updateData: any = {
            last_message: {
                text,
                sender_id: userId,
                timestamp: now
            },
            updated_at: now
        };

        // Increment unread counts for other participants
        if (conversationDataFromDb && conversationDataFromDb.participants) {
            const unreadCounts = conversationDataFromDb.unread_counts || {};
            conversationDataFromDb.participants.forEach((pId: string) => {
                if (pId !== userId) {
                    unreadCounts[pId] = (unreadCounts[pId] || 0) + 1;
                }
            });
            updateData.unread_counts = unreadCounts;
        }

        await conversationRef.update(updateData);

        // Log the message action
        await db.collection('audit_logs').add({
            user_id: userId,
            action: 'send_message',
            target_type: 'conversation',
            target_id: conversation_id,
            details: JSON.stringify({ textLength: text.length }),
            timestamp: now
        });

        res.json({ success: true, message: messageData });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOfficers = async (req: Request, res: Response) => {
    try {
        const staffRoles = [
            'super_admin', 'director_ceo', 'finance_manager', 'accounts_assistant',
            'driver_relations_manager', 'operations_supervisor', 'it_manager', 'system_admin_developer'
        ];

        const querySnapshot = await db.collection('users')
            .where('role', 'in', staffRoles)
            .get();

        const officers = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            role: doc.data().role,
            department: doc.data().department || null,
            profile_photo: doc.data().profile_photo || null
        }));

        res.json({ success: true, officers });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createConversation = async (req: Request, res: Response) => {
    const { participants, type, department, title } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
        const conversationId = nodeCrypto.randomUUID();
        const now = new Date().toISOString();

        // 1. Initial participants (from request + sender)
        let allParticipants = Array.from(new Set([...(participants || []), userId]));

        // 2. If it's a department conversation, find all users with that department/role
        if (type === 'department' && department) {
            // Mapping UI departments to backend roles
            const deptToRole: Record<string, string[]> = {
                'Operations': ['operations_supervisor', 'super_admin'],
                'Finance': ['finance_manager', 'accounts_assistant', 'super_admin'],
                'Driver Relations': ['driver_relations_manager', 'super_admin'],
                'IT Support': ['it_manager', 'system_admin_developer', 'super_admin']
            };

            const rolesToFetch = deptToRole[department] || [];
            if (rolesToFetch.length > 0) {
                const staffSnapshot = await db.collection('users')
                    .where('role', 'in', rolesToFetch)
                    .get();
                
                staffSnapshot.docs.forEach(doc => {
                    allParticipants.push(doc.id);
                });
            }
        }

        // Finalize unique participants
        allParticipants = Array.from(new Set(allParticipants));

        const conversationData = {
            id: conversationId,
            participants: allParticipants,
            type, // 'direct' or 'department'
            department: department || null,
            title: title || (type === 'direct' ? 'Direct Message' : `${department} Department`),
            created_at: now,
            updated_at: now,
            last_message: null,
            unread_counts: {}
        };

        await db.collection('conversations').doc(conversationId).set(conversationData);

        // Log the conversation creation
        await db.collection('audit_logs').add({
            user_id: userId,
            action: 'create_conversation',
            target_type: 'conversation',
            target_id: conversationId,
            details: JSON.stringify({ type, department, participantCount: allParticipants.length }),
            timestamp: now
        });

        res.json({ success: true, conversation: conversationData });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const uploadMessageFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/messages/${req.file.filename}`;
        
        res.json({
            success: true,
            file: {
                name: req.file.originalname,
                url: fileUrl,
                type: req.file.mimetype
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
        const conversationRef = db.collection('conversations').doc(conversationId);
        const conversationDoc = await conversationRef.get();
        
        if (!conversationDoc.exists) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const data = conversationDoc.data();
        const unreadCounts = data?.unread_counts || {};
        unreadCounts[userId] = 0;

        await conversationRef.update({ unread_counts: unreadCounts });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
