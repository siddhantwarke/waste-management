// Test script to debug authentication and waste requests API
const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
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

async function testLoginAndRequests() {
  try {
    console.log('=== Testing Login and Waste Requests API ===');
    
    // Test 0: Register a new user first
    console.log('\n0. Registering a test user...');
    const registerOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser_debug',
        email: 'testuser_debug@example.com',
        password: 'TestPass123',
        first_name: 'Debug',
        last_name: 'User',
        role: 'customer',
        phone: '+1234567890'
      })
    };
    
    const registerResponse = await makeRequest('http://localhost:5000/api/auth/register', registerOptions);
    console.log('Register response status:', registerResponse.status);
    console.log('Register response:', registerResponse.data);
    
    // Test 1: Login with the newly created user
    console.log('\n1. Testing login...');
    const loginOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testuser_debug@example.com',
        password: 'TestPass123'
      })
    };
    
    const loginResponse = await makeRequest('http://localhost:5000/api/auth/login', loginOptions);
    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.data.success && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('Login successful, token received');
      
      // Test 2: Get waste requests using the token
      console.log('\n2. Testing waste requests API...');
      const requestsOptions = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const requestsResponse = await makeRequest('http://localhost:5000/api/waste/requests', requestsOptions);
      console.log('Waste requests response status:', requestsResponse.status);
      console.log('Waste requests response:', requestsResponse.data);
      
      // Test 3: Create a waste request for this user
      console.log('\n3. Creating a waste request...');
      const createRequestOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          waste_type: 'plastic',
          quantity: 5.0,
          pickup_address: '123 Debug Street, Test City',
          pickup_date: '2025-07-30',
          pickup_time: 'morning',
          special_instructions: 'Test request for debugging'
        })
      };
      
      const createResponse = await makeRequest('http://localhost:5000/api/waste/requests', createRequestOptions);
      console.log('Create request response status:', createResponse.status);
      console.log('Create request response:', createResponse.data);
      
      // Test 4: Check waste requests again
      console.log('\n4. Checking waste requests again...');
      const requestsResponse2 = await makeRequest('http://localhost:5000/api/waste/requests', requestsOptions);
      console.log('Waste requests response status:', requestsResponse2.status);
      console.log('Waste requests response:', requestsResponse2.data);
      
    } else {
      console.log('Login failed');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLoginAndRequests();
