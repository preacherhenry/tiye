import { db } from '../src/config/firebase';

async function checkGraceStatus() {
    console.log('🔍 Searching for Grace in the database...\n');

    try {
        // Search for users named Grace
        const usersSnapshot = await db.collection('users')
            .where('role', '==', 'driver')
            .get();

        const graceUsers = usersSnapshot.docs.filter(doc =>
            doc.data().name?.toLowerCase().includes('grace')
        );

        if (graceUsers.length === 0) {
            console.log('❌ No driver named Grace found.');
            return;
        }

        console.log(`✅ Found ${graceUsers.length} driver(s) with name containing 'Grace'\n`);

        for (const userDoc of graceUsers) {
            const userId = userDoc.id;
            const userData = userDoc.data();

            console.log('👤 User Info:');
            console.log(`   ID: ${userId}`);
            console.log(`   Name: ${userData.name}`);
            console.log(`   Phone: ${userData.phone}`);
            console.log(`   Email: ${userData.email}`);

            // Check driver profile
            const driverDoc = await db.collection('drivers').doc(userId).get();
            if (driverDoc.exists) {
                const driverData = driverDoc.data()!;
                console.log('\n🚗 Driver Profile:');
                console.log(`   Subscription Status: ${driverData.subscription_status || 'none'}`);
                console.log(`   Online Status: ${driverData.online_status || 'offline'}`);
                console.log(`   Is Online: ${driverData.is_online || false}`);
                console.log(`   Subscription Expiry: ${driverData.subscription_expiry || 'N/A'}`);
            }

            // Check subscriptions
            const subsSnapshot = await db.collection('driver_subscriptions')
                .where('driver_id', '==', userId)
                .get();

            console.log(`\n💳 Subscriptions (${subsSnapshot.size} total):`);
            if (subsSnapshot.empty) {
                console.log('   No subscriptions found.');
            } else {
                subsSnapshot.docs.forEach(doc => {
                    const sub = doc.data();
                    console.log(`   - ID: ${doc.id}`);
                    console.log(`     Status: ${sub.status}`);
                    console.log(`     Plan: ${sub.plan_id}`);
                    console.log(`     Expiry: ${sub.expiry_date || 'N/A'}`);
                    console.log(`     Created: ${sub.created_at}`);
                });
            }

            console.log('\n' + '='.repeat(50) + '\n');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkGraceStatus().then(() => process.exit(0));
