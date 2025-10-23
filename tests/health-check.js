/**
 * Quick Integration Test
 * Validates that the server is running and basic API endpoints work
 */

const axios = require('axios');
const colors = require('colors');

async function quickHealthCheck() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('🏥 Quick Health Check for Flight Booking API\n'.cyan.bold);
    
    try {
        // Test server is running
        console.log('1️⃣  Testing server connectivity...'.blue);
        const healthResponse = await axios.get(`${baseUrl}/api/health`).catch(() => {
            // If /api/health doesn't exist, try a basic request
            return axios.get(`${baseUrl}/`);
        });
        
        if (healthResponse.status === 200) {
            console.log('   ✅ Server is running and accessible\n'.green);
        } else {
            throw new Error('Server not responding correctly');
        }
        
        // Test search endpoint
        console.log('2️⃣  Testing flight search endpoint...'.blue);
        const searchPayload = {
            origin: 'LHR',
            destination: 'JFK',
            departureDate: '2025-11-30',
            passengers: [{ type: 'adult' }],
            cabinClass: 'economy'
        };
        
        const searchResponse = await axios.post(`${baseUrl}/api/search-flights`, searchPayload);
        
        if (searchResponse.status === 200 && searchResponse.data.success) {
            console.log('   ✅ Flight search API working correctly'.green);
            const offerCount = searchResponse.data.offers ? searchResponse.data.offers.length : 0;
            console.log(`   📊 Found ${offerCount} offers\n`.gray);
        } else {
            throw new Error('Flight search API not working');
        }
        
        console.log('🎉 Quick health check PASSED! Ready for full testing.\n'.green.bold);
        return true;
        
    } catch (error) {
        console.log('❌ Health check FAILED!'.red.bold);
        console.log(`   Error: ${error.message}`.red);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Server might not be running. Try:'.yellow);
            console.log('   npm run dev'.gray);
        }
        
        console.log('');
        return false;
    }
}

// Run if called directly
if (require.main === module) {
    quickHealthCheck().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = quickHealthCheck;