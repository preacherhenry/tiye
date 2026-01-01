const fs = require('fs');
const path = require('path');

const files = [
    'src/screens/auth/LoginScreen.tsx',
    'src/screens/auth/RegisterScreen.tsx'
];

files.forEach(file => {
    const fullPath = path.resolve('c:/Users/lenovo/taxi_mobile', file);
    try {
        if (fs.existsSync(fullPath)) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // Replace container background only
            // Assuming container style is defined as: container: { ... backgroundColor: Colors.primary ... }
            if (content.includes('backgroundColor: Colors.primary')) {
                content = content.replace(/backgroundColor:\s*Colors.primary/g, "backgroundColor: Colors.background");
                console.log(`Patched Background in ${file}`);
            } else {
                console.log(`No primary background found in ${file}`);
            }

            fs.writeFileSync(fullPath, content);
        } else {
            console.log(`File not found: ${fullPath}`);
        }
    } catch (e) {
        console.error(`Error patching ${file}:`, e.message);
    }
});
