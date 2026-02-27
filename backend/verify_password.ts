
import bcrypt from 'bcryptjs';

const hash = "$2b$10$yKnRgw68oUj0ZbCjKsWWX.WoedCYNiVQBeVDYiF38e4L3GXqm6LBO";
const passwordToTest = "password123";

async function verify() {
    const match = await bcrypt.compare(passwordToTest, hash);
    console.log(`Password "${passwordToTest}" matches hash: ${match}`);
}

verify();
