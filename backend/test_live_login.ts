import axios from 'axios';

async function testLiveLogin() {
    const liveUrl = 'https://tiye-backend.onrender.com/login';
    const credentials = {
        email: 'debug_admin@tiye.com',
        password: 'debug_password_123'
    };

    console.log(`--- Testing Live Login ---`);
    console.log(`URL: ${liveUrl}`);
    console.log(`Payload: ${JSON.stringify(credentials)}`);

    try {
        const response = await axios.post(liveUrl, credentials);
        console.log('Login Status:', response.status);
        console.log('Login Body:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            const token = response.data.token;
            console.log('✅ Auth Token received.');

            // Now test the profile fetch
            const driverId = 'sJVUcB1CQ06aA88imUxS'; // The problematic driver ID
            const profileUrl = `https://tiye-backend.onrender.com/admin/drivers/${driverId}/profile`;

            console.log(`\n--- Fetching Driver Profile ---`);
            console.log(`URL: ${profileUrl}`);

            const profileRes = await axios.get(profileUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Profile Status:', profileRes.status);
            console.log('Profile Data (Partial):', {
                driver: profileRes.data.driver?.name,
                activeTrip: profileRes.data.activeTrip,
                realTimeStatus: profileRes.data.driver?.realTimeStatus
            });
        }

    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        }
    }
}

testLiveLogin();
