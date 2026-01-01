const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLatestRide() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taxi_app'
    });

    console.log('\n=== Checking Latest Ride Request ===\n');

    // Get latest ride
    const [rides] = await connection.execute(
        `SELECT r.*, u.name as driver_name 
         FROM ride_requests r 
         LEFT JOIN users u ON r.driver_id = u.id 
         ORDER BY r.id DESC LIMIT 1`
    );

    if (rides.length > 0) {
        const ride = rides[0];
        console.log('Ride DETAILS:');
        console.log('  ID:', ride.id);
        console.log('  Status:', ride.status);
        console.log('  Driver ID:', ride.driver_id);
        console.log('  Driver Name:', ride.driver_name || 'NULL (No Driver Joined)');
        console.log('  Created At:', ride.created_at);

        if (ride.status === 'accepted') {
            console.log('\n✅ Ride is ACCEPTED in database');
            if (!ride.driver_id) {
                console.log('❌ BUT driver_id is missing! This explains why it might fail.');
            }
        } else {
            console.log(`\nℹ️ Ride status is '${ride.status}' (Not accepted yet?)`);
        }
    } else {
        console.log('No rides found in database');
    }

    await connection.end();
}

checkLatestRide();
