const fs = require('fs');
const path = require('path');

const mobilePath = path.resolve('c:/Users/lenovo/taxi_mobile/src/screens/driver/DriverDashboard.tsx');
const localPath = path.resolve('temp_mobile/DriverDashboard.tsx');

try {
    const content = fs.readFileSync(mobilePath, 'utf8');
    fs.writeFileSync(localPath, content);
    console.log('Copied AppNavigator to temp folder');
} catch (error) {
    console.error('Error:', error.message);
}
