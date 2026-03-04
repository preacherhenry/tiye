const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function testQuery() {
    console.log('\n--- Checking current active subscriptions counts ---');
    try {
        const activeSnapshot = await db.collection('driver_subscriptions')
            .where('status', '==', 'active')
            .get();
        console.log(`Total active subscriptions: ${activeSnapshot.size}`);

        const now = new Date().toISOString();
        let expiredCount = 0;
        activeSnapshot.forEach(doc => {
            const d = doc.data();
            const isExpired = d.expiry_date < now;
            if (isExpired) {
                expiredCount++;
                console.log(`- MATCH: ${doc.id} | Expiry=${d.expiry_date} | Driver=${d.driver_id}`);
            }
        });
        console.log(`Total expired among active: ${expiredCount}`);

    } catch (error) {
        console.error('❌ Count failed:', error.message);
    }
}

testQuery().catch(console.error);
