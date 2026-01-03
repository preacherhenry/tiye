const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDrivers() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('--- Driver Status Audit ---');

        // Check Users Status for Role Driver
        const [userStats] = await pool.execute("SELECT status, COUNT(*) as count FROM users WHERE role = 'driver' GROUP BY status");
        console.log('\n--- Users Table (Role=Driver) ---');
        console.table(userStats);

        // Check Driver Applications Status
        const [appStats] = await pool.execute("SELECT status, COUNT(*) as count FROM driver_applications GROUP BY status");
        console.log('\n--- Driver Applications Table ---');
        console.table(appStats);

        // Check Drivers Table (Actual profile entries)
        const [driverStats] = await pool.execute("SELECT COUNT(*) as count FROM drivers");
        console.log('\n--- Drivers Table (Profiles) ---');
        console.log(`Total Drivers in 'drivers' table: ${driverStats[0].count}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkDrivers();
