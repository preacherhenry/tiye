import cron from 'node-cron';
import { db } from '../config/firebase';

export const startCleanupJob = () => {
    // Run every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('🧹 Running automatic 7-day trip data retention cleanup...');
        
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const cutoffDate = sevenDaysAgo.toISOString();

            // Query trips that are completed, cancelled, or rejected and older than 7 days
            const snapshot = await db.collection('rides')
                .where('status', 'in', ['completed', 'cancelled', 'rejected'])
                .where('created_at', '<', cutoffDate)
                .get();

            if (snapshot.empty) {
                console.log('✅ No old trips to clean up.');
                return;
            }

            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`✅ Successfully deleted ${snapshot.size} old trip records.`);
        } catch (error) {
            console.error('❌ Error during trip cleanup job:', error);
        }
    });

    console.log('⏰ Trip Data Retention Job scheduled (2:00 AM daily).');
};
