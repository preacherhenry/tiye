
import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function diagnose(driverId: string) {
    console.log(`\n--- Diagnosing Driver: ${driverId} ---`);

    const driverDoc = await db.collection('drivers').doc(driverId).get();
    if (!driverDoc.exists) {
        console.log('Driver not found');
        return;
    }

    const driverData = driverDoc.data()!;
    console.log('Profile Data:');
    console.log(`- subscription_status: ${driverData.subscription_status}`);
    console.log(`- subscription_expiry: ${driverData.subscription_expiry}`);
    console.log(`- is_online: ${driverData.is_online}`);
    console.log(`- online_status: ${driverData.online_status}`);

    console.log('\nSubscriptions:');
    const subsSnapshot = await db.collection('driver_subscriptions')
        .where('driver_id', '==', driverId)
        .get();

    const now = new Date().toISOString();
    console.log(`Current Time (now): ${now}`);

    subsSnapshot.docs.forEach(doc => {
        const sub = doc.data();
        const isExpired = sub.expiry_date < now;
        console.log(`- ID: ${doc.id}`);
        console.log(`  Plan: ${sub.plan_name}`);
        console.log(`  Status: ${sub.status}`);
        console.log(`  Expiry: ${sub.expiry_date} ${isExpired ? '(EXPIRED)' : '(VALID)'}`);
        console.log(`  Paused At: ${sub.paused_at}`);
    });
}

const targetId = process.argv[2] || 'mutinta'; // Replace with actual ID if known
diagnose(targetId).then(() => process.exit(0));
