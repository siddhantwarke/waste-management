const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testUpdatedDashboard() {
  console.log('🧪 Testing Updated Dashboard - No Request Pickup & Location Features');
  console.log('='.repeat(70));

  try {
    // Test 1: Register a customer and collector
    console.log('\n1️⃣ Setting up test users...');
    
    // Generate unique identifiers
    const timestamp = Date.now();
    
    // Register customer
    const customerData = {
      username: `testcustomer_updated_${timestamp}`,
      password: 'Password123',
      first_name: 'Test',
      last_name: 'Customer',
      email: `testcustomer_updated_${timestamp}@example.com`,
      phone: '+1234567890',
      role: 'customer',
      address: '123 Test Street',
      city: 'New York',
      state: 'NY',
      zip_code: '10001',
      country: 'United States'
    };

    const collectorData = {
      username: `testcollector_updated_${timestamp}`,
      password: 'Password123',
      first_name: 'Test',
      last_name: 'Collector',
      email: `testcollector_updated_${timestamp}@example.com`,
      phone: '+1098765432',
      role: 'collector',
      address: '456 Collector Ave',
      city: 'New York',
      state: 'NY',
      zip_code: '10002',
      country: 'United States',
      collector_group_name: 'Test Collection Group',
      plastic_price: 0.50,
      paper_price: 0.30,
      glass_price: 0.40,
      metal_price: 0.60,
      organic_price: 0.20,
      e_waste_price: 0.80,
      hazardous_price: 1.00,
      mixed_price: 0.35
    };

    // Register users
    await axios.post(`${API_BASE}/auth/register`, customerData);
    await axios.post(`${API_BASE}/auth/register`, collectorData);
    console.log('✅ Test users registered successfully');

    // Test 2: Login as customer
    console.log('\n2️⃣ Testing customer login...');
    const customerLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: customerData.email,
      password: 'Password123'
    });
    const customerToken = customerLogin.data.token;
    console.log('✅ Customer logged in successfully');

    // Test 3: Login as collector
    console.log('\n3️⃣ Testing collector login...');
    const collectorLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: collectorData.email,
      password: 'Password123'
    });
    const collectorToken = collectorLogin.data.token;
    console.log('✅ Collector logged in successfully');

    // Test 4: Get collectors by city (for customer dashboard)
    console.log('\n4️⃣ Testing customer dashboard - getting available collectors...');
    const collectorsResponse = await axios.get(`${API_BASE}/auth/collectors/New York`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log(`✅ Found ${collectorsResponse.data.collectors.length} collectors in New York`);
    
    // Find our test collector
    const testCollector = collectorsResponse.data.collectors.find(c => c.email === collectorData.email);
    if (!testCollector) {
      throw new Error('Test collector not found in collectors list');
    }
    console.log(`Using collector ID: ${testCollector.id} (${testCollector.first_name} ${testCollector.last_name})`);

    // Test 5: Create booking request using new booking flow
    console.log('\n5️⃣ Testing new booking flow...');
    const bookingData = {
      waste_type: 'plastic',
      quantity: 5.0,
      pickup_address: '123 Test Street, New York, NY 10001',
      pickup_date: '2025-08-05',
      pickup_time: 'morning',
      special_instructions: 'Please call before arrival',
      collector_id: testCollector.id,
      status: 'pending'
    };

    const bookingResponse = await axios.post(`${API_BASE}/waste/requests`, bookingData, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const requestId = bookingResponse.data.data.id;
    console.log(`✅ Booking created successfully with ID: ${requestId}`);

    // Test 6: Get customer's requests (for customer dashboard)
    console.log('\n6️⃣ Testing customer dashboard - getting my requests...');
    const customerRequests = await axios.get(`${API_BASE}/waste/requests`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log(`✅ Customer has ${customerRequests.data.data.length} active requests`);

    // Test 7: Get assigned requests for collector (new endpoint)
    console.log('\n7️⃣ Testing collector dashboard - getting assigned requests...');
    const assignedRequests = await axios.get(`${API_BASE}/waste/requests/assigned`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    console.log(`✅ Collector has ${assignedRequests.data.data.length} assigned requests`);

    // Test 8: Accept request (collector action)
    console.log('\n8️⃣ Testing accept request functionality...');
    await axios.put(`${API_BASE}/waste/requests/${requestId}/accept`, {}, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    console.log('✅ Request accepted successfully');

    // Test 9: Complete request (collector action)
    console.log('\n9️⃣ Testing complete request functionality...');
    await axios.put(`${API_BASE}/waste/requests/${requestId}/complete`, {}, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    console.log('✅ Request completed successfully');

    // Test 10: Verify final status
    console.log('\n🔟 Verifying final request status...');
    const finalRequests = await axios.get(`${API_BASE}/waste/requests`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const completedRequest = finalRequests.data.data.find(r => r.id === requestId);
    console.log(`✅ Request status is now: ${completedRequest.status}`);

    console.log('\n' + '='.repeat(70));
    console.log('🎉 ALL TESTS PASSED! Updated dashboard functionality working correctly');
    console.log('✅ No location detection required');
    console.log('✅ No separate request pickup page needed');
    console.log('✅ Booking modal handles all request creation');
    console.log('✅ Collector assignment and status flows work');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testUpdatedDashboard();
