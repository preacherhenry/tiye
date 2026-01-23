
import { db } from '../src/config/firebase';

async function findAnySubForMutinta() {
    const mutintaId = 'pPLLr5AAEj4WnWNHZJwv';
    console.log(`Searching all subscriptions for driver: ${mutintaId}`);

    const snapshot = await db.collection('driver_subscriptions')
        .where('driver_id', '==', mutintaId)
        .get();

    console.log(`Found ${snapshot.size} records.`);
    snapshot.docs.forEach(doc => {
        console.log(`ID: ${doc.id} | Status: ${doc.get('status')} | Plan: ${doc.get('plan_name')}`);
    });

    // Check if there are any records with a DIFFERENT driver_id format
    const allSubs = await db.collection('driver_subscriptions').get();
    console.log(`\nChecking all ${allSubs.size} records for potential matches...`);
    allSubs.docs.forEach(doc => {
        const d = doc.data();
        if (JSON.stringify(d).includes(mutintaId)) {
            console.log(`Potential Match -> ID: ${doc.id} | Data: ${JSON.stringify(d)}`);
        }
    });
}

findAnySubForMutinta().then(() => process.exit(0));
