const http = require('http');

const API_URL = 'http://localhost:5000';

function post(url, data, token = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(data))
            }
        };
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ body: JSON.parse(body), status: res.statusCode });
                } catch (e) {
                    resolve({ body, status: res.statusCode });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function testRideRequest() {
    console.log('🧪 Starting Ride Request Test...');

    try {
        // 1. Register a test passenger
        const email = `test_passenger_${Date.now()}@example.com`;
        const password = 'password123';
        console.log(`--- Step 1: Registering passenger ${email} ---`);
        const regRes = await post(`${API_URL}/register`, {
            name: 'Test Passenger',
            email,
            password,
            phone: '1234567890',
            role: 'passenger'
        });

        if (!regRes.body.success) {
            console.error('❌ Registration failed:', regRes.body.message);
            return;
        }
        const userId = regRes.body.userId;
        console.log(`✅ Registered! User ID: ${userId}`);

        // 2. Login
        console.log('--- Step 2: Logging in ---');
        const loginRes = await post(`${API_URL}/login`, { email, password });
        if (!loginRes.body.success) {
            console.error('❌ Login failed:', loginRes.body.message);
            return;
        }
        const token = loginRes.body.token;
        console.log('✅ Login successful!');

        // 3. Request Ride
        console.log('--- Step 3: Requesting Ride ---');
        const rideData = {
            passenger_id: userId,
            pickup: 'Chirundu Road, Zambia',
            destination: 'Machembere, Zambia',
            fare: 56,
            distance: 3.6
        };
        const rideRes = await post(`${API_URL}/request-ride`, rideData, token);

        if (rideRes.body.success) {
            console.log('✅ Ride Request Successful!');
            console.log('Ride ID:', rideRes.body.rideId);
        } else {
            console.error('❌ Ride Request Failed!');
            console.error('Status Code:', rideRes.status);
            console.error('Response:', JSON.stringify(rideRes.body, null, 2));
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

testRideRequest();
