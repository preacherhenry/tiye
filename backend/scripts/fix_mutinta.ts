import { db } from '../src/config/firebase';

async function fixMutinta() {
    console.log('🔧 Fixing Mutinta\'s driver profile to match paused subscription...\n');

    try {
        const mutintaId = 'pPLLr5AAEj4WnWNHZJwv';

        // Update driver profile to reflect paused status
        await db.collection('drivers').doc(mutintaId).update({
            subscription_status: 'paused',
            is_online: false,
            online_status: 'offline'
        });

        console.log('✅ Mutinta\'s driver profile updated:');
        console.log('   - subscription_status: paused (was: active)');
        console.log('   - is_online: false (was: true)');
        console.log('   - online_status: offline (was: online)');

        console.log('\n🔒 Mutinta is now blocked from accepting ride requests.');
        console.log('   She will see a "Subscription Paused" message.');
        console.log('   If she has other subscriptions, she can switch to them.');

        // Verify the update
        const driverDoc = await db.collection('drivers').doc(mutintaId).get();
        const driverData = driverDoc.data();

        console.log('\n✓ Verification:');
        console.log(`   Current Status: ${driverData?.subscription_status}`);
        console.log(`   Is Online: ${driverData?.is_online}`);
        console.log(`   Online Status: ${driverData?.online_status}`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixMutinta().then(() => process.exit(0));
