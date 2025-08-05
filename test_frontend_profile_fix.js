const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test profile update with frontend simulation
async function testFrontendProfileUpdate() {
  console.log('=== Testing Frontend Profile Update Fix ===\n');
  
  try {
    // Step 1: Login to get a token
    console.log('1. Logging in as customer...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'customer@test.com',
      password: 'Password123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Login successful, token received');
    
    // Step 2: Simulate frontend API call with token
    console.log('\n2. Simulating frontend profile update call...');
    
    // Create axios instance like frontend api.js does
    const frontendApi = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Add request interceptor like frontend
    frontendApi.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    
    // Test profile update data
    const updateData = {
      first_name: 'Frontend Test',
      last_name: 'Update Test',
      phone: '+9876543210',
      address: '456 Frontend Street',
      country: 'Frontend Country',
      state: 'Frontend State',
      city: 'Frontend City'
    };
    
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    const updateResponse = await frontendApi.put('/auth/profile', updateData);
    console.log('✓ Profile update successful');
    console.log('Update response:', JSON.stringify(updateResponse.data, null, 2));
    
    // Step 3: Verify the update persisted
    console.log('\n3. Verifying profile was updated...');
    const verifyResponse = await frontendApi.get('/auth/profile');
    const updatedProfile = verifyResponse.data.user;
    
    console.log('Verified profile:', JSON.stringify(updatedProfile, null, 2));
    
    // Check if all fields were updated
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
      console.log('\n✅ Frontend profile update test PASSED!');
      console.log('✅ Profile updates are saving to database correctly');
      console.log('✅ No logout redirect occurred');
    } else {
      console.log('\n❌ Some fields were not updated correctly');
    }
    
  } catch (error) {
    console.error('❌ Frontend profile update test FAILED:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Check server status
async function checkServerStatus() {
  try {
    const response = await axios.get(`${API_BASE}/auth/verify`);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return true; // Server is running, just auth failed
    }
    return false;
  }
}

async function main() {
  console.log('Checking server status...');
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('❌ Backend server is not running. Please start it first.');
    console.log('Run: cd backend && npm start');
    return;
  }
  
  console.log('✓ Backend server is running\n');
  await testFrontendProfileUpdate();
}

main().catch(console.error);
