const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testCustomer = {
  username: 'customer_' + Date.now(),
  email: `customer_${Date.now()}@example.com`,
  password: 'TestPassword123',
  role: 'customer',
  first_name: 'Test',
  last_name: 'Customer',
  phone: '+1234567890',
  address: '123 Customer Street, Test City, TC 12345',
  country: 'TestCountry',
  state: 'TestState',
  city: 'TestCity'
};

const testCollector = {
  username: 'collector_' + Date.now(),
  email: `collector_${Date.now()}@example.com`,
  password: 'TestPassword123',
  role: 'collector',
  first_name: 'Test',
  last_name: 'Collector',
  phone: '+1234567891',
  address: '456 Collector Avenue, Test City, TC 12345',
  country: 'TestCountry',
  state: 'TestState',
  city: 'TestCity',
  collector_group_name: 'Test Waste Collectors',
  e_waste_price: 5.0,
  plastic_price: 2.5,
  organic_price: 1.0,
  paper_price: 1.5,
  metal_price: 8.0,
  glass_price: 1.2,
  hazardous_price: 15.0,
  mixed_price: 3.0
};

async function testCompleteFlow() {
  try {
    console.log('🧪 Complete Test: Create Booking → Check Collector Sees Only Their Requests');
    console.log('='.repeat(70));

    // Register customer and collector
    console.log('1️⃣ Registering customer and collector...');
    const customerReg = await axios.post(`${BASE_URL}/auth/register`, testCustomer);
    const collectorReg = await axios.post(`${BASE_URL}/auth/register`, testCollector);
    
    const customerId = customerReg.data.user.id;
    const collectorId = collectorReg.data.user.id;
    console.log(`✅ Customer ID: ${customerId}, Collector ID: ${collectorId}`);

    // Login both users
    console.log('2️⃣ Logging in users...');
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
    console.log('✅ Both users logged in successfully');

    // Create a booking request assigned to this collector
    console.log('3️⃣ Creating booking request...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pickupDate = tomorrow.toISOString().split('T')[0];

    const bookingData = {
      waste_type: 'plastic',
      quantity: 3.0,
      pickup_address: '123 Customer Street, Test City, TC 12345',
      pickup_date: pickupDate,
      pickup_time: 'afternoon',
      special_instructions: 'Ring the doorbell twice',
      collector_id: collectorId,
      status: 'pending'
    };

    const bookingResponse = await axios.post(`${BASE_URL}/waste/requests`, bookingData, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    const bookingId = bookingResponse.data.data.id;
    console.log(`✅ Booking created with ID: ${bookingId}`);
    console.log(`   📋 Assigned to collector ID: ${collectorId}`);

    // Now check what the collector sees
    console.log('4️⃣ Checking collector\'s pending requests...');
    const pendingResponse = await axios.get(`${BASE_URL}/waste/requests/pending`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    console.log(`✅ Collector retrieved ${pendingResponse.data.data.length} pending requests`);
    console.log(`📊 Response count: ${pendingResponse.data.count}`);

    // Analyze the results
    console.log('\n🔍 Detailed Analysis:');
    console.log('-'.repeat(50));
    
    if (pendingResponse.data.data.length === 0) {
      console.log('❌ ERROR: Collector should see the assigned request but got 0 requests');
    } else {
      console.log(`📋 Requests returned: ${pendingResponse.data.data.length}`);
      
      let foundOurBooking = false;
      let correctAssignments = 0;
      let incorrectAssignments = 0;
      
      pendingResponse.data.data.forEach((request, index) => {
        console.log(`\n   ${index + 1}. Request Details:`);
        console.log(`      ID: ${request.id}`);
        console.log(`      Status: ${request.status}`);
        console.log(`      Waste Type: ${request.waste_type}`);
        console.log(`      Quantity: ${request.quantity}kg`);
        console.log(`      Collector ID: ${request.collector_id}`);
        console.log(`      Pickup Time: ${request.pickup_time || 'Not set'}`);
        
        if (request.id === bookingId) {
          foundOurBooking = true;
          console.log(`      🎯 This is our test booking!`);
        }
        
        if (request.collector_id === collectorId) {
          correctAssignments++;
          console.log(`      ✅ CORRECT: Assigned to this collector`);
        } else {
          incorrectAssignments++;
          console.log(`      ❌ ERROR: Wrong assignment (should be ${collectorId}, got ${request.collector_id})`);
        }
      });
      
      console.log('\n📊 Summary:');
      if (foundOurBooking) {
        console.log('✅ Found our test booking in the results');
      } else {
        console.log('❌ ERROR: Our test booking is missing from results');
      }
      
      console.log(`✅ Correctly assigned requests: ${correctAssignments}`);
      console.log(`❌ Incorrectly assigned requests: ${incorrectAssignments}`);
      
      if (incorrectAssignments === 0 && foundOurBooking) {
        console.log('\n🎉 SUCCESS: getPendingRequests function is working perfectly!');
        console.log('   ✅ Only shows requests assigned to the logged-in collector');
        console.log('   ✅ Includes our test booking');
        console.log('   ✅ No incorrect assignments found');
      } else {
        console.log('\n❌ ISSUES FOUND:');
        if (!foundOurBooking) {
          console.log('   - Our test booking is missing');
        }
        if (incorrectAssignments > 0) {
          console.log(`   - ${incorrectAssignments} requests are incorrectly assigned`);
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Test FAILED!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCompleteFlow();
