import { db } from './src/config/firebase';
import bcrypt from 'bcryptjs';

async function createFreshAdmin() {
    try {
        console.log('--- Creating Fresh Admin Account ---');

        const email = 'henry@tiye.com';
        const password = 'Henry2026!';

        // Create a new document with auto-generated ID
        const newUserRef = db.collection('users').doc();
        const userId = newUserRef.id;

        const hashedPassword = await bcrypt.hash(password, 10);

        const adminData = {
            id: userId,  // CRITICAL: Store the ID in the document data too
            name: 'Henry Admin',
            email: email,
            password: hashedPassword,
            role: 'super_admin',
            status: 'active',
            phone: '+260999999999',
            created_at: new Date().toISOString(),
            is_online: false
        };

        await newUserRef.set(adminData);

        console.log('✅ Fresh admin account created!');
        console.log(`   Document ID: ${userId}`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   ID field in document: ${adminData.id}`);
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        process.exit();
    }
}

createFreshAdmin();
