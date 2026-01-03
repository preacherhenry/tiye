const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const passengers = [
    { name: 'Alice Walker', email: 'alice@test.com', phone: '+12345678901' },
    { name: 'Bob Smith', email: 'bob@test.com', phone: '+12345678902' },
    { name: 'Charlie Brown', email: 'charlie@test.com', phone: '+12345678903' },
    { name: 'Diana Prince', email: 'diana@test.com', phone: '+12345678904' },
    { name: 'Evan Wright', email: 'evan@test.com', phone: '+12345678905' }
];

async function seedPassengers() {
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
        console.log('--- Seeding Passengers ---');
        const hashedPassword = await bcrypt.hash('password123', 10);

        for (const p of passengers) {
            // Check if exists
            const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [p.email]);
            if (rows.length > 0) {
                console.log(`Passenger ${p.email} already exists.`);
                continue;
            }

            await pool.execute(`
                INSERT INTO users (name, email, phone, password, role, status, created_at, last_login_at)
                VALUES (?, ?, ?, ?, 'passenger', 'active', NOW(), NOW())
            `, [p.name, p.email, p.phone, hashedPassword]);

            console.log(`Added passenger: ${p.name}`);
        }

        console.log('--- Seeding Complete ---');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

seedPassengers();
