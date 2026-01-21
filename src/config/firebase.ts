import * as admin from 'firebase-admin';
import path from 'path';

let credential;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(serviceAccount);
    } catch (error) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', error);
        const serviceAccountPath = path.resolve(__dirname, '../../firebase-adminsdk.json');
        credential = admin.credential.cert(serviceAccountPath);
    }
} else {
    const serviceAccountPath = path.resolve(__dirname, '../../firebase-adminsdk.json');
    credential = admin.credential.cert(serviceAccountPath);
}

admin.initializeApp({
    credential: credential,
});

export const db = admin.firestore();
export const auth = admin.auth();

console.log('✅ Firebase Admin initialized successfully');

export default admin;
