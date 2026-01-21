require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAdminAccount() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app'
    });

    console.log('\n=== CREATING ADMIN ACCOUNT ===\n');

    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [result] = await connection.execute(
            'INSERT INTO users (name, phone, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            ['Test Admin', '+260971111111', 'admin@test.com', hashedPassword, 'super_admin', 'active']
        );
        console.log('✅ ADMIN CREATED');
        console.log('   Email: admin@test.com');
        console.log('   Password: admin123');
        console.log('   Role: super_admin\n');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('⚠️  Admin account already exists');
            console.log('   Email: admin@test.com');
            console.log('   Password: admin123 (if not changed)\n');
        } else {
            console.log('❌ Error creating admin:', error.message, '\n');
        }
    }

    await connection.end();
}

createAdminAccount().catch(console.error);
