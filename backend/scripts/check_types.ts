
import { db } from '../src/config/firebase';

async function checkSubTypes() {
    const subId = 'a3asVneLMCucXYSyYBFv';
    const doc = await db.collection('driver_subscriptions').doc(subId).get();
    if (!doc.exists) {
        console.log("Sub not found");
        return;
    }
    const data = doc.data()!;
    console.log(`Sub ID: ${subId}`);
    console.log(`driver_id value: "${data.driver_id}"`);
    console.log(`driver_id type: ${typeof data.driver_id}`);

    // Check driver profile as well
    const driverId = 'pPLLr5AAEj4WnWNHZJwv';
    const driver = await db.collection('drivers').doc(driverId).get();
    console.log(`Driver ID: ${driverId}`);
    console.log(`Driver ID Type: ${typeof driver.id}`);
}

checkSubTypes().then(() => process.exit(0));
