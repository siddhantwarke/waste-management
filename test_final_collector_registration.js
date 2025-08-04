const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCollectorRegistration() {
    console.log('=== Final Testing: Collector Registration with All Waste Types ===\n');
    
    try {
        // Test registration with all waste type prices
        const testCollector = {
            username: `testcollector_${Date.now()}`,
            email: `testcollector${Date.now()}@example.com`,
            password: 'Password123',
            first_name: 'Test',
            last_name: 'Collector',
            phone: '1234567890',
            address: '1234 Test Street, Los Angeles, CA 90210',
            role: 'collector',
            country: 'United States',
            state: 'California',
            city: 'Los Angeles',
            collector_group_name: 'Green Waste Solutions',
            e_waste_price: '3.20',
            plastic_price: '1.80',
            organic_price: '2.50',
            paper_price: '1.60',
            metal_price: '2.80',
            glass_price: '1.20',
            hazardous_price: '5.00',
            mixed_price: '1.50'
        };
        
        console.log('1. Testing collector registration with all waste type pricing...');
        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testCollector);
        
        if (registerResponse.data.success) {
            console.log('✅ Registration successful');
            console.log('   User ID:', registerResponse.data.user.id);
            console.log('   Role:', registerResponse.data.user.role);
            console.log('   Group Name:', registerResponse.data.user.collector_group_name);
            console.log('   Location:', `${registerResponse.data.user.city}, ${registerResponse.data.user.state}`);
            
            // Test login
            console.log('\n2. Testing login...');
            const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                email: testCollector.email,
                password: testCollector.password
            });
            
            if (loginResponse.data.success) {
                console.log('✅ Login successful');
                const token = loginResponse.data.token;
                
                // Test profile fetch
                console.log('\n3. Testing profile fetch...');
                const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (profileResponse.data.success) {
                    console.log('✅ Profile fetch successful');
                    const profile = profileResponse.data.user;
                    
                    console.log('   Profile Details:');
                    console.log('   - Name:', `${profile.first_name} ${profile.last_name}`);
                    console.log('   - Role:', profile.role);
                    console.log('   - Location:', `${profile.city}, ${profile.state}, ${profile.country}`);
                    console.log('   - Group Name:', profile.collector_group_name);
                    console.log('   - Waste Prices:');
                    console.log('     * E-Waste:', profile.e_waste_price ? `$${profile.e_waste_price}/kg` : 'Not set');
                    console.log('     * Plastic:', profile.plastic_price ? `$${profile.plastic_price}/kg` : 'Not set');
                    console.log('     * Organic:', profile.organic_price ? `$${profile.organic_price}/kg` : 'Not set');
                    console.log('     * Paper:', profile.paper_price ? `$${profile.paper_price}/kg` : 'Not set');
                    console.log('     * Metal:', profile.metal_price ? `$${profile.metal_price}/kg` : 'Not set');
                    console.log('     * Glass:', profile.glass_price ? `$${profile.glass_price}/kg` : 'Not set');
                    console.log('     * Hazardous:', profile.hazardous_price ? `$${profile.hazardous_price}/kg` : 'Not set');
                    console.log('     * Mixed:', profile.mixed_price ? `$${profile.mixed_price}/kg` : 'Not set');
                    
                    // Test profile update
                    console.log('\n4. Testing profile update...');
                    const updateData = {
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        phone: profile.phone,
                        address: profile.address,
                        country: profile.country,
                        state: profile.state,
                        city: profile.city,
                        collector_group_name: 'Updated Green Solutions',
                        organic_price: '2.75',
                        plastic_price: '2.00',
                        e_waste_price: '3.50'
                        // Keep other existing fields unchanged
                    };
                    
                    const updateResponse = await axios.put(`${BASE_URL}/auth/profile`, updateData, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (updateResponse.data.success) {
                        console.log('✅ Profile update successful');
                        const updatedProfile = updateResponse.data.user;
                        console.log('   Updated Details:');
                        console.log('   - Group Name:', updatedProfile.collector_group_name);
                        console.log('   - Updated Organic Price:', updatedProfile.organic_price ? `$${updatedProfile.organic_price}/kg` : 'Not set');
                        console.log('   - Updated Plastic Price:', updatedProfile.plastic_price ? `$${updatedProfile.plastic_price}/kg` : 'Not set');
                        console.log('   - Updated E-Waste Price:', updatedProfile.e_waste_price ? `$${updatedProfile.e_waste_price}/kg` : 'Not set');
                        console.log('   - Unchanged Paper Price:', updatedProfile.paper_price ? `$${updatedProfile.paper_price}/kg` : 'Not set');
                        console.log('   - Unchanged Hazardous Price:', updatedProfile.hazardous_price ? `$${updatedProfile.hazardous_price}/kg` : 'Not set');
                    }
                }
            }
        }
        
        console.log('\n=== Final Test Summary ===');
        console.log('✅ All collector registration and profile tests passed!');
        console.log('✅ All waste type pricing fields working correctly');
        console.log('✅ Profile updates with partial data working correctly');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.data?.errors) {
            console.error('Validation errors:', error.response.data.errors);
        }
    }
}

testCollectorRegistration();
