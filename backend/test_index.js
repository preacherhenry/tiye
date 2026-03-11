const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'firebase-adminsdk.json'));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  console.log('--- Testing exact controller query ---');
  try {
    const snapshot = await db.collection('wallet_transactions')
        .where('type', '==', 'deposit')
        .where('status', '==', 'pending')
        .orderBy('created_at', 'desc')
        .get();
    
    console.log(`Success! Found ${snapshot.size} deposits.`);
    snapshot.docs.forEach(doc => {
        console.log(`- ID: ${doc.id}, Driver: ${doc.data().driver_id}, Amount: ${doc.data().amount}`);
    });
  } catch (error) {
    console.error('FAILED Query:', error.message);
    if (error.message.includes('index')) {
        console.log('\n🚨 MISSING INDEX DETECTED 🚨');
    }
  }
  process.exit(0);
}

check().catch(e => { console.error(e.message); process.exit(1); });
