const mysql = require('mysql2/promise');
require('dotenv').config();

const migrate = async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('🔄 Starting migration for driver presence system...');

        // Check if columns exist to prevent errors
        const [columns] = await pool.execute('SHOW COLUMNS FROM drivers');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('online_status')) {
            console.log('➕ Adding online_status column...');
            await pool.execute("ALTER TABLE drivers ADD COLUMN online_status ENUM('online', 'offline', 'on_trip') NOT NULL DEFAULT 'offline'");
        } else {
            console.log('ℹ️  online_status column already exists.');
        }

        if (!columnNames.includes('last_seen_at')) {
            console.log('➕ Adding last_seen_at column...');
            await pool.execute("ALTER TABLE drivers ADD COLUMN last_seen_at DATETIME NULL");
        } else {
            console.log('ℹ️  last_seen_at column already exists.');
        }

        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
};

migrate();
