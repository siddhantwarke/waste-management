const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Register a test customer first
async function createTestCustomer() {
  console.log('Creating test customer...');
  
  const customerData = {
    username: 'testcustomer',
    email: 'customer@test.com',
    password: 'Password123!', // Strong password
    role: 'customer',
    first_name: 'Test',
    last_name: 'Customer',
    phone: '+1234567890',
    address: '123 Test Street',
    country: 'Test Country',
    state: 'Test State',
    city: 'Test City'
  };
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, customerData);
    console.log('✓ Test customer created successfully');
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      if (error.response.data.message.includes('already exists')) {
        console.log('✓ Test customer already exists');
        return { success: true };
      } else {
        console.log('❌ Registration validation errors:', error.response.data);
        throw error;
      }
    }
    throw error;
  }
}

// Test customer profile update flow
async function testCustomerProfileUpdate() {
  console.log('=== Testing Customer Profile Update ===\n');
  
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
    console.log('Current profile:', JSON.stringify(profileResponse.data.user, null, 2));
    
    const currentProfile = profileResponse.data.user;
    
    // Step 3: Update profile
    console.log('\n3. Updating profile...');
    const updateData = {
      first_name: 'Updated First',
      last_name: 'Updated Last', 
      phone: '+1234567890',
      address: '123 Updated Street, Updated City',
      country: 'Updated Country',
      state: 'Updated State',
      city: 'Updated City'
    };
    
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    const updateResponse = await axios.put(`${API_BASE}/auth/profile`, updateData, { headers: authHeaders });
    console.log('✓ Profile update successful');
    console.log('Update response:', JSON.stringify(updateResponse.data, null, 2));
    
    // Step 4: Verify the update was saved
    console.log('\n4. Verifying profile was updated...');
    const verifyResponse = await axios.get(`${API_BASE}/auth/profile`, { headers: authHeaders });
    console.log('✓ Profile retrieved for verification');
    
    const updatedProfile = verifyResponse.data.user;
    console.log('Updated profile:', JSON.stringify(updatedProfile, null, 2));
    
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
      console.log('\n✅ All profile fields were updated successfully!');
    } else {
      console.log('\n❌ Some profile fields were not updated');
    }
    
    // Step 5: Test token validation after update
    console.log('\n5. Testing token validation after update...');
    const verifyTokenResponse = await axios.get(`${API_BASE}/auth/verify`, { headers: authHeaders });
    console.log('✓ Token is still valid after profile update');
    console.log('Token verification response:', JSON.stringify(verifyTokenResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Function to start server if needed
async function checkServerStatus() {
  try {
    // Try a simple endpoint first
    const response = await axios.get(`${API_BASE}/health`);
    return true;
  } catch (error) {
    try {
      // Try auth endpoint without auth header (should get 401 but means server is running)
      await axios.get(`${API_BASE}/auth/verify`);
      return true;
    } catch (authError) {
      if (authError.response && authError.response.status === 401) {
        return true; // Server is running, just auth failed
      }
      return false;
    }
  }
}

async function main() {
  console.log('Checking server status...');
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start the backend server first.');
    console.log('Run: cd backend && npm start');
    return;
  }
  
  console.log('✓ Server is running');
  
  await createTestCustomer();
  await testCustomerProfileUpdate();
}

main().catch(console.error);
