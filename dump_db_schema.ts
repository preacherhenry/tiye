import pool from './src/config/db';
import fs from 'fs';

async function dumpSchema() {
    try {
        const [tables] = await pool.execute('SHOW TABLES');
        const schema: any = {};
        for (const tableRow of tables as any[]) {
            const tableName = Object.values(tableRow)[0] as string;
            const [columns] = await pool.execute(`DESCRIBE ${tableName}`);
            schema[tableName] = columns;
        }
        fs.writeFileSync('schema_dump.json', JSON.stringify(schema, null, 2));
        console.log('Schema dumped to schema_dump.json');
    } catch (error) {
        console.error('Error dumping schema:', error);
    } finally {
        process.exit();
    }
}

dumpSchema();
