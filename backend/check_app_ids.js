const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, './firebase-adminsdk.json');
const credential = admin.credential.cert(serviceAccountPath);

admin.initializeApp({
    credential: credential
});

const db = admin.firestore();

async function listAllAppIds() {
    const docsSnapshot = await db.collection('driver_documents').get();
    const ids = new Set();
    docsSnapshot.docs.forEach(doc => {
        ids.add(doc.data().application_id);
    });
    console.log('Unique Application IDs in driver_documents:');
    Array.from(ids).forEach(id => console.log(`- "${id}"`));
}

listAllAppIds().catch(console.error);
