
import { db } from '../src/config/firebase';

async function dumpAllSubs() {
    console.log("Dumping all subscriptions...");
    const snapshot = await db.collection('driver_subscriptions').get();
    console.log(`Total subscriptions: ${snapshot.size}`);
    snapshot.docs.forEach(doc => {
        const d = doc.data();
        console.log(`ID: ${doc.id} | Driver: ${d.driver_id} | Status: ${d.status} | Expiry: ${d.expiry_date}`);
    });
}

dumpAllSubs().then(() => process.exit(0));
