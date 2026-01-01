require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

async function describeUsers() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'taxi_app'
        });

        // Get Full Column Details
        const [rows] = await pool.query("SHOW COLUMNS FROM users LIKE 'role'");
        console.log("Role Column Definition:");
        console.log(JSON.stringify(rows[0], null, 2));

        await pool.end();
    } catch (error) {
        console.error("Error:", error.message);
    }
}

describeUsers();
