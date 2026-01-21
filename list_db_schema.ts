import pool from './src/config/db';

async function listTables() {
    try {
        const [tables] = await pool.execute('SHOW TABLES');
        const schema: any = {};
        for (const tableRow of tables as any[]) {
            const tableName = Object.values(tableRow)[0] as string;
            const [columns] = await pool.execute(`DESCRIBE ${tableName}`);
            schema[tableName] = columns;
        }
        console.log(JSON.stringify(schema, null, 2));
    } catch (error) {
        console.error('Error listing tables:', error);
    } finally {
        process.exit();
    }
}

listTables();
