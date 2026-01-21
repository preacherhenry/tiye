require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createTestAccounts() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app'
    });

    console.log('\n=== CREATING TEST ACCOUNTS ===\n');

    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Test Passenger
    try {
        const [passengerResult] = await connection.execute(
            'INSERT INTO users (name, phone, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            ['Test Passenger', '+260971234567', 'passenger@test.com', hashedPassword, 'passenger', 'active']
        );
        console.log('✅ PASSENGER CREATED');
        console.log('   Email: passenger@test.com');
        console.log('   Password: test123');
        console.log('   Role: passenger\n');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('⚠️  Passenger account already exists');
            console.log('   Email: passenger@test.com');
            console.log('   Password: test123 (if not changed)\n');
        } else {
            console.log('❌ Error creating passenger:', error.message, '\n');
        }
    }

    // Test Driver
    try {
        const [driverResult] = await connection.execute(
            'INSERT INTO users (name, phone, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            ['Test Driver', '+260977654321', 'driver@test.com', hashedPassword, 'driver', 'approved']
        );

        const driverId = driverResult.insertId;

        await connection.execute(
            'INSERT INTO drivers (user_id, car_model, car_color, plate_number, is_online, online_status) VALUES (?, ?, ?, ?, FALSE, "offline")',
            [driverId, 'Toyota Corolla', 'White', 'ABC-1234']
        );

        console.log('✅ DRIVER CREATED');
        console.log('   Email: driver@test.com');
        console.log('   Password: test123');
        console.log('   Role: driver (APPROVED)');
        console.log('   Vehicle: White Toyota Corolla (ABC-1234)\n');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('⚠️  Driver account already exists');
            console.log('   Email: driver@test.com');
            console.log('   Password: test123 (if not changed)\n');
        } else {
            console.log('❌ Error creating driver:', error.message, '\n');
        }
    }

    console.log('='.repeat(50));
    console.log('\n📱 YOU CAN NOW LOGIN WITH:\n');
    console.log('PASSENGER:');
    console.log('  Email: passenger@test.com');
    console.log('  Password: test123\n');
    console.log('DRIVER:');
    console.log('  Email: driver@test.com');
    console.log('  Password: test123\n');
    console.log('='.repeat(50));
    console.log('\n💡 Make sure your mobile app is using IP: 10.68.186.9');
    console.log('   Restart the Expo app if you just updated the IP\n');

    await connection.end();
}

createTestAccounts().catch(console.error);
