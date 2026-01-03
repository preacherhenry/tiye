const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('🚀 Seeding Super Admin...');

    const email = 'superadmin@tiye.com';
    const password = 'adminpassword123'; // User should change this
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);

        if (existing.length > 0) {
            console.log('User already exists. Updating to Super Admin...');
            await connection.execute(
                'UPDATE users SET role = "super_admin", status = "approved", password = ? WHERE email = ?',
                [hashedPassword, email]
            );
        } else {
            console.log('Creating new Super Admin...');
            await connection.execute(
                'INSERT INTO users (name, phone, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                ['Master Admin', '0000000000', email, hashedPassword, 'super_admin', 'approved']
            );
        }
        console.log('✅ Super Admin seeded successfully!');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Initial Password: ${password}`);
        console.log('⚠️ Please change your password after logging in.');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await connection.end();
    }
}

seed();
