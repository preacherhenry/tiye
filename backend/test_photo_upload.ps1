$testEmail = "photo_test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"

Write-Host "`n=== Testing Registration with Photo Upload ===" -ForegroundColor Cyan

# Step 1: Register user
Write-Host "`n[Step 1] Registering new user..." -ForegroundColor Yellow
$registerBody = @{
    name     = "Photo Test User"
    phone    = "+260971234567"
    email    = $testEmail
    password = "testpass123"
    role     = "passenger"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri 'http://localhost:5000/register' -Method POST -ContentType 'application/json' -Body $registerBody -UseBasicParsing
    $registerData = $registerResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "Response: $($registerResponse.Content)" -ForegroundColor White
    
    if ($registerData.userId) {
        $userId = $registerData.userId
        Write-Host "User ID: $userId" -ForegroundColor Green
        
        # Step 2: Test photo upload endpoint
        Write-Host "`n[Step 2] Testing photo upload endpoint..." -ForegroundColor Yellow
        
        # Create a simple test file
        $testPhotoPath = "test_photo.txt"
        "Test photo content" | Out-File -FilePath $testPhotoPath -Encoding ASCII
        
        try {
            # Create multipart form data
            $boundary = [System.Guid]::NewGuid().ToString()
            $LF = "`r`n"
            
            $bodyLines = @(
                "--$boundary",
                "Content-Disposition: form-data; name=`"userId`"$LF",
                "$userId",
                "--$boundary",
                "Content-Disposition: form-data; name=`"photo`"; filename=`"test.jpg`"",
                "Content-Type: image/jpeg$LF",
                "Test photo binary data",
                "--$boundary--$LF"
            ) -join $LF
            
            $uploadResponse = Invoke-WebRequest -Uri 'http://localhost:5000/upload-photo' `
                -Method POST `
                -ContentType "multipart/form-data; boundary=$boundary" `
                -Body $bodyLines `
                -UseBasicParsing
                
            Write-Host "✅ Photo upload endpoint responded!" -ForegroundColor Green
            Write-Host "Response: $($uploadResponse.Content)" -ForegroundColor White
        }
        catch {
            Write-Host "⚠️  Photo upload test: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
        finally {
            # Cleanup
            if (Test-Path $testPhotoPath) {
                Remove-Item $testPhotoPath
            }
        }
        
        # Step 3: Verify user was created in database
        Write-Host "`n[Step 3] Verifying user in database..." -ForegroundColor Yellow
        Write-Host "You can check the database with:" -ForegroundColor Cyan
        Write-Host "  node -e `"const mysql=require('mysql2/promise');mysql.createConnection({host:'localhost',user:'root',password:'your_password',database:'taxi_db'}).then(c=>c.query('SELECT id,name,email,profile_photo FROM users WHERE id=?',[$userId]).then(r=>{console.log(r[0]);c.end()}))`"" -ForegroundColor Gray
        
    }
    else {
        Write-Host "❌ Registration did not return userId!" -ForegroundColor Red
    }
    
}
catch {
    Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
