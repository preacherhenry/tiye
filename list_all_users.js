const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAllUsers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app'
    });

    console.log('\n=== All Users in Database ===\n');

    const [users] = await connection.execute(
        'SELECT id, name, email, role, profile_photo FROM users ORDER BY id DESC LIMIT 10'
    );

    users.forEach(user => {
        console.log(`ID: ${user.id} | Name: ${user.name} | Role: ${user.role}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Photo: ${user.profile_photo || 'NULL'}`);
        console.log('---');
    });

    await connection.end();
}

checkAllUsers();
