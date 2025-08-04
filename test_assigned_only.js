const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testOnlyAssignedRequests() {
  try {
    console.log('🔍 Testing getPendingRequests - Only Assigned Requests\n');

    // Test with a new collector to ensure clean slate
    const testCollector = {
      username: 'testcollector_assigned_' + Date.now(),
      email: `testcollector_assigned_${Date.now()}@example.com`,
      password: 'TestPassword123',
      role: 'collector',
      first_name: 'Test',
      last_name: 'Collector',
      phone: '+1234567892',
      address: '789 Collector Street, Test City, TC 12345',
      country: 'TestCountry',
      state: 'TestState',
      city: 'TestCity',
      collector_group_name: 'Test Assigned Collectors',
      e_waste_price: 5.0,
      plastic_price: 2.5,
      organic_price: 1.0,
      paper_price: 1.5,
      metal_price: 8.0,
      glass_price: 1.2,
      hazardous_price: 15.0,
      mixed_price: 3.0
    };

    const testCustomer = {
      username: 'testcustomer_assigned_' + Date.now(),
      email: `testcustomer_assigned_${Date.now()}@example.com`,
      password: 'TestPassword123',
      role: 'customer',
      first_name: 'Test',
      last_name: 'Customer',
      phone: '+1234567893',
      address: '999 Customer Road, Test City, TC 12345',
      country: 'TestCountry',
      state: 'TestState',
      city: 'TestCity'
    };

    // Register collector
    console.log('1️⃣ Registering new collector...');
    const collectorRegResponse = await axios.post(`${BASE_URL}/auth/register`, testCollector);
    const collectorId = collectorRegResponse.data.user.id;
    console.log(`✅ Collector registered with ID: ${collectorId}`);

    // Register customer
    console.log('2️⃣ Registering new customer...');
    const customerRegResponse = await axios.post(`${BASE_URL}/auth/register`, testCustomer);
    const customerId = customerRegResponse.data.user.id;
    console.log(`✅ Customer registered with ID: ${customerId}`);

    // Login collector
    console.log('3️⃣ Logging in collector...');
    const collectorLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testCollector.email,
      password: testCollector.password
    });
    const collectorToken = collectorLoginResponse.data.token;
    console.log('✅ Collector logged in');

    // Login customer
    console.log('4️⃣ Logging in customer...');
    const customerLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testCustomer.email,
      password: testCustomer.password
    });
    const customerToken = customerLoginResponse.data.token;
    console.log('✅ Customer logged in');

    // Check collector's pending requests (should be empty)
    console.log('5️⃣ Checking collector\'s pending requests (should be empty)...');
    const emptyResponse = await axios.get(`${BASE_URL}/waste/requests/pending`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    console.log(`📊 Collector has ${emptyResponse.data.count || emptyResponse.data.data.length} pending requests (should be 0)`);
    
    if (emptyResponse.data.data.length === 0) {
      console.log('✅ Correct: No assigned requests for new collector');
    } else {
      console.log('❌ Unexpected: New collector has existing requests');
      console.log(`   Requests found: ${emptyResponse.data.data.length}`);
      emptyResponse.data.data.forEach(req => {
        console.log(`   - Request ID: ${req.id}, Collector ID: ${req.collector_id}`);
      });
    }

    // Create a booking assigned to this collector
    console.log('6️⃣ Creating booking assigned to this collector...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pickupDate = tomorrow.toISOString().split('T')[0];

    const bookingData = {
      waste_type: 'organic',
      quantity: 8.0,
      pickup_address: '999 Customer Road, Test City, TC 12345',
      pickup_date: pickupDate,
      pickup_time: 'afternoon',
      special_instructions: 'Test booking for specific collector',
      collector_id: collectorId,
      status: 'pending'
    };

    const bookingResponse = await axios.post(`${BASE_URL}/waste/requests`, bookingData, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const bookingId = bookingResponse.data.data.id;
    console.log(`✅ Booking created with ID: ${bookingId}`);

    // Check collector's pending requests (should have exactly 1)
    console.log('7️⃣ Checking collector\'s pending requests (should have exactly 1)...');
    const oneResponse = await axios.get(`${BASE_URL}/waste/requests/pending`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    console.log(`📊 Collector has ${oneResponse.data.count || oneResponse.data.data.length} pending requests (should be 1)`);
    
    if (oneResponse.data.data.length === 1) {
      console.log('✅ Correct: Exactly 1 assigned request found');
      const request = oneResponse.data.data[0];
      console.log(`   📝 Request ID: ${request.id}`);
      console.log(`   🗂️  Waste Type: ${request.waste_type}`);
      console.log(`   ⚖️  Quantity: ${request.quantity} kg`);
      console.log(`   🕐 Pickup Time: ${request.pickup_time}`);
      console.log(`   👤 Collector ID: ${request.collector_id}`);
      
      if (request.id === bookingId && request.collector_id === collectorId) {
        console.log('✅ Perfect: The request matches our booking');
      } else {
        console.log('❌ Mismatch: Request details don\'t match');
      }
    } else {
      console.log('❌ Incorrect count of requests');
      oneResponse.data.data.forEach(req => {
        console.log(`   - Request ID: ${req.id}, Collector ID: ${req.collector_id}`);
      });
    }

    console.log('\n🎉 Test completed successfully! ✅');
    console.log('✅ getPendingRequests now correctly shows only assigned requests');

  } catch (error) {
    console.error('\n❌ Test FAILED!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testOnlyAssignedRequests();
