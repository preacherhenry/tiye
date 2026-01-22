import { db } from './src/config/firebase';
import bcrypt from 'bcryptjs';

async function updateAdminPassword() {
    try {
        console.log('--- Updating Superadmin Password ---');

        const email = 'superadmin@tiye.com';
        const newPassword = 'admin123';

        const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();

        if (userQuery.empty) {
            console.log(`No user found with email: ${email}`);
            return;
        }

        const userDoc = userQuery.docs[0];
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await userDoc.ref.update({
            password: hashedPassword
        });

        console.log('✅ Password updated successfully!');
        console.log(`   Email: ${email}`);
        console.log(`   New Password: ${newPassword}`);
    } catch (error) {
        console.error('Error updating password:', error);
    } finally {
        process.exit();
    }
}

updateAdminPassword();
