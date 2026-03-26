const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.resolve(__dirname, './firebase-adminsdk.json');
const credential = admin.credential.cert(serviceAccountPath);

admin.initializeApp({
    credential: credential
});

const db = admin.firestore();

async function checkApplication(appId) {
    const docsSnapshot = await db.collection('driver_documents')
        .where('application_id', '==', appId)
        .get();

    const docs = docsSnapshot.docs.map(doc => doc.data());
    fs.writeFileSync('/tmp/app_docs.json', JSON.stringify(docs, null, 2));
    console.log('Results written to /tmp/app_docs.json');
}

checkApplication('05ueGSBN5igAOlKMMxCt').catch(console.error);
