import pool from '../src/config/db';
import { db } from '../src/config/firebase';
import { RowDataPacket } from 'mysql2';

async function migrateData() {
    console.log('🚀 Starting migration from MySQL to Firestore...');

    const tables = [
        { name: 'users', collection: 'users' },
        { name: 'drivers', collection: 'drivers' },
        { name: 'ride_requests', collection: 'rides' },
        { name: 'subscriptions', collection: 'subscriptions' },
        { name: 'fares', collection: 'fares' },
        { name: 'zones', collection: 'zones' },
        { name: 'promotions', collection: 'promotions' }
    ];

    for (const table of tables) {
        console.log(`📦 Migrating table: ${table.name} -> collection: ${table.collection}`);
        try {
            const [rows] = await pool.execute<RowDataPacket[]>(`SELECT * FROM ${table.name}`);

            const batch = db.batch();
            let count = 0;

            for (const row of rows) {
                // Determine document ID (use 'id' if exists, otherwise let Firestore generate)
                const docId = row.id ? String(row.id) : (row.user_id ? String(row.user_id) : undefined);
                const docRef = docId ? db.collection(table.collection).doc(docId) : db.collection(table.collection).doc();

                // Convert MySQL dates/nulls to Firestore-friendly formats if needed
                const cleanRow = { ...row };

                // Remove numeric IDs we're using as Doc IDs to keep it clean, 
                // but keep them if they are foreign keys

                batch.set(docRef, cleanRow);
                count++;

                // Firestore batch limit is 500
                if (count % 500 === 0) {
                    await batch.commit();
                    console.log(`   ✅ Committed batch of 500 for ${table.name}`);
                }
            }

            if (count % 500 !== 0) {
                await batch.commit();
            }
            console.log(`   ✅ Finished ${table.name}: ${count} documents migrated.`);

        } catch (error) {
            console.error(`❌ Error migrating ${table.name}:`, error);
        }
    }

    console.log('🏁 Migration complete!');
    process.exit(0);
}

migrateData();
