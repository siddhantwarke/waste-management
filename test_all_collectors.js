const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAllCollectorsEndpoint() {
  console.log('=== Testing All Collectors Endpoint ===\n');
  
  try {
    // Login as customer first to get auth token
    console.log('1. Logging in as customer...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'customer@test.com',
      password: 'Password123!'
    });
    
    const token = loginResponse.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Test new all collectors endpoint
    console.log('\n2. Testing /auth/collectors endpoint...');
    const allCollectorsResponse = await axios.get(`${API_BASE}/auth/collectors`, { headers });
    
    console.log('✅ All collectors endpoint working!');
    console.log(`Total collectors: ${allCollectorsResponse.data.collectors.length}`);
    
    if (allCollectorsResponse.data.collectors.length > 0) {
      console.log('\nSample collectors:');
      allCollectorsResponse.data.collectors.slice(0, 3).forEach((collector, index) => {
        console.log(`${index + 1}. ${collector.first_name} ${collector.last_name} - ${collector.city}`);
        if (collector.collector_group_name) {
          console.log(`   Group: ${collector.collector_group_name}`);
        }
      });
    }
    
    // Test city-specific endpoint for comparison
    console.log('\n3. Testing city-specific endpoint...');
    const cityCollectorsResponse = await axios.get(`${API_BASE}/auth/collectors/Kolhapur`, { headers });
    
    console.log(`Collectors in Kolhapur: ${cityCollectorsResponse.data.collectors.length}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

testAllCollectorsEndpoint().then(success => {
  console.log(success ? '\n✅ All tests passed!' : '\n❌ Tests failed!');
});
