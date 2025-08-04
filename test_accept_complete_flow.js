const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testCustomer = {
  username: 'customer_accept_' + Date.now(),
  email: `customer_accept_${Date.now()}@example.com`,
  password: 'TestPassword123',
  role: 'customer',
  first_name: 'Accept',
  last_name: 'Customer',
  phone: '+1234567890',
  address: '123 Customer Street, Test City, TC 12345',
  country: 'TestCountry',
  state: 'TestState',
  city: 'TestCity'
};

const testCollector = {
  username: 'collector_accept_' + Date.now(),
  email: `collector_accept_${Date.now()}@example.com`,
  password: 'TestPassword123',
  role: 'collector',
  first_name: 'Accept',
  last_name: 'Collector',
  phone: '+1234567891',
  address: '456 Collector Avenue, Test City, TC 12345',
  country: 'TestCountry',
  state: 'TestState',
  city: 'TestCity',
  collector_group_name: 'Accept Test Collectors',
  e_waste_price: 5.0,
  plastic_price: 2.5,
  organic_price: 1.0,
  paper_price: 1.5,
  metal_price: 8.0,
  glass_price: 1.2,
  hazardous_price: 15.0,
  mixed_price: 3.0
};

async function testAcceptCompleteFlow() {
  try {
    console.log('🧪 Testing Accept & Complete Request Flow');
    console.log('='.repeat(60));

    // Register and login users
    console.log('1️⃣ Setting up test users...');
    const customerReg = await axios.post(`${BASE_URL}/auth/register`, testCustomer);
    const collectorReg = await axios.post(`${BASE_URL}/auth/register`, testCollector);
    
    const customerId = customerReg.data.user.id;
    const collectorId = collectorReg.data.user.id;
    
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
    console.log(`✅ Customer ID: ${customerId}, Collector ID: ${collectorId}`);

    // Create booking request
    console.log('2️⃣ Creating booking request...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pickupDate = tomorrow.toISOString().split('T')[0];

    const bookingData = {
      waste_type: 'organic',
      quantity: 7.5,
      pickup_address: '123 Customer Street, Test City, TC 12345',
      pickup_date: pickupDate,
      pickup_time: 'morning',
      special_instructions: 'Please be careful with the organic waste',
      collector_id: collectorId,
      status: 'pending'
    };

    const bookingResponse = await axios.post(`${BASE_URL}/waste/requests`, bookingData, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    const bookingId = bookingResponse.data.data.id;
    console.log(`✅ Booking created with ID: ${bookingId} (status: pending)`);

    // Step 3: Check collector's pending requests
    console.log('3️⃣ Checking collector\'s pending requests...');
    const pendingResponse = await axios.get(`${BASE_URL}/waste/requests/pending`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    const pendingRequest = pendingResponse.data.data.find(r => r.id === bookingId);
    if (pendingRequest && pendingRequest.status === 'pending') {
      console.log('✅ Request found in pending requests with status: pending');
    } else {
      throw new Error('Request not found in pending requests or wrong status');
    }

    // Step 4: Accept the request
    console.log('4️⃣ Accepting the request...');
    const acceptResponse = await axios.put(`${BASE_URL}/waste/requests/${bookingId}/accept`, {}, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    if (acceptResponse.data.success) {
      console.log('✅ Request accepted successfully');
      console.log(`   📊 New status: ${acceptResponse.data.data.status}`);
      
      if (acceptResponse.data.data.status === 'in_progress') {
        console.log('✅ Status correctly changed to in_progress');
      } else {
        throw new Error(`Expected status 'in_progress', got '${acceptResponse.data.data.status}'`);
      }
    } else {
      throw new Error(`Failed to accept request: ${acceptResponse.data.message}`);
    }

    // Step 5: Check assigned requests (should show in-progress request)
    console.log('5️⃣ Checking assigned requests...');
    const assignedResponse = await axios.get(`${BASE_URL}/waste/requests/assigned`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    if (assignedResponse.data.success) {
      console.log(`✅ Retrieved ${assignedResponse.data.count} assigned requests`);
      
      const inProgressRequest = assignedResponse.data.data.find(r => r.id === bookingId);
      if (inProgressRequest) {
        console.log(`   📋 Found our request with status: ${inProgressRequest.status}`);
        if (inProgressRequest.status === 'in_progress') {
          console.log('✅ Request correctly shows as in_progress in assigned requests');
        } else {
          throw new Error(`Expected 'in_progress', got '${inProgressRequest.status}'`);
        }
      } else {
        throw new Error('Request not found in assigned requests');
      }
    } else {
      throw new Error(`Failed to get assigned requests: ${assignedResponse.data.message}`);
    }

    // Step 6: Complete the request
    console.log('6️⃣ Completing the request...');
    const completeResponse = await axios.put(`${BASE_URL}/waste/requests/${bookingId}/complete`, {}, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    if (completeResponse.data.success) {
      console.log('✅ Request completed successfully');
      console.log(`   📊 Final status: ${completeResponse.data.data.status}`);
      
      if (completeResponse.data.data.status === 'completed') {
        console.log('✅ Status correctly changed to completed');
      } else {
        throw new Error(`Expected status 'completed', got '${completeResponse.data.data.status}'`);
      }
    } else {
      throw new Error(`Failed to complete request: ${completeResponse.data.message}`);
    }

    // Step 7: Final check of assigned requests
    console.log('7️⃣ Final check of assigned requests...');
    const finalAssignedResponse = await axios.get(`${BASE_URL}/waste/requests/assigned`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    const completedRequest = finalAssignedResponse.data.data.find(r => r.id === bookingId);
    if (completedRequest && completedRequest.status === 'completed') {
      console.log('✅ Request correctly shows as completed in assigned requests');
    } else {
      throw new Error('Request not found or incorrect status in final check');
    }

    // Step 8: Check that request no longer appears in pending
    console.log('8️⃣ Verifying request no longer in pending...');
    const finalPendingResponse = await axios.get(`${BASE_URL}/waste/requests/pending`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    const stillPending = finalPendingResponse.data.data.find(r => r.id === bookingId);
    if (!stillPending) {
      console.log('✅ Request correctly removed from pending requests');
    } else {
      throw new Error('Request still appears in pending requests after completion');
    }

    console.log('\n🎉 COMPLETE SUCCESS! All tests passed ✅');
    console.log('📋 Test Summary:');
    console.log('   ✅ Request created with pending status');
    console.log('   ✅ Request appears in collector\'s pending requests');
    console.log('   ✅ Request can be accepted (pending → in_progress)');
    console.log('   ✅ Request appears in assigned requests with in_progress status');
    console.log('   ✅ Request can be completed (in_progress → completed)');
    console.log('   ✅ Request shows as completed in assigned requests');
    console.log('   ✅ Request removed from pending requests after acceptance');
    console.log('\n🎯 Accept & Complete functionality is working perfectly!');

  } catch (error) {
    console.error('\n❌ Test FAILED!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAcceptCompleteFlow();
