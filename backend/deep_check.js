
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function deepCheck() {
    const id = 'sJVUcB1CQ06aA88imUxS';
    console.log('--- Deep Check for Grace ---');
    
    const driverDoc = await db.collection('drivers').doc(id).get();
    const userData = driverDoc.data();
    console.log('DRIVERS Status:', userData.subscription_status);
    console.log('DRIVERS Expiry:', userData.subscription_expiry);
    console.log('DRIVERS Online:', userData.is_online);

    const userDoc = await db.collection('users').doc(id).get();
    const userProfile = userDoc.data();
    console.log('USERS Role:', userProfile.role);
    console.log('USERS Status:', userProfile.status);
    // Some apps store redundant info in users collection
    console.log('USERS Sub Status (Extra):', userProfile.subscription_status); 

    const subs = await db.collection('driver_subscriptions').where('driver_id', '==', id).get();
    subs.forEach(s => {
        console.log(`SUB ${s.id}: status=${s.data().status}, expiry=${s.data().expiry_date}`);
    });
}

deepCheck();
