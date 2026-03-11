import { Request, Response } from 'express';
import { db } from '../config/firebase';

// Helper to check and update offline status for all drivers
export const checkOfflineStatus = async () => {
    try {
        const cutoff = new Date(Date.now() - 60000).toISOString();

        const driversToUpdate = await db.collection('drivers')
            .where('last_seen_at', '<', cutoff)
            .where('online_status', '==', 'online')
            .get();

        if (!driversToUpdate.empty) {
            const batch = db.batch();
            driversToUpdate.docs.forEach(doc => {
                batch.update(doc.ref, {
                    online_status: 'offline',
                    is_online: false
                });
            });
            await batch.commit();
            console.log(`⚠️  [Auto-Offline] ${driversToUpdate.size} driver(s) marked offline due to inactivity.`);
        }
    } catch (error: any) {
        if (error.code === 9) {
            console.warn('⚠️  Firestore Index required for offline status check.');
        } else {
            console.error('Error checking offline status:', error);
        }
    }
};

export const checkLowBalanceDrivers = async () => {
    try {
        const minBalanceDoc = await db.collection('settings').doc('min_online_balance').get();
        const minBalance = Number(minBalanceDoc.data()?.value || 5);

        const lowBalanceDrivers = await db.collection('drivers')
            .where('wallet_balance', '<', minBalance)
            .where('online_status', '==', 'online')
            .get();

        if (!lowBalanceDrivers.empty) {
            const batch = db.batch();
            lowBalanceDrivers.docs.forEach(doc => {
                batch.update(doc.ref, {
                    online_status: 'offline',
                    is_online: false
                });
            });
            await batch.commit();
            console.log(`🕒 [Wallet-Check] ${lowBalanceDrivers.size} driver(s) forced offline due to low wallet balance (< K${minBalance}).`);
        }
    } catch (error) {
        console.error('Error checking low balance drivers:', error);
    }
};

// Start background tasks
setInterval(checkOfflineStatus, 30000); // Every 30 seconds
setInterval(checkLowBalanceDrivers, 60000); // Every minute

export const heartbeat = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    console.log(`💓 Heartbeat received from User ${userId}`);

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const driverDoc = await db.collection('drivers').doc(userId).get();

        if (!userDoc.exists || !driverDoc.exists) {
            return res.json({ success: false, message: 'Driver profile not found' });
        }

        const user = userDoc.data()!;
        const driver = driverDoc.data()!;

        const isApproved = user.status === 'approved';
        const isSuspended = user.status === 'suspended';
        const isOnTrip = driver.online_status === 'on_trip';

        // WALLET BALANCE CHECK
        const minBalanceDoc = await db.collection('settings').doc('min_online_balance').get();
        const minBalance = Number(minBalanceDoc.data()?.value || 5);
        const hasEnoughBalance = (driver.wallet_balance || 0) >= minBalance;

        let newStatus = 'offline';
        let newIsOnline = false;

        // ONLY allow online if approved AND not suspended AND enough balance
        if (isApproved && !isSuspended) {
            if (isOnTrip) {
                newStatus = 'on_trip';
                newIsOnline = true;
            } else if (hasEnoughBalance) {
                newStatus = 'online';
                newIsOnline = true;
            }
        }

        await db.collection('drivers').doc(userId).update({
            last_seen_at: new Date().toISOString(),
            is_online: newIsOnline,
            online_status: newStatus
        });

        console.log(`✅ Driver ${userId} heartbeat updated.`);
        res.json({ success: true });
    } catch (error: any) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
