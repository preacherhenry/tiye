
import { db } from '../src/config/firebase';

async function auditMutinta() {
    const mutintaId = 'pPLLr5AAEj4WnWNHZJwv';
    console.log(`--- Audit for ${mutintaId} ---`);

    const driver = await db.collection('drivers').doc(mutintaId).get();
    const d = driver.data();
    console.log(`Driver Status: ${d?.subscription_status}`);
    console.log(`Driver Expiry: ${d?.subscription_expiry}`);

    const subs = await db.collection('driver_subscriptions').where('driver_id', '==', mutintaId).get();
    console.log(`Subscription Records: ${subs.size}`);
    subs.docs.forEach(doc => {
        const sd = doc.data();
        console.log(`- Sub ID: ${doc.id} | Status: ${sd.status} | Expiry: ${sd.expiry_date}`);
    });
}

auditMutinta().then(() => process.exit(0));
