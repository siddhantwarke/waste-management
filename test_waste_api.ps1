# Test the new waste management API endpoints

Write-Host "Testing Waste Management API Endpoints..."

# Get token from the test user we created earlier
$loginBody = @{
    email = "test@example.com"
    password = "Test123!"
} | ConvertTo-Json

Write-Host "`n1. Getting authentication token..."
try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    Write-Host "✅ Login successful, token obtained"
    
    $headers = @{
        'Authorization' = "Bearer $token"
        'Content-Type' = 'application/json'
    }
    
    Write-Host "`n2. Testing nearby collectors endpoint..."
    try {
        $collectorsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/waste/collectors/nearby?latitude=37.7749&longitude=-122.4194" -Method GET -Headers $headers
        Write-Host "✅ Nearby collectors endpoint working"
        Write-Host "Response: $($collectorsResponse.Content)"
    } catch {
        Write-Host "❌ Nearby collectors endpoint failed: $($_.Exception.Message)"
    }
    
    Write-Host "`n3. Testing user's waste requests endpoint..."
    try {
        $requestsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/waste/requests" -Method GET -Headers $headers
        Write-Host "✅ Waste requests endpoint working"
        Write-Host "Response: $($requestsResponse.Content)"
    } catch {
        Write-Host "❌ Waste requests endpoint failed: $($_.Exception.Message)"
    }
    
    Write-Host "`n4. Testing create waste request endpoint..."
    $newRequestBody = @{
        waste_type = "plastic"
        quantity = 5.5
        pickup_address = "123 Test Street, Test City"
        pickup_date = "2025-07-30"
        pickup_time = "14:00"
        special_instructions = "Near the front door"
    } | ConvertTo-Json
    
    try {
        $createResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/waste/requests" -Method POST -Body $newRequestBody -Headers $headers
        Write-Host "✅ Create waste request endpoint working"
        Write-Host "Response: $($createResponse.Content)"
    } catch {
        Write-Host "❌ Create waste request endpoint failed: $($_.Exception.Message)"
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error details: $errorBody"
    }
    
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)"
}
