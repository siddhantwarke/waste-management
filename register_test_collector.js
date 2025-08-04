const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function registerTestCollector() {
  try {
    console.log('Registering test collector...');
    
    const registrationData = {
      username: 'testcollector',
      email: 'testcollector@example.com',
      password: 'Password123',
      role: 'collector',
      first_name: 'Test',
      last_name: 'Collector',
      phone: '+1234567890',
      address: '123 Collector Street, Test City',
      country: 'USA',
      state: 'TestState',
      city: 'TestCity',
      collector_group_name: 'Test Waste Solutions',
      e_waste_price: 15.50,
      plastic_price: 12.00,
      organic_price: 8.00,
      paper_price: 5.50,
      metal_price: 20.00,
      glass_price: 7.50,
      hazardous_price: 25.00,
      mixed_price: 10.00
    };
    
    console.log('Registration data:', JSON.stringify(registrationData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, registrationData);
    console.log('Registration successful:', response.data);
    
  } catch (error) {
    console.error('Registration error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

registerTestCollector();
