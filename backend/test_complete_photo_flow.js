const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPhotoFlow() {
    const axios = require('axios');
    const FormData = require('form-data');
    const fs = require('fs');

    console.log('\n=== Testing Complete Photo Upload Flow ===\n');

    // Step 1: Register a new user
    console.log('[Step 1] Registering new user...');
    const testEmail = `photo_flow_test_${Date.now()}@example.com`;

    try {
        const registerResponse = await axios.post('http://localhost:5000/register', {
            name: 'Photo Flow Test',
            phone: '+260975555555',
            email: testEmail,
            password: 'testpass123',
            role: 'passenger'
        });

        console.log('✅ Registration response:', registerResponse.data);

        if (!registerResponse.data.success || !registerResponse.data.userId) {
            console.error('❌ Registration failed or no userId returned');
            return;
        }

        const userId = registerResponse.data.userId;
        console.log(`User ID: ${userId}`);

        // Step 2: Upload a photo
        console.log('\n[Step 2] Uploading profile photo...');

        // Create a test image file
        const testImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync('test_image.png', testImageContent);

        const formData = new FormData();
        formData.append('userId', userId.toString());
        formData.append('photo', fs.createReadStream('test_image.png'), {
            filename: 'test_photo.png',
            contentType: 'image/png'
        });

        const uploadResponse = await axios.post('http://localhost:5000/upload-photo', formData, {
            headers: formData.getHeaders()
        });

        console.log('✅ Upload response:', uploadResponse.data);

        // Step 3: Verify in database
        console.log('\n[Step 3] Checking database...');

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'taxi_app'
        });

        const [users] = await connection.execute(
            'SELECT id, name, email, profile_photo FROM users WHERE id = ?',
            [userId]
        );

        if (users.length > 0) {
            console.log('✅ User found in database:');
            console.log(`   Name: ${users[0].name}`);
            console.log(`   Email: ${users[0].email}`);
            console.log(`   Profile Photo: ${users[0].profile_photo || 'NOT SET'}`);

            if (users[0].profile_photo) {
                console.log('\n🎉 SUCCESS! Photo URL is stored in database!');
            } else {
                console.log('\n❌ FAILED: Photo URL was not saved to database');
            }
        }

        await connection.end();

        // Cleanup
        fs.unlinkSync('test_image.png');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testPhotoFlow();
