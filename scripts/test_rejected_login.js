const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkLogin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const email = 'Leo@gmail.com';
    const password = 'password123'; // The password user probably chose

    try {
        const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('👤 User found:', { id: user.id, email: user.email, role: user.role, status: user.status });

        const match = await bcrypt.compare(password, user.password);
        console.log('🔑 Password match:', match);

        if (match) {
            if (user.role === 'driver') {
                if (user.status === 'rejected') {
                    console.log('✅ Correct Rejection logic would be triggered');
                } else {
                    console.log('ℹ️ Status is:', user.status);
                }
            } else {
                console.log('ℹ️ Role is:', user.role);
            }
        } else {
            console.log('❌ Password mismatch. Hash in DB:', user.password);
        }

    } catch (e) {
        console.error('❌ Diagnostic failed:', e.message);
    } finally {
        await connection.end();
    }
}

checkLogin();
