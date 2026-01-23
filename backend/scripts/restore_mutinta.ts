
import { db } from '../src/config/firebase';

async function restoreMutinta() {
    const mutintaId = 'pPLLr5AAEj4WnWNHZJwv';
    const planId = '2OblDk26gyxyCfTox3Z5'; // Known plan ID
    const now = new Date();
    const expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    console.log(`Restoring Mutinta's subscription...`);

    const subRef = db.collection('driver_subscriptions').doc();
    const subData = {
        id: subRef.id,
        driver_id: mutintaId,
        plan_id: planId,
        plan_name: 'Weekly Plan',
        status: 'active',
        created_at: now.toISOString(),
        expiry_date: expiry.toISOString(),
        amount: 30, // Default amount for weekly
        payment_method: 'Manual Restoration',
        verified_at: now.toISOString(),
        screenshot_url: null
    };

    await db.runTransaction(async (transaction) => {
        transaction.set(subRef, subData);
        transaction.update(db.collection('drivers').doc(mutintaId), {
            subscription_status: 'active',
            subscription_expiry: expiry.toISOString()
        });
    });

    console.log(`✅ Mutinta's subscription restored! ID: ${subRef.id}`);
}

restoreMutinta().then(() => process.exit(0));
