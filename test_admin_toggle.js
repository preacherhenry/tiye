const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@test.com'; // The Super Admin we created
const ADMIN_PASSWORD = 'admin123';

async function testToggle() {
    try {
        // 1. Login
        console.log('Logging in as Super Admin...');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();

        if (!loginData.success) {
            console.error('❌ Login failed:', loginData);
            return;
        }

        const token = loginData.token;
        console.log('✅ Login successful. Token obtained.');

        // 2. Fetch Admins
        console.log('\nFetching admins...');
        const adminsRes = await fetch(`${API_URL}/admin/admins`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const adminsData = await adminsRes.json();
        const admins = adminsData.admins;

        // Find Blessing
        const blessing = admins.find(a => a.name.toLowerCase().includes('blessing') || a.email.includes('tiye.com'));

        if (!blessing) {
            console.log('❌ Could not find user "Blessing" in admin list.');
            console.log('Available admins:', admins.map(a => `${a.name} (${a.email})`));
            return;
        }

        console.log(`✅ Found Blessing: ID=${blessing.id}, Status=${blessing.status}`);

        // 3. Toggle Status
        const newStatus = blessing.status === 'active' ? 'suspended' : 'active';
        console.log(`\nAttempting to set status to: ${newStatus}...`);

        const toggleRes = await fetch(`${API_URL}/admin/admins/${blessing.id}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        const toggleText = await toggleRes.text();
        console.log('Toggle Status Code:', toggleRes.status);

        let toggleData;
        try {
            toggleData = JSON.parse(toggleText);
        } catch (e) {
            console.error('❌ Failed to parse JSON. Raw response:', toggleText);
            return;
        }

        console.log('✅ Toggle Response:', toggleData);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testToggle();
