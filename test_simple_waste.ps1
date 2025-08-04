$loginBody = @{
    email = "test@example.com"
    password = "Test123!"
} | ConvertTo-Json

# First login to get token
try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    Write-Host "Login successful"
    
    # Test waste request creation
    $wasteRequestBody = @{
        waste_type = "plastic"
        quantity = 5.5
        pickup_address = "123 Test Street, Test City, Test State 12345"
        pickup_date = "2025-07-30"
        pickup_time = "morning"
        special_instructions = "Please ring the doorbell twice"
    } | ConvertTo-Json
    
    Write-Host "Request body: $wasteRequestBody"
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $wasteResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/waste/requests" -Method POST -Body $wasteRequestBody -Headers $headers
    Write-Host "Success: $($wasteResponse.Content)"
    
} catch {
    Write-Host "Error Status: $($_.Exception.Response.StatusCode)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Error Response: $responseBody"
}
