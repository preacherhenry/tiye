import { db } from '../src/config/firebase';

async function blockGrace() {
    console.log('🚫 Blocking Grace from accepting rides...\n');

    try {
        const graceId = 'sJVUcB1CQ06aA88imUxS';

        // Update driver profile
        await db.collection('drivers').doc(graceId).update({
            subscription_status: 'none',
            is_online: false,
            online_status: 'offline',
            subscription_expiry: null,
            active_subscription_id: null
        });

        console.log('✅ Grace\'s driver profile updated:');
        console.log('   - subscription_status: none');
        console.log('   - is_online: false');
        console.log('   - online_status: offline');
        console.log('   - subscription_expiry: null');
        console.log('   - active_subscription_id: null');

        console.log('\n🔒 Grace is now blocked from accepting ride requests.');
        console.log('   She will see a "No Active Subscription" message in the app.');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

blockGrace().then(() => process.exit(0));
