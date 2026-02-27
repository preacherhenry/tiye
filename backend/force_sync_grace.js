
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function cleanGraceSubs() {
    const driverId = 'sJVUcB1CQ06aA88imUxS'; // Grace's ID
    const now = new Date().toISOString();

    try {
        console.log(`--- Expiring Grace's Individual Sub Records ---`);
        const subsSnapshot = await db.collection('driver_subscriptions')
            .where('driver_id', '==', driverId)
            .get();

        const batch = db.batch();
        let count = 0;

        subsSnapshot.forEach(doc => {
            const sub = doc.data();
            if (sub.status === 'active' && sub.expiry_date <= now) {
                console.log(`Expiring sub ${doc.id}`);
                batch.update(doc.ref, { status: 'expired' });
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`Successfully expired ${count} records.`);
        } else {
            console.log('No active/expired records found for Grace.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

cleanGraceSubs();
