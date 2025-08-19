import 'dotenv/config';
import { scraper } from '../server/services/scraper.js';

async function testScraper() {
  console.log('🔍 Testing Bolton Council scraper...');
  
  try {
    // Test connection first
    console.log('Testing connection to Bolton Council websites...');
    const connectionTest = await scraper.testConnection();
    
    if (!connectionTest) {
      console.log('❌ Connection test failed. Some websites may be unreachable.');
      console.log('Proceeding with partial scraping...');
    } else {
      console.log('✅ Connection test passed!');
    }
    
    // Run the scraper
    console.log('🚀 Starting comprehensive data scrape...');
    await scraper.scrapeAndStoreData();
    
    console.log('✅ Scraper test completed successfully!');
    
  } catch (error) {
    console.error('❌ Scraper test failed:', error);
    process.exit(1);
  }
}

// Run the test
testScraper();
