import 'dotenv/config';
import { scraper } from '../server/services/scraper.js';

async function quickTestScraper() {
  console.log('🚀 Running quick Bolton Council scraper test (limited crawl)...');
  
  try {
    // Test connection first
    console.log('Testing connection to Bolton Council websites...');
    const connectionTest = await scraper.testConnection();
    
    if (!connectionTest) {
      console.log('❌ Connection test failed. Some websites may be unreachable.');
      console.log('Proceeding anyway to test what we can access...');
    } else {
      console.log('✅ Connection test passed!');
    }
    
    // Override scraper settings for quick test
    (scraper as any).maxDepth = 2; // Limit depth
    (scraper as any).minFilesPerLayer = 5; // Reduce files per layer
    (scraper as any).baseDelay = 1000; // Faster delays
    (scraper as any).maxDelay = 3000; // Faster max delay
    
    console.log('🚀 Starting LIMITED data scrape (depth: 2, 5 files per layer)...');
    console.log('This will take about 2-3 minutes to complete...');
    
    // Run the scraper with limits
    await scraper.scrapeAndStoreData();
    
    console.log('✅ Quick scraper test completed successfully!');
    
    // Wait a moment for any pending database operations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📊 Test completed! Check scraped_data/ directory for JSON files.');
    console.log('🗄️ Check your database for council data entries.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Quick scraper test failed:', error);
    process.exit(1);
  }
}

// Run the test
quickTestScraper();
