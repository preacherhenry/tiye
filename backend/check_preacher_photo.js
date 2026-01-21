const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPreacherAccount() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app'
    });

    console.log('\n=== Checking Preacher Account ===\n');

    // Check by email
    const [users] = await connection.execute(
        'SELECT id, name, email, phone, profile_photo FROM users WHERE email = ? OR phone = ?',
        ['preacher.192@yahoo.com', '0978128041']
    );

    if (users.length > 0) {
        const user = users[0];
        console.log('Found user:');
        console.log('  ID:', user.id);
        console.log('  Name:', user.name);
        console.log('  Email:', user.email);
        console.log('  Phone:', user.phone);
        console.log('  Profile Photo:', user.profile_photo || 'NULL ❌');

        if (!user.profile_photo) {
            console.log('\n⚠️  This account does NOT have a profile photo in the database!');
            console.log('Solution: Upload a photo from Settings → Choose Photo → Upload');
        }
    } else {
        console.log('No user found with that email/phone');
    }

    // Also check user ID 32 (the one that just uploaded)
    console.log('\n=== Checking User ID 32 (Just Created) ===\n');
    const [newUsers] = await connection.execute(
        'SELECT id, name, email, profile_photo FROM users WHERE id = 32'
    );

    if (newUsers.length > 0) {
        console.log('User 32:', newUsers[0]);
    }

    await connection.end();
}

checkPreacherAccount();
