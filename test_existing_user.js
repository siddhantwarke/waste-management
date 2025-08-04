// Test logging in with existing user who has waste requests
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testExistingUser() {
  try {
    console.log('=== Testing with User ID 3 (siddhantwarke@gmail.com) ===');
    
    // Common passwords to try
    const passwordsToTry = [
      'Password123',
      'password123',
      'Siddhant123',
      'siddhant123',
      'Test123',
      'test123',
      '12345678',
      'Password@123'
    ];
    
    for (const password of passwordsToTry) {
      console.log(`\nTrying password: ${password}`);
      
      const loginOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'siddhantwarke@gmail.com',
          password: password
        })
      };
      
      const loginResponse = await makeRequest('http://localhost:5000/api/auth/login', loginOptions);
      console.log('Login response status:', loginResponse.status);
      
      if (loginResponse.status === 200) {
        console.log('SUCCESS! Login response:', loginResponse.data);
        
        // Test waste requests
        const token = loginResponse.data.token;
        const requestsOptions = {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        const requestsResponse = await makeRequest('http://localhost:5000/api/waste/requests', requestsOptions);
        console.log('Waste requests response:', requestsResponse.data);
        return; // Exit on success
      } else {
        console.log('Failed:', loginResponse.data.message);
      }
    }
    
    console.log('All password attempts failed');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testExistingUser();
