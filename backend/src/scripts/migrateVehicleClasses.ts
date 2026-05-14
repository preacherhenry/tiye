import * as admin from 'firebase-admin';
const serviceAccount = require('../../firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function migrate() {
    console.log('🚀 Starting vehicle class migration...');

    // 1. Migrate Drivers
    const driversSnapshot = await db.collection('drivers').get();
    let driversCount = 0;
    
    for (const doc of driversSnapshot.docs) {
        const data = doc.data();
        let updated = false;
        let newClass = data.vehicle_class;

        if (data.vehicle_class === 'Regular' || !data.vehicle_class) {
            newClass = 'Taxi';
            updated = true;
        } else if (data.vehicle_class === 'Comfort+') {
            newClass = 'Comfort Plus';
            updated = true;
        }

        if (updated) {
            await doc.ref.update({ vehicle_class: newClass });
            driversCount++;
            console.log(`✅ Updated driver ${doc.id} (${data.name}) to class: ${newClass}`);
        }
    }

    // 2. Migrate Pending Rides
    const ridesSnapshot = await db.collection('rides').where('status', '==', 'pending').get();
    let ridesCount = 0;
    for (const doc of ridesSnapshot.docs) {
        const data = doc.data();
        let updated = false;
        let newClass = data.vehicle_class;

        if (data.vehicle_class === 'Regular' || !data.vehicle_class) {
            newClass = 'Taxi';
            updated = true;
        } else if (data.vehicle_class === 'Comfort+') {
            newClass = 'Comfort Plus';
            updated = true;
        }

        if (updated) {
            await doc.ref.update({ vehicle_class: newClass });
            ridesCount++;
            console.log(`✅ Updated pending ride ${doc.id} to class: ${newClass}`);
        }
    }

    console.log(`🎉 Migration complete!`);
    console.log(`Drivers updated: ${driversCount}`);
    console.log(`Pending rides updated: ${ridesCount}`);
}

migrate().catch(console.error);
