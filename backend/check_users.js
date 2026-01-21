require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

async function checkUsers() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'taxi_app'
        });

        const [rows] = await pool.query("SHOW COLUMNS FROM users");
        console.log("Users Table Columns:");
        rows.forEach(row => console.log(` - ${row.Field}`));

        await pool.end();
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkUsers();
