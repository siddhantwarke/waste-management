const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test customer profile update with filtered data
async function testCustomerProfileUpdate() {
  console.log('=== Testing Customer Profile Update (Fixed) ===\n');
  
  try {
    // Step 1: Login as customer
    console.log('1. Logging in as customer...');
    const loginData = {
      email: 'customer@test.com',
      password: 'Password123!'
    };
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    console.log('✓ Login successful');
    const token = loginResponse.data.token;
    
    // Set up auth headers
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Get current profile
    console.log('\n2. Getting current profile...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, { headers: authHeaders });
    console.log('✓ Profile retrieved successfully');
    console.log('Current profile role:', profileResponse.data.user.role);
    
    // Step 3: Update profile with ONLY customer fields (no collector data)
    console.log('\n3. Updating profile with customer data only...');
    const updateData = {
      first_name: 'Updated Customer',
      last_name: 'Fixed Update', 
      phone: '+9876543210',
      address: '456 Fixed Street, Working City',
      country: 'Fixed Country',
      state: 'Fixed State',
      city: 'Fixed City'
      // Note: NO collector fields included at all
    };
    
    console.log('Update data (customer only):', JSON.stringify(updateData, null, 2));
    
    const updateResponse = await axios.put(`${API_BASE}/auth/profile`, updateData, { headers: authHeaders });
    console.log('✓ Profile update successful');
    console.log('Update response:', JSON.stringify(updateResponse.data, null, 2));
    
    // Step 4: Verify the update was saved
    console.log('\n4. Verifying profile was updated...');
    const verifyResponse = await axios.get(`${API_BASE}/auth/profile`, { headers: authHeaders });
    console.log('✓ Profile retrieved for verification');
    
    const updatedProfile = verifyResponse.data.user;
    
    // Check if the updates were saved
    let allUpdated = true;
    for (const [key, value] of Object.entries(updateData)) {
      if (updatedProfile[key] !== value) {
        console.log(`❌ Field ${key} was not updated. Expected: ${value}, Got: ${updatedProfile[key]}`);
        allUpdated = false;
      } else {
        console.log(`✓ Field ${key} updated correctly: ${value}`);
      }
    }
    
    if (allUpdated) {
      console.log('\n✅ All customer profile fields were updated successfully!');
    } else {
      console.log('\n❌ Some profile fields were not updated');
    }
    
    // Step 5: Test token validation after update
    console.log('\n5. Testing token validation after update...');
    const verifyTokenResponse = await axios.get(`${API_BASE}/auth/verify`, { headers: authHeaders });
    console.log('✓ Token is still valid after profile update');
    
    return allUpdated;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Test with collector fields included (should fail with 400)
async function testCustomerProfileUpdateWithCollectorFields() {
  console.log('\n=== Testing Customer Profile Update with Collector Fields (Should Fail) ===\n');
  
  try {
    // Login as customer
    const loginData = {
      email: 'customer@test.com',
      password: 'Password123!'
    };
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    const token = loginResponse.data.token;
    
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Try to update with collector fields (empty strings)
    const updateData = {
      first_name: 'Test Customer',
      last_name: 'With Collector Fields', 
      phone: '+1234567890',
      address: '123 Test Street',
      country: 'Test Country',
      state: 'Test State',
      city: 'Test City',
      // These should cause validation errors for customers
      collector_group_name: '',
      e_waste_price: '',
      plastic_price: '',
      organic_price: ''
    };
    
    console.log('Trying to update with empty collector fields...');
    
    const updateResponse = await axios.put(`${API_BASE}/auth/profile`, updateData, { headers: authHeaders });
    console.log('❌ Update succeeded when it should have failed');
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✓ Correctly received 400 error for empty collector fields');
      console.log('Validation errors:', JSON.stringify(error.response.data, null, 2));
      return true;
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function main() {
  console.log('Testing customer profile update fixes...\n');
  
  const test1 = await testCustomerProfileUpdate();
  const test2 = await testCustomerProfileUpdateWithCollectorFields();
  
  console.log('\n=== Test Results ===');
  console.log(`Customer-only update: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`With collector fields: ${test2 ? '✅ PASS (correctly failed)' : '❌ FAIL'}`);
  
  if (test1 && test2) {
    console.log('\n🎉 All tests passed! Customer profile update is fixed.');
  } else {
    console.log('\n❌ Some tests failed. Profile update still has issues.');
  }
}

main().catch(console.error);
