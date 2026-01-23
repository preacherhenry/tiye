
import { db } from '../src/config/firebase';

async function listSubs() {
    const mutintaId = 'pPLLr5AAEj4WnWNHZJwv';
    console.log(`Listing subs for ${mutintaId}...`);
    const snapshot = await db.collection('driver_subscriptions').where('driver_id', '==', mutintaId).get();
    console.log(`Found ${snapshot.size} records.`);
    snapshot.docs.forEach(doc => {
        const d = doc.data();
        console.log(`- Sub ID: ${doc.id}`);
        console.log(`  Status: ${d.status}`);
        console.log(`  Expiry: ${d.expiry_date}`);
        console.log(`  Plan:   ${d.plan_name}`);
        console.log(`  Paused At: ${d.paused_at}`);
    });

    const driver = await db.collection('drivers').doc(mutintaId).get();
    console.log(`Driver Data:`);
    console.log(JSON.stringify(driver.data(), null, 2));
}

listSubs().then(() => process.exit(0));
