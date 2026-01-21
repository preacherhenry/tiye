import pool from './src/config/db';

async function setup() {
    try {
        console.log('🚀 Starting subscription database setup...');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                duration_days INT NOT NULL,
                description TEXT,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ subscription_plans table checked/created');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS driver_subscriptions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                driver_id INT NOT NULL,
                plan_id INT NOT NULL,
                screenshot_url VARCHAR(255),
                status ENUM('pending', 'active', 'expired', 'rejected') DEFAULT 'pending',
                start_date DATETIME,
                expiry_date DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ driver_subscriptions table checked/created');

        const [cols]: any = await pool.execute('SHOW COLUMNS FROM drivers LIKE "subscription_status"');
        if (cols.length === 0) {
            await pool.execute('ALTER TABLE drivers ADD COLUMN subscription_status ENUM("none", "pending", "active", "expired") DEFAULT "none"');
            await pool.execute('ALTER TABLE drivers ADD COLUMN subscription_expiry DATETIME');
            console.log('✅ drivers table updated with subscription fields');
        } else {
            console.log('ℹ️ drivers table already has subscription fields');
        }

        console.log('✨ Subscription database setup complete!');
    } catch (e: any) {
        console.error('❌ Error during setup:', e.message);
    } finally {
        process.exit();
    }
}

setup();
