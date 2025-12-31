const fs = require('fs');
const path = require('path');

const targetPath = process.argv[2];
const sourceFile = process.argv[3];

if (!targetPath || !sourceFile) {
    console.error('Usage: node write_mobile_file.js <relative_path_in_mobile> <source_file_path>');
    process.exit(1);
}

const content = fs.readFileSync(sourceFile, 'utf8');
const mobileDir = path.resolve(__dirname, '../../taxi_mobile');
const fullPath = path.join(mobileDir, targetPath);

// Ensure dir exists
fs.mkdirSync(path.dirname(fullPath), { recursive: true });

fs.writeFileSync(fullPath, content);
console.log(`Wrote to ${fullPath}`);
