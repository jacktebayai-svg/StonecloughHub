import 'dotenv/config';

const BASE_URL = 'http://localhost:5000';

async function testAppEndpoints() {
  console.log('🔍 Testing app endpoints with real Bolton Council data...');
  
  const endpoints = [
    '/api/council-data',
    '/api/council-data/council_meeting',
    '/api/council-data/chart_data',
    '/api/council-data/service',
    '/api/council-stats'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing ${endpoint}`);
      const response = await fetch(`${BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        console.log(`✅ ${endpoint}: ${data.length} items returned`);
        if (data.length > 0) {
          console.log(`   Sample: ${data[0].title}`);
          console.log(`   Type: ${data[0].dataType}`);
          console.log(`   Date: ${data[0].date}`);
        }
      } else {
        console.log(`✅ ${endpoint}: Object returned`);
        console.log(`   Keys: ${Object.keys(data).join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Endpoint testing complete!');
  
  console.log('\n📱 Open your browser and visit:');
  console.log(`   🌐 Main app: ${BASE_URL}`);
  console.log(`   📊 Council data: ${BASE_URL}/council`);
  console.log(`   📈 API test: ${BASE_URL}/api/council-data`);
}

// Run the test
testAppEndpoints();
