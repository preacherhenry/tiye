const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000';
// Use valid test IDs from previous logs or known state
// Passenger: 33 (user-1767274061348)
// Driver: 34 (user-1767348963011)

async function debugDriverRides() {
    const DRIVER_EMAIL = 'driver@test.com'; // Bob
    const DRIVER_PASS = 'test123';

    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: DRIVER_EMAIL, password: DRIVER_PASS })
        });
        const loginData = await loginRes.json();

        if (!loginData.success) {
            console.error('Login Failed:', loginData);
            return;
        }

        const token = loginData.token;
        const driverId = loginData.user.id;
        console.log(`Logged in as Driver ID: ${driverId}`);

        // 2. Fetch Rides
        console.log('Fetching rides...');
        const response = await fetch(`${API_URL}/driver-rides/${driverId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        console.log('Success:', data.success);
        if (data.success && data.rides) {
            console.log(`Found ${data.rides.length} rides.`);
            // Sort by ID desc to see latest
            const latest = data.rides.sort((a, b) => b.id - a.id).slice(0, 3);
            latest.forEach(r => {
                console.log(`Ride #${r.id}: Status='${r.status}', Driver=${r.driver_id}, Passenger=${r.passenger_id}`);
            });
        } else {
            console.log('No rides found or error structure:', data);
        }
    } catch (error) {
        console.error('Error fetching driver rides:', error);
    }
}

debugDriverRides();
