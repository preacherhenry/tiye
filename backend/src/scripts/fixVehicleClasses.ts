/**
 * One-shot Firestore data repair script.
 *
 * Normalizes any legacy vehicle_class values on driver documents
 * to the canonical set used by the current app:
 *   'Regular', 'Comfort', 'Comfort+'
 *
 * Legacy values that may exist from old migration scripts:
 *   'Taxi'         -> 'Regular'
 *   'Comfort Plus' -> 'Comfort+'
 *
 * Run once:
 *   cd c:\Users\lenovo\taxi_backend\backend
 *   npx ts-node src/scripts/fixVehicleClasses.ts
 */

import * as admin from 'firebase-admin';

const serviceAccount = require('../../firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const LEGACY_CLASS_MAP: Record<string, string> = {
    'taxi': 'Regular',
    'comfort plus': 'Comfort+',
};

const normalizeVehicleClass = (cls: string | undefined | null): string | null => {
    if (!cls) return null;
    const canonical = LEGACY_CLASS_MAP[cls.toLowerCase().trim()];
    return canonical ?? null; // null = already correct, no update needed
};

async function fixDriverVehicleClasses() {
    console.log('🔧 Starting vehicle class repair for drivers...');

    const snapshot = await db.collection('drivers').get();
    console.log(`🔍 Found ${snapshot.size} driver document(s).`);

    const batch = db.batch();
    let updateCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const currentClass = data.vehicle_class;
        const fixedClass = normalizeVehicleClass(currentClass);

        if (fixedClass) {
            console.log(`   ✏️  Driver ${doc.id}: "${currentClass}" → "${fixedClass}"`);
            batch.update(doc.ref, {
                vehicle_class: fixedClass,
                class_repaired_at: new Date().toISOString()
            });
            updateCount++;
        }
    }

    if (updateCount === 0) {
        console.log('✅ All driver vehicle_class values are already up to date. No changes needed.');
        return;
    }

    await batch.commit();
    console.log(`\n🎉 Repair complete. Updated ${updateCount} driver document(s).`);
}

async function fixPendingRideVehicleClasses() {
    console.log('\n🔧 Starting vehicle class repair for pending rides...');

    const snapshot = await db.collection('rides')
        .where('status', '==', 'pending')
        .get();
    console.log(`🔍 Found ${snapshot.size} pending ride(s).`);

    const batch = db.batch();
    let updateCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const currentClass = data.vehicle_class;
        const fixedClass = normalizeVehicleClass(currentClass);

        if (fixedClass) {
            console.log(`   ✏️  Ride ${doc.id}: "${currentClass}" → "${fixedClass}"`);
            batch.update(doc.ref, { vehicle_class: fixedClass });
            updateCount++;
        }
    }

    if (updateCount === 0) {
        console.log('✅ All pending ride vehicle_class values are already up to date. No changes needed.');
        return;
    }

    await batch.commit();
    console.log(`🎉 Repair complete. Updated ${updateCount} pending ride(s).`);
}

(async () => {
    try {
        await fixDriverVehicleClasses();
        await fixPendingRideVehicleClasses();
        console.log('\n✅ All done. Run your backend server now.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Repair failed:', err);
        process.exit(1);
    }
})();
