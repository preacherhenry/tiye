const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000';
const PASSENGER_EMAIL = 'passenger@test.com';
const PASSENGER_PASS = 'test123';
const DRIVER_EMAIL = 'driver@test.com';
const DRIVER_PASS = 'test123';

async function testFlow() {
    try {
        // 1. Login Passenger
        console.log('Login Passenger...');
        const pLogin = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: PASSENGER_EMAIL, password: PASSENGER_PASS })
        }).then(r => r.json());
        const pToken = pLogin.token;
        const pId = pLogin.user.id;

        // 2. Login Driver
        console.log('Login Driver...');
        const dLogin = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: DRIVER_EMAIL, password: DRIVER_PASS })
        }).then(r => r.json());
        const dToken = dLogin.token;
        const dId = dLogin.user.id;

        // 3. Request Ride
        console.log('Requesting Ride...');
        const reqRide = await fetch(`${API_URL}/request-ride`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pToken}` },
            body: JSON.stringify({
                passenger_id: pId,
                pickup: 'Test Pickup',
                destination: 'Test Dest',
                fare: 50,
                distance: 5
            })
        }).then(r => r.json());
        const rideId = reqRide.rideId;
        console.log(`Ride Created: ${rideId}`);

        // 4. Accept Ride
        console.log('Driver Accepting Ride...');
        await fetch(`${API_URL}/accept-ride`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dToken}` },
            body: JSON.stringify({ ride_id: rideId, driver_id: dId })
        }).then(r => r.json());

        // 5. Verify Driver sees it as accepted
        console.log('Check Driver Rides (Before Cancel)...');
        const driverRides1 = await fetch(`${API_URL}/driver-rides/${dId}`, {
            headers: { Authorization: `Bearer ${dToken}` }
        }).then(r => r.json());
        const activeRide1 = driverRides1.rides.find(r => r.id === rideId);
        console.log(`Driver Ride Status: ${activeRide1.status}`);

        // 6. Cancel Ride (Passenger)
        console.log('Passenger Cancelling Ride...');
        await fetch(`${API_URL}/update-ride-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pToken}` },
            body: JSON.stringify({ ride_id: rideId, status: 'cancelled' })
        }).then(r => r.json());

        // 7. Verify Driver sees it as cancelled
        console.log('Check Driver Rides (After Cancel)...');
        const driverRides2 = await fetch(`${API_URL}/driver-rides/${dId}`, {
            headers: { Authorization: `Bearer ${dToken}` }
        }).then(r => r.json());
        const activeRide2 = driverRides2.rides.find(r => r.id === rideId);
        console.log(`Driver Ride Status: ${activeRide2.status}`);

        if (activeRide2.status === 'cancelled') {
            console.log('✅ TEST PASSED: Driver can see cancellation');
        } else {
            console.log('❌ TEST FAILED: Driver status mismatch');
        }

    } catch (e) {
        console.error(e);
    }
}

testFlow();
