const fetch = require('node-fetch');

async function testLogin() {
    try {
        console.log("Attempting login API request...");
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@tiye.com',
                password: 'admin123'
            })
        });

        const data = await response.json();
        console.log("API Status Code:", response.status);
        console.log("API Response Body:");
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("API Request Failed:", error.message);
    }
}

testLogin();
