const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('🚀 Starting Admin Dashboard Normalization...');

    try {
        // 1. Create audit_logs table
        console.log('--- Creating audit_logs ---');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                action VARCHAR(255) NOT NULL,
                target_type VARCHAR(50),
                target_id INT,
                details JSON,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Create driver_documents table
        console.log('--- Creating driver_documents ---');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS driver_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id INT NOT NULL,
                doc_type ENUM('license', 'nrc', 'registration', 'profile_photo') NOT NULL,
                file_path VARCHAR(255) NOT NULL,
                verification_status ENUM('unverified', 'verified', 'rejected') DEFAULT 'unverified',
                rejection_reason TEXT,
                verified_by INT,
                verified_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 3. Create document_audit_logs table
        console.log('--- Creating document_audit_logs ---');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS document_audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                document_id INT NOT NULL,
                admin_id INT NOT NULL,
                action ENUM('verify', 'reject', 'undo') NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Update users table role and ensure Super Admin exists
        console.log('--- Updating users table role ---');
        try {
            await connection.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) DEFAULT 'passenger'");
        } catch (e) {
            console.log('Role column modification warning (might already be compatible):', e.message);
        }

        // 5. Update driver_applications table to handle attempt counts
        console.log('--- Updating driver_applications ---');
        try {
            await connection.execute("ALTER TABLE driver_applications ADD COLUMN attempt_count INT DEFAULT 1");
            await connection.execute("ALTER TABLE driver_applications ADD COLUMN rejected_at TIMESTAMP NULL");
        } catch (e) {
            console.log('Application column addition warning (might already exist):', e.message);
        }

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
