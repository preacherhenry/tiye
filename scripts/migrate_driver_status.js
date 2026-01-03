const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
    const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app',
    };
    const pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();

    try {
        console.log("Adding 'status' to users table...");
        try {
            await conn.execute("ALTER TABLE users ADD COLUMN status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'approved' AFTER role");
            console.log("✅ Added 'status' to users.");
        } catch (e) {
            console.log("⚠️ Column 'status' might already exist or error occurred.");
        }

        console.log("Updating default status for existing drivers...");
        await conn.execute("UPDATE users SET status = 'approved' WHERE role = 'driver'");

        console.log("Schema migration complete.");
    } catch (e) {
        console.error("❌ Error during migration:", e.message);
    } finally {
        conn.release();
        process.exit(0);
    }
}
migrate();
