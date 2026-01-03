const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function addMissingColumns() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'tiye_taxi'
    });

    try {
        console.log('Checking for missing columns in users table...');
        const [rows] = await connection.execute('DESCRIBE users');
        const columns = rows.map(r => r.Field);

        if (!columns.includes('current_lat')) {
            console.log('Adding current_lat column...');
            await connection.execute('ALTER TABLE users ADD COLUMN current_lat DECIMAL(10, 8) NULL');
        }

        if (!columns.includes('current_lng')) {
            console.log('Adding current_lng column...');
            await connection.execute('ALTER TABLE users ADD COLUMN current_lng DECIMAL(11, 8) NULL');
        }

        console.log('✅ Success: Columns verified/added.');
    } catch (error) {
        console.error('❌ Error updating database:', error);
    } finally {
        await connection.end();
    }
}

addMissingColumns();
