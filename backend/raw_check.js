
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function rawCheck() {
    const id = 'sJVUcB1CQ06aA88imUxS';
    const doc = await db.collection('drivers').doc(id).get();
    console.log('RAW DRIVERS DOC:', JSON.stringify(doc.data(), null, 2));
}

rawCheck();
