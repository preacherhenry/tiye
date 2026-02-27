
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function forceDisconnectGrace() {
    const driverId = 'sJVUcB1CQ06aA88imUxS'; // Grace's ID

    try {
        console.log(`--- Forcing Disconnect for Grace ---`);
        const driverDoc = await db.collection('drivers').doc(driverId).get();
        if (!driverDoc.exists) return console.log('Driver not found');
        
        console.log('Current Status:', driverDoc.data().subscription_status);
        console.log('Current Online:', driverDoc.data().is_online);

        await db.collection('drivers').doc(driverId).update({
            subscription_status: 'expired',
            is_online: false,
            online_status: 'offline'
        });
        
        // Also ensure user collection is synced
        await db.collection('users').doc(driverId).update({
            is_online: false
        });

        console.log('Update successful: Grace is now offline and expired.');

    } catch (error) {
        console.error('Error:', error);
    }
}

forceDisconnectGrace();
