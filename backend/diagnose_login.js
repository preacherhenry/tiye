require('dotenv').config();
const mysql = require('mysql2/promise');

async function diagnoseLogin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app'
    });

    console.log('\n=== LOGIN DIAGNOSTIC TOOL ===\n');

    // List all users
    const [users] = await connection.execute(
        'SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC'
    );

    console.log('📋 All Users in Database:');
    console.log('─'.repeat(80));
    users.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Status: ${user.status || 'active'}`);
        console.log(`Created: ${user.created_at}`);
        console.log('─'.repeat(80));
    });

    console.log(`\n✅ Total Users: ${users.length}\n`);

    // Check for drivers with pending status
    const [pendingDrivers] = await connection.execute(
        "SELECT u.id, u.name, u.email, u.status FROM users u WHERE u.role = 'driver' AND u.status = 'pending'"
    );

    if (pendingDrivers.length > 0) {
        console.log('⚠️  Pending Driver Accounts (Cannot Login):');
        pendingDrivers.forEach(d => {
            console.log(`   - ${d.name} (${d.email})`);
        });
        console.log('');
    }

    // Check for rejected/suspended drivers
    const [blockedDrivers] = await connection.execute(
        "SELECT u.id, u.name, u.email, u.status FROM users u WHERE u.role = 'driver' AND u.status IN ('rejected', 'suspended')"
    );

    if (blockedDrivers.length > 0) {
        console.log('🚫 Blocked Driver Accounts (Cannot Login):');
        blockedDrivers.forEach(d => {
            console.log(`   - ${d.name} (${d.email}) - Status: ${d.status}`);
        });
        console.log('');
    }

    // Check for approved drivers
    const [approvedDrivers] = await connection.execute(
        "SELECT u.id, u.name, u.email, u.status FROM users u WHERE u.role = 'driver' AND u.status = 'approved'"
    );

    if (approvedDrivers.length > 0) {
        console.log('✅ Approved Drivers (Can Login):');
        approvedDrivers.forEach(d => {
            console.log(`   - ${d.name} (${d.email})`);
        });
        console.log('');
    }

    // Check for passengers
    const [passengers] = await connection.execute(
        "SELECT u.id, u.name, u.email FROM users u WHERE u.role = 'passenger'"
    );

    if (passengers.length > 0) {
        console.log('🚶 Passengers (Can Login):');
        passengers.forEach(p => {
            console.log(`   - ${p.name} (${p.email})`);
        });
        console.log('');
    }

    // Check for admins
    const [admins] = await connection.execute(
        "SELECT u.id, u.name, u.email, u.role FROM users u WHERE u.role IN ('admin', 'super_admin')"
    );

    if (admins.length > 0) {
        console.log('👑 Admins (Can Login):');
        admins.forEach(a => {
            console.log(`   - ${a.name} (${a.email}) - ${a.role}`);
        });
        console.log('');
    }

    console.log('\n💡 TIPS:');
    console.log('   1. Make sure you\'re using the correct email and password');
    console.log('   2. Driver accounts must be "approved" to login');
    console.log('   3. Check that the backend server is running on port 5000');
    console.log('   4. Verify the mobile app can reach: http://10.133.206.9:5000');
    console.log('   5. Try pinging 10.133.206.9 from your mobile device\n');

    await connection.end();
}

diagnoseLogin().catch(console.error);
