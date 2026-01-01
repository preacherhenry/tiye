const fs = require('fs');
const path = require('path');

const targetDir = process.argv[2];
if (!targetDir) {
    console.error("Please specify a directory path relative to taxi_mobile");
    process.exit(1);
}

const mobilePath = path.resolve('c:/Users/lenovo/taxi_mobile', targetDir);

try {
    const files = fs.readdirSync(mobilePath);
    files.forEach(file => {
        console.log(file);
    });
} catch (error) {
    console.error("Error listing directory:", error.message);
}
