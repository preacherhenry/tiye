import pool from './src/config/db';
import fs from 'fs';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const TABLES_TO_CLEAN = [
    'audit_logs',
    'document_audit_logs',
    'login_history',
    'payments',
    'ride_requests',
    'driver_documents',
    'driver_applications',
    'driver_subscriptions',
    'promotion_usage'
];

async function cleanup() {
    console.log('🚀 Starting Controlled Database Cleanup...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `cleanup_backup_${timestamp}.json`;
    const backupData: any = {};

    try {
        // 1. Backup Phase
        console.log('📦 Backing up data to', backupFile);
        for (const table of [...TABLES_TO_CLEAN, 'drivers', 'users']) {
            const [rows] = await pool.execute(`SELECT * FROM ${table}`);
            backupData[table] = rows;
        }
        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        console.log('✅ Backup completed.');

        // 2. Pre-cleanup Counts
        console.log('\n📊 Current Record Counts:');
        for (const table of [...TABLES_TO_CLEAN, 'drivers', 'users']) {
            const [rows] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(` - ${table}: ${rows[0].count}`);
        }

        // 3. Cleanup Phase
        console.log('\n🗑️ Executing Cleanup...');
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

            // Clean secondary tables first
            for (const table of TABLES_TO_CLEAN) {
                const [result] = await connection.execute<ResultSetHeader>(`DELETE FROM ${table}`);
                console.log(` - Deleted ${result.affectedRows} from ${table}`);
            }

            // Clean drivers (preserve admins/ID 37)
            const [driverResult] = await connection.execute<ResultSetHeader>(`
                DELETE FROM drivers 
                WHERE user_id NOT IN (
                    SELECT id FROM users 
                    WHERE role IN ('super_admin', 'admin') 
                    OR id = 37
                )
            `);
            console.log(` - Deleted ${driverResult.affectedRows} from drivers (preserved admins)`);

            // Clean users (preserve admins/ID 37)
            const [userResult] = await connection.execute<ResultSetHeader>(`
                DELETE FROM users 
                WHERE role NOT IN ('super_admin', 'admin') 
                AND id != 37
            `);
            console.log(` - Deleted ${userResult.affectedRows} from users (preserved admins)`);

            await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
            await connection.commit();
            console.log('\n✨ Cleanup transaction committed successfully.');
        } catch (error) {
            await connection.rollback();
            console.error('❌ Cleanup failed, rolled back:', error);
            throw error;
        } finally {
            connection.release();
        }

        // 4. Post-cleanup Counts
        console.log('\n📊 Post-Cleanup Record Counts:');
        for (const table of [...TABLES_TO_CLEAN, 'drivers', 'users']) {
            const [rows] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(` - ${table}: ${rows[0].count}`);
        }

        console.log('\n✅ Database reset to clean testing state.');
        console.log('⚠️ IMPORTANT: If you need to rollback, use the backup file:', backupFile);

    } catch (error) {
        console.error('💥 Fatal error during cleanup:', error);
    } finally {
        process.exit();
    }
}

cleanup();
