const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testFrontendFlow() {
  try {
    console.log('🧪 Testing Frontend-Backend Integration for Accept/Complete Flow');
    console.log('='.repeat(70));

    // Use existing collector from previous tests (collector ID 34)
    console.log('1️⃣ Logging in as existing collector...');
    
    // Try to login as an existing collector
    const collectorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'collector_accept_1754301173406@example.com', // From previous test
      password: 'TestPassword123'
    });
    
    const collectorToken = collectorLogin.data.token;
    console.log('✅ Collector logged in successfully');

    // Get pending requests
    console.log('2️⃣ Getting pending requests...');
    const pendingResponse = await axios.get(`${BASE_URL}/waste/requests/pending`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    console.log(`✅ Found ${pendingResponse.data.count} pending requests`);
    
    if (pendingResponse.data.data.length === 0) {
      console.log('ℹ️  No pending requests to test with');
      return;
    }

    const testRequest = pendingResponse.data.data[0];
    console.log(`📋 Testing with request ID: ${testRequest.id}`);

    // Test the accept endpoint (frontend style)
    console.log('3️⃣ Testing accept request (frontend API call)...');
    const acceptResponse = await axios.put(`${BASE_URL}/waste/requests/${testRequest.id}/accept`, {}, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    if (acceptResponse.data.success) {
      console.log('✅ Accept API call successful');
      console.log(`   📊 Status changed to: ${acceptResponse.data.data.status}`);
    } else {
      throw new Error(`Accept failed: ${acceptResponse.data.message}`);
    }

    // Get assigned requests
    console.log('4️⃣ Getting assigned requests...');
    const assignedResponse = await axios.get(`${BASE_URL}/waste/requests/assigned`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    console.log(`✅ Found ${assignedResponse.data.count} assigned requests`);
    
    const acceptedRequest = assignedResponse.data.data.find(r => r.id === testRequest.id);
    if (acceptedRequest && acceptedRequest.status === 'in_progress') {
      console.log('✅ Request correctly appears in assigned requests with in_progress status');
    } else {
      throw new Error('Request not found in assigned requests or wrong status');
    }

    // Test the complete endpoint
    console.log('5️⃣ Testing complete request...');
    const completeResponse = await axios.put(`${BASE_URL}/waste/requests/${testRequest.id}/complete`, {}, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    if (completeResponse.data.success) {
      console.log('✅ Complete API call successful');
      console.log(`   📊 Status changed to: ${completeResponse.data.data.status}`);
    } else {
      throw new Error(`Complete failed: ${completeResponse.data.message}`);
    }

    console.log('\n🎉 Frontend-Backend Integration Test PASSED! ✅');
    console.log('📋 Summary:');
    console.log('   ✅ /waste/requests/pending endpoint working');
    console.log('   ✅ /waste/requests/{id}/accept endpoint working');
    console.log('   ✅ /waste/requests/assigned endpoint working');
    console.log('   ✅ /waste/requests/{id}/complete endpoint working');
    console.log('   ✅ Status flow: pending → in_progress → completed');

  } catch (error) {
    console.error('\n❌ Test FAILED!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFrontendFlow();
