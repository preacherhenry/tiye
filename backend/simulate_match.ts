
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
    const key = (cls || '').toLowerCase().trim();
    return map[key] ?? cls;
};

// Simplified geo logic from rideController
const getDistanceBetween = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

async function simulateRideMatching() {
    console.log('=== RIDE MATCHING SIMULATION ===\n');

    const preacherId = '41ncSJwQ29lW7nYwLFXQ'; // Identified from previous diagnostic
    const rideId = 'ZorBu8uUfdL6fCTLeaTz'; // Identified from previous diagnostic

    // 1. Fetch Driver
    const driverDoc = await db.collection('drivers').doc(preacherId).get();
    if (!driverDoc.exists) {
        console.log('❌ Driver not found');
        return;
    }
    const driver = driverDoc.data()!;
    const driverClass = normalizeVehicleClass(driver.vehicle_class);
    const driverLat = driver.current_lat;
    const driverLng = driver.current_lng;
    const walletBalance = driver.wallet_balance || 0;

    console.log(`Driver: Preacher (${preacherId})`);
    console.log(`- Online Status: ${driver.online_status}`);
    console.log(`- Wallet: K${walletBalance}`);
    console.log(`- Class: "${driver.vehicle_class}" -> "${driverClass}"`);
    console.log(`- Location: ${driverLat}, ${driverLng}`);

    // 2. Wallet Check Simulation
    const minBalanceDoc = await db.collection('settings').doc('min_online_balance').get();
    const minBalance = Number(minBalanceDoc.data()?.value || 5);
    if (walletBalance < minBalance) {
        console.log(`🚫 FAILED: Wallet balance K${walletBalance} < Min K${minBalance}`);
    } else {
        console.log(`✅ PASSED: Wallet Check (K${walletBalance} >= K${minBalance})`);
    }

    // 3. Fetch Rejections
    const rejectionsSnapshot = await db.collection('ride_rejections')
        .where('driver_id', '==', String(preacherId))
        .get();
    const rejectedRideIds = new Set(rejectionsSnapshot.docs.map(doc => doc.data().ride_id));
    console.log(`- Rejected Ride IDs count: ${rejectedRideIds.size}`);

    // 4. Fetch All Pending Rides (Same as rideController)
    console.log('\n--- Fetching Pending Rides (Batch of 50) ---');
    const querySnapshot = await db.collection('rides')
        .where('status', '==', 'pending')
        .limit(50)
        .get();
    
    console.log(`- Total pending rides in first 50: ${querySnapshot.size}`);
    const foundInBatch = querySnapshot.docs.some(d => d.id === rideId);
    console.log(`- Specific Ride (${rideId}) found in batch: ${foundInBatch ? 'YES ✅' : 'NO ❌'}`);

    // 4.5 If not in first 50, check if it's pending at all
    if (!foundInBatch) {
        const specificRideDoc = await db.collection('rides').doc(rideId).get();
        if (specificRideDoc.exists) {
            console.log(`  (Note: Ride exists in DB with status "${specificRideDoc.data()?.status}")`);
        } else {
            console.log(`  (Note: Ride DOES NOT EXIST in DB)`);
        }
    }

    // 5. Run Filter Logic
    console.log('\n--- Running Match Logic on Batch ---');
    querySnapshot.docs.forEach(doc => {
        const ride = doc.data();
        const rideClass = normalizeVehicleClass(ride.vehicle_class);
        const isMatch = (rideClass === driverClass);
        const isNotRejected = !rejectedRideIds.has(doc.id);
        
        if (doc.id === rideId) {
            console.log(`Checking target Ride ${doc.id}:`);
            console.log(`  - Ride Class: "${ride.vehicle_class}" -> "${rideClass}"`);
            console.log(`  - Driver Class: "${driverClass}"`);
            console.log(`  - Class Match: ${isMatch}`);
            console.log(`  - Not Rejected: ${isNotRejected}`);
            
            if (isMatch && isNotRejected) {
                const dist = getDistanceBetween(
                    Number(driverLat), Number(driverLng),
                    Number(ride.pickup_lat), Number(ride.pickup_lng)
                );
                console.log(`  - Distance to Pickup: ${dist.toFixed(2)} km`);
                console.log('  ✅ SHOULD BE VISIBLE');
            } else {
                console.log('  ❌ FILTERED OUT');
            }
        }
    });

    console.log('\n=== END OF SIMULATION ===');
    process.exit(0);
}

simulateRideMatching();
