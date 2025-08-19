#!/usr/bin/env node

/**
 * Test web connectivity for scraping without database dependencies
 */

async function testWebConnectivity() {
  console.log('🔍 Testing Bolton Council website connectivity...\n');
  
  const testUrls = [
    'https://paplanning.bolton.gov.uk/online-applications',
    'https://www.bolton.gov.uk',
    'https://bolton.moderngov.co.uk',
    'https://www.bolton.gov.uk/directory/17/open-data'
  ];
  
  const userAgent = 'Mozilla/5.0 (compatible; BoltonHubBot/1.0)';
  let successCount = 0;
  let totalTests = testUrls.length;
  
  for (const url of testUrls) {
    try {
      console.log(`📥 Testing: ${url}`);
      
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': userAgent
        },
        timeout: 10000
      });
      
      if (response.ok) {
        console.log(`✅ SUCCESS: ${response.status} ${response.statusText}`);
        successCount++;
      } else {
        console.log(`❌ FAILED: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
    
    console.log(''); // Add spacing
  }
  
  // Summary
  console.log('=' .repeat(50));
  console.log(`📊 CONNECTIVITY TEST RESULTS: ${successCount}/${totalTests} successful`);
  
  const successRate = (successCount / totalTests) * 100;
  console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 75) {
    console.log('🎉 EXCELLENT: All major endpoints are accessible');
    console.log('✅ Scraper should work well');
  } else if (successRate >= 50) {
    console.log('⚠️  PARTIAL: Some endpoints are having issues');
    console.log('🔧 Scraper may have reduced effectiveness');
  } else {
    console.log('❌ POOR: Most endpoints are inaccessible');
    console.log('🚨 Scraper likely to fail - check network connectivity');
  }
  
  if (successCount < totalTests) {
    console.log('\n💡 Troubleshooting tips:');
    console.log('   • Check your internet connection');
    console.log('   • Verify firewall settings');
    console.log('   • Try accessing URLs manually in browser');
    console.log('   • Some sites may be temporarily down');
  }
}

testWebConnectivity().catch(console.error);
