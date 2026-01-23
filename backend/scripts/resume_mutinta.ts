
import { db } from '../src/config/firebase';

async function resumeMutinta() {
    console.log("🚀 Resuming Mutinta's subscription...");

    // 1. Find her paused sub
    const mutintaId = 'pPLLr5AAEj4WnWNHZJwv';
    const subs = await db.collection('driver_subscriptions')
        .where('driver_id', '==', mutintaId)
        .where('status', '==', 'paused')
        .get();

    if (subs.empty) {
        console.log("❌ No paused subscription found for Mutinta.");
        return;
    }

    const subDoc = subs.docs[0];
    const subData = subDoc.data();

    // 2. Perform the unpause logic manually as the controller would
    const pausedAt = new Date(subData.paused_at);
    const now = new Date();
    const pauseDurationMs = now.getTime() - pausedAt.getTime();

    const currentExpiry = new Date(subData.expiry_date);
    const newExpiry = new Date(currentExpiry.getTime() + pauseDurationMs);

    console.log(`- Previous Expiry: ${subData.expiry_date}`);
    console.log(`- New Expiry: ${newExpiry.toISOString()}`);

    await db.runTransaction(async (transaction) => {
        // Update Sub
        transaction.update(subDoc.ref, {
            status: 'active',
            expiry_date: newExpiry.toISOString(),
            paused_at: null
        });

        // Update Driver
        transaction.update(db.collection('drivers').doc(mutintaId), {
            subscription_status: 'active',
            subscription_expiry: newExpiry.toISOString()
        });
    });

    console.log("✅ Mutinta's subscription has been RESUMED and Profile UPDATED!");
}

resumeMutinta().then(() => process.exit(0));
