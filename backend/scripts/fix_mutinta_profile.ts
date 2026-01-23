
import { db } from '../src/config/firebase';

async function fixMutinta() {
    const mutintaId = 'pPLLr5AAEj4WnWNHZJwv';
    console.log(`Fixing Mutinta's profile status...`);

    await db.collection('drivers').doc(mutintaId).update({
        subscription_status: 'active'
    });

    console.log("✅ Mutinta's profile status set to 'active'!");
}

fixMutinta().then(() => process.exit(0));
