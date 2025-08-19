import 'dotenv/config';
import { storage } from '../server/storage.js';

async function checkDatabase() {
  console.log('🔍 Checking database for collected Bolton Council data...');
  
  try {
    // Get all council data (with high limit to get all)
    const allData = await storage.getCouncilData(undefined, 1000);
    
    console.log(`\n📊 Total Council Data Records: ${allData.length}\n`);
    
    if (allData.length === 0) {
      console.log('❌ No data found in database. The scraper may not have stored data successfully.');
      return;
    }
    
    // Group by data type
    const dataByType = allData.reduce((acc, item) => {
      acc[item.dataType] = (acc[item.dataType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📋 Data by Type:');
    Object.entries(dataByType).forEach(([type, count]) => {
      console.log(`  • ${type}: ${count} records`);
    });
    
    console.log('\n🔍 Sample Records:');
    
    // Show a few sample records of different types
    const sampleTypes = ['council_meeting', 'chart_data', 'service', 'councillor'];
    
    for (const type of sampleTypes) {
      const sample = allData.find(item => item.dataType === type);
      if (sample) {
        console.log(`\n📄 Sample ${type}:`);
        console.log(`   Title: ${sample.title}`);
        console.log(`   Description: ${sample.description}`);
        console.log(`   Source: ${sample.sourceUrl}`);
        console.log(`   Date: ${sample.date}`);
        if (sample.metadata) {
          console.log(`   Metadata: ${JSON.stringify(sample.metadata, null, 2)}`);
        }
      }
    }
    
    // Check recent data (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentData = allData.filter(item => new Date(item.createdAt) > oneDayAgo);
    
    console.log(`\n⏰ Recent Data (last 24h): ${recentData.length} records`);
    
    console.log('\n✅ Database check complete!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

// Run the check
checkDatabase();
