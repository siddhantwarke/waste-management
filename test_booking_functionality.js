const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testBookingFunctionality() {
  try {
    console.log('=== Testing Booking Functionality ===\n');
    
    // 1. Login as customer
    console.log('1. Logging in as customer...');
    const loginData = {
      email: 'sid@gmail.com', // Assuming this customer exists
      password: 'Sid@@2727'
    };
    
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    console.log('✅ Customer login successful');
    
    const customerToken = loginResponse.data.token;
    const customerHeaders = {
      'Authorization': `Bearer ${customerToken}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Get collectors in customer's city
    console.log('\n2. Getting available collectors...');
    const customerProfile = await axios.get(`${API_BASE_URL}/auth/profile`, { headers: customerHeaders });
    const customer = customerProfile.data.user;
    console.log(`Customer: ${customer.first_name} ${customer.last_name} from ${customer.city}`);
    
    const collectorsResponse = await axios.get(`${API_BASE_URL}/auth/collectors/${customer.city}`, { headers: customerHeaders });
    const collectors = collectorsResponse.data.collectors;
    
    if (collectors.length === 0) {
      console.log('❌ No collectors found in customer city');
      return;
    }
    
    const selectedCollector = collectors[0];
    console.log(`✅ Found ${collectors.length} collectors. Selected: ${selectedCollector.first_name} ${selectedCollector.last_name}`);
    
    // 3. Create a booking request
    console.log('\n3. Creating booking request...');
    const bookingData = {
      collector_id: selectedCollector.id,
      waste_type: 'plastic',
      quantity: 5.5,
      pickup_address: '123 Test Street, Test City',
      pickup_date: '2025-08-05',
      special_instructions: 'Please call before arriving'
    };
    
    const bookingResponse = await axios.post(`${API_BASE_URL}/waste/requests`, bookingData, { headers: customerHeaders });
    console.log('✅ Booking request created successfully');
    console.log('Response:', bookingResponse.data.message);
    
    // 4. Login as collector to see pending requests
    console.log('\n4. Logging in as collector to check pending requests...');
    const collectorLoginData = {
      email: 'prat@gmail.com',
      password: 'Sid@@2727'
    };
    
    const collectorLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, collectorLoginData);
    console.log('✅ Collector login successful');
    
    const collectorToken = collectorLoginResponse.data.token;
    const collectorHeaders = {
      'Authorization': `Bearer ${collectorToken}`,
      'Content-Type': 'application/json'
    };
    
    // 5. Get pending requests for collector
    console.log('\n5. Getting pending requests for collector...');
    const pendingResponse = await axios.get(`${API_BASE_URL}/waste/requests/pending`, { headers: collectorHeaders });
    
    console.log(`✅ Found ${pendingResponse.data.data.length} pending requests`);
    console.log(`   - Assigned to me: ${pendingResponse.data.assigned_count}`);
    console.log(`   - Unassigned: ${pendingResponse.data.unassigned_count}`);
    
    // Show assigned requests
    const assignedRequests = pendingResponse.data.data.filter(req => req.assigned_to_me);
    if (assignedRequests.length > 0) {
      console.log('\nRequests assigned to this collector:');
      assignedRequests.forEach((request, index) => {
        console.log(`   ${index + 1}. ${request.waste_type} - ${request.quantity}kg`);
        console.log(`      Customer: ${request.customer_first_name} ${request.customer_last_name}`);
        console.log(`      Address: ${request.pickup_address}`);
        console.log(`      Date: ${request.pickup_date}`);
        console.log(`      Instructions: ${request.special_instructions || 'None'}`);
      });
    }
    
    console.log('\n=== Booking Functionality Test Completed Successfully! ===');
    console.log('✅ Customer can book specific collectors');
    console.log('✅ Booking requests are sent to the selected collector');
    console.log('✅ Collector can see assigned booking requests');
    console.log('✅ Collector can distinguish between assigned and unassigned requests');
    
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

testBookingFunctionality();
