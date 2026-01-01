Write-Host "🚀 Preparing to build APK for Physical Device..." -ForegroundColor Cyan

# Check if logged in to expo
Write-Host "Checking Expo login status..." -ForegroundColor Yellow
$whoami = npx expo whoami
if ($?) {
    Write-Host "✅ Logged in as: $whoami" -ForegroundColor Green
}
else {
    Write-Host "⚠️ You need to log in to Expo first." -ForegroundColor Red
    Write-Host "Please run: npx expo login" -ForegroundColor Yellow
    exit
}

# Navigate to mobile dir
cd ../taxi_mobile

# Run build
Write-Host "🏗️ Starting Build (Profile: preview)..." -ForegroundColor Cyan
Write-Host "This will generate an APK file you can install on your phone." -ForegroundColor Gray

npx eas build -p android --profile preview

Write-Host "✅ Build process initiated!" -ForegroundColor Green
Write-Host "Follow the instructions above. Once finished, download the APK and install it on your phone." -ForegroundColor Yellow
