const mysql = require('mysql2/promise');
require('dotenv').config();

async function addColumn() {
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
        console.log('--- Adding last_login_at to users ---');

        // Check if exists first (though we know it doesn't)
        const [columns] = await pool.execute("SHOW COLUMNS FROM users LIKE 'last_login_at'");
        if (columns.length === 0) {
            await pool.execute('ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL');
            console.log('Column added successfully.');
        } else {
            console.log('Column already exists.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

addColumn();
