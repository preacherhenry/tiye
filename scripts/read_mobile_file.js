const fs = require('fs');
const path = require('path');

const targetPath = process.argv[2];

if (!targetPath) {
    console.error('Usage: node read_mobile_file.js <relative_path_in_mobile>');
    process.exit(1);
}

const mobileDir = path.resolve(__dirname, '../../taxi_mobile');
const fullPath = path.join(mobileDir, targetPath);

try {
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(content);
} catch (e) {
    console.error('Error reading file:', e.message);
}
