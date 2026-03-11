const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'firebase-adminsdk.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkGraceProof() {
    try {
        console.log('Querying pending deposits for Grace...');
        // Match user's screenshot where Grace is the driver
        const snapshot = await db.collection('wallet_transactions')
            .where('status', '==', 'pending')
            .get();

        if (snapshot.empty) {
            console.log('No pending deposits found.');
            return;
        }

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`- ID: ${doc.id}`);
            console.log(`  Driver ID: ${data.driver_id}`);
            console.log(`  Amount: ${data.amount}`);
            console.log(`  Proof URL: ${data.proof_photo}`);
            console.log(`  Created At: ${data.created_at}`);
            console.log('---');
        });
    } catch (err) {
        console.error('Error querying Firestore:', err.message);
    }
    process.exit(0);
}

checkGraceProof();
