import { db } from './src/config/firebase';

async function cleanupBrokenPhotos() {
    console.log('🚀 Starting cleanup of broken photo URLs...');
    
    const usersSnapshot = await db.collection('users').get();
    let count = 0;

    for (const doc of usersSnapshot.docs) {
        const data = doc.data();
        const photo = data.profile_photo;

        // Check if photo URL points to local uploads on Render or localhost
        if (photo && (photo.includes('/uploads/') || photo.includes('localhost:5000'))) {
            console.log(`❌ Found broken photo for user: ${data.name || data.email} (${doc.id})`);
            console.log(`   URL: ${photo}`);
            
            await doc.ref.update({ profile_photo: null });
            count++;
        }
    }

    console.log(`\n✅ Cleanup complete. Fixed ${count} broken URLs.`);
    process.exit();
}

cleanupBrokenPhotos();
