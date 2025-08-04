const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testBookingWithNewCustomer() {
  try {
    console.log('=== Testing Booking Functionality ===\n');
    
    // 1. Register a new customer
    console.log('1. Registering new customer...');
    const customerData = {
      username: 'bookcustomer',
      email: 'bookcustomer@example.com',
      password: 'Password123',
      role: 'customer',
      first_name: 'Book',
      last_name: 'Customer',
      phone: '9876543210',
      address: 'Booking Test Address, Kolhapur',
      country: 'India',
      state: 'Maharashtra',
      city: 'Kolhapur'
    };
    
    let customerToken;
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, customerData);
      console.log('✅ Customer registered successfully');
      customerToken = registerResponse.data.token;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('Customer already exists, logging in...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: 'bookcustomer@example.com',
          password: 'Password123'
        });
        customerToken = loginResponse.data.token;
        console.log('✅ Customer login successful');
      } else {
        throw error;
      }
    }
    
    const customerHeaders = {
      'Authorization': `Bearer ${customerToken}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Get available collectors
    console.log('\n2. Getting available collectors in Kolhapur...');
    const collectorsResponse = await axios.get(`${API_BASE_URL}/auth/collectors/kolhapur`, { headers: customerHeaders });
    console.log(`✅ Found ${collectorsResponse.data.collectors.length} collectors`);
    
    if (collectorsResponse.data.collectors.length === 0) {
      console.log('❌ No collectors found! Cannot continue test.');
      return;
    }
    
    const collector = collectorsResponse.data.collectors[0];
    console.log(`   Selected collector: ${collector.first_name} ${collector.last_name} (ID: ${collector.id})`);
    console.log(`   Group: ${collector.collector_group_name}`);
    
    // 3. Create booking request
    console.log('\n3. Creating booking request...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const bookingData = {
      collector_id: collector.id,
      waste_type: 'plastic',
      quantity: 5.5,
      pickup_address: 'Test Pickup Address, Kolhapur, Maharashtra',
      pickup_date: tomorrowStr,
      pickup_time: 'morning',
      special_instructions: 'Please call before arriving. This is a test booking.'
    };
    
    const bookingResponse = await axios.post(`${API_BASE_URL}/waste/requests`, bookingData, { headers: customerHeaders });
    console.log('✅ Booking request created successfully');
    console.log(`   Booking ID: ${bookingResponse.data.data.id}`);
    console.log(`   Message: ${bookingResponse.data.message}`);
    
    // 4. Login as collector and check pending requests
    console.log('\n4. Testing collector\'s view of pending requests...');
    const collectorLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'prat@gmail.com',
      password: 'Sid@@2727'
    });
    console.log('✅ Collector login successful');
    
    const collectorHeaders = {
      'Authorization': `Bearer ${collectorLoginResponse.data.token}`,
      'Content-Type': 'application/json'
    };
    
    const pendingResponse = await axios.get(`${API_BASE_URL}/waste/requests/pending`, { headers: collectorHeaders });
    console.log('✅ Pending requests retrieved');
    console.log(`   Total requests: ${pendingResponse.data.data.length}`);
    console.log(`   Assigned to collector: ${pendingResponse.data.assigned_count || 0}`);
    console.log(`   General unassigned: ${pendingResponse.data.unassigned_count || 0}`);
    
    // Find our booking request
    const ourRequest = pendingResponse.data.data.find(req => req.id === bookingResponse.data.data.id);
    if (ourRequest) {
      console.log('\n🎉 SUCCESS! Booking request found in collector\'s pending list!');
      console.log(`   Customer: ${ourRequest.customer_first_name} ${ourRequest.customer_last_name}`);
      console.log(`   Waste Type: 🍶 ${ourRequest.waste_type}`);
      console.log(`   Quantity: ${ourRequest.quantity} kg`);
      console.log(`   Pickup Address: ${ourRequest.pickup_address}`);
      console.log(`   Status: ${ourRequest.status}`);
      console.log(`   Assigned to this collector: ${ourRequest.assigned_to_me ? 'Yes' : 'No'}`);
      console.log(`   Special Instructions: ${ourRequest.special_instructions}`);
    } else {
      console.log('❌ Booking request not found in collector\'s pending list');
      console.log('Available requests:');
      pendingResponse.data.data.forEach((req, index) => {
        console.log(`   ${index + 1}. ID: ${req.id}, Customer: ${req.customer_first_name} ${req.customer_last_name}, Type: ${req.waste_type}`);
      });
    }
    
    console.log('\n=== Test Complete! ===');
    
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

testBookingWithNewCustomer();
