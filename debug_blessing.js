require('dotenv').config();
const mysql = require('mysql2/promise');

async function debugBlessing() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app'
    });

    console.log('\n=== SEARCHING FOR "BLESSING" ===\n');

    try {
        // Search in Users table
        const [users] = await connection.execute(
            'SELECT id, name, email, role, status FROM users WHERE name LIKE ? OR email LIKE ?',
            ['%Blessing%', '%blessing%']
        );

        if (users.length === 0) {
            console.log('❌ No user found with name or email containing "Blessing"');
        } else {
            console.log(`✅ Found ${users.length} user(s):`);
            for (const user of users) {
                console.log('------------------------------------------------');
                console.log(`ID: ${user.id}`);
                console.log(`Name: ${user.name}`);
                console.log(`Email: ${user.email}`);
                console.log(`Role: ${user.role}`);
                console.log(`Status: ${user.status}`);

                if (user.role === 'driver') {
                    const [drivers] = await connection.execute('SELECT * FROM drivers WHERE user_id = ?', [user.id]);
                    if (drivers.length > 0) {
                        console.log('Driver Details:', drivers[0]);
                    }
                    const [apps] = await connection.execute('SELECT * FROM driver_applications WHERE user_id = ?', [user.id]);
                    if (apps.length > 0) {
                        console.log('Application Status:', apps[0].status);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
    await connection.end();
}

debugBlessing().catch(console.error);
