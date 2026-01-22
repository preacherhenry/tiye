const fetch = require('node-fetch');

async function testFreshAdminLogin() {
    const liveUrl = 'https://tiye-backend.onrender.com/login';
    const credentials = {
        email: 'henry@tiye.com',
        password: 'Henry2026!'
    };

    console.log(`--- Testing Fresh Admin Login ---`);
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

        if (data.success) {
            console.log('\n✅ LOGIN SUCCESSFUL!');
            console.log('This account should now work on the live web admin.');
        } else {
            console.log('\n❌ LOGIN FAILED');
            console.log('Error:', data.message);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testFreshAdminLogin();
