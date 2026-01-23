
import { db } from '../src/config/firebase';

async function massSyncSubscriptions() {
    console.log("🚀 Starting Mass Subscription Synchronization...");
    const now = new Date().toISOString();
    let updatedCount = 0;
    let totalDrivers = 0;

    try {
        const driversSnapshot = await db.collection('drivers').get();
        totalDrivers = driversSnapshot.size;
        console.log(`🔍 Found ${totalDrivers} driver profiles to check.`);

        for (const driverDoc of driversSnapshot.docs) {
            const driverId = driverDoc.id;
            const driverData = driverDoc.data();

            // Fetch all subscriptions for this driver
            const subsSnapshot = await db.collection('driver_subscriptions')
                .where('driver_id', '==', driverId)
                .get();

            let targetStatus = 'none';
            let bestExpiry = driverData.subscription_expiry || null;
            let activeSubFound = false;
            let pausedSubFound = false;
            let expiredSubFound = false;

            subsSnapshot.docs.forEach(subDoc => {
                const sub = subDoc.data();
                if (sub.status === 'active') {
                    if (sub.expiry_date > now) {
                        activeSubFound = true;
                        // Update best expiry if this one is further in the future
                        if (!bestExpiry || sub.expiry_date > bestExpiry) {
                            bestExpiry = sub.expiry_date;
                        }
                    } else {
                        expiredSubFound = true;
                    }
                } else if (sub.status === 'paused') {
                    pausedSubFound = true;
                }
            });

            if (activeSubFound) {
                targetStatus = 'active';
            } else if (pausedSubFound) {
                targetStatus = 'paused';
            } else if (expiredSubFound) {
                targetStatus = 'expired';
            }

            // check if update is needed
            const needsUpdate = driverData.subscription_status !== targetStatus ||
                (targetStatus === 'active' && driverData.subscription_expiry !== bestExpiry);

            if (needsUpdate) {
                const updateData: any = {
                    subscription_status: targetStatus,
                    subscription_expiry: bestExpiry
                };

                // If not active, force offline
                if (targetStatus !== 'active') {
                    updateData.is_online = false;
                    updateData.online_status = 'offline';
                }

                await db.collection('drivers').doc(driverId).update(updateData);
                console.log(`✅ Updated Driver ${driverId} (${driverData.email || 'No Email'}): ${driverData.subscription_status} -> ${targetStatus}`);
                updatedCount++;
            }
        }

        console.log(`\n✨ Mass Sync Completed!`);
        console.log(`📊 Total Drivers Checked: ${totalDrivers}`);
        console.log(`🔄 Total Drivers Updated: ${updatedCount}`);

    } catch (error) {
        console.error("❌ Mass Sync Failed:", error);
    }
}

massSyncSubscriptions().then(() => process.exit(0));
