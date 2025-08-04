const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testCollectorProfileUpdate() {
  try {
    console.log('Testing collector profile update...');
    
    // First, login as the collector
    const loginData = {
      email: 'prat@gmail.com', // Use email instead of username
      password: 'Sid@@2727' // Assuming this is the password
    };
    
    console.log('Logging in as collector...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    console.log('Login successful:', loginResponse.data.success);
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Now try to update the profile with new waste type prices
    const profileUpdateData = {
      first_name: 'Pratiksha',
      last_name: 'Warke',
      phone: '1234567890',
      address: 'Updated Address, Kolhapur',
      country: 'India',
      state: 'Maharashtra',
      city: 'Kolhapur',
      collector_group_name: 'Green Waste Solutions',
      e_waste_price: 15.50,
      plastic_price: 12.00,
      organic_price: 8.00,
      paper_price: 5.50,
      metal_price: 20.00,
      glass_price: 7.50,
      hazardous_price: 25.00,
      mixed_price: 10.00
    };
    
    console.log('Updating collector profile...');
    console.log('Profile data:', JSON.stringify(profileUpdateData, null, 2));
    
    const updateResponse = await axios.put(`${API_BASE_URL}/auth/profile`, profileUpdateData, { headers });
    console.log('Profile update successful:', updateResponse.data);
    
  } catch (error) {
    console.error('Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCollectorProfileUpdate();
