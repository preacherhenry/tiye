
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function syncGrace() {
    const now = new Date().toISOString();
    const driverId = 'sJVUcB1CQ06aA88imUxS'; // Grace's ID

    try {
        console.log(`Checking sync for Grace at ${now}`);
        const driverDoc = await db.collection('drivers').doc(driverId).get();
        if (!driverDoc.exists) return console.log('Driver not found');
        
        const driverData = driverDoc.data();
        console.log('Current Status:', driverData.subscription_status);
        console.log('Current Expiry:', driverData.subscription_expiry);

        const subsSnapshot = await db.collection('driver_subscriptions')
            .where('driver_id', '==', driverId)
            .get();

        let targetStatus = 'none';
        let bestExpiry = null;
        let activeSubFound = false;
        let pausedSubFound = false;
        let expiredSubFound = false;

        subsSnapshot.docs.forEach(subDoc => {
            const sub = subDoc.data();
            console.log(`Sub ${subDoc.id}: status=${sub.status}, expiry=${sub.expiry_date}`);
            if (sub.status === 'active') {
                if (sub.expiry_date > now) {
                    activeSubFound = true;
                    if (!bestExpiry || sub.expiry_date > bestExpiry) {
                        bestExpiry = sub.expiry_date;
                    }
                } else {
                    expiredSubFound = true;
                }
            } else if (sub.status === 'paused') {
                pausedSubFound = true;
            }
        });

        if (activeSubFound) {
            targetStatus = 'active';
        } else if (pausedSubFound) {
            targetStatus = 'paused';
        } else if (expiredSubFound) {
            targetStatus = 'expired';
        }

        console.log('Calculated Target Status:', targetStatus);

        if (driverData.subscription_status !== targetStatus) {
            console.log('Updating status to:', targetStatus);
            await db.collection('drivers').doc(driverId).update({
                subscription_status: targetStatus,
                is_online: targetStatus === 'active',
                online_status: targetStatus === 'active' ? 'online' : 'offline'
            });
            console.log('Update successful');
        } else {
            console.log('No update needed (mismatch not found or already correct)');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

syncGrace();
