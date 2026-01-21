const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Fixing Application row ---');
        await connection.execute('UPDATE driver_applications SET full_name = "Leo", user_id = 36 WHERE id = 1');

        console.log('--- Cleaning old documents ---');
        await connection.execute('DELETE FROM driver_documents WHERE application_id = 1');

        console.log('--- Inserting correct documents for Leo ---');
        const docs = [
            { type: 'license', file: 'user-1767437017063.jpeg' },
            { type: 'nrc', file: 'user-1767437017082.jpeg' },
            { type: 'registration', file: 'user-1767437017106.jpeg' },
            { type: 'profile_photo', file: 'user-1767437017129.jpeg' }
        ];

        for (const d of docs) {
            await connection.execute(
                'INSERT INTO driver_documents (application_id, doc_type, file_path) VALUES (?, ?, ?)',
                [1, d.type, 'http://localhost:5000/uploads/' + d.file]
            );
        }

        console.log('✅ Successfully corrected data for Leo (User 36)');
    } catch (e) {
        console.error('❌ Fix failed:', e.message);
    } finally {
        await connection.end();
    }
}

fix();
