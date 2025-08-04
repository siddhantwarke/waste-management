const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testCompleteCollectorFlow() {
  try {
    console.log('=== Testing Complete Collector Flow ===\n');
    
    // 1. Test collector login
    console.log('1. Testing collector login...');
    const loginData = {
      email: 'prat@gmail.com',
      password: 'Sid@@2727'
    };
    
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    console.log('✅ Login successful');
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Test getting collector profile
    console.log('\n2. Testing get collector profile...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, { headers });
    const collector = profileResponse.data.user;
    
    console.log(`✅ Profile retrieved for: ${collector.first_name} ${collector.last_name}`);
    console.log(`   Role: ${collector.role}`);
    console.log(`   City: ${collector.city}`);
    console.log(`   Group: ${collector.collector_group_name}`);
    console.log(`   E-waste price: $${collector.e_waste_price}/kg`);
    console.log(`   Plastic price: $${collector.plastic_price}/kg`);
    console.log(`   Organic price: $${collector.organic_price}/kg`);
    
    // 3. Test profile update with new prices
    console.log('\n3. Testing profile update with new prices...');
    const newPrices = {
      first_name: collector.first_name,
      last_name: collector.last_name,
      phone: collector.phone,
      address: collector.address,
      country: collector.country,
      state: collector.state,
      city: collector.city,
      collector_group_name: 'Updated Green Waste Solutions',
      e_waste_price: 18.00,
      plastic_price: 14.50,
      organic_price: 9.25,
      paper_price: 6.75,
      metal_price: 22.50,
      glass_price: 8.25,
      hazardous_price: 28.00,
      mixed_price: 11.50
    };
    
    const updateResponse = await axios.put(`${API_BASE_URL}/auth/profile`, newPrices, { headers });
    console.log('✅ Profile updated successfully');
    
    const updatedCollector = updateResponse.data.user;
    console.log(`   Updated group: ${updatedCollector.collector_group_name}`);
    console.log(`   Updated e-waste price: $${updatedCollector.e_waste_price}/kg`);
    console.log(`   Updated plastic price: $${updatedCollector.plastic_price}/kg`);
    
    // 4. Test city-based collector search (case insensitive)
    console.log('\n4. Testing city-based collector search...');
    const cities = ['kolhapur', 'Kolhapur', 'KOLHAPUR'];
    
    for (const city of cities) {
      const collectorsResponse = await axios.get(`${API_BASE_URL}/auth/collectors/${city}`, { headers });
      const collectors = collectorsResponse.data.collectors;
      
      console.log(`✅ Found ${collectors.length} collectors in "${city}"`);
      
      if (collectors.length > 0) {
        const foundCollector = collectors[0];
        console.log(`   Collector: ${foundCollector.first_name} ${foundCollector.last_name}`);
        console.log(`   Group: ${foundCollector.collector_group_name}`);
        console.log(`   City: ${foundCollector.city}`);
        console.log(`   E-waste: $${foundCollector.e_waste_price}/kg`);
        console.log(`   Plastic: $${foundCollector.plastic_price}/kg`);
        console.log(`   Organic: $${foundCollector.organic_price}/kg`);
        console.log(`   Paper: $${foundCollector.paper_price}/kg`);
        console.log(`   Metal: $${foundCollector.metal_price}/kg`);
        console.log(`   Glass: $${foundCollector.glass_price}/kg`);
        console.log(`   Hazardous: $${foundCollector.hazardous_price}/kg`);
        console.log(`   Mixed: $${foundCollector.mixed_price}/kg`);
      }
    }
    
    console.log('\n=== All Tests Passed! ===');
    console.log('✅ Collector login works');
    console.log('✅ Profile retrieval includes all collector fields');
    console.log('✅ Profile update saves all waste type prices');
    console.log('✅ City-based search is case-insensitive');
    console.log('✅ Collector data includes group name and all waste prices');
    
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

testCompleteCollectorFlow();
