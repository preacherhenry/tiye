
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function testProfileResponse() {
    const userId = 'sJVUcB1CQ06aA88imUxS'; // Grace
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const user = userDoc.data();
        
        let driverInfo = {};
        if (user.role === 'driver') {
            const driverDoc = await db.collection('drivers').doc(userId).get();
            if (driverDoc.exists) {
                const driver = driverDoc.data();
                driverInfo = {
                    subscription_status: driver.subscription_status,
                    subscription_expiry: driver.subscription_expiry
                };
            }
        }

        const response = {
            success: true,
            user: {
                id: user.id || userId,
                name: user.name,
                email: user.email,
                role: user.role,
                ...driverInfo
            }
        };

        console.log('--- MOCKED /profile RESPONSE ---');
        console.log(JSON.stringify(response, null, 2));

    } catch (e) {
        console.error(e);
    }
}

testProfileResponse();
