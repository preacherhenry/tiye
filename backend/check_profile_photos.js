const mysql = require('mysql2/promise');

async function checkPhotoUpload() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'taxi_app'
        });

        console.log('\n=== Checking Latest User with Photo ===\n');

        const [users] = await connection.execute(
            'SELECT id, name, email, profile_photo FROM users ORDER BY id DESC LIMIT 5'
        );

        users.forEach(user => {
            console.log(`User ID: ${user.id}`);
            console.log(`Name: ${user.name}`);
            console.log(`Email: ${user.email}`);
            console.log(`Profile Photo: ${user.profile_photo || 'Not set'}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkPhotoUpload();
