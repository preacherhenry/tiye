const http = require('http');

const API_HOST = '10.68.186.9';
const API_PORT = 5000;

console.log('\n=== QUICK LOGIN TEST ===\n');
console.log(`Testing connection to: http://${API_HOST}:${API_PORT}\n`);

// Test 1: Check if server is reachable
console.log('Test 1: Checking if server is reachable...');
const healthCheck = http.request({
    hostname: API_HOST,
    port: API_PORT,
    path: '/',
    method: 'GET',
    timeout: 3000
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('✅ Server is reachable!');
        console.log('   Response:', data);
        console.log('');

        // Test 2: Try login
        testLogin();
    });
});

healthCheck.on('error', (error) => {
    console.log('❌ CANNOT REACH SERVER!');
    console.log('   Error:', error.message);
    console.log('');
    console.log('⚠️  This means your mobile phone also cannot reach the backend.');
    console.log('   Possible causes:');
    console.log('   1. Backend server is not running');
    console.log('   2. Firewall is blocking port 5000');
    console.log('   3. Wrong IP address');
    console.log('');
    process.exit(1);
});

healthCheck.on('timeout', () => {
    healthCheck.destroy();
    console.log('❌ CONNECTION TIMEOUT');
    process.exit(1);
});

healthCheck.end();

function testLogin() {
    console.log('Test 2: Testing login with passenger@test.com...');

    const postData = JSON.stringify({
        email: 'passenger@test.com',
        password: 'test123'
    });

    const loginReq = http.request({
        hostname: API_HOST,
        port: API_PORT,
        path: '/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 5000
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('');
                console.log('Response from server:');
                console.log(JSON.stringify(response, null, 2));
                console.log('');

                if (response.success) {
                    console.log('✅ LOGIN WORKS FROM COMPUTER!');
                    console.log('');
                    console.log('⚠️  If login fails on mobile, the issue is:');
                    console.log('   1. Mobile app not using updated IP (10.68.186.9)');
                    console.log('   2. Mobile phone cannot reach this IP');
                    console.log('   3. Expo cache not cleared');
                    console.log('');
                    console.log('🔧 SOLUTION:');
                    console.log('   1. Stop Expo (Ctrl+C in the terminal)');
                    console.log('   2. Close the app completely on your phone');
                    console.log('   3. Run: npx expo start --clear');
                    console.log('   4. Scan QR code again');
                } else {
                    console.log('❌ LOGIN FAILED');
                    console.log('   Message:', response.message);
                    console.log('   This means there is an issue with the credentials or backend logic');
                }
            } catch (e) {
                console.log('❌ Invalid response from server:', data);
            }
        });
    });

    loginReq.on('error', (error) => {
        console.log('❌ Login request failed:', error.message);
    });

    loginReq.write(postData);
    loginReq.end();
}
