import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { uploadFile } from '../utils/storage';
import { hasPermission } from '../config/roles';

export const getPlans = async (req: Request, res: Response) => {
    try {
        const querySnapshot = await db.collection('subscription_plans')
            .where('status', '==', 'active')
            .get();
        const plans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, plans });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitSubscription = async (req: Request, res: Response) => {
    const { driver_id, plan_id } = req.body;
    const file = req.file;

    if (!driver_id || !plan_id || !file) {
        return res.status(400).json({ success: false, message: 'Driver ID, Plan ID and payment proof are required' });
    }

    try {
        const screenshot_url = await uploadFile(file as Express.Multer.File, 'subscriptions', req);

        const batch = db.batch();
        const subRef = db.collection('driver_subscriptions').doc();
        batch.set(subRef, {
            id: subRef.id,
            driver_id,
            plan_id,
            screenshot_url,
            status: 'pending',
            created_at: new Date().toISOString()
        });

        const driverRef = db.collection('drivers').doc(String(driver_id));
        const driverDoc = await driverRef.get();
        if (driverDoc.exists && driverDoc.data()?.subscription_status !== 'active') {
            batch.update(driverRef, { subscription_status: 'pending' });
        }

        await batch.commit();
        res.json({ success: true, message: 'Subscription submitted for verification' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminGetSubscriptions = async (req: Request, res: Response) => {
    try {
        const subsSnapshot = await db.collection('driver_subscriptions').orderBy('created_at', 'desc').get();
        const userRole = (req as any).user?.role;
        const canViewFinancials = hasPermission(userRole, 'finance:view_docs');

        const subscriptions = await Promise.all(subsSnapshot.docs.map(async (doc: any) => {
            const sub = doc.data();
            const userDoc = await db.collection('users').doc(sub.driver_id).get();
            const planDoc = await db.collection('subscription_plans').doc(sub.plan_id).get();

            const userData = userDoc.data() || {};
            const planData = planDoc.data() || {};

            return {
                ...sub,
                id: doc.id,
                driver_name: userData.name,
                driver_phone: userData.phone,
                plan_name: planData.name,
                // Mask sensitive info if no permission
                price: canViewFinancials ? planData.price : '***',
                screenshot_url: canViewFinancials ? sub.screenshot_url : null,
                duration_days: planData.duration_days
            };
        }));

        res.json({ success: true, subscriptions });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminVerifySubscription = async (req: Request, res: Response) => {
    const { subscription_id, status } = req.body; // 'active' or 'rejected'

    if (!['active', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        const subRef = db.collection('driver_subscriptions').doc(subscription_id);
        const subDoc = await subRef.get();

        if (!subDoc.exists) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }

        const sub = subDoc.data()!;
        const planDoc = await db.collection('subscription_plans').doc(sub.plan_id).get();
        if (!planDoc.exists) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }
        const plan = planDoc.data()!;
        const driverId = sub.driver_id;

        if (status === 'active') {
            const startDate = new Date();

            // Calculate expiry based on duration unit and value
            const durationValue = plan.duration_value || plan.duration_days || 0;
            const durationUnit = plan.duration_unit || 'days';

            let durationMs = 0;
            if (durationUnit === 'hours') {
                durationMs = durationValue * 60 * 60 * 1000;
            } else if (durationUnit === 'weeks') {
                durationMs = durationValue * 7 * 24 * 60 * 60 * 1000;
            } else {
                // Default to days
                durationMs = durationValue * 24 * 60 * 60 * 1000;
            }

            const expiryDate = new Date(startDate.getTime() + durationMs);

            const batch = db.batch();
            batch.update(subRef, {
                status: 'active',
                start_date: startDate.toISOString(),
                expiry_date: expiryDate.toISOString()
            });

            batch.update(db.collection('drivers').doc(String(driverId)), {
                subscription_status: 'active',
                subscription_expiry: expiryDate.toISOString()
            });

            await batch.commit();
        } else {
            const batch = db.batch();
            batch.update(subRef, { status: 'rejected' });

            // Check if driver has other active subscriptions
            const now = new Date().toISOString();
            const otherActive = await db.collection('driver_subscriptions')
                .where('driver_id', '==', driverId)
                .where('status', '==', 'active')
                .where('expiry_date', '>', now)
                .get();

            if (otherActive.empty) {
                batch.update(db.collection('drivers').doc(String(driverId)), {
                    subscription_status: 'none',
                    is_online: false,
                    online_status: 'offline'
                });
            }
            await batch.commit();
        }

        res.json({ success: true, message: `Subscription ${status}` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminCreatePlan = async (req: Request, res: Response) => {
    const { name, price, duration_value, duration_unit, description } = req.body;
    try {
        const planRef = db.collection('subscription_plans').doc();
        await planRef.set({
            id: planRef.id,
            name,
            price,
            duration_value,
            duration_unit,
            description,
            status: 'active',
            created_at: new Date().toISOString()
        });
        res.json({ success: true, message: 'Plan created' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminGetPlans = async (req: Request, res: Response) => {
    try {
        const querySnapshot = await db.collection('subscription_plans').get();
        const plans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, plans });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminUpdatePlan = async (req: Request, res: Response) => {
    const { id, name, price, duration_value, duration_unit, description, status } = req.body;
    try {
        await db.collection('subscription_plans').doc(id).update({
            name,
            price,
            duration_value,
            duration_unit,
            description,
            status
        });
        res.json({ success: true, message: 'Plan updated' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminDeletePlan = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await db.collection('subscription_plans').doc(id).delete();
        res.json({ success: true, message: 'Plan deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminToggleSubscriptionPause = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'paused'

    if (!['active', 'paused'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        const result = await db.runTransaction(async (transaction) => {
            const subRef = db.collection('driver_subscriptions').doc(id);
            const subDoc = await transaction.get(subRef);

            if (!subDoc.exists) {
                return { success: false, message: 'Subscription not found' };
            }

            const sub = subDoc.data()!;
            const driverId = sub.driver_id;

            if (status === 'paused') {
                if (sub.status === 'paused') {
                    return { success: false, message: 'Subscription is already paused' };
                }

                transaction.update(subRef, {
                    status: 'paused',
                    paused_at: new Date().toISOString()
                });

                // Immediately block the driver when pausing
                const driverRef = db.collection('drivers').doc(String(driverId));
                transaction.update(driverRef, {
                    subscription_status: 'paused',
                    is_online: false,
                    online_status: 'offline'
                });
            } else {
                if (sub.status !== 'paused') {
                    return { success: false, message: 'Subscription is not paused' };
                }

                const pausedAt = new Date(sub.paused_at);
                const now = new Date();
                const pauseDurationMs = now.getTime() - pausedAt.getTime();

                const currentExpiry = new Date(sub.expiry_date);
                const newExpiry = new Date(currentExpiry.getTime() + pauseDurationMs);

                transaction.update(subRef, {
                    status: 'active',
                    expiry_date: newExpiry.toISOString(),
                    paused_at: null
                });

                // Check if this sub is the one that should update the driver's expiry
                const driverRef = db.collection('drivers').doc(String(driverId));
                transaction.update(driverRef, {
                    subscription_expiry: newExpiry.toISOString(),
                    subscription_status: 'active'
                });
            }

            return { success: true, driverId };
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        const driverId = result.driverId;
        const now = new Date().toISOString();

        // Sync driver's subscription_status
        const activeCount = await db.collection('driver_subscriptions')
            .where('driver_id', '==', driverId)
            .where('status', '==', 'active')
            .where('expiry_date', '>', now)
            .get();

        const pausedCount = await db.collection('driver_subscriptions')
            .where('driver_id', '==', driverId)
            .where('status', '==', 'paused')
            .get();

        let driverStatus = 'none';
        if (!activeCount.empty) {
            driverStatus = 'active';
        } else if (!pausedCount.empty) {
            driverStatus = 'paused';
        }

        const updateData: any = {
            subscription_status: driverStatus
        };

        if (driverStatus !== 'active') {
            updateData.is_online = false;
            updateData.online_status = 'offline';
        }

        await db.collection('drivers').doc(String(driverId)).update(updateData);

        res.json({ success: true, message: `Subscription ${status}` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminDeleteSubscription = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const subRef = db.collection('driver_subscriptions').doc(id);
        const subDoc = await subRef.get();
        if (!subDoc.exists) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }
        const driverId = subDoc.data()!.driver_id;

        await subRef.delete();

        // Sync driver's subscription_status
        const now = new Date().toISOString();
        const activeSubs = await db.collection('driver_subscriptions')
            .where('driver_id', '==', driverId)
            .where('status', '==', 'active')
            .where('expiry_date', '>', now)
            .get();

        const newStatus = activeSubs.empty ? 'none' : 'active';

        const updateData: any = {
            subscription_status: newStatus
        };

        if (newStatus !== 'active') {
            updateData.is_online = false;
            updateData.online_status = 'offline';
        }

        await db.collection('drivers').doc(String(driverId)).update(updateData);

        res.json({ success: true, message: 'Subscription deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- DRIVER ENDPOINTS ---

export const getAvailableSubscriptions = async (req: Request, res: Response) => {
    const driverId = (req as any).user.id;

    try {
        const snapshots = await db.collection('driver_subscriptions')
            .where('driver_id', '==', driverId)
            .where('status', 'in', ['active', 'paused'])
            .get();

        const subscriptions = await Promise.all(snapshots.docs.map(async (doc) => {
            const data = doc.data();
            const planDoc = await db.collection('subscription_plans').doc(data.plan_id).get();
            const plan = planDoc.data() || {};

            return {
                id: doc.id,
                ...data,
                plan_name: plan.name,
                plan_price: plan.price
            };
        }));

        res.json({ success: true, subscriptions });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const switchSubscription = async (req: Request, res: Response) => {
    const driverId = (req as any).user.id;
    const { subscription_id } = req.body;

    try {
        await db.runTransaction(async (transaction) => {
            // 1. Validate Target Subscription
            const newSubRef = db.collection('driver_subscriptions').doc(subscription_id);
            const newSubDoc = await transaction.get(newSubRef);

            if (!newSubDoc.exists || newSubDoc.data()?.driver_id !== driverId) {
                throw new Error("Subscription not found or unauthorized");
            }
            const newSub = newSubDoc.data()!;

            // 2. Find currently Active subscription (if any) and Pause it
            const activeSnapshot = await db.collection('driver_subscriptions')
                .where('driver_id', '==', driverId)
                .where('status', '==', 'active')
                .get();

            activeSnapshot.docs.forEach(doc => {
                if (doc.id !== subscription_id) {
                    transaction.update(doc.ref, {
                        status: 'paused',
                        paused_at: new Date().toISOString()
                    });
                }
            });

            // 3. Activate the new subscription
            // Calculate new expiry if it was paused
            let newExpiry = newSub.expiry_date;
            let updatePayload: any = { status: 'active', paused_at: null };

            if (newSub.status === 'paused' && newSub.paused_at) {
                const pausedAt = new Date(newSub.paused_at);
                const now = new Date();
                // Shift expiry by duration paused
                const pauseDuration = now.getTime() - pausedAt.getTime();
                const currentExpiry = new Date(newSub.expiry_date);
                newExpiry = new Date(currentExpiry.getTime() + pauseDuration).toISOString();
                updatePayload.expiry_date = newExpiry;
            } else if (newSub.status !== 'active') { // e.g. newly approved pending?
                // usually verify handles specific dates, but if we switch to an unprocessed one?
                // For now assume switch is only between active/paused.
            }

            transaction.update(newSubRef, updatePayload);

            // 4. Update Driver Profile
            const driverRef = db.collection('drivers').doc(String(driverId));
            transaction.update(driverRef, {
                subscription_status: 'active',
                active_subscription_id: subscription_id,
                subscription_expiry: newExpiry
            });
        });

        res.json({ success: true, message: 'Switched subscription successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// --- BACKGROUND JOB ---
export const checkExpiredSubscriptions = async () => {
    console.log('⏰ Running Subscription Expiry Check...');
    const now = new Date().toISOString();

    try {
        const expiredSnapshot = await db.collection('driver_subscriptions')
            .where('status', '==', 'active')
            .where('expiry_date', '<', now)
            .get();

        if (expiredSnapshot.empty) return;

        console.log(`Found ${expiredSnapshot.size} expired subscriptions.`);

        const batch = db.batch();

        for (const doc of expiredSnapshot.docs) {
            const sub = doc.data();
            const driverId = sub.driver_id;

            // 1. Mark subscription as expired
            batch.update(doc.ref, { status: 'expired' });

            // 2. Check if driver has OTHER valid subscriptions (paused or active overlap?)
            // We do NOT auto-switch, but we check availability to set the flag on the driver
            const otherSubs = await db.collection('driver_subscriptions')
                .where('driver_id', '==', driverId)
                .where('status', 'in', ['paused']) // Check paused mainly
                .get();

            const hasBackup = !otherSubs.empty;

            // 3. Update Driver Status
            const driverRef = db.collection('drivers').doc(String(driverId));
            batch.update(driverRef, {
                subscription_status: 'expired',
                is_online: false,
                online_status: 'offline',
                has_backup_subscription: hasBackup // Use this for UI prompt
            });
        }

        await batch.commit();
        console.log('✅ Updated expired subscriptions.');

    } catch (error) {
        console.error('❌ Subscription Cron Failed:', error);
    }
};

// --- FAILSALE BACKGROUND JOB (Every 30 seconds) ---
export const syncAllDriverSubscriptions = async () => {
    const now = new Date().toISOString();

    try {
        // Find all active subscriptions (Equality only, no index required)
        const activeSubsSnapshot = await db.collection('driver_subscriptions')
            .where('status', '==', 'active')
            .get();

        if (activeSubsSnapshot.empty) {
            console.log('✅ [Sync] No active subscriptions found.');
            return;
        }

        // Filter for expired ones in memory to avoid needing a composite index
        const expiredDocs = activeSubsSnapshot.docs.filter(doc => {
            const data = doc.data();
            return data.expiry_date && data.expiry_date < now;
        });

        if (expiredDocs.length === 0) {
            console.log('✅ [Sync] No expired subscriptions found among active ones.');
            return;
        }

        console.log(`♻️ [Sync] Found ${expiredDocs.length} expired records to sync.`);
        const batch = db.batch();

        for (const subDoc of expiredDocs) {
            const sub = subDoc.data();
            const driverId = sub.driver_id;

            // Mark the sub as expired
            batch.update(subDoc.ref, { status: 'expired' });

            // Update the driver profile to offline
            const driverRef = db.collection('drivers').doc(String(driverId));
            batch.update(driverRef, {
                subscription_status: 'expired',
                is_online: false,
                online_status: 'offline'
            });

            // Also update the user doc for consistency
            const userRef = db.collection('users').doc(String(driverId));
            batch.update(userRef, {
                subscription_status: 'expired'
            });
        }

        await batch.commit();
        console.log('✅ [Sync] Successfully synchronized expired drivers.');

    } catch (error) {
        console.error('❌ Subscription Sync Job Failed:', error);
    }
};

// --- DRIVER HISTORY ---
export const getDriverSubscriptionHistory = async (req: Request, res: Response) => {
    const { driver_id } = req.params;

    try {
        const querySnapshot = await db.collection('driver_subscriptions')
            .where('driver_id', '==', String(driver_id))
            .where('status', 'in', ['expired', 'rejected'])
            .orderBy('created_at', 'desc')
            .get();

        const historyPromises = querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const planDoc = await db.collection('subscription_plans').doc(data.plan_id).get();
            const planData = planDoc.data() || {};

            return {
                id: doc.id,
                ...data,
                plan_name: planData.name,
                price: planData.price
            };
        });

        const history = await Promise.all(historyPromises);
        res.json({ success: true, history });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const clearDriverSubscriptionHistory = async (req: Request, res: Response) => {
    const { driver_id } = req.params;

    try {
        const querySnapshot = await db.collection('driver_subscriptions')
            .where('driver_id', '==', String(driver_id))
            .where('status', 'in', ['expired', 'rejected'])
            .get();

        if (querySnapshot.empty) {
            return res.json({ success: true, message: 'History is already empty.' });
        }

        const batch = db.batch();
        querySnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        res.json({ success: true, message: 'Subscription history cleared successfully.' });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

