const http = require('http');

const API_HOST = '10.133.206.9';
const API_PORT = 5000;

function makeRequest(email, password) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ email, password });

        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: '/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Invalid JSON response', raw: data });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
    });
}

async function testLogin() {
    console.log('\n=== TESTING LOGIN ENDPOINT ===\n');
    console.log(`Server: http://${API_HOST}:${API_PORT}\n`);

    // Test cases with existing users
    const testCases = [
        { email: 'henry.192.168.01.03@gmail.com', password: 'password123', desc: 'Passenger' },
        { email: 'preacher.192@yahoo.com', password: 'password123', desc: 'Driver (approved)' },
        { email: 'admin@tiye.com', password: 'password123', desc: 'Admin' },
    ];

    for (const testCase of testCases) {
        console.log(`🧪 Testing: ${testCase.email}`);
        console.log(`   Type: ${testCase.desc}`);
        console.log('─'.repeat(60));

        try {
            const response = await makeRequest(testCase.email, testCase.password);

            if (response.success) {
                console.log('✅ Login SUCCESSFUL');
                console.log('   User:', response.user?.name || 'N/A');
                console.log('   Role:', response.user?.role || 'N/A');
                console.log('   Token:', response.token ? '✓ Received' : '✗ Missing');
            } else {
                console.log('❌ Login FAILED');
                console.log('   Message:', response.message || 'Unknown error');
                console.log('   Status:', response.status || 'N/A');
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('❌ CONNECTION REFUSED');
                console.log('   ⚠️  Backend server is NOT running on port 5000!');
                console.log('   ➜  Start the server with: npm start');
                break;
            } else if (error.message === 'Request timeout') {
                console.log('❌ CONNECTION TIMEOUT');
                console.log('   ⚠️  Cannot reach server at ' + API_HOST);
                break;
            } else {
                console.log('❌ ERROR:', error.message);
            }
        }
        console.log('');
    }

    console.log('='.repeat(60));
    console.log('\n💡 TROUBLESHOOTING STEPS:\n');
    console.log('1. ✓ Backend server is running (port 5000 is listening)');
    console.log('2. ? Are you using the correct password?');
    console.log('   Common passwords: password123, Password123, test123');
    console.log('');
    console.log('3. ? Can your mobile device reach the server?');
    console.log('   - Open browser on your phone');
    console.log(`   - Visit: http://${API_HOST}:${API_PORT}`);
    console.log('   - You should see: {"status":"Taxi node backend running"}');
    console.log('');
    console.log('4. ? Are you on the same WiFi network?');
    console.log('   - Both phone and computer must be on same network');
    console.log('');
    console.log('5. ? Check your computer\'s IP address:');
    console.log('   - Run: ipconfig');
    console.log('   - Look for IPv4 Address under your WiFi adapter');
    console.log(`   - Update app.json if IP changed from ${API_HOST}`);
    console.log('');
}

testLogin().catch(console.error);
