import pool from '../src/config/db';
import * as fs from 'fs';

const checkSchema = async () => {
    try {
        const [docs]: any = await pool.execute('DESCRIBE driver_documents');
        const [apps]: any = await pool.execute('DESCRIBE driver_applications');
        fs.writeFileSync('scripts/schema_audit.txt',
            'DRIVER_DOCUMENTS:\n' + JSON.stringify(docs, null, 2) +
            '\n\nDRIVER_APPLICATIONS:\n' + JSON.stringify(apps, null, 2)
        );
    } catch (e: any) {
        fs.writeFileSync('scripts/schema_audit.txt', 'Error: ' + e.message);
    } finally {
        process.exit();
    }
};

checkSchema();
