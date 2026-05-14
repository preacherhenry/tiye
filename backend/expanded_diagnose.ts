
import { db } from './src/config/firebase';

const normalizeVehicleClass = (cls: string | undefined | null): string => {
    if (!cls) return 'Regular';
    const map: Record<string, string> = {
        'taxi': 'Regular',
        'regular': 'Regular',
        'comfort': 'Comfort',
        'comfort+': 'Comfort+',
        'comfort plus': 'Comfort+',
    };
    return map[(cls || '').toLowerCase().trim()] ?? cls;
};

async function expandedDiagnose() {
    console.log('=== EXPANDED DIAGNOSTIC REPORT ===\n');

    const preacherId = '41ncSJwQ29lW7nYwLFXQ';
    const rideId = 'ZorBu8uUfdL6fCTLeaTz';

    // 1. Check Passenger of the Ride
    const rideDoc = await db.collection('rides').doc(rideId).get();
    if (rideDoc.exists) {
        const rideData = rideDoc.data()!;
        console.log(`Ride ${rideId} Passenger ID: ${rideData.passenger_id}`);
        if (rideData.passenger_id === preacherId) {
            console.log('⚠️ ALERT: The passenger is the same as the driver (Preacher).');
        } else {
            console.log('✅ Passenger is NOT Preacher.');
            const passengerDoc = await db.collection('users').doc(rideData.passenger_id).get();
            console.log(`   Passenger Name: ${passengerDoc.data()?.name || 'Unknown'}`);
        }
    }

    // 2. Check ALL Pending Rides
    const allPendingSnap = await db.collection('rides').where('status', '==', 'pending').get();
    console.log(`\nTotal system-wide pending rides: ${allPendingSnap.size}`);

    // 3. Check for any other drivers online in Comfort+
    console.log('\n--- Other Drivers in Comfort+ ---');
    const driversSnap = await db.collection('drivers').get();
    const otherComfortPlus = driversSnap.docs.filter(d => {
        const cls = normalizeVehicleClass(d.data().vehicle_class);
        return cls === 'Comfort+' && d.id !== preacherId && d.data().online_status === 'online';
    });
    
    if (otherComfortPlus.length === 0) {
        console.log('None found.');
    } else {
        console.log(`Found ${otherComfortPlus.length} other online Comfort+ driver(s):`);
        for (const doc of otherComfortPlus) {
            const userDoc = await db.collection('users').doc(doc.id).get();
            console.log(`   - ${userDoc.data()?.name || 'Unknown'} (${doc.id})`);
        }
    }

    // 4. Check Wallet Balance in USERS collection vs DRIVERS
    const userDoc = await db.collection('users').doc(preacherId).get();
    console.log(`\nPreacher User Doc Balance: ${userDoc.data()?.wallet_balance}`);
    const drDoc = await db.collection('drivers').doc(preacherId).get();
    console.log(`Preacher Driver Doc Balance: ${drDoc.data()?.wallet_balance}`);

    // 5. Simulation logic (re-confirmed)
    console.log('\n--- Final Simulation Check ---');
    const dClass = normalizeVehicleClass(drDoc.data()?.vehicle_class);
    const rClass = normalizeVehicleClass(rideDoc.data()?.vehicle_class);
    console.log(`Driver Class: ${dClass}`);
    console.log(`Ride Class:   ${rClass}`);
    console.log(`Match Result: ${dClass === rClass}`);

    process.exit(0);
}

expandedDiagnose();
