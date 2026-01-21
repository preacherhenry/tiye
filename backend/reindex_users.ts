import pool from './src/config/db';
import { RowDataPacket } from 'mysql2';

async function reindexUsers() {
    console.log('🔄 Re-indexing users to start from ID 1...');

    try {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

            // 1. Get current users sorted by ID
            const [users] = await connection.execute<RowDataPacket[]>('SELECT id FROM users ORDER BY id ASC');
            console.log(` - Found ${users.length} users to re-index.`);

            // 2. Update each user to a new temporary ID first to avoid collisions, then to final ID
            // Or since we only have 3, we can just map them directly
            let newId = 1;
            for (const user of users) {
                console.log(`   - Moving ID ${user.id} -> ${newId}`);
                await connection.execute('UPDATE users SET id = ? WHERE id = ?', [newId, user.id]);
                newId++;
            }

            // 3. Reset auto-increment
            await connection.execute(`ALTER TABLE users AUTO_INCREMENT = ${newId}`);
            console.log(` - Auto-increment set to ${newId}`);

            await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
            await connection.commit();
            console.log('✅ Users re-indexed successfully.');
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('❌ Error re-indexing users:', error);
    } finally {
        process.exit();
    }
}

reindexUsers();
