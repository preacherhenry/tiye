const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDrivers() {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'taxi_app'
        });

        const [users] = await conn.execute('SELECT id, name, role FROM users WHERE role = "driver"');
        console.log('DRIVERS IN USERS TABLE:', users.length);
        console.log('DRIVERS LIST:', JSON.stringify(users, null, 2));

        const [drivers] = await conn.execute('SELECT * FROM drivers');
        console.log('RECORDS IN DRIVERS TABLE:', drivers.length);

        await conn.end();
    } catch (e) {
        console.error('DIAGNOSTIC ERROR:', e);
    }
}

checkDrivers();
