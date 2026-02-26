
import { db } from './src/config/firebase';
import bcrypt from 'bcryptjs';

async function resetPassword() {
    console.log('--- Resetting Password for henry@tiye.com ---');
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await db.collection('users').doc('qduu1jU3Oey1lmlNFcTL').update({
            password: hashedPassword,
            role: 'super_admin' // Just to be sure
        });
        console.log('✅ Password for henry@tiye.com has been reset to: password123');
    } catch (error) {
        console.error('Error resetting password:', error);
    }
}

resetPassword();
