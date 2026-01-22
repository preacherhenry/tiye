
import { db } from '../src/config/firebase';
import bcrypt from 'bcryptjs';

const createDebugAdmin = async () => {
    try {
        const email = 'debug_admin@tiye.com';
        const password = 'debug_password_123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (!snapshot.empty) {
            console.log('Reseting existing debug admin...');
            const docId = snapshot.docs[0].id;
            await db.collection('users').doc(docId).update({
                password: hashedPassword,
                role: 'super_admin',
                status: 'active'
            });
            console.log('✅ Debug Admin Reset. Use:', email, password);
        } else {
            const ref = db.collection('users').doc();
            await ref.set({
                name: 'Debug Admin',
                email,
                password: hashedPassword,
                role: 'super_admin',
                status: 'active',
                phone: '0000000000',
                created_at: new Date().toISOString()
            });
            console.log('✅ Debug Admin Created. Use:', email, password);
        }
    } catch (e: any) {
        console.error('Error:', e.message);
    }
};

createDebugAdmin();
