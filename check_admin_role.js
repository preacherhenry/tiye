require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

async function checkAdmin() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'taxi_app'
        });

        const [rows] = await pool.query("SELECT id, name, email, role FROM users WHERE email = ?", ['admin@tiye.com']);
        console.log("Admin User Record (JSON):");
        console.log(JSON.stringify(rows, null, 2));

        await pool.end();
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkAdmin();
