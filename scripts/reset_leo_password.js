const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const email = 'Leo@gmail.com';
    const newPassword = 'password123';

    try {
        console.log(`--- Resetting password for ${email} ---`);
        const hashed = await bcrypt.hash(newPassword, 10);
        await connection.execute('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
        console.log('✅ Password successfully reset to:', newPassword);
    } catch (e) {
        console.error('❌ Reset failed:', e.message);
    } finally {
        await connection.end();
    }
}

resetPassword();
