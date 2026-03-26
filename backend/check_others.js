const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, './firebase-adminsdk.json');
const credential = admin.credential.cert(serviceAccountPath);

admin.initializeApp({
    credential: credential
});

const db = admin.firestore();

async function checkOtherApps() {
    const apps = ['NMs534aQZaPsEsXnil9R', 'cHoAki5XbZPW3vJcLQ1x', 'CbeBennlopwMlQS6xrFo', 'h3ukHbMEaSdJ7OuQYCTM', 'vTz7FXm57kUAZhS7w6kK', 'bmDWNKuLFBoNqmnh0QCJ'];
    
    for (const appId of apps) {
        console.log(`\nChecking App ID: ${appId}`);
        const docsSnapshot = await db.collection('driver_documents')
            .where('application_id', '==', appId)
            .limit(1)
            .get();
        
        if (docsSnapshot.empty) {
            console.log('No documents found.');
        } else {
            const d = docsSnapshot.docs[0].data();
            console.log(`Type: ${d.doc_type}, Path: ${d.file_path}`);
        }
    }
}

checkOtherApps().catch(console.error);
