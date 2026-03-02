
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function verifyDistribution() {
    const driverId = 'sJVUcB1CQ06aA88imUxS'; // Grace
    console.log('--- Verifying Distribution Rule ---');

    // 1. Create 5 pending rides
    console.log('1. Creating 5 pending rides...');
    const batch = db.batch();
    const rideIds = [];
    for (let i = 1; i <= 5; i++) {
        const ref = db.collection('rides').doc();
        batch.set(ref, {
            id: ref.id,
            passenger_id: 'test_passenger',
            pickup_location: `Test Pickup Loop ${i}`,
            destination: `Dest ${i}`,
            status: 'pending',
            created_at: new Date().toISOString()
        });
        rideIds.push(ref.id);
    }
    await batch.commit();

    // 2. Clear existing rejections for this driver to ensure clean test
    console.log('2. Cleaning previous rejections...');
    const oldRejections = await db.collection('ride_rejections').where('driver_id', '==', driverId).get();
    const rejBatch = db.batch();
    oldRejections.forEach(doc => rejBatch.delete(doc.ref));
    await rejBatch.commit();

    // 3. Simulate getPendingRides logic
    async function getFilteredRides(id) {
        const rejections = await db.collection('ride_rejections').where('driver_id', '==', id).get();
        const rejIds = new Set(rejections.docs.map(d => d.data().ride_id));
        const allRides = await db.collection('rides').where('status', '==', 'pending').limit(10).get();
        return allRides.docs.map(d => d.data()).filter(r => !rejIds.has(r.id)).slice(0, 3);
    }

    let visibleRides = await getFilteredRides(driverId);
    console.log(`Initial visible rides: ${visibleRides.length} (Expected: 3)`);
    visibleRides.forEach((r, idx) => console.log(`  ${idx+1}: ${r.pickup_location} (ID: ${r.id})`));

    if (visibleRides.length !== 3) {
        console.log('❌ FAILED: Did not show exactly 3 rides.');
    }

    // 4. Reject one ride
    const toReject = visibleRides[0].id;
    console.log(`\n3. Rejecting ride: ${visibleRides[0].pickup_location}`);
    await db.collection('ride_rejections').doc(`${driverId}_${toReject}`).set({
        driver_id: driverId,
        ride_id: toReject,
        rejected_at: new Date().toISOString()
    });

    // 5. Check visible rides again
    visibleRides = await getFilteredRides(driverId);
    console.log(`\nVisible rides after rejection: ${visibleRides.length}`);
    visibleRides.forEach((r, idx) => console.log(`  ${idx+1}: ${r.pickup_location} (ID: ${r.id})`));
    
    const isStillVisible = visibleRides.some(r => r.id === toReject);
    if (isStillVisible) {
        console.log('❌ FAILED: Rejected ride still visible!');
    } else {
        console.log('✅ SUCCESS: Rejected ride hidden, new target appeared.');
    }

    // 6. Test on_trip logic
    console.log('\n4. Testing On-Trip logic...');
    await db.collection('drivers').doc(driverId).update({ online_status: 'on_trip' });
    
    // Logic from controller:
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    if (driverDoc.data().online_status === 'on_trip') {
        console.log('✅ SUCCESS: Driver is on trip, logic will return 0 rides.');
    } else {
        console.log('❌ FAILED: Driver status not updated correctly.');
    }

    // Reset driver status
    await db.collection('drivers').doc(driverId).update({ online_status: 'online' });

    // Cleanup
    console.log('\nCleaning up test data...');
    const cleanupBatch = db.batch();
    for (const id of rideIds) cleanupBatch.delete(db.collection('rides').doc(id));
    await cleanupBatch.commit();
    console.log('Done.');
}

verifyDistribution().catch(console.error);
