
import { db } from './src/config/firebase';

async function listUsers() {
    console.log('--- Current Users in Database ---');
    try {
        const snapshot = await db.collection('users').get();
        if (snapshot.empty) {
            console.log('No users found in the "users" collection.');
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id} | Email: ${data.email} | Role: ${data.role} | Name: ${data.name}`);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

listUsers();
