
import { db } from './src/config/firebase';

async function inspectHenry() {
    try {
        const snapshot = await db.collection('users').where('email', '==', 'henry@tiye.com').get();
        if (snapshot.empty) {
            console.log('User henry@tiye.com not found.');
            return;
        }

        snapshot.forEach(doc => {
            console.log('--- Henry Admin Details ---');
            console.log(JSON.stringify(doc.data(), null, 2));
        });
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

inspectHenry();
