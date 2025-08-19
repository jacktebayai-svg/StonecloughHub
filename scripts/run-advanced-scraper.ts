#!/usr/bin/env tsx

/**
 * Advanced Scraper System Integration Script
 * 
 * This script demonstrates how to run the complete advanced scraper system
 * with all the enhanced features we've built:
 * 
 * - Intelligent crawling strategy with AI-powered content analysis
 * - Enhanced URL discovery with pattern detection
 * - Advanced data extraction with multi-format support
 * - Comprehensive duplicate detection and deduplication
 * - Automated scheduling and orchestration
 * - Real-time monitoring and alerting
 * - Data quality validation and reporting
 */

import { intelligentOrchestrator } from '../server/services/intelligent-orchestrator';
import { intelligentCrawlingStrategy } from '../server/services/intelligent-crawler-strategy';
import { enhancedUrlDiscovery } from '../server/services/enhanced-url-discovery';
import { advancedDataExtractor } from '../server/services/advanced-data-extraction';
import { advancedDeduplicationEngine } from '../server/services/advanced-deduplication';
import { enhancedStorage } from '../server/services/enhanced-storage';

async function main() {
  console.log('🚀 Starting Advanced Bolton Council Scraper System');
  console.log('================================================');
  
  try {
    // 1. Start the intelligent orchestration system
    console.log('\n📊 Step 1: Starting Intelligent Orchestration System...');
    await intelligentOrchestrator.start();
    
    // Wait a moment for the system to initialize
    await sleep(2000);
    
    // 2. Get system status
    console.log('\n📈 Step 2: System Status Check...');
    const status = intelligentOrchestrator.getStatus();
    console.log(`   • Running: ${status.isRunning ? '✅' : '❌'}`);
    console.log(`   • Scheduled Tasks: ${status.scheduledTasks}`);
    console.log(`   • Running Tasks: ${status.runningTasks}`);
    console.log(`   • Maintenance Mode: ${status.maintenanceMode ? '🔧' : '✅'}`);
    console.log(`   • System Health: ${status.systemHealth.overall}`);
    
    // 3. Manual demonstration of URL discovery
    console.log('\n🔍 Step 3: Demonstrating URL Discovery...');
    const testUrl = 'https://www.bolton.gov.uk';
    const testContent = `
      <html>
        <head><title>Bolton Council - Home</title></head>
        <body>
          <h1>Bolton Council</h1>
          <nav>
            <a href="/council-and-democracy/meetings-agendas-and-minutes">Meetings</a>
            <a href="/environment-and-planning/planning-applications">Planning</a>
            <a href="/transparency-and-performance">Transparency</a>
            <a href="/council-tax">Council Tax</a>
          </nav>
          <main>
            <p>Welcome to Bolton Council's website.</p>
          </main>
        </body>
      </html>
    `;
    
    const discoveryResult = await enhancedUrlDiscovery.discoverUrls(testContent, testUrl, 0);
    console.log(`   • URLs Discovered: ${discoveryResult.discoveredUrls.length}`);
    console.log(`   • Patterns Detected: ${discoveryResult.patterns.length}`);
    console.log(`   • Processing Time: ${discoveryResult.statistics.processingTime}ms`);
    
    // 4. Manual demonstration of data extraction
    console.log('\n🧠 Step 4: Demonstrating Data Extraction...');
    const extractionResult = await advancedDataExtractor.extractData(
      testContent, 
      testUrl, 
      'text/html'
    );
    console.log(`   • Entities Extracted: ${extractionResult.primaryData.length}`);
    console.log(`   • Structured Data Points: ${extractionResult.structuredData.length}`);
    console.log(`   • Semantic Tags: ${extractionResult.semanticTags.length}`);
    console.log(`   • Quality Score: ${Math.round(extractionResult.qualityScore * 100)}%`);
    console.log(`   • Processing Time: ${extractionResult.processingTime}ms`);
    
    // 5. Let the system run for a demonstration period
    console.log('\n⏰ Step 5: Running Automated Tasks...');
    console.log('   The system will now run scheduled tasks automatically.');
    console.log('   Monitoring for 30 seconds...\n');
    
    // Monitor the system for 30 seconds
    for (let i = 0; i < 6; i++) {
      await sleep(5000);
      const currentStatus = intelligentOrchestrator.getStatus();
      
      console.log(`   [${new Date().toLocaleTimeString()}] Status Update:`);
      console.log(`     • Running Tasks: ${currentStatus.runningTasks}`);
      console.log(`     • Tasks in Queue: ${currentStatus.tasksInQueue}`);
      console.log(`     • Recent Executions: ${currentStatus.recentExecutions.length}`);
      
      if (currentStatus.recentExecutions.length > 0) {
        const latest = currentStatus.recentExecutions[0];
        console.log(`     • Latest Task: ${latest.status} (${latest.taskId})`);
      }
      console.log('');
    }
    
    // 6. Generate a comprehensive report
    console.log('\n📊 Step 6: Generating System Report...');
    const report = await intelligentOrchestrator.generateReport('day');
    console.log(`   • Session ID: ${report.sessionId}`);
    console.log(`   • Total Tasks: ${report.totalTasks}`);
    console.log(`   • Successful Tasks: ${report.successfulTasks}`);
    console.log(`   • Failed Tasks: ${report.failedTasks}`);
    console.log(`   • Items Added: ${report.dataChanges.itemsAdded}`);
    console.log(`   • System Health: ${report.systemHealth.overallStatus}`);
    console.log(`   • Memory Usage: ${Math.round(report.systemHealth.memoryUsage)}MB`);
    console.log(`   • Error Rate: ${(report.systemHealth.errorRate * 100).toFixed(2)}%`);
    
    if (report.recommendations.length > 0) {
      console.log('\n   📋 Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`     ${index + 1}. ${rec}`);
      });
    }
    
    // 7. Demonstrate advanced search capabilities
    console.log('\n🔍 Step 7: Demonstrating Enhanced Search...');
    try {
      const searchResult = await enhancedStorage.advancedSearch({
        query: 'council meeting',
        fullText: true,
        limit: 5,
        sortBy: 'relevance'
      });
      
      console.log(`   • Search Results: ${searchResult.items.length}`);
      console.log(`   • Total Count: ${searchResult.totalCount}`);
      console.log(`   • Search Time: ${searchResult.searchStats.searchTime}ms`);
      console.log(`   • Query Complexity: ${searchResult.searchStats.queryComplexity}`);
      
      if (searchResult.facets) {
        const categoryCount = Object.keys(searchResult.facets.categories).length;
        const wardCount = Object.keys(searchResult.facets.wards).length;
        console.log(`   • Categories Available: ${categoryCount}`);
        console.log(`   • Wards Available: ${wardCount}`);
      }
    } catch (error) {
      console.log('   • Search demonstration skipped (database not connected)');
    }
    
    // 8. Show crawling statistics
    console.log('\n📈 Step 8: Crawling Statistics...');
    const crawlStats = intelligentCrawlingStrategy.getStatistics();
    console.log(`   • Queue Size: ${crawlStats.queueSize}`);
    console.log(`   • Ready to Process: ${crawlStats.readyToProcess}`);
    console.log(`   • Average Priority: ${crawlStats.averagePriority.toFixed(2)}`);
    console.log(`   • Next Scheduled: ${crawlStats.nextScheduled?.toLocaleTimeString() || 'None'}`);
    console.log(`   • Estimated Processing Time: ${Math.round(crawlStats.estimatedProcessingTime / 1000)}s`);
    
    // 9. System summary
    console.log('\n🎉 Step 9: System Summary');
    console.log('========================');
    console.log('✅ Advanced Scraper System is now running with:');
    console.log('   • Intelligent crawling with AI-powered content analysis');
    console.log('   • Enhanced URL discovery with pattern recognition');
    console.log('   • Multi-format data extraction (HTML, JSON, XML, PDF, CSV)');
    console.log('   • Advanced duplicate detection with 7 different strategies');
    console.log('   • Automated scheduling with dependency management');
    console.log('   • Real-time monitoring and alerting');
    console.log('   • Comprehensive search with faceted filtering');
    console.log('   • Data quality validation and reporting');
    console.log('   • Full-text search with PostgreSQL optimization');
    console.log('   • Automated maintenance and health checks');
    
    console.log('\n🔄 The system will continue running in the background.');
    console.log('   Use the orchestrator API to monitor and control tasks.');
    console.log('   Check the monitoring dashboard for real-time metrics.');
    
  } catch (error) {
    console.error('\n❌ Error running advanced scraper system:', error);
    process.exit(1);
  }
}

// Utility function for delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('\n🛑 Received shutdown signal...');
  try {
    await intelligentOrchestrator.stop();
    console.log('✅ Advanced scraper system stopped gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received termination signal...');
  try {
    await intelligentOrchestrator.stop();
    console.log('✅ Advanced scraper system stopped gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
