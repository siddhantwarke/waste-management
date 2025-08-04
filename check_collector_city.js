const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function checkCollectorCity() {
  try {
    console.log('Checking collector city...');
    
    // Login as the collector
    const loginData = {
      email: 'prat@gmail.com',
      password: 'Sid@@2727'
    };
    
    console.log('Logging in as collector...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    console.log('Login successful:', loginResponse.data.success);
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Get profile to see the collector's city
    console.log('Getting collector profile...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, { headers });
    console.log('Collector profile:', profileResponse.data.user);
    
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

checkCollectorCity();
