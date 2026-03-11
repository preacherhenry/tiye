const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables if they exist
require('dotenv').config();

let credential;
const serviceAccountPath = path.resolve(__dirname, 'firebase-adminsdk.json');

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('Using FIREBASE_SERVICE_ACCOUNT from process.env');
    try {
        credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
    } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', e.message);
        credential = admin.credential.cert(serviceAccountPath);
    }
} else {
    console.log('Using local firebase-adminsdk.json');
    credential = admin.credential.cert(serviceAccountPath);
}

admin.initializeApp({
    credential: credential,
    storageBucket: 'tiye-taxi-app.firebasestorage.app'
});

const storage = admin.storage();

async function listBuckets() {
    try {
        console.log('Project Options:', admin.app().options);
        
        const bucket = admin.storage().bucket();
        console.log('Default Bucket Name:', bucket.name);
        
        // Use the underlying GCS storage object to list buckets
        const [buckets] = await bucket.storage.getBuckets();
        
        if (buckets.length === 0) {
            console.log('❌ No buckets found! Is Firebase Storage enabled?');
        } else {
            console.log(`✅ Found ${buckets.length} buckets:`);
            buckets.forEach(b => console.log(`- ${b.name}`));
        }
    } catch (error) {
        console.error('❌ Failed to list buckets!');
        console.error('Error details:', error.message);
    }
    process.exit(0);
}

listBuckets();
