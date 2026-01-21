require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

async function alterRole() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'taxi_app'
        });

        console.log("Altering 'role' column to include admin types...");
        // Modifying to include admin and super_admin
        await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('passenger', 'driver', 'admin', 'super_admin') DEFAULT 'passenger'");
        console.log("✅ Schema updated successfully.");

        await pool.end();
    } catch (error) {
        console.error("❌ Error altering schema:", error.message);
    }
}

alterRole();
