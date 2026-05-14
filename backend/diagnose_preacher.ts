
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
    return map[cls.toLowerCase().trim()] ?? cls;
};

async function diagnose() {
    console.log('=== DIAGNOSTIC REPORT ===\n');

    // 1. Find Preacher's user entry
    console.log('--- Searching for Preacher in users collection ---');
    const usersSnap = await db.collection('users').get();
    const preacherUsers = usersSnap.docs
        .filter(d => {
            const data = d.data();
            const name: string = (data.name || '').toLowerCase();
            return name.includes('preacher');
        })
        .map(d => ({ id: d.id, ...d.data() }));

    if (preacherUsers.length === 0) {
        console.log('❌ No user with name containing "preacher" found.');
    } else {
        console.log(`✅ Found ${preacherUsers.length} user(s):`);
        preacherUsers.forEach((u: any) => {
            console.log(`   ID: ${u.id} | Name: ${u.name} | Role: ${u.role} | Status: ${u.status}`);
        });
    }

    // 2. For each preacher user, check drivers collection
    console.log('\n--- Checking drivers collection for Preacher ---');
    for (const user of preacherUsers as any[]) {
        const driverDoc = await db.collection('drivers').doc(user.id).get();
        if (!driverDoc.exists) {
            console.log(`❌ No driver document found for user ${user.id} (${user.name})`);
        } else {
            const d = driverDoc.data()!;
            const rawClass = d.vehicle_class;
            const normalized = normalizeVehicleClass(rawClass);
            console.log(`\n✅ Driver Document for ${user.name} (${user.id}):`);
            console.log(`   vehicle_class (raw):        "${rawClass}"`);
            console.log(`   vehicle_class (normalized): "${normalized}"`);
            console.log(`   online_status:              "${d.online_status}"`);
            console.log(`   wallet_balance:             K${d.wallet_balance}`);
            console.log(`   current_lat/lng:            ${d.current_lat}, ${d.current_lng}`);
        }
    }

    // 3. Check the pending Comfort+ ride(s)
    console.log('\n--- Pending Rides with vehicle_class containing "Comfort+" ---');
    const ridesSnap = await db.collection('rides')
        .where('status', '==', 'pending')
        .get();

    const comfortPlusRides = ridesSnap.docs.filter(d => {
        const cls = d.data().vehicle_class || '';
        return normalizeVehicleClass(cls) === 'Comfort+';
    });

    if (comfortPlusRides.length === 0) {
        console.log('❌ No pending Comfort+ rides found.');
    } else {
        comfortPlusRides.forEach(doc => {
            const r = doc.data();
            console.log(`\n   Ride ID: ${doc.id}`);
            console.log(`   vehicle_class (raw):        "${r.vehicle_class}"`);
            console.log(`   vehicle_class (normalized): "${normalizeVehicleClass(r.vehicle_class)}"`);
            console.log(`   status:                     "${r.status}"`);
            console.log(`   created_at:                 ${r.created_at}`);
        });
    }

    // 4. Check min_online_balance setting
    console.log('\n--- Settings: min_online_balance ---');
    const settingDoc = await db.collection('settings').doc('min_online_balance').get();
    const minBalance = settingDoc.exists ? settingDoc.data()?.value : '(not set, default=5)';
    console.log(`   min_online_balance: K${minBalance}`);

    // 5. Check ride_rejections for any preacher driver
    if (preacherUsers.length > 0) {
        console.log('\n--- Checking ride_rejections for Preacher ---');
        for (const user of preacherUsers as any[]) {
            const rejectionsSnap = await db.collection('ride_rejections')
                .where('driver_id', '==', String(user.id))
                .get();
            if (rejectionsSnap.empty) {
                console.log(`   No rejections recorded for driver ${user.id}`);
            } else {
                console.log(`   ${rejectionsSnap.size} rejection(s) found for driver ${user.id}:`);
                rejectionsSnap.docs.forEach(r => {
                    console.log(`     ride_id: ${r.data().ride_id}  at: ${r.data().rejected_at}`);
                });
            }
        }
    }

    console.log('\n=== END OF DIAGNOSTIC REPORT ===');
    process.exit(0);
}

diagnose().catch(err => {
    console.error('Diagnostic Error:', err);
    process.exit(1);
});
