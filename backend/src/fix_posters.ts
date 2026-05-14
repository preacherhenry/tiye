import { db } from './config/firebase';

async function fixPosters() {
    console.log('🔧 Fixing Poster A1...');
    
    try {
        // Link A1 to Debonaires (tLZCa7QJSAZHCbz3Qvyl)
        await db.collection('posters').doc('A1').set({
            store_id: 'tLZCa7QJSAZHCbz3Qvyl',
            status: 'active',
            updated_at: new Date().toISOString()
        }, { merge: true });

        console.log('✅ Poster A1 linked to DEBONAIRES.');

    } catch (error) {
        console.error('💥 Error during fix:', error);
    }
}

fixPosters().then(() => process.exit(0));
