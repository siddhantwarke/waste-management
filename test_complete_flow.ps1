$body = @{
    username = "newuser123" 
    email = "newuser@example.com"
    password = "NewUser123!"
    role = "customer"
    first_name = "New"
    last_name = "User"
    phone = "+1234567899"
    address = "789 New St"
} | ConvertTo-Json

Write-Host "Testing registration with new user..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Registration Status Code: $($response.StatusCode)"
    Write-Host "Registration Response: $($response.Content)"
    
    # Extract token for login test
    $registrationData = $response.Content | ConvertFrom-Json
    Write-Host "`nUser registered successfully with ID: $($registrationData.user.id)"
    
} catch {
    Write-Host "Registration Error Status: $($_.Exception.Response.StatusCode)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Registration Error Response: $responseBody"
}

# Test login with the new user
Write-Host "`nTesting login with new user..."
$loginBody = @{
    email = "newuser@example.com"
    password = "NewUser123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login Status Code: $($loginResponse.StatusCode)"
    Write-Host "Login Response: $($loginResponse.Content)"
} catch {
    Write-Host "Login Error Status: $($_.Exception.Response.StatusCode)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Login Error Response: $responseBody"
}
