const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testCollectorsByCityAPI() {
  try {
    console.log('Testing collectors by city API...');
    
    // Login as collector to get token (any user will work for this test)
    const loginData = {
      email: 'prat@gmail.com',
      password: 'Sid@@2727'
    };
    
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    console.log('Login successful:', loginResponse.data.success);
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test different city cases
    const cities = ['kolhapur', 'Kolhapur', 'KOLHAPUR'];
    
    for (const city of cities) {
      console.log(`\nTesting city: "${city}"`);
      const response = await axios.get(`${API_BASE_URL}/auth/collectors/${city}`, { headers });
      console.log(`Found ${response.data.collectors.length} collectors`);
      
      if (response.data.collectors.length > 0) {
        console.log('First collector:', {
          name: `${response.data.collectors[0].first_name} ${response.data.collectors[0].last_name}`,
          city: response.data.collectors[0].city,
          group: response.data.collectors[0].collector_group_name,
          prices: {
            e_waste: response.data.collectors[0].e_waste_price,
            plastic: response.data.collectors[0].plastic_price,
            organic: response.data.collectors[0].organic_price
          }
        });
      }
    }
    
  } catch (error) {
    console.error('Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCollectorsByCityAPI();
