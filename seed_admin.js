require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'taxi_app'
        });

        // Check if admin exists
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", ['admin@tiye.com']);

        if (rows.length > 0) {
            console.log("Admin user already exists.");
            // Optional: Update role if not admin
            if (rows[0].role !== 'admin' && rows[0].role !== 'super_admin') {
                await pool.query("UPDATE users SET role = 'super_admin' WHERE email = ?", ['admin@tiye.com']);
                console.log("Updated existing user to super_admin.");
            }
        } else {
            // Create Admin
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                "INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
                ['Super Admin', 'admin@tiye.com', '0000000000', hashedPassword, 'super_admin']
            );
            console.log("Admin user created: admin@tiye.com / admin123");
        }

        await pool.end();
    } catch (error) {
        console.error("Error:", error.message);
    }
}

seedAdmin();
