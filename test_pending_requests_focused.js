const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test collector credentials
const testCollector = {
  username: 'testcollector_' + Date.now(),
  email: `testcollector_${Date.now()}@example.com`,
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

async function testPendingRequests() {
  try {
    console.log('🧪 Testing getPendingRequests - Should only show assigned requests');
    console.log('=' * 60);

    // Step 1: Register a new collector
    console.log('1️⃣ Registering new collector...');
    const regResponse = await axios.post(`${BASE_URL}/auth/register`, testCollector);
    
    if (!regResponse.data.success) {
      throw new Error('Collector registration failed');
    }
    
    const collectorId = regResponse.data.user.id;
    console.log(`✅ Collector registered with ID: ${collectorId}`);

    // Step 2: Login collector
    console.log('2️⃣ Logging in collector...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testCollector.email,
      password: testCollector.password
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Collector login failed');
    }
    
    const collectorToken = loginResponse.data.token;
    console.log('✅ Collector logged in successfully');

    // Step 3: Get pending requests for this collector
    console.log('3️⃣ Getting pending requests for this collector...');
    const pendingResponse = await axios.get(`${BASE_URL}/waste/requests/pending`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    
    if (!pendingResponse.data.success) {
      throw new Error(`Failed to get pending requests: ${pendingResponse.data.message}`);
    }

    console.log('✅ Successfully retrieved pending requests');
    console.log(`📊 Total requests returned: ${pendingResponse.data.data.length}`);
    console.log(`📋 Count: ${pendingResponse.data.count}`);

    // Step 4: Analyze the results
    console.log('\n📋 Request Analysis:');
    console.log('-'.repeat(50));
    
    if (pendingResponse.data.data.length === 0) {
      console.log('✅ CORRECT: No requests assigned to this new collector (expected)');
    } else {
      console.log('🔍 Examining returned requests:');
      pendingResponse.data.data.forEach((request, index) => {
        console.log(`   ${index + 1}. ID: ${request.id}, Status: ${request.status}, Collector ID: ${request.collector_id}`);
        
        if (request.collector_id === collectorId) {
          console.log(`      ✅ CORRECT: Request ${request.id} is assigned to this collector`);
        } else if (request.collector_id === null) {
          console.log(`      ❌ ERROR: Request ${request.id} is unassigned but still returned`);
        } else {
          console.log(`      ❌ ERROR: Request ${request.id} is assigned to different collector (${request.collector_id})`);
        }
      });
    }

    // Step 5: Test with existing collector (if any)
    console.log('\n4️⃣ Testing with existing collector (ID: 19)...');
    
    // Try to login as an existing collector from previous tests
    try {
      const existingLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'testcollector_1754300099969@example.com', // From previous test
        password: 'TestPassword123'
      });
      
      if (existingLoginResponse.data.success) {
        const existingToken = existingLoginResponse.data.token;
        console.log('✅ Logged in as existing collector');
        
        const existingPendingResponse = await axios.get(`${BASE_URL}/waste/requests/pending`, {
          headers: { Authorization: `Bearer ${existingToken}` }
        });
        
        if (existingPendingResponse.data.success) {
          console.log(`📊 Existing collector has ${existingPendingResponse.data.data.length} pending requests`);
          
          // Check if these are all assigned to collector ID 19
          const wrongAssignments = existingPendingResponse.data.data.filter(req => req.collector_id !== 19);
          if (wrongAssignments.length === 0) {
            console.log('✅ CORRECT: All requests are assigned to the correct collector');
          } else {
            console.log(`❌ ERROR: ${wrongAssignments.length} requests are not assigned to this collector`);
          }
        }
      }
    } catch (error) {
      console.log('ℹ️  Could not test with existing collector (expected if they don\'t exist)');
    }

    console.log('\n🎯 Test Summary:');
    console.log('='.repeat(50));
    
    if (pendingResponse.data.data.length === 0) {
      console.log('✅ getPendingRequests function is working CORRECTLY');
      console.log('   Only returns requests assigned to the specific collector');
      console.log('   New collectors with no assigned requests get empty array');
    } else {
      const correctAssignments = pendingResponse.data.data.filter(req => req.collector_id === collectorId);
      const incorrectAssignments = pendingResponse.data.data.filter(req => req.collector_id !== collectorId);
      
      if (incorrectAssignments.length === 0) {
        console.log('✅ getPendingRequests function is working CORRECTLY');
        console.log(`   All ${correctAssignments.length} returned requests are assigned to this collector`);
      } else {
        console.log('❌ getPendingRequests function has ISSUES');
        console.log(`   ${incorrectAssignments.length} out of ${pendingResponse.data.data.length} requests are incorrectly returned`);
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

// Run the test
testPendingRequests();
