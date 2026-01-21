const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('🚀 Starting Geocoding Migration...');

        // Add coordinate columns to ride_requests
        const columnsToAdd = [
            'ADD COLUMN IF NOT EXISTS pickup_lat DECIMAL(10, 8)',
            'ADD COLUMN IF NOT EXISTS pickup_lng DECIMAL(11, 8)',
            'ADD COLUMN IF NOT EXISTS dest_lat DECIMAL(10, 8)',
            'ADD COLUMN IF NOT EXISTS dest_lng DECIMAL(11, 8)'
        ];

        for (const col of columnsToAdd) {
            try {
                await connection.execute(`ALTER TABLE ride_requests ${col}`);
                console.log(`✅ ${col.split(' ')[2]} added (or already exists)`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ Column ${col.split(' ')[2]} already exists.`);
                } else {
                    throw e;
                }
            }
        }

        console.log('✨ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
