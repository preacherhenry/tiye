require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app'
    });

    console.log('\n=== PASSWORD RESET / USER CREATION TOOL ===\n');

    const choice = await question('Choose an option:\n1. Reset password for existing user\n2. Create new test passenger\n3. Create new test driver (auto-approved)\n4. List all users\n\nEnter choice (1-4): ');

    if (choice === '1') {
        // Reset password
        const email = await question('\nEnter email address: ');
        const [users] = await connection.execute('SELECT id, name, role FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            console.log('❌ User not found!');
        } else {
            const user = users[0];
            console.log(`\n✓ Found: ${user.name} (${user.role})`);
            const newPassword = await question('Enter new password: ');
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
            console.log(`\n✅ Password updated successfully!`);
            console.log(`\nLogin credentials:`);
            console.log(`Email: ${email}`);
            console.log(`Password: ${newPassword}`);
        }
    } else if (choice === '2') {
        // Create passenger
        const name = await question('\nEnter name: ');
        const email = await question('Enter email: ');
        const phone = await question('Enter phone: ');
        const password = await question('Enter password: ');

        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const [result] = await connection.execute(
                'INSERT INTO users (name, phone, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                [name, phone, email, hashedPassword, 'passenger', 'active']
            );

            console.log(`\n✅ Passenger created successfully!`);
            console.log(`\nLogin credentials:`);
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
            console.log(`Role: passenger`);
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            if (error.code === 'ER_DUP_ENTRY') {
                console.log('This email already exists!');
            }
        }
    } else if (choice === '3') {
        // Create driver
        const name = await question('\nEnter name: ');
        const email = await question('Enter email: ');
        const phone = await question('Enter phone: ');
        const password = await question('Enter password: ');
        const carModel = await question('Enter car model (e.g., Toyota Corolla): ');
        const carColor = await question('Enter car color: ');
        const plateNumber = await question('Enter plate number: ');

        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            // Create user
            const [userResult] = await connection.execute(
                'INSERT INTO users (name, phone, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                [name, phone, email, hashedPassword, 'driver', 'approved']
            );

            const userId = userResult.insertId;

            // Create driver record
            await connection.execute(
                'INSERT INTO drivers (user_id, car_model, car_color, plate_number, is_online, online_status) VALUES (?, ?, ?, ?, FALSE, "offline")',
                [userId, carModel, carColor, plateNumber]
            );

            console.log(`\n✅ Driver created successfully!`);
            console.log(`\nLogin credentials:`);
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
            console.log(`Role: driver (APPROVED)`);
            console.log(`Vehicle: ${carColor} ${carModel} (${plateNumber})`);
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            if (error.code === 'ER_DUP_ENTRY') {
                console.log('This email already exists!');
            }
        }
    } else if (choice === '4') {
        // List users
        const [users] = await connection.execute(
            'SELECT id, name, email, role, status FROM users ORDER BY created_at DESC'
        );

        console.log('\n📋 All Users:\n');
        users.forEach(user => {
            const statusEmoji = user.status === 'approved' || user.status === 'active' ? '✅' :
                user.status === 'pending' ? '⏳' :
                    user.status === 'rejected' ? '❌' : '⚠️';
            console.log(`${statusEmoji} ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Status: ${user.status || 'active'}`);
            console.log('');
        });
    }

    await connection.end();
    rl.close();
}

main().catch(error => {
    console.error('Error:', error);
    rl.close();
});
