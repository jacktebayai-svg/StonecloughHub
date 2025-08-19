import 'dotenv/config';
import { scraper } from '../server/services/scraper.js';

async function fullDataScrape() {
  console.log('🚀 Running COMPREHENSIVE Bolton Council data scrape...');
  console.log('This will collect extensive real data for the app launch!');
  
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
    
    // Configure for comprehensive scrape
    (scraper as any).maxDepth = 5; // Increase depth
    (scraper as any).minFilesPerLayer = 15; // More files per layer
    (scraper as any).baseDelay = 1500; // Moderate delays for comprehensive data
    (scraper as any).maxDelay = 4000; 
    
    console.log('🚀 Starting COMPREHENSIVE data scrape...');
    console.log('Configuration: depth=5, 15 files per layer');
    console.log('This will take approximately 5-8 minutes to complete...');
    
    // Run the comprehensive scraper
    await scraper.scrapeAndStoreData();
    
    console.log('✅ Comprehensive scraper completed successfully!');
    
    // Wait a moment for any pending database operations
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📊 Comprehensive data collection completed!');
    console.log('🗄️ Check your database for extensive council data entries.');
    console.log('📁 Check scraped_data/ directory for JSON files.');
    
    console.log('\n🎉 READY FOR LAUNCH! Your app now has comprehensive real Bolton Council data.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Comprehensive scraper failed:', error);
    process.exit(1);
  }
}

// Run the comprehensive scrape
fullDataScrape();
