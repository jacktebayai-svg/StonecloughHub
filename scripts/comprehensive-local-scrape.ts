import 'dotenv/config';
import { scraper } from '../server/services/scraper.js';
import { storage } from '../server/storage.js';
import * as fs from 'fs/promises';
import * as path from 'path';

async function comprehensiveLocalScrape() {
  console.log('🏗️  COMPREHENSIVE LOCAL BOLTON COUNCIL DATA COLLECTION');
  console.log('🎯 Strategy: Extensive local collection → Production import');
  console.log('📊 This will collect maximum data without stressing live infrastructure');
  
  const startTime = Date.now();
  
  try {
    // Test connection first
    console.log('\n🔍 Testing connection to Bolton Council websites...');
    const connectionTest = await scraper.testConnection();
    
    if (!connectionTest) {
      console.log('⚠️  Connection test failed. Some websites may be unreachable.');
      console.log('🔄 Proceeding with available sources...');
    } else {
      console.log('✅ Connection test passed!');
    }
    
    // Configure for MAXIMUM local data collection
    (scraper as any).maxDepth = 8; // Deep crawling
    (scraper as any).minFilesPerLayer = 25; // More files per layer
    (scraper as any).baseDelay = 800; // Faster for local (respectful but thorough)
    (scraper as any).maxDelay = 2500; 
    
    console.log('\n⚙️  COMPREHENSIVE SCRAPE CONFIGURATION:');
    console.log('   📏 Depth: 8 layers (maximum coverage)');
    console.log('   📄 Files per layer: 25 (extensive collection)');
    console.log('   ⏱️  Delays: 0.8-2.5s (local optimized)');
    console.log('   🕒 Estimated time: 12-18 minutes');
    
    console.log('\n🚀 Starting COMPREHENSIVE local data collection...');
    console.log('📡 This will gather extensive Bolton Council data locally');
    
    // Clear existing data for fresh comprehensive collection
    const dataDir = './scraped_data_comprehensive';
    try {
      await fs.rm(dataDir, { recursive: true, force: true });
    } catch (error) {
      // Directory doesn't exist, continue
    }
    await fs.mkdir(dataDir, { recursive: true });
    
    // Override the writeToJsonFile method to save in comprehensive directory
    const originalWrite = (scraper as any).writeToJsonFile;
    (scraper as any).writeToJsonFile = async (data: any, filename: string, dataType: string) => {
      try {
        const filePath = path.join(dataDir, `${dataType}_${filename}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`💾 Comprehensive: ${dataType}_${filename}.json`);
      } catch (error) {
        console.error(`❌ Error writing comprehensive data to ${filename}:`, error.message);
      }
    };
    
    // Run the comprehensive scraper
    await scraper.scrapeAndStoreData();
    
    // Restore original method
    (scraper as any).writeToJsonFile = originalWrite;
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000 / 60);
    
    console.log('\n🎉 COMPREHENSIVE LOCAL SCRAPE COMPLETED!');
    console.log(`⏱️  Duration: ${duration} minutes`);
    
    // Get final statistics
    console.log('\n📊 FINAL DATA COLLECTION SUMMARY:');
    const finalData = await storage.getCouncilData(undefined, 2000);
    console.log(`🗄️  Database Records: ${finalData.length}`);
    
    // Count by type
    const dataByType = finalData.reduce((acc, item) => {
      acc[item.dataType] = (acc[item.dataType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📋 Data by Type:');
    Object.entries(dataByType).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count} records`);
    });
    
    // Count JSON files created
    const files = await fs.readdir(dataDir);
    console.log(`\n📁 Local Files Created: ${files.length} JSON files`);
    console.log(`📂 Location: ${dataDir}/`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. ✅ Comprehensive local data collection COMPLETE');
    console.log('2. 📦 Export data for production import');
    console.log('3. 🚀 Deploy to production with full dataset');
    console.log('4. 🔄 Set up production scraper for ongoing updates');
    
    console.log('\n🏆 SUCCESS! Ready for production deployment with comprehensive data!');
    
  } catch (error) {
    console.error('\n❌ COMPREHENSIVE SCRAPE FAILED:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Handle process cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Graceful shutdown requested...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the comprehensive scrape
comprehensiveLocalScrape().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
