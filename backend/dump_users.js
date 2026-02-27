
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require('./firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function dumpAllUsers() {
    try {
        console.log('--- Dumping All Users from Firestore (JS) ---');
        const snapshot = await db.collection('users').get();
        if (snapshot.empty) {
            console.log('No users found.');
            return;
        }

        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        console.log('Email | Role | Status | Password Hash');
        console.log('-'.repeat(60));
        users.forEach(u => {
            console.log(`${u.email || 'N/A'} | ${u.role} | ${u.status} | ${u.password ? u.password.substring(0, 15) + '...' : 'NULL'}`);
        });

        console.log('\n--- Full User Data (JSON) ---');
        console.log(JSON.stringify(users, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

dumpAllUsers();
