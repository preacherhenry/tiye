const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
  keyFilename: path.resolve(__dirname, 'firebase-adminsdk.json')
});

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
}

listBuckets();
