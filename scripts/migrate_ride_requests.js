const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('🚀 Updating ride_requests schema...');

    try {
        // 1. Update status enum to include all possible statuses
        console.log('--- Updating status enum ---');
        await connection.execute(`
            ALTER TABLE ride_requests 
            MODIFY COLUMN status ENUM('pending', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled') 
            DEFAULT 'pending'
        `);

        // 2. Add coordinate columns
        console.log('--- Adding coordinate columns ---');
        const columnsToAdd = [
            { name: 'pickup_lat', type: 'DECIMAL(10, 8)' },
            { name: 'pickup_lng', type: 'DECIMAL(11, 8)' },
            { name: 'dropoff_lat', type: 'DECIMAL(10, 8)' },
            { name: 'dropoff_lng', type: 'DECIMAL(11, 8)' }
        ];

        for (const col of columnsToAdd) {
            try {
                await connection.execute(`ALTER TABLE ride_requests ADD COLUMN ${col.name} ${col.type}`);
                console.log(`✅ Added ${col.name}`);
            } catch (e) {
                console.log(`⚠️  Column ${col.name} might already exist: ${e.message}`);
            }
        }

        console.log('✅ ride_requests schema updated successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
