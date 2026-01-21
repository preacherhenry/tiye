const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'taxi_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function migrate() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to database.');

        // Add vehicle columns to users table
        try {
            await connection.query("ALTER TABLE users ADD COLUMN car_model VARCHAR(255) NULL");
            console.log('Added car_model to users');
        } catch (e) { console.log('car_model might already exist'); }

        try {
            await connection.query("ALTER TABLE users ADD COLUMN car_color VARCHAR(255) NULL");
            console.log('Added car_color to users');
        } catch (e) { console.log('car_color might already exist'); }

        try {
            await connection.query("ALTER TABLE users ADD COLUMN plate_number VARCHAR(255) NULL");
            console.log('Added plate_number to users');
        } catch (e) { console.log('plate_number might already exist'); }

        // Add ride details to ride_requests table
        try {
            await connection.query("ALTER TABLE ride_requests ADD COLUMN fare DECIMAL(10,2) NULL");
            console.log('Added fare to ride_requests');
        } catch (e) { console.log('fare might already exist'); }

        try {
            await connection.query("ALTER TABLE ride_requests ADD COLUMN distance DECIMAL(10,2) NULL");
            console.log('Added distance to ride_requests');
        } catch (e) { console.log('distance might already exist'); }

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
