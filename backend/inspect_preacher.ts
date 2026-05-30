import { db } from './src/config/firebase';

async function inspectUser() {
    const userId = '41ncSJwQ29lW7nYwLFXQ'; // Preacher
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
        console.log('--- Preacher User Data ---');
        console.log(JSON.stringify(userDoc.data(), null, 2));
    } else {
        console.log('User not found');
    }
    process.exit();
}

inspectUser();
