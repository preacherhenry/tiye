import { db } from '../config/firebase';

async function migrateDrivers() {
    console.log('🚀 Starting driver migration to "Regular" vehicle class...');
    
    try {
        const driversRef = db.collection('drivers');
        const snapshot = await driversRef.get();
        
        if (snapshot.empty) {
            console.log('❌ No drivers found in the database.');
            return;
        }

        console.log(`🔍 Found ${snapshot.size} drivers. Checking for vehicle_class...`);

        let updatedCount = 0;
        let skippedCount = 0;

        const batch = db.batch();

        snapshot.forEach(doc => {
            const data = doc.data();
            // Assign to Regular if vehicle_class is missing or empty
            if (!data.vehicle_class) {
                batch.update(doc.ref, { vehicle_class: 'Regular' });
                updatedCount++;
            } else {
                skippedCount++;
            }
        });

        if (updatedCount > 0) {
            await batch.commit();
            console.log(`✅ Migration complete! Updated ${updatedCount} drivers to "Regular".`);
        } else {
            console.log('ℹ️ All drivers already have a vehicle_class assigned.');
        }

        console.log(`📊 Summary: Total: ${snapshot.size}, Updated: ${updatedCount}, Skipped: ${skippedCount}`);

    } catch (error) {
        console.error('💥 Error during migration:', error);
    }
}

migrateDrivers().then(() => process.exit(0));
