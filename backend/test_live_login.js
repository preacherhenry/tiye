const fetch = require('node-fetch');

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
        const response = await fetch(liveUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testLiveLogin();
