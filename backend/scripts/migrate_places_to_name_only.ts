/**
 * Firestore Migration Script: Convert Places to Name-Only Model
 * 
 * This script migrates existing place documents from the old schema:
 *   { name, latitude, longitude, category, area }
 * 
 * To the new schema:
 *   { name, description }
 * 
 * The description is created by consolidating category and area.
 */

import { db } from '../src/config/firebase';

interface OldPlace {
    name: string;
    latitude?: number;
    longitude?: number;
    category?: string;
    area?: string;
    created_at: string;
}

interface NewPlace {
    name: string;
    description: string;
    created_at: string;
}

async function migratePlaces() {
    console.log('🔄 Starting places migration to name-only model...\n');

    try {
        // Fetch all existing places
        const snapshot = await db.collection('places').get();

        if (snapshot.empty) {
            console.log('ℹ️  No places found in database. Migration complete.');
            return;
        }

        console.log(`📊 Found ${snapshot.size} place(s) to migrate\n`);

        let successCount = 0;
        let errorCount = 0;

        // Process each place
        for (const doc of snapshot.docs) {
            const oldData = doc.data() as OldPlace;

            try {
                // Build description from category and area
                const descriptionParts: string[] = [];

                if (oldData.category) {
                    // Capitalize category nicely
                    const capitalizedCategory = oldData.category.charAt(0).toUpperCase() + oldData.category.slice(1);
                    descriptionParts.push(capitalizedCategory);
                }

                if (oldData.area) {
                    descriptionParts.push(oldData.area);
                }

                const description = descriptionParts.join(' • ');

                // Create new data structure
                const newData: NewPlace = {
                    name: oldData.name,
                    description: description || '',
                    created_at: oldData.created_at
                };

                // Update Firestore document
                await db.collection('places').doc(doc.id).set(newData);

                console.log(`✅ Migrated: "${oldData.name}"`);
                if (description) {
                    console.log(`   Description: ${description}`);
                }
                if (oldData.latitude && oldData.longitude) {
                    console.log(`   Removed coords: (${oldData.latitude}, ${oldData.longitude})`);
                }
                console.log('');

                successCount++;
            } catch (error) {
                console.error(`❌ Failed to migrate "${oldData.name}":`, error);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`✨ Migration Complete!`);
        console.log(`   Success: ${successCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migratePlaces()
    .then(() => {
        console.log('\n✅ All done! Exiting...');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration error:', error);
        process.exit(1);
    });
