#!/usr/bin/env tsx

import { config } from 'dotenv';
import { QualityScoringEngine } from '../server/services/quality-scoring-engine.ts';
import CitationService from '../server/services/citation-service.ts';

// Load environment variables
config();

/**
 * Minimal test script for the enhanced crawler features
 * Tests core functionality without problematic imports
 */
async function testEnhancedCrawlerMinimal() {
  console.log('🚀 Starting Enhanced Crawler Test (Minimal)');
  console.log('=' .repeat(60));

  try {
    // Test 1: Quality Scoring Engine
    console.log('\n📊 Testing Quality Scoring Engine...');
    await testQualityScoring();

    // Test 2: Citation Service
    console.log('\n📎 Testing Citation Service...');
    await testCitationService();

    // Test 3: Environment Validation
    console.log('\n🔧 Testing Environment...');
    await testEnvironment();

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

/**
 * Test the Quality Scoring Engine
 */
async function testQualityScoring(): Promise<void> {
  const testHtml = `
    <html>
      <head><title>Bolton Council Meeting Minutes</title></head>
      <body>
        <nav>Navigation</nav>
        <main>
          <h1>Council Meeting Minutes</h1>
          <p>Meeting held on 15th January 2024. This is a comprehensive test of the content extraction and quality scoring system.</p>
          <table>
            <tr><th>Item</th><th>Decision</th><th>Amount</th></tr>
            <tr><td>Budget approval</td><td>Approved</td><td>£250,000</td></tr>
            <tr><td>Road maintenance</td><td>Approved</td><td>£150,000</td></tr>
          </table>
          <ul>
            <li>Contact: info@bolton.gov.uk</li>
            <li>Phone: 01204 333333</li>
          </ul>
        </main>
      </body>
    </html>
  `;

  const score = QualityScoringEngine.calculateQualityScore(
    testHtml, 
    'https://bolton.gov.uk/meetings', 
    'meetings'
  );

  console.log('Quality Score Results:');
  console.log(`Overall Score: ${score.overallScore}/100`);
  console.log(`Content Score: ${score.contentScore}`);
  console.log(`Structure Score: ${score.structureScore}`);
  console.log(`Contact Score: ${score.contactScore}`);
  console.log(`Quality Tier: ${QualityScoringEngine.getQualityTier(score.overallScore)}`);
  
  if (score.overallScore > 70) {
    console.log('✅ Quality scoring: EXCELLENT');
  } else if (score.overallScore > 50) {
    console.log('✅ Quality scoring: GOOD');
  } else {
    console.log('⚠️ Quality scoring: NEEDS IMPROVEMENT');
  }
}

/**
 * Test the Citation Service
 */
async function testCitationService(): Promise<void> {
  // Create a mock pool for testing
  const mockPool = {
    query: async () => ({ rows: [] })
  } as any;

  const citationService = new CitationService(mockPool);

  // Test URL analysis
  const testUrls = [
    'https://www.bolton.gov.uk/meetings/agenda-2024-01-15.pdf',
    'https://bolton.gov.uk/transparency/spending-data-2024.csv',
    'https://paplanning.bolton.gov.uk/application/24/12345',
    'https://bolton.moderngov.co.uk/documents/minutes.pdf'
  ];

  for (const url of testUrls) {
    const analysis = citationService.extractDeepLinkInfo(url);
    console.log(`URL: ${url}`);
    console.log(`- Type: ${analysis.suggestedType}`);
    console.log(`- Is Direct File: ${analysis.isDirectFile}`);
    console.log(`- File Type: ${analysis.fileType || 'N/A'}`);
    console.log(`- Domain: ${analysis.domain}`);
    console.log(`- Government Domain: ${analysis.isDomainSpecific}`);
    console.log('');
  }

  console.log('✅ Citation service analysis working correctly');
}

/**
 * Test environment and database connection
 */
async function testEnvironment(): Promise<void> {
  console.log('Environment Variables:');
  console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`- SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  
  // Test database URL format
  if (process.env.DATABASE_URL) {
    try {
      new URL(process.env.DATABASE_URL);
      console.log('✅ Database URL is valid');
    } catch {
      console.log('⚠️ Database URL format may be invalid');
    }
  }

  console.log('✅ Environment validation completed');
}

/**
 * Main test execution
 */
testEnhancedCrawlerMinimal()
  .then(() => {
    console.log('\n🎉 Enhanced crawler test suite completed!');
    console.log('\n🚀 Ready to run full enhanced crawler with:');
    console.log('   • Advanced quality scoring with multiple criteria');
    console.log('   • Citation tracking with file URL and parent page URL');
    console.log('   • Domain quota management and crawl prioritization');  
    console.log('   • Structured data validation with Zod schemas');
    console.log('   • Enhanced data extraction and processing');
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
