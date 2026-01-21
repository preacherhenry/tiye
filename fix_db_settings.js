const mysql = require('mysql2/promise');

async function runFix() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'taxi_app'
    });

    try {
        console.log('--- Database Fix Started ---');

        // 1. Cleanup duplicate key_name entries (keep the one with the highest ID)
        console.log('1. Cleaning up duplicate settings...');
        await pool.execute(`
            DELETE FROM settings 
            WHERE id NOT IN (
                SELECT max_id FROM (
                    SELECT MAX(id) as max_id 
                    FROM settings 
                    GROUP BY key_name
                ) as tmp
            )
        `);

        // 2. Add Unique Index if not exists
        console.log('2. Ensuring unique constraint on key_name...');
        try {
            await pool.execute('ALTER TABLE settings ADD UNIQUE INDEX idx_unique_key_name (key_name)');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('   - Unique index already exists.');
            } else {
                throw err;
            }
        }

        // 3. Ensure all required keys exist
        console.log('3. Inserting missing fare keys...');
        const keys = [
            ['base_fare', '20'],
            ['price_per_km', '10'],
            ['price_per_min', '0'],
            ['min_fare', '20'],
            ['surge_multiplier', '1.0'],
            ['surge_enabled', 'false']
        ];

        for (const [key, value] of keys) {
            await pool.execute(
                'INSERT IGNORE INTO settings (key_name, value) VALUES (?, ?)',
                [key, value]
            );
        }

        console.log('--- Database Fix Completed Successfully ---');
    } catch (error) {
        console.error('FAILED to complete database fix:', error.message);
    } finally {
        await pool.end();
    }
}

runFix();
