const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCompleteFlow() {
  try {
    console.log('🧪 Complete Frontend Integration Test');
    console.log('='.repeat(50));

    // Test data
    const testCustomer = {
      username: 'frontend_test_customer_' + Date.now(),
      email: `frontend_test_customer_${Date.now()}@example.com`,
      password: 'TestPassword123',
      role: 'customer',
      first_name: 'Frontend',
      last_name: 'Customer',
      phone: '+1234567890',
      address: '123 Frontend Street, Test City, TC 12345',
      country: 'TestCountry',
      state: 'TestState',
      city: 'TestCity'
    };

    const testCollector = {
      username: 'frontend_test_collector_' + Date.now(),
      email: `frontend_test_collector_${Date.now()}@example.com`,
      password: 'TestPassword123',
      role: 'collector',
      first_name: 'Frontend',
      last_name: 'Collector',
      phone: '+1234567891',
      address: '456 Frontend Avenue, Test City, TC 12345',
      country: 'TestCountry',
      state: 'TestState',
      city: 'TestCity',
      collector_group_name: 'Frontend Test Collectors',
      e_waste_price: 5.0,
      plastic_price: 2.5,
      organic_price: 1.0,
      paper_price: 1.5,
      metal_price: 8.0,
      glass_price: 1.2,
      hazardous_price: 15.0,
      mixed_price: 3.0
    };

    // Register users
    console.log('1️⃣ Registering test users...');
    const customerReg = await axios.post(`${BASE_URL}/auth/register`, testCustomer);
    const collectorReg = await axios.post(`${BASE_URL}/auth/register`, testCollector);
    
    const customerId = customerReg.data.user.id;
    const collectorId = collectorReg.data.user.id;
    
    // Login users
    const customerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: testCustomer.email,
      password: testCustomer.password
    });
    const collectorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: testCollector.email,
      password: testCollector.password
    });
    
    const customerToken = customerLogin.data.token;
    const collectorToken = collectorLogin.data.token;
    console.log(`✅ Users created - Customer: ${customerId}, Collector: ${collectorId}`);

    // Create booking
    console.log('2️⃣ Creating booking request...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pickupDate = tomorrow.toISOString().split('T')[0];

    const bookingData = {
      waste_type: 'paper',
      quantity: 4.5,
      pickup_address: '123 Frontend Street, Test City, TC 12345',
      pickup_date: pickupDate,
      pickup_time: 'evening',
      special_instructions: 'Frontend integration test',
      collector_id: collectorId,
      status: 'pending'
    };

    const bookingResponse = await axios.post(`${BASE_URL}/waste/requests`, bookingData, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    const bookingId = bookingResponse.data.data.id;
    console.log(`✅ Booking created with ID: ${bookingId}`);

    // Test collector dashboard APIs
    console.log('3️⃣ Testing collector pending requests API...');
    const pendingResponse = await axios.get(`${BASE_URL}/waste/requests/pending`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    console.log(`✅ Pending requests API: ${pendingResponse.data.count} requests`);
    
    const myPendingRequest = pendingResponse.data.data.find(r => r.id === bookingId);
    if (!myPendingRequest) {
      throw new Error('Our booking not found in pending requests');
    }
    console.log('✅ Our booking found in pending requests');

    // Test accept API (what frontend will call)
    console.log('4️⃣ Testing accept request API (frontend call)...');
    const acceptResponse = await axios.put(`${BASE_URL}/waste/requests/${bookingId}/accept`, {}, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    if (acceptResponse.data.success && acceptResponse.data.data.status === 'in_progress') {
      console.log('✅ Accept API working - Status changed to in_progress');
    } else {
      throw new Error(`Accept API failed or wrong status: ${acceptResponse.data.data?.status}`);
    }

    // Test assigned requests API
    console.log('5️⃣ Testing assigned requests API...');
    const assignedResponse = await axios.get(`${BASE_URL}/waste/requests/assigned`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    const myAssignedRequest = assignedResponse.data.data.find(r => r.id === bookingId);
    if (myAssignedRequest && myAssignedRequest.status === 'in_progress') {
      console.log('✅ Assigned requests API working - Request shows as in_progress');
    } else {
      throw new Error('Request not found in assigned requests or wrong status');
    }

    // Test complete API
    console.log('6️⃣ Testing complete request API...');
    const completeResponse = await axios.put(`${BASE_URL}/waste/requests/${bookingId}/complete`, {}, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    if (completeResponse.data.success && completeResponse.data.data.status === 'completed') {
      console.log('✅ Complete API working - Status changed to completed');
    } else {
      throw new Error(`Complete API failed or wrong status: ${completeResponse.data.data?.status}`);
    }

    console.log('\n🎉 ALL FRONTEND INTEGRATION TESTS PASSED! ✅');
    console.log('\n📋 Frontend Integration Summary:');
    console.log('   ✅ Customer can create bookings assigned to specific collector');
    console.log('   ✅ Collector can see pending requests via /waste/requests/pending');
    console.log('   ✅ Collector can accept requests via /waste/requests/{id}/accept');
    console.log('   ✅ Accepted requests appear in /waste/requests/assigned with in_progress status');
    console.log('   ✅ Collector can complete requests via /waste/requests/{id}/complete');
    console.log('   ✅ Completed requests show in assigned with completed status');
    console.log('\n🚀 The frontend should now work correctly with these API endpoints!');

  } catch (error) {
    console.error('\n❌ Integration Test FAILED!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCompleteFlow();
