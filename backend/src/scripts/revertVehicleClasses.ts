import * as admin from 'firebase-admin';
const serviceAccount = require('../../firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function revert() {
    console.log('🔄 Reverting vehicle class migration...');

    const driversSnapshot = await db.collection('drivers').get();
    let count = 0;

    for (const doc of driversSnapshot.docs) {
        const data = doc.data();
        let newClass: string | null = null;

        if (data.vehicle_class === 'Taxi') newClass = 'Regular';
        else if (data.vehicle_class === 'Comfort Plus') newClass = 'Comfort+';

        if (newClass) {
            await doc.ref.update({ vehicle_class: newClass });
            count++;
            console.log(`↩️  Reverted driver ${doc.id} to class: ${newClass}`);
        }
    }

    console.log(`✅ Revert complete. ${count} drivers updated.`);
}

revert().catch(console.error);
