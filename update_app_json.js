const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '../taxi_mobile/app.json');

try {
    const data = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(data);

    // Update apiUrl
    if (!appJson.expo.extra) {
        appJson.expo.extra = {};
    }
    appJson.expo.extra.apiUrl = "http://10.79.1.9:5000";

    // Ensure build profile exists if needed, but EAS handles that in eas.json usually.
    // Just setting the env var here.

    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    console.log('✅ Updated app.json with apiUrl: http://10.79.1.9:5000');
} catch (error) {
    console.error('❌ Failed to update app.json:', error);
}
