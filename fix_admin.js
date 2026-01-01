require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

async function fixAdminRole() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'taxi_app'
        });

        // FORCE UPDATE
        const [result] = await pool.query("UPDATE users SET role = 'super_admin' WHERE email = 'admin@tiye.com'");
        console.log(`Update Result: Affected Rows: ${result.affectedRows}, Changed Rows: ${result.changedRows}`);

        // VERIFY IMMEDIATELY
        const [rows] = await pool.query("SELECT id, email, role FROM users WHERE email = 'admin@tiye.com'");
        console.log("Verified Role immediately after update:", JSON.stringify(rows[0], null, 2));

        await pool.end();
    } catch (error) {
        console.error("Error:", error.message);
    }
}

fixAdminRole();
