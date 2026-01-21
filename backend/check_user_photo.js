const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLoginResponse() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app'
    });

    console.log('\n=== Checking User with ID 28 (Preacher) ===\n');

    const [users] = await connection.execute(
        'SELECT id, name, email, phone, role, profile_photo FROM users WHERE id = 28'
    );

    if (users.length > 0) {
        const user = users[0];
        console.log('User in database:');
        console.log('  Name:', user.name);
        console.log('  Email:', user.email);
        console.log('  Role:', user.role);
        console.log('  Profile Photo:', user.profile_photo || 'NULL');

        if (!user.profile_photo) {
            console.log('\n⚠️  Profile photo is NULL in database!');
            console.log('This user needs to upload a profile photo.');
        } else {
            console.log('\n✅ Profile photo URL exists in database');
            console.log('   The login endpoint should be returning this.');
        }
    } else {
        console.log('User ID 28 not found');
    }

    await connection.end();
}

checkLoginResponse();
