const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
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
        console.log('--- Database User Audit ---');

        // Check Role Distribution
        const [roles] = await pool.execute('SELECT role, COUNT(*) as count FROM users GROUP BY role');
        console.table(roles);

        // List all users
        const [users] = await pool.execute('SELECT id, name, email, role, status FROM users LIMIT 10');
        console.log('\n--- First 10 Users ---');
        console.table(users);

        // Check columns to be sure
        const [columns] = await pool.execute('SHOW COLUMNS FROM users');
        const roleCol = columns.find(c => c.Field === 'role');
        console.log('\n--- Role Column Definition ---');
        console.log(roleCol ? roleCol.Type : 'Role column not found!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkUsers();
