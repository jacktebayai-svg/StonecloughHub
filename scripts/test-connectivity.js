#!/usr/bin/env node

/**
 * Test scraper connectivity to target websites
 */

import { scraper } from '../server/services/scraper.js';

async function testConnectivity() {
  console.log('🔍 Testing Bolton Council website connectivity...\n');
  
  try {
    const isConnected = await scraper.testConnection();
    
    if (isConnected) {
      console.log('✅ SUCCESS: All target websites are accessible');
      console.log('📋 Planning portal: ✅');
      console.log('🏛️ Council website: ✅');
    } else {
      console.log('❌ FAILED: Some websites are not accessible');
      console.log('This could affect scraping performance.');
    }
  } catch (error) {
    console.error('❌ ERROR: Connectivity test failed');
    console.error('Details:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Possible causes:');
      console.log('   - Network connectivity issues');
      console.log('   - DNS resolution problems');
      console.log('   - Firewall blocking requests');
    }
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 Possible causes:');
      console.log('   - Slow network connection');
      console.log('   - Target server overloaded');
      console.log('   - Request timeout too low');
    }
  }
}

testConnectivity();
