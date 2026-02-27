
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkDriverSubscriptions(userId) {
    try {
        console.log(`--- Checking Subscriptions for Driver: ${userId} ---`);
        
        // 1. Get driver doc
        const driverDoc = await db.collection('drivers').doc(userId).get();
        if (driverDoc.exists) {
            console.log('Driver Profile Expiry:', driverDoc.data().subscription_expiry);
            console.log('Driver Profile Status:', driverDoc.data().subscription_status);
        }

        // 2. Get all subscriptions for this driver
        const subsSnapshot = await db.collection('driver_subscriptions')
            .where('driver_id', '==', userId)
            .get();

        if (subsSnapshot.empty) {
            console.log('No subscriptions found in driver_subscriptions collection.');
            return;
        }

        console.log('\n--- Subscriptions in driver_subscriptions ---');
        subsSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id}`);
            console.log(`  Status: ${data.status}`);
            console.log(`  Start:  ${data.start_date}`);
            console.log(`  Expiry: ${data.expiry_date}`);
            console.log(`  Plan:   ${data.plan_id}`);
            console.log('----------------------------');
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

const userId = 'sJVUcB1CQ06aA88imUxS'; // Grace's ID
checkDriverSubscriptions(userId);
