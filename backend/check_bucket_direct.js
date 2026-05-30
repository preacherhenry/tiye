const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
  keyFilename: path.resolve(__dirname, 'firebase-adminsdk.json')
});

async function checkBucket() {
  const bucketName = 'tiye-taxi-app.appspot.com';
  console.log(`Checking bucket: ${bucketName}`);
  try {
    const [exists] = await storage.bucket(bucketName).exists();
    console.log(`Bucket exists: ${exists}`);
    
    if (exists) {
        const [metadata] = await storage.bucket(bucketName).getMetadata();
        console.log('Bucket Metadata found!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkBucket();
