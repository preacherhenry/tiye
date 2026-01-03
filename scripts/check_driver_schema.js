const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app',
    };
    const pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();

    const fs = require('fs');
    let output = "";

    try {
        output += "Users columns:\n";
        const [userCols] = await conn.execute("SHOW COLUMNS FROM users");
        userCols.forEach(r => output += ` - ${r.Field}\n`);

        output += "\nChecking 'drivers' table...\n";
        const [driverCols] = await conn.execute("SHOW COLUMNS FROM drivers");
        output += "Drivers columns:\n";
        driverCols.forEach(r => output += ` - ${r.Field}\n`);

        output += "\nChecking 'driver_applications' table...\n";
        const [appCols] = await conn.execute("SHOW COLUMNS FROM driver_applications");
        output += "Application columns:\n";
        appCols.forEach(r => output += ` - ${r.Field}\n`);

        fs.writeFileSync('schema_debug.txt', output);
        console.log("Written to schema_debug.txt");

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        conn.release();
        process.exit(0);
    }
}
check();
