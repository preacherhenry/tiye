const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPhotoURL() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app'
    });

    console.log('\n=== Checking User 32 Photo URL ===\n');

    const [users] = await connection.execute(
        'SELECT id, name, email, profile_photo FROM users WHERE id = 32'
    );

    if (users.length > 0) {
        const user = users[0];
        console.log('Database Record:');
        console.log('  ID:', user.id);
        console.log('  Name:', user.name);
        console.log('  Email:', user.email);
        console.log('  Profile Photo:', user.profile_photo);

        if (user.profile_photo) {
            console.log('\n✅ Photo URL exists in database');
            console.log('URL:', user.profile_photo);

            // Check if it's accessible
            const fs = require('fs');
            const path = require('path');

            // Extract filename from URL
            const filename = user.profile_photo.split('/').pop();
            const filePath = path.join(__dirname, 'uploads', filename);

            if (fs.existsSync(filePath)) {
                console.log('✅ Photo file exists on disk:', filePath);
            } else {
                console.log('❌ Photo file NOT found on disk:', filePath);
            }
        } else {
            console.log('\n❌ No photo URL in database!');
        }
    }

    await connection.end();
}

checkPhotoURL();
