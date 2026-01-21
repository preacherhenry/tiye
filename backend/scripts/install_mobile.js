const { exec } = require('child_process');
const path = require('path');

const packageName = process.argv[2];
if (!packageName) {
    console.error('Usage: node install_mobile.js <package_name>');
    process.exit(1);
}

const mobileDir = path.resolve(__dirname, '../../taxi_mobile');

console.log(`Installing ${packageName} in ${mobileDir}...`);

exec(`npm install ${packageName}`, { cwd: mobileDir }, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`stderr: ${stderr}`);
    }
    console.log(`stdout: ${stdout}`);
});
