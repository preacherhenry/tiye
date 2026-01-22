import axios from 'axios';

async function testLiveLogin() {
    const liveUrl = 'https://tiye-backend.onrender.com/login';
    const credentials = {
        email: 'superadmin@tiye.com',
        password: 'admin123'
    };

    console.log(`--- Testing Live Login ---`);
    console.log(`URL: ${liveUrl}`);
    console.log(`Payload: ${JSON.stringify(credentials)}`);

    try {
        const response = await axios.post(liveUrl, credentials);
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        }
    }
}

testLiveLogin();
