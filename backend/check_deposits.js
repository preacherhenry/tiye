const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'firebase-adminsdk.json'));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  const walletSnap = await db.collection('wallet_transactions').orderBy('created_at', 'desc').limit(20).get();
  console.log('=== WALLET TRANSACTIONS (' + walletSnap.size + ' found) ===');
  walletSnap.docs.forEach(doc => {
    const d = doc.data();
    console.log(JSON.stringify({
      id: d.id, driver_id: d.driver_id, type: d.type,
      amount: d.amount, status: d.status, description: d.description,
      proof_photo: d.proof_photo ? 'YES' : 'NO', created_at: d.created_at
    }, null, 2));
    console.log('---');
  });

  try {
    const subSnap = await db.collection('subscription_payments').orderBy('created_at', 'desc').limit(10).get();
    console.log('\n=== LEGACY SUBSCRIPTION PAYMENTS (' + subSnap.size + ' found) ===');
    subSnap.docs.forEach(doc => {
      const d = doc.data();
      console.log(JSON.stringify(d, null, 2));
      console.log('---');
    });
  } catch(e) {
    console.log('No legacy subscription_payments collection or error:', e.message);
  }

  const driversSnap = await db.collection('drivers').get();
  console.log('\n=== DRIVER WALLET BALANCES ===');
  driversSnap.docs.forEach(doc => {
    const d = doc.data();
    console.log('Driver ' + doc.id + ': K' + (d.wallet_balance || 0));
  });

  process.exit(0);
}

check().catch(e => { console.error(e.message); process.exit(1); });
