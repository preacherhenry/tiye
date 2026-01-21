import pool from './src/config/db';

const TABLES_TO_RESET = [
    'audit_logs',
    'document_audit_logs',
    'login_history',
    'payments',
    'ride_requests',
    'driver_documents',
    'driver_applications',
    'driver_subscriptions',
    'promotion_usage',
    'drivers',
    'users'
];

async function resetAutoIncrement() {
    console.log('🔄 Resetting Auto-Increment Counters...');

    try {
        for (const table of TABLES_TO_RESET) {
            console.log(` - Resetting ${table}...`);
            // Setting to 1 will automatically adjust to MAX(id) + 1 for non-empty tables
            await pool.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        }
        console.log('✅ All counters reset successfully.');
    } catch (error) {
        console.error('❌ Error resetting counters:', error);
    } finally {
        process.exit();
    }
}

resetAutoIncrement();
