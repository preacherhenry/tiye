
import { db } from '../src/config/firebase';

const diagnoseDrivers = async () => {
    console.log("🔍 Starting Driver Diagnosis...");

    try {
        // 1. Fetch all users with role 'driver'
        console.log("\n--- Checking 'users' collection for role='driver' ---");
        const usersSnapshot = await db.collection('users').where('role', '==', 'driver').get();

        if (usersSnapshot.empty) {
            console.log("❌ No users found with role='driver'.");
        } else {
            console.log(`✅ Found ${usersSnapshot.size} driver(s) in 'users' collection:`);

            for (const doc of usersSnapshot.docs) {
                const data = doc.data();
                console.log(`\n🆔 User ID: ${doc.id}`);
                console.log(`   Name: ${data.name}`);
                console.log(`   Email: ${data.email}`);
                console.log(`   Role: '${data.role}' (Expected: 'driver')`);
                console.log(`   Status: ${data.status}`);

                // 2. Check corresponding 'drivers' collection
                const driverDoc = await db.collection('drivers').doc(doc.id).get();
                if (driverDoc.exists) {
                    console.log(`   ✅ Driver Profile (in 'drivers'): FOUND`);
                    console.log(`      Car: ${driverDoc.data()?.car_model}`);
                    console.log(`      Online Status: ${driverDoc.data()?.online_status}`);
                } else {
                    console.log(`   ❌ Driver Profile (in 'drivers'): MISSING! (This is likely the cause)`);

                    // Attempt auto-fix? No, just report for now.
                }
            }
        }

        // 3. Reverse check: Check if any user is confused
        console.log("\n--- Checking for potential role mismatches ---");
        const allUsers = await db.collection('users').get();
        allUsers.docs.forEach(doc => {
            const d = doc.data();
            if (d.role !== 'driver' && (d.email?.includes('driver') || d.name?.includes('Driver'))) {
                console.log(`⚠️ Suspicious User (might be a driver?): ${d.email} has role '${d.role}'`);
            }
        });

    } catch (error) {
        console.error("Diagnosis Failed:", error);
    }
};

diagnoseDrivers();
