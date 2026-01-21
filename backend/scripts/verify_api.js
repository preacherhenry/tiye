const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testApi() {
    console.log('--- Starting API Verification ---');

    // 1. Register Passenger
    console.log('\n1. Registering Passenger...');
    const passengerEmail = `p${Date.now()}@test.com`;
    try {
        const passengerRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Passenger',
                phone: '1234567890',
                email: passengerEmail,
                password: 'password123',
                role: 'passenger'
            })
        });
        console.log('Passenger Register:', await passengerRes.json());
    } catch (e) {
        console.error('Fetch error (Register P):', e);
    }

    // 2. Register Driver
    console.log('\n2. Registering Driver...');
    const driverEmail = `d${Date.now()}@test.com`;
    try {
        const driverRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Driver',
                phone: '0987654321',
                email: driverEmail,
                password: 'password123',
                role: 'driver'
            })
        });
        console.log('Driver Register:', await driverRes.json());
    } catch (e) { console.error(e); }

    // 3. Login Passenger
    console.log('\n3. Logging in Passenger...');
    let passengerId;
    try {
        const loginPRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: passengerEmail, password: 'password123' })
        });
        const loginPData = await loginPRes.json();
        console.log('Passenger Login:', loginPData);
        passengerId = loginPData.user?.id;
    } catch (e) { console.error(e); }

    // 4. Request Ride
    console.log('\n4. Requesting Ride...');
    if (passengerId) {
        try {
            const rideRes = await fetch(`${BASE_URL}/request-ride`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passenger_id: passengerId,
                    pickup: 'A',
                    destination: 'B'
                })
            });
            console.log('Request Ride:', await rideRes.json());
        } catch (e) { console.error(e); }
    }

    // 5. Login Driver
    console.log('\n5. Logging in Driver...');
    let driverId;
    try {
        const loginDRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: driverEmail, password: 'password123' })
        });
        const loginDData = await loginDRes.json();
        console.log('Driver Login:', loginDData);
        driverId = loginDData.user?.id;
    } catch (e) { console.error(e); }

    // 6. Get Pending Rides
    console.log('\n6. Getting Pending Rides...');
    try {
        const pendingRes = await fetch(`${BASE_URL}/pending-rides`);
        const pendingData = await pendingRes.json();
        console.log('Pending Rides Response:', JSON.stringify(pendingData, null, 2));

        const myRide = pendingData.rides?.find(r => r.passenger_id === passengerId && r.status === 'pending');

        if (myRide && driverId) {
            console.log(`Found ride ID: ${myRide.id}, accepting it...`);
            // 7. Accept Ride
            const acceptRes = await fetch(`${BASE_URL}/accept-ride`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ride_id: myRide.id,
                    driver_id: driverId
                })
            });
            console.log('Accept Ride:', await acceptRes.json());
        }
    } catch (e) { console.error(e); }

    console.log('\n--- Verification Complete ---');
}

testApi().catch(console.error);
