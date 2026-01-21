import pool from '../src/config/db';
import * as fs from 'fs';

const checkApps = async () => {
    let output = '';
    const log = (msg: string) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        log('--- START DB CHECK ---');

        const [apps]: any = await pool.execute('SELECT * FROM driver_applications');
        log(`TOTAL APPLICATIONS: ${apps.length}`);
        apps.forEach((app: any) => {
            log(`- App ID: ${app.id}, User ID: ${app.user_id}, Status: ${app.status}, Name: ${app.full_name}`);
        });

        const [users]: any = await pool.execute("SELECT id, name, role, status FROM users");
        log(`TOTAL USERS: ${users.length}`);
        users.forEach((u: any) => {
            log(`- User ID: ${u.id}, Name: ${u.name}, Role: ${u.role}, Status: ${u.status}`);
        });

        const [rides]: any = await pool.execute('SELECT COUNT(*) as count FROM ride_requests');
        log(`TOTAL RIDE REQUESTS: ${rides[0].count}`);

        const [drivers]: any = await pool.execute('SELECT COUNT(*) as count FROM drivers');
        log(`TOTAL DRIVERS: ${drivers[0].count}`);

        log('--- END DB CHECK ---');
    } catch (error: any) {
        log('DATABASE ERROR: ' + error.message);
    } finally {
        fs.writeFileSync('scripts/results.txt', output);
        process.exit();
    }
};

checkApps();
