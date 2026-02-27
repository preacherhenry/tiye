
import { db } from './src/config/firebase';
import bcrypt from 'bcryptjs';

async function createNewSuperAdmin() {
    const name = "Admin User";
    const email = "admin_new@tiye.com";
    const username = "admin_new";
    const password = "adminPassword123!";
    const role = "super_admin";

    try {
        console.log(`--- Creating New SuperAdmin: ${email} ---`);

        // Check if email already exists
        const emailCheck = await db.collection('users').where('email', '==', email).get();
        if (!emailCheck.empty) {
            console.log(`Error: User with email ${email} already exists.`);
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserRef = db.collection('users').doc();
        const userId = newUserRef.id;

        const userData = {
            id: userId,
            username: username,
            username_lower: username.toLowerCase(),
            name: name,
            email: email,
            password: hashedPassword,
            role: role,
            status: 'active',
            created_at: new Date().toISOString(),
            is_online: false
        };

        await newUserRef.set(userData);

        console.log('✅ SuperAdmin created successfully!');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Role: ${role}`);

    } catch (error) {
        console.error('Error creating SuperAdmin:', error);
    } finally {
        process.exit();
    }
}

createNewSuperAdmin();
