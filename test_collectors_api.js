const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testCollectorsAPI() {
  try {
    console.log('Testing collectors API...');
    
    // First, login as customer to get token
    console.log('1. Logging in as customer...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'siddhantwarke@gmail.com',
      password: 'Sid@@2727'
    });
    
    if (!loginResponse.data.success) {
      console.error('Login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('Login successful!');
    console.log('User city:', loginResponse.data.user.city);
    
    const token = loginResponse.data.token;
    
    // Test collectors endpoint
    console.log('2. Testing collectors endpoint...');
    const collectorsResponse = await axios.get(`${API_URL}/auth/collectors/kolhapur`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Collectors API Response:');
    console.log('Status:', collectorsResponse.status);
    console.log('Data:', JSON.stringify(collectorsResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error testing collectors API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testCollectorsAPI();
