const fetch = require('node-fetch');

async function testAdminOverview() {
    const url = 'https://tiye-backend.onrender.com/admin/dashboard-stats';

    // Get the token from the previous login test
    const loginUrl = 'https://tiye-backend.onrender.com/login';
    const credentials = {
        email: 'henry@tiye.com',
        password: 'Henry2026!'
    };

    console.log('--- Step 1: Login to get token ---');
    const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });

    const loginData = await loginResponse.json();

    if (!loginData.success) {
        console.log('Login failed:', loginData.message);
        return;
    }

    const token = loginData.token;
    console.log('✅ Login successful, got token');

    console.log('\n--- Step 2: Fetch admin overview ---');
    const overviewResponse = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const responseText = await overviewResponse.text();
    console.log('Status:', overviewResponse.status);

    try {
        const overviewData = JSON.parse(responseText);
        console.log('Response:', JSON.stringify(overviewData, null, 2));
    } catch (e) {
        console.log('❌ Failed to parse JSON. Raw response:');
        console.log(responseText);
    }
}

testAdminOverview().catch(console.error);
