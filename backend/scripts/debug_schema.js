const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load .env from parent dir or current dir
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'taxi_app',
};

console.log('Database Config:', { ...dbConfig, password: '****' });

const pool = mysql.createPool(dbConfig);

async function run() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log(`✅ Connected to database: ${dbConfig.database}`);

        // 1. Check existing columns
        const [rows] = await conn.execute("SHOW COLUMNS FROM ride_requests");
        console.log("Current Columns in ride_requests:");
        const columns = rows.map(r => r.Field);
        columns.forEach(c => console.log(` - ${c}`));

        // 2. Add 'fare' if missing
        if (!columns.includes('fare')) {
            console.log("⚠️ Column 'fare' is MISSING. Adding it now...");
            await conn.execute("ALTER TABLE ride_requests ADD COLUMN fare DECIMAL(10, 2) DEFAULT 0.00");
            console.log("✅ Added 'fare' column.");
        } else {
            console.log("✓ Column 'fare' exists.");
        }

        // 3. Add 'distance' if missing
        if (!columns.includes('distance')) {
            console.log("⚠️ Column 'distance' is MISSING. Adding it now...");
            await conn.execute("ALTER TABLE ride_requests ADD COLUMN distance DECIMAL(10, 2) DEFAULT 0.00");
            console.log("✅ Added 'distance' column.");
        } else {
            console.log("✓ Column 'distance' exists.");
        }

        console.log("Schema verification complete.");
    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

run();
