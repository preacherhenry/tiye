import pool from '../src/config/db';
import * as fs from 'fs';

const checkSchema = async () => {
    try {
        const tableName = process.argv[2] || 'driver_applications';
        const [columns]: any = await pool.execute(`DESCRIBE ${tableName}`);
        fs.writeFileSync('scripts/schema_results.txt', JSON.stringify(columns, null, 2));
    } catch (e: any) {
        fs.writeFileSync('scripts/schema_results.txt', 'Error: ' + e.message);
    } finally {
        process.exit();
    }
};

checkSchema();
