const mysql = require('mysql2/promise');
require('dotenv').config();

async function createPromotionUsageTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app'
    });

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS promotion_usage (
                id INT AUTO_INCREMENT PRIMARY KEY,
                promotion_id INT NOT NULL,
                user_id INT NOT NULL,
                used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_usage (promotion_id, user_id)
            )
        `);
        console.log('✅ promotion_usage table created or already exists.');
    } catch (error) {
        console.error('❌ Error creating promotion_usage table:', error);
    } finally {
        await connection.end();
    }
}

createPromotionUsageTable();
