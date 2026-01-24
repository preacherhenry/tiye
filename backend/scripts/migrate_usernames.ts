import { db } from '../src/config/firebase';

async function migrateUsernames() {
    console.log('🚀 Starting username migration...');

    try {
        const usersSnapshot = await db.collection('users').get();
        const batch = db.batch();
        let count = 0;

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();

            // Skip users that already have a username
            if (userData.username && userData.username_lower) {
                continue;
            }

            // Generate a username
            let baseUsername = '';
            if (userData.name) {
                baseUsername = userData.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            } else if (userData.email) {
                baseUsername = userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            } else {
                baseUsername = 'user' + doc.id.slice(0, 4);
            }

            // Ensure uniqueness within the batch/DB is tricky without more queries, 
            // but for a one-time migration of typical data it's usually fine to append a slice of ID
            const uniqueUsername = baseUsername + doc.id.slice(0, 3);
            const usernameLower = uniqueUsername.toLowerCase();

            console.log(`Setting username for ${userData.email || userData.name || doc.id}: ${uniqueUsername}`);

            batch.update(doc.ref, {
                username: uniqueUsername,
                username_lower: usernameLower
            });

            count++;

            // Commit every 500 docs
            if (count % 500 === 0) {
                await batch.commit();
                console.log(`✅ Committed 500 updates...`);
            }
        }

        if (count % 500 !== 0) {
            await batch.commit();
        }

        console.log(`🏁 Migration complete. Updated ${count} users.`);
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrateUsernames();
