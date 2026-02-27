
import { db } from './src/config/firebase';

async function dumpAllUsers() {
    try {
        console.log('--- Dumping All Users from Firestore ---');
        const snapshot = await db.collection('users').get();
        if (snapshot.empty) {
            console.log('No users found.');
            return;
        }

        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.table(users.map(u => ({
            Email: u.email || 'N/A',
            Role: u.role,
            Status: u.status,
            PasswordHash: u.password ? (u.password.substring(0, 10) + '...') : 'NULL'
        })));

        // Log full details for debugging
        console.log('\nFull JSON Data:');
        console.log(JSON.stringify(users, null, 2));

    } catch (error) {
        console.error('Error dumping users:', error);
    }
}

dumpAllUsers();
