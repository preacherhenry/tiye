import { Request, Response } from 'express';
import { db } from '../config/firebase';

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
        const host = req.get('host') || 'localhost:5000';
        const screenshot_url = `${req.protocol}://${host}/uploads/${file.filename}`;

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

        const subscriptions = await Promise.all(subsSnapshot.docs.map(async (doc) => {
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
                price: planData.price,
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
            const expiryDate = new Date();
            expiryDate.setDate(startDate.getDate() + (plan.duration_days || 0));

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
    const { name, price, duration_days, description } = req.body;
    try {
        const planRef = db.collection('subscription_plans').doc();
        await planRef.set({
            id: planRef.id,
            name,
            price,
            duration_days,
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
    const { id, name, price, duration_days, description, status } = req.body;
    try {
        await db.collection('subscription_plans').doc(id).update({
            name,
            price,
            duration_days,
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
                    subscription_expiry: newExpiry.toISOString()
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
