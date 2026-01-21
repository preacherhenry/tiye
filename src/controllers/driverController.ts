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
    } catch (error) {
        console.error('Error checking offline status:', error);
    }
};

export const checkExpiredSubscriptions = async () => {
    try {
        const now = new Date().toISOString();

        // 1. Mark driver subscriptions as expired in driver_subscriptions collection
        const expiredSubs = await db.collection('driver_subscriptions')
            .where('status', '==', 'active')
            .where('expiry_date', '<', now)
            .get();

        if (!expiredSubs.empty) {
            const batch = db.batch();
            expiredSubs.docs.forEach(doc => {
                batch.update(doc.ref, { status: 'expired' });
            });
            await batch.commit();
        }

        // 2. Sync drivers collection status
        const expiredDrivers = await db.collection('drivers')
            .where('subscription_status', '==', 'active')
            .where('subscription_expiry', '<', now)
            .get();

        if (!expiredDrivers.empty) {
            const batch = db.batch();
            expiredDrivers.docs.forEach(doc => {
                batch.update(doc.ref, { subscription_status: 'expired' });
            });
            await batch.commit();
            console.log(`🕒 [Auto-Expiry] ${expiredDrivers.size} driver(s) subscriptions marked as expired.`);
        }
    } catch (error) {
        console.error('Error checking expired subscriptions:', error);
    }
};

// Start background tasks
setInterval(checkOfflineStatus, 30000); // Every 30 seconds
setInterval(checkExpiredSubscriptions, 60000); // Every minute

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

        const isSuspended = user.status === 'suspended';
        const hasActiveSub = driver.subscription_status === 'active';
        const isOnTrip = driver.online_status === 'on_trip';

        let newStatus = 'offline';
        let newIsOnline = false;

        if (!isSuspended) {
            if (isOnTrip) {
                newStatus = 'on_trip';
                newIsOnline = true;
            } else if (hasActiveSub) {
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
