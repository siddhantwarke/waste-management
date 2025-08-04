// Create multiple waste requests for test user
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

async function setupTestData() {
  try {
    console.log('=== Setting up test data for testuser_debug ===');
    
    // Login with test user
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
    console.log('Login successful:', loginResponse.data.success);
    
    const token = loginResponse.data.token;
    
    // Create multiple waste requests
    const requests = [
      {
        waste_type: 'e-waste',
        quantity: 3.0,
        pickup_address: '456 Electronic Ave, Tech City',
        pickup_date: '2025-07-31',
        pickup_time: 'afternoon',
        special_instructions: 'Old computer and monitor'
      },
      {
        waste_type: 'organic',
        quantity: 10.5,
        pickup_address: '789 Garden St, Green Town',
        pickup_date: '2025-08-01',
        pickup_time: 'morning',
        special_instructions: 'Compostable food waste'
      },
      {
        waste_type: 'paper',
        quantity: 2.0,
        pickup_address: '321 Office Blvd, Business District',
        pickup_date: '2025-08-02',
        pickup_time: 'evening',
        special_instructions: 'Shredded documents'
      }
    ];
    
    for (let i = 0; i < requests.length; i++) {
      console.log(`Creating request ${i + 1}...`);
      const createOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requests[i])
      };
      
      const createResponse = await makeRequest('http://localhost:5000/api/waste/requests', createOptions);
      console.log(`Request ${i + 1} created:`, createResponse.data.success);
    }
    
    // Check final count
    const requestsOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const requestsResponse = await makeRequest('http://localhost:5000/api/waste/requests', requestsOptions);
    console.log(`\nFinal count: ${requestsResponse.data.data.length} waste requests`);
    console.log('Requests:', requestsResponse.data.data.map(r => ({
      id: r.id,
      waste_type: r.waste_type,
      quantity: r.quantity,
      status: r.status
    })));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupTestData();
