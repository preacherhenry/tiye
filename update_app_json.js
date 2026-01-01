const fs = require('fs');
const path = require('path');

const mobileAppJsonPath = path.resolve('c:/Users/lenovo/taxi_mobile/app.json');

try {
    const content = fs.readFileSync(mobileAppJsonPath, 'utf8');
    const json = JSON.parse(content);

    // Get IP from args or hardcode based on what we found (10.79.1.9)
    const apiUrl = 'http://10.79.1.9:5000';

    if (!json.expo.extra) {
        json.expo.extra = {};
    }

    json.expo.extra.apiUrl = apiUrl;

    // Ensure android package is set (saw it in partial output but good to ensure)
    if (!json.expo.android) json.expo.android = {};
    if (!json.expo.android.package) json.expo.android.package = "com.tiye.taxi";

    // Ensure cleartext traffic is allowed (saw it too)
    json.expo.android.usesCleartextTraffic = true;

    fs.writeFileSync(mobileAppJsonPath, JSON.stringify(json, null, 2));
    console.log(`✅ Updated app.json with apiUrl: ${apiUrl}`);
    console.log('Preserved existing config including projectId if present.');

} catch (error) {
    console.error('Failed to update app.json:', error);
    process.exit(1);
}
