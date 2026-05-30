const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require('./firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const storage = admin.storage();

async function listBuckets() {
    try {
        const [buckets] = await storage.getBuckets();
        console.log('Available buckets:');
        buckets.forEach(bucket => {
            console.log(`- ${bucket.name}`);
        });
    } catch (error) {
        console.error('Error listing buckets:', error.message);
    }
    process.exit();
}

listBuckets();
