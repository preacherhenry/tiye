
import { db } from '../src/config/firebase';

const diagnoseDrivers = async () => {
    console.log("🔍 Starting Driver Diagnosis...");

    try {
        const usersSnapshot = await db.collection('users').where('role', '==', 'driver').get();

        if (usersSnapshot.empty) {
            console.log("❌ No users found with role='driver'.");
            return;
        }

        console.log(`✅ Found ${usersSnapshot.size} driver(s). Checking profiles...`);

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            const driverDoc = await db.collection('drivers').doc(doc.id).get();

            if (driverDoc.exists) {
                const driverData = driverDoc.data();

                // Only print if it's the specific driver 'Grace' or just print all key info
                if (userData.name.includes('Grace') || driverData?.online_status === 'online') {
                    console.log(`\n--------------------------------------------------`);
                    console.log(`👤 Driver: ${userData.name} (ID: ${doc.id})`);
                    console.log(`   📧 Email: ${userData.email}`);
                    console.log(`   🚗 Car: ${driverData?.car_model} (${driverData?.plate_number})`);
                    console.log(`   🟢 Online Status: ${driverData?.online_status}  (Is Online: ${driverData?.is_online})`);
                    console.log(`   💳 Sub Status:    ${driverData?.subscription_status}`);
                    console.log(`   📅 Sub Expiry:    ${driverData?.subscription_expiry}`);

                    // Check Subscriptions
                    const subs = await db.collection('driver_subscriptions')
                        .where('driver_id', '==', doc.id)
                        .get();

                    console.log(`   📂 Subscriptions Records Found: ${subs.size}`);
                    if (!subs.empty) {
                        subs.docs.forEach(s => {
                            const sd = s.data();
                            console.log(`      - [${sd.status.toUpperCase()}] Expires: ${sd.expiry_date} (ID: ${s.id})`);
                        });
                    } else {
                        console.log(`      ⚠️  NO SUBSCRIPTION DOCUMENTS FOUND!`);
                        if (driverData?.subscription_status === 'active') {
                            console.log(`      🔥 CRITICAL: Status is ACTIVE but no documents exist!`);
                        }
                    }
                }
            } else {
                console.log(`❌ Driver Profile Missing for user ${userData.name} (${doc.id})`);
            }
        }

    } catch (error) {
        console.error("Diagnosis Failed:", error);
    }
};

diagnoseDrivers();
