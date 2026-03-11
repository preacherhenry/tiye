import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { hasPermission } from '../config/roles';
import { uploadFile } from '../utils/storage';

export const requestDeposit = async (req: Request, res: Response) => {
    const { amount } = req.body;
    const driver_id = (req as any).user?.id || req.body.driver_id;
    const file = req.file as Express.Multer.File;

    if (!driver_id || !amount || !file) {
        return res.json({ success: false, message: 'Driver ID, Amount and payment proof are required' });
    }

    try {
        const proof_photo = await uploadFile(file, 'deposits', req);

        const transRef = db.collection('wallet_transactions').doc();
        await transRef.set({
            id: transRef.id,
            driver_id,
            type: 'deposit',
            amount: Number(amount),
            status: 'pending',
            proof_photo,
            description: 'Wallet Deposit Request',
            created_at: new Date().toISOString()
        });

        res.json({ success: true, message: 'Deposit submitted for verification' });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getWalletHistory = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { driver_id } = req.params; // If admin is viewing a specific driver

    // Security: Drivers can only see their own wallet. Staff can see anyone's.
    const targetDriverId = driver_id || userId;
    
    if (userRole === 'driver' && targetDriverId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    try {
        let query = db.collection('wallet_transactions')
            .where('driver_id', '==', String(targetDriverId));
            // .orderBy('created_at', 'desc'); // Requires composite index with where clause

        const snapshot = await query.get();
        let docs = [...snapshot.docs];
        
        // Sort in memory to avoid index requirements
        docs.sort((a, b) => new Date(b.data().created_at).getTime() - new Date(a.data().created_at).getTime());

        let transactions = docs.map(doc => doc.data());

        // DRIVER VIEW RULE: Must NOT see trip deductions.
        if (userRole === 'driver') {
            transactions = transactions.filter(t => t.type !== 'deduction');
        }

        res.json({ success: true, transactions });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getWalletBalance = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { driver_id } = req.params;

    const targetDriverId = driver_id || userId;

    try {
        const driverDoc = await db.collection('drivers').doc(String(targetDriverId)).get();
        if (!driverDoc.exists) {
            return res.json({ success: false, message: 'Driver profile not found' });
        }

        const balance = driverDoc.data()?.wallet_balance || 0;
        res.json({ success: true, balance });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const adminGetPendingDeposits = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('wallet_transactions')
            .where('type', '==', 'deposit')
            .where('status', '==', 'pending')
            // .orderBy('created_at', 'desc') // Requires composite index
            .get();

        let docs = [...snapshot.docs];
        // Sort in memory
        docs.sort((a, b) => new Date(b.data().created_at).getTime() - new Date(a.data().created_at).getTime());

        const deposits = await Promise.all(docs.map(async (doc) => {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.driver_id).get();
            const userData = userDoc.data() || {};
            return {
                ...data,
                driver_name: userData.name,
                driver_phone: userData.phone
            };
        }));

        res.json({ success: true, deposits });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const adminVerifyDeposit = async (req: Request, res: Response) => {
    const { transaction_id, status } = req.body; // 'approved' or 'rejected'
    const adminId = (req as any).user?.id;

    if (!['approved', 'rejected'].includes(status)) {
        return res.json({ success: false, message: 'Invalid status' });
    }

    try {
        const transRef = db.collection('wallet_transactions').doc(transaction_id);
        const transDoc = await transRef.get();

        if (!transDoc.exists) {
            return res.json({ success: false, message: 'Transaction not found' });
        }

        const transaction = transDoc.data()!;
        if (transaction.status !== 'pending') {
            return res.json({ success: false, message: 'Transaction already processed' });
        }

        const driverId = transaction.driver_id;
        const amount = transaction.amount;

        await db.runTransaction(async (t) => {
            const driverRef = db.collection('drivers').doc(String(driverId));
            const driverDoc = await t.get(driverRef);

            if (status === 'approved') {
                const currentBalance = driverDoc.exists ? (driverDoc.data()?.wallet_balance || 0) : 0;
                const newBalance = currentBalance + amount;

                t.update(driverRef, { wallet_balance: newBalance });
                t.update(transRef, {
                    status: 'approved',
                    processed_by: adminId,
                    processed_at: new Date().toISOString()
                });
            } else {
                t.update(transRef, {
                    status: 'rejected',
                    processed_by: adminId,
                    processed_at: new Date().toISOString()
                });
            }
        });

        res.json({ success: true, message: `Deposit ${status} successfully` });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};
