import { db } from './config/firebase';

async function diagnoseMarketplace() {
    console.log('🔍 Diagnosing Marketplace Posters...');
    
    try {
        const postersSnap = await db.collection('posters').get();
        if (postersSnap.empty) {
            console.log('❌ No posters found.');
        } else {
            console.log(`✅ Found ${postersSnap.size} posters.`);
            for (const doc of postersSnap.docs) {
                const data = doc.data();
                console.log(`\nPoster ID: ${doc.id}`);
                console.log(`- Store ID: ${data.store_id}`);
                console.log(`- Status: ${data.status}`);
                
                if (data.store_id) {
                    const storeDoc = await db.collection('stores').doc(data.store_id).get();
                    if (storeDoc.exists) {
                        const storeData = storeDoc.data();
                        console.log(`  ✅ Linked Store Found: ${storeData?.store_name}`);
                        console.log(`  - Description: ${storeData?.store_description}`);
                    } else {
                        console.log(`  ❌ Linked Store NOT FOUND for ID: ${data.store_id}`);
                    }
                } else {
                    console.log('  ⚠️ No store_id assigned to this poster.');
                }
            }
        }

        const storesSnap = await db.collection('stores').get();
        console.log(`\n✅ Total Stores in database: ${storesSnap.size}`);
        storesSnap.docs.forEach(doc => {
            console.log(`- ${doc.id}: ${doc.data().store_name}`);
        });

    } catch (error) {
        console.error('💥 Error during diagnosis:', error);
    }
}

diagnoseMarketplace().then(() => process.exit(0));
