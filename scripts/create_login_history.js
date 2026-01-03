const mysql = require('mysql2/promise');
require('dotenv').config();

async function createLoginHistoryTable() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Creating login_history table...');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS login_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_login_time (login_time)
            )
        `);

        console.log('✅ login_history table created successfully');

        // Check if table exists and show structure
        const [rows] = await db.execute('DESCRIBE login_history');
        console.table(rows);

    } catch (error) {
        console.error('❌ Error creating table:', error);
    } finally {
        await db.end();
    }
}

createLoginHistoryTable();
