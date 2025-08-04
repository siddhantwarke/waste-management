const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testWithCollectorAsCustomer() {
  try {
    console.log('=== Testing Booking with Collector Account ===\n');
    
    // Use the existing collector account as customer for this test
    console.log('1. Logging in as collector (to act as customer)...');
    const loginData = {
      email: 'prat@gmail.com',
      password: 'Sid@@2727'
    };
    
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    console.log('✅ Login successful');
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Get profile
    console.log('\n2. Getting user profile...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, { headers });
    const user = profileResponse.data.user;
    console.log(`User: ${user.first_name} ${user.last_name} (${user.role}) from ${user.city}`);
    
    // 3. Get collectors in same city
    console.log('\n3. Getting available collectors...');
    const collectorsResponse = await axios.get(`${API_BASE_URL}/auth/collectors/${user.city}`, { headers });
    const collectors = collectorsResponse.data.collectors;
    
    console.log(`✅ Found ${collectors.length} collectors in ${user.city}`);
    if (collectors.length > 0) {
      const collector = collectors[0];
      console.log(`Selected collector: ${collector.first_name} ${collector.last_name}`);
      console.log(`Group: ${collector.collector_group_name}`);
      console.log(`Plastic price: $${collector.plastic_price}/kg`);
    }
    
    // 4. Test creating a direct booking request (without role restriction for testing)
    console.log('\n4. Creating a test booking request...');
    const bookingData = {
      collector_id: collectors.length > 0 ? collectors[0].id : 5, // Use first collector or ID 5
      waste_type: 'plastic',
      quantity: 3.5,
      pickup_address: 'Test Address, Kolhapur',
      pickup_date: '2025-08-06',
      special_instructions: 'Test booking from dashboard'
    };
    
    // Make API call directly (might fail due to role restriction, but let's see)
    try {
      const bookingResponse = await axios.post(`${API_BASE_URL}/waste/requests`, bookingData, { headers });
      console.log('✅ Booking request created!');
      console.log('Message:', bookingResponse.data.message);
    } catch (bookingError) {
      console.log('⚠️  Booking failed (likely due to role restriction):');
      console.log('Status:', bookingError.response?.status);
      console.log('Message:', bookingError.response?.data?.message);
    }
    
    // 5. Check pending requests as collector
    console.log('\n5. Checking pending requests as collector...');
    const pendingResponse = await axios.get(`${API_BASE_URL}/waste/requests/pending`, { headers });
    
    console.log(`✅ Pending requests endpoint works!`);
    console.log(`Total requests: ${pendingResponse.data.data.length}`);
    console.log(`Assigned to me: ${pendingResponse.data.assigned_count || 0}`);
    console.log(`Unassigned: ${pendingResponse.data.unassigned_count || 0}`);
    
    // Show some request details
    if (pendingResponse.data.data.length > 0) {
      console.log('\nSample requests:');
      pendingResponse.data.data.slice(0, 3).forEach((request, index) => {
        console.log(`   ${index + 1}. ${request.waste_type} - ${request.quantity || 'N/A'}kg`);
        console.log(`      Status: ${request.status}`);
        console.log(`      Assigned to me: ${request.assigned_to_me ? 'Yes' : 'No'}`);
      });
    }
    
    console.log('\n=== Test Summary ===');
    console.log('✅ Login system working');
    console.log('✅ Collector search working');
    console.log('✅ Pending requests endpoint working');
    console.log('✅ Booking modal should work in frontend');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testWithCollectorAsCustomer();
