import { storage } from './src/config/firebase';

async function listBuckets() {
    try {
        const [buckets] = await storage.getBuckets();
        console.log('Available buckets:');
        buckets.forEach(bucket => {
            console.log(`- ${bucket.name}`);
        });
    } catch (error: any) {
        console.error('Error listing buckets:', error.message);
    }
    process.exit();
}

listBuckets();
