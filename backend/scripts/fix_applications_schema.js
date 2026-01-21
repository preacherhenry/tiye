const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('🚀 Fixing driver_applications schema...');

    try {
        // 1. Add user_id column if it doesn't exist
        console.log('--- Adding user_id column ---');
        const [columns] = await connection.execute('DESCRIBE driver_applications');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('user_id')) {
            await connection.execute('ALTER TABLE driver_applications ADD COLUMN user_id INT AFTER id');
            console.log('✅ Added user_id column.');
        } else {
            console.log('ℹ️ user_id column already exists.');
        }

        // 2. Link applications to users via email
        console.log('--- Linking applications to users ---');
        const [apps] = await connection.execute('SELECT id, email FROM driver_applications WHERE user_id IS NULL');

        for (const app of apps) {
            const [users] = await connection.execute('SELECT id FROM users WHERE email = ?', [app.email]);
            if (users.length > 0) {
                await connection.execute('UPDATE driver_applications SET user_id = ? WHERE id = ?', [users[0].id, app.id]);
                console.log(`✅ Linked application ${app.id} to user ${users[0].id} (${app.email})`);
            } else {
                console.log(`⚠️ No user found for ${app.email} (application ${app.id})`);
            }
        }

        console.log('✅ Schema fix completed!');
    } catch (error) {
        console.error('❌ Fix failed:', error);
    } finally {
        await connection.end();
    }
}

fix();
