import { uploadFile } from './src/utils/storage';
import path from 'path';
import fs from 'fs';

// Mock Express request
const mockReq = {
    secure: true,
    get: (name: string) => {
        if (name === 'x-forwarded-proto') return 'https';
        if (name === 'host') return 'localhost:5000';
        return '';
    }
} as any;

// Mock Multer file
const testFilePath = path.resolve(__dirname, 'test_image.jpg');
// Create a dummy image if it doesn't exist
if (!fs.existsSync(testFilePath)) {
    fs.writeFileSync(testFilePath, 'dummy image content');
}

const mockFile = {
    path: testFilePath,
    filename: 'test-upload-' + Date.now() + '.jpg',
    mimetype: 'image/jpeg'
} as any;

async function runTest() {
    console.log('🚀 Starting Firebase Storage test upload...');
    try {
        const url = await uploadFile(mockFile, 'test_uploads', mockReq);
        console.log('🏁 Test completed. URL:', url);
        if (url.includes('storage.googleapis.com')) {
            console.log('✅ SUCCESS: Uploaded to Firebase Storage!');
        } else {
            console.log('⚠️ FALLBACK: Uploaded to local storage (Render fallback).');
        }
    } catch (error) {
        console.error('💥 Test script CRASHED:', error);
    }
}

runTest();
