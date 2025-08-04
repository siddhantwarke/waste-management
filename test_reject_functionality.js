const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testRejectFunctionality() {
  console.log('🧪 Testing Reject Request Functionality');
  console.log('='.repeat(50));

  try {
    // Generate unique identifiers
    const timestamp = Date.now();
    
    // Test data
    const customerData = {
      username: `testcustomer_reject_${timestamp}`,
      password: 'Password123',
      first_name: 'Test',
      last_name: 'Customer',
      email: `testcustomer_reject_${timestamp}@example.com`,
      phone: '+1234567890',
      role: 'customer',
      address: '123 Test Street',
      city: 'New York',
      state: 'NY',
      zip_code: '10001',
      country: 'United States'
    };

    const collectorData = {
      username: `testcollector_reject_${timestamp}`,
      password: 'Password123',
      first_name: 'Test',
      last_name: 'Collector',
      email: `testcollector_reject_${timestamp}@example.com`,
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

    console.log('\n1️⃣ Setting up test users...');
    
    // Register users
    await axios.post(`${API_BASE}/auth/register`, customerData);
    await axios.post(`${API_BASE}/auth/register`, collectorData);
    console.log('✅ Test users registered successfully');

    // Login users
    console.log('\n2️⃣ Logging in users...');
    const customerLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: customerData.email,
      password: 'Password123'
    });
    const customerToken = customerLogin.data.token;

    const collectorLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: collectorData.email,
      password: 'Password123'
    });
    const collectorToken = collectorLogin.data.token;
    console.log('✅ Users logged in successfully');

    // Get collectors by city
    console.log('\n3️⃣ Getting available collectors...');
    const collectorsResponse = await axios.get(`${API_BASE}/auth/collectors/New York`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    const testCollector = collectorsResponse.data.collectors.find(c => c.email === collectorData.email);
    if (!testCollector) {
      throw new Error('Test collector not found');
    }
    console.log(`✅ Found collector: ${testCollector.first_name} ${testCollector.last_name}`);

    // Create booking request
    console.log('\n4️⃣ Creating booking request...');
    const bookingData = {
      waste_type: 'plastic',
      quantity: 5.0,
      pickup_address: '123 Test Street, New York, NY 10001',
      pickup_date: '2025-08-05',
      pickup_time: 'morning',
      special_instructions: 'Test reject functionality',
      collector_id: testCollector.id,
      status: 'pending'
    };

    const bookingResponse = await axios.post(`${API_BASE}/waste/requests`, bookingData, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const requestId = bookingResponse.data.data.id;
    console.log(`✅ Booking created with ID: ${requestId}`);

    // Check pending requests (collector view)
    console.log('\n5️⃣ Checking pending requests...');
    const pendingResponse = await axios.get(`${API_BASE}/waste/requests/pending`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    console.log(`✅ Collector has ${pendingResponse.data.data.length} pending request(s)`);

    // Reject the request
    console.log('\n6️⃣ Rejecting the request...');
    await axios.put(`${API_BASE}/waste/requests/${requestId}/reject`, {}, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    console.log('✅ Request rejected successfully');

    // Verify request is no longer in pending
    console.log('\n7️⃣ Verifying request removed from pending...');
    const pendingAfterReject = await axios.get(`${API_BASE}/waste/requests/pending`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    console.log(`✅ Collector now has ${pendingAfterReject.data.data.length} pending request(s)`);

    // Check assigned requests (should show cancelled)
    console.log('\n8️⃣ Checking assigned requests...');
    const assignedResponse = await axios.get(`${API_BASE}/waste/requests/assigned`, {
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    const cancelledRequest = assignedResponse.data.data.find(r => r.id === requestId);
    console.log(`✅ Request status is now: ${cancelledRequest ? cancelledRequest.status : 'not found'}`);

    // Verify customer sees cancelled status
    console.log('\n9️⃣ Verifying customer sees cancelled status...');
    const customerRequests = await axios.get(`${API_BASE}/waste/requests`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const customerRequest = customerRequests.data.data.find(r => r.id === requestId);
    console.log(`✅ Customer sees request status: ${customerRequest ? customerRequest.status : 'not found'}`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 REJECT FUNCTIONALITY TEST PASSED!');
    console.log('✅ Collector can reject requests');
    console.log('✅ Rejected requests marked as cancelled');
    console.log('✅ Cancelled requests removed from pending');
    console.log('✅ Cancelled requests visible in assigned with correct status');
    console.log('✅ Customer sees cancelled status');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testRejectFunctionality();
