import { db } from './src/config/firebase';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
    try {
        console.log('--- Seeding Super Admin to Firestore ---');

        const email = 'superadmin@tiye.com';
        const password = 'admin123';

        const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();

        if (!userQuery.empty) {
            console.log(`Admin account ${email} already exists in Firestore.`);
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: '1',
            name: 'PREACHER SIANKUNGUYA',
            email: email,
            password: hashedPassword,
            role: 'super_admin',
            status: 'active',
            phone: '+260111111111',
            created_at: new Date().toISOString()
        };

        await db.collection('users').doc('1').set(newUser);

        console.log('✅ Super Admin account created in Firestore!');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        process.exit();
    }
}

seedAdmin();
