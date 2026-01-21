const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testPassengerRegistration() {
    console.log('\n=== Testing Passenger Registration ===');

    try {
        const response = await axios.post(`${API_URL}/register`, {
            name: 'Test Passenger',
            phone: '+260971234567',
            email: `passenger_test_${Date.now()}@test.com`,
            password: 'testpass123',
            role: 'passenger'
        });

        console.log('✅ Passenger Registration Response:', JSON.stringify(response.data, null, 2));
        return response.data.success;
    } catch (error) {
        console.error('❌ Passenger Registration Failed:', error.response?.data || error.message);
        return false;
    }
}

async function testDriverRegistration() {
    console.log('\n=== Testing Driver Registration ===');

    try {
        const response = await axios.post(`${API_URL}/register`, {
            name: 'Test Driver',
            phone: '+260979876543',
            email: `driver_test_${Date.now()}@test.com`,
            password: 'testpass123',
            role: 'driver',
            car_model: 'Toyota Corolla',
            car_color: 'Silver',
            plate_number: 'TEST123'
        });

        console.log('✅ Driver Registration Response:', JSON.stringify(response.data, null, 2));
        return response.data.success;
    } catch (error) {
        console.error('❌ Driver Registration Failed:', error.response?.data || error.message);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Starting Registration Tests...\n');

    const passengerResult = await testPassengerRegistration();
    const driverResult = await testDriverRegistration();

    console.log('\n=== Test Summary ===');
    console.log(`Passenger Registration: ${passengerResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Driver Registration: ${driverResult ? '✅ PASSED' : '❌ FAILED'}`);

    if (passengerResult && driverResult) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
}

runTests();
