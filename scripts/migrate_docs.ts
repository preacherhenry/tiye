import pool from '../src/config/db';

const migrate = async () => {
    try {
        console.log('Migrating driver_applications table...');

        // 1. Add new columns
        await pool.execute('ALTER TABLE driver_applications ADD COLUMN license_front VARCHAR(255) AFTER driving_experience_years');
        await pool.execute('ALTER TABLE driver_applications ADD COLUMN license_back VARCHAR(255) AFTER license_front');
        await pool.execute('ALTER TABLE driver_applications ADD COLUMN nrc_front VARCHAR(255) AFTER license_back');
        await pool.execute('ALTER TABLE driver_applications ADD COLUMN nrc_back VARCHAR(255) AFTER nrc_front');

        // 2. Make old columns nullable so we don't break existing logic yet
        await pool.execute('ALTER TABLE driver_applications MODIFY COLUMN license_document VARCHAR(255) NULL');
        await pool.execute('ALTER TABLE driver_applications MODIFY COLUMN national_id_document VARCHAR(255) NULL');
        await pool.execute('ALTER TABLE driver_applications MODIFY COLUMN vehicle_registration_document VARCHAR(255) NULL');

        console.log('Migration successful.');
    } catch (error: any) {
        console.error('Migration failed:', error.message);
    } finally {
        process.exit();
    }
};

migrate();
