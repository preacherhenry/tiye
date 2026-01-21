$passengerBody = @{
    name = "Test Passenger"
    phone = "+260971234567"
    email = "passenger_test@example.com"
    password = "testpass123"
    role = "passenger"
} | ConvertTo-Json

$driverBody = @{
    name = "Test Driver"
    phone = "+260979876543"
    email = "driver_test@example.com"
    password = "testpass123"
    role = "driver"
    car_model = "Toyota Corolla"
    car_color = "Silver"
    plate_number = "TEST123"
} | ConvertTo-Json

Write-Host "`n=== Testing Passenger Registration ===" -ForegroundColor Cyan
try {
    $passengerResponse = Invoke-WebRequest -Uri 'http://localhost:5000/register' -Method POST -ContentType 'application/json' -Body $passengerBody
    Write-Host "Status: $($passengerResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($passengerResponse.Content)" -ForegroundColor Green
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n=== Testing Driver Registration ===" -ForegroundColor Cyan
try {
    $driverResponse = Invoke-WebRequest -Uri 'http://localhost:5000/register' -Method POST -ContentType 'application/json' -Body $driverBody
    Write-Host "Status: $($driverResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($driverResponse.Content)" -ForegroundColor Green
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}
