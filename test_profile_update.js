const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testProfileUpdate() {
  console.log('🧪 Testing Profile Update Functionality');
  console.log('='.repeat(50));

  try {
    // Generate unique identifiers
    const timestamp = Date.now();
    
    // Test data - customer
    const customerData = {
      username: `testcustomer_profile_${timestamp}`,
      password: 'Password123',
      first_name: 'Test',
      last_name: 'Customer',
      email: `testcustomer_profile_${timestamp}@example.com`,
      phone: '+1234567890',
      role: 'customer',
      address: '123 Test Street',
      city: 'New York',
      state: 'NY',
      zip_code: '10001',
      country: 'United States'
    };

    console.log('\n1️⃣ Registering customer...');
    await axios.post(`${API_BASE}/auth/register`, customerData);
    console.log('✅ Customer registered successfully');

    console.log('\n2️⃣ Logging in customer...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: customerData.email,
      password: 'Password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Customer logged in successfully');
    console.log('Token:', token.substring(0, 20) + '...');

    console.log('\n3️⃣ Getting current profile...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile retrieved successfully');
    console.log('Current profile data:');
    console.log('- Name:', profileResponse.data.user.first_name, profileResponse.data.user.last_name);
    console.log('- Phone:', profileResponse.data.user.phone);
    console.log('- City:', profileResponse.data.user.city);

    console.log('\n4️⃣ Updating profile...');
    const updateData = {
      first_name: 'Updated',
      last_name: 'Customer',
      phone: '+1987654321',
      address: '456 Updated Street',
      city: 'Los Angeles',
      state: 'CA',
      country: 'United States'
    };

    const updateResponse = await axios.put(`${API_BASE}/auth/profile`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile update response:', updateResponse.data.message);

    console.log('\n5️⃣ Verifying profile update...');
    const updatedProfileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Updated profile retrieved');
    console.log('Updated profile data:');
    console.log('- Name:', updatedProfileResponse.data.user.first_name, updatedProfileResponse.data.user.last_name);
    console.log('- Phone:', updatedProfileResponse.data.user.phone);
    console.log('- City:', updatedProfileResponse.data.user.city);

    // Verify changes were saved
    const user = updatedProfileResponse.data.user;
    if (user.first_name === 'Updated' && user.phone === '+1987654321' && user.city === 'Los Angeles') {
      console.log('\n✅ Profile update verified - all changes saved to database!');
    } else {
      console.log('\n❌ Profile update failed - changes not saved');
      console.log('Expected: Updated, +1987654321, Los Angeles');
      console.log('Actual:', user.first_name + ',', user.phone + ',', user.city);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 PROFILE UPDATE TEST COMPLETED');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.error('🔐 Authentication failed - token might be invalid or expired');
    }
    if (error.response?.data) {
      console.error('Full response:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('Request details:', {
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers
    });
    process.exit(1);
  }
}

testProfileUpdate();
