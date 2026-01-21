require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTestAccounts() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app'
    });

    console.log('\n=== TEST ACCOUNTS STATUS ===\n');

    // Check passenger
    const [passengers] = await connection.execute(
        'SELECT id, name, email, role, status FROM users WHERE email = ?',
        ['passenger@test.com']
    );

    if (passengers.length > 0) {
        const p = passengers[0];
        console.log('✅ PASSENGER ACCOUNT EXISTS');
        console.log(`   Name: ${p.name}`);
        console.log(`   Email: ${p.email}`);
        console.log(`   Status: ${p.status}`);
        console.log(`   Password: test123`);
    } else {
        console.log('❌ Passenger account not found');
    }

    console.log('');

    // Check driver
    const [drivers] = await connection.execute(
        `SELECT u.id, u.name, u.email, u.role, u.status, d.car_model, d.car_color, d.plate_number
         FROM users u
         LEFT JOIN drivers d ON u.id = d.user_id
         WHERE u.email = ?`,
        ['driver@test.com']
    );

    if (drivers.length > 0) {
        const d = drivers[0];
        console.log('✅ DRIVER ACCOUNT EXISTS');
        console.log(`   Name: ${d.name}`);
        console.log(`   Email: ${d.email}`);
        console.log(`   Status: ${d.status}`);
        console.log(`   Vehicle: ${d.car_color} ${d.car_model} (${d.plate_number})`);
        console.log(`   Password: test123`);
    } else {
        console.log('❌ Driver account not found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📱 LOGIN CREDENTIALS:\n');
    console.log('PASSENGER:');
    console.log('  Email: passenger@test.com');
    console.log('  Password: test123\n');
    console.log('DRIVER:');
    console.log('  Email: driver@test.com');
    console.log('  Password: test123\n');
    console.log('='.repeat(60));

    await connection.end();
}

checkTestAccounts().catch(console.error);
