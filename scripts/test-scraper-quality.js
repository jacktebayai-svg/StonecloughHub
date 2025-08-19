#!/usr/bin/env node

/**
 * Scraper Quality Test Script
 * Tests the web scraping functionality without database dependencies
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

const execAsync = promisify(exec);

console.log('🕷️ Scraper Quality Evaluation');
console.log('=============================\n');

class ScraperQualityTest {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    this.testUrls = [
      'https://www.bolton.gov.uk',
      'https://bolton.moderngov.co.uk',
      'https://www.bolton.gov.uk/directory/17/open-data',
      'https://www.bolton.gov.uk/council',
    ];
    this.results = {
      totalPages: 0,
      successfulScrapes: 0,
      extractedData: {
        links: 0,
        text: 0,
        structuredData: 0
      },
      errors: [],
      pageAnalysis: []
    };
  }

  async makeRequest(url, retries = 2) {
    try {
      const randomUserAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      
      console.log(`📥 Fetching: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': randomUserAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.9',
          'Connection': 'keep-alive',
        },
        timeout: 15000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if (retries > 0) {
        console.log(`⚠️  Retrying ${url} (${retries} attempts left)`);
        await this.delay(2000);
        return this.makeRequest(url, retries - 1);
      }
      throw error;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  analyzePageContent(url, html) {
    const $ = cheerio.load(html);
    const analysis = {
      url,
      title: $('title').text().trim(),
      links: $('a[href]').length,
      images: $('img').length,
      forms: $('form').length,
      headings: {
        h1: $('h1').length,
        h2: $('h2').length,
        h3: $('h3').length,
      },
      structuredData: {
        meetings: $('a:contains("meeting"), a:contains("agenda"), a:contains("minutes")').length,
        planning: $('a[href*="planning"], a[href*="application"]').length,
        documents: $('a[href*=".pdf"], a[href*="document"]').length,
        dataFiles: $('a[href*=".csv"], a[href*=".xlsx"], a[href*="data"]').length,
      },
      textLength: $('body').text().length,
      hasNavigation: $('nav').length > 0,
      hasSearch: $('input[type="search"], input[name*="search"]').length > 0,
      relevantContent: this.extractRelevantContent($)
    };

    return analysis;
  }

  extractRelevantContent($) {
    const relevantData = {
      councilMeetings: [],
      planningApplications: [],
      contacts: [],
      documents: []
    };

    // Extract meeting information
    $('a:contains("meeting"), a:contains("agenda"), a:contains("minutes")').each((_, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      if (text && href) {
        relevantData.councilMeetings.push({
          title: text,
          link: href,
          context: $el.parent().text().trim().substring(0, 200)
        });
      }
    });

    // Extract planning applications
    $('a[href*="planning"], a[href*="application"]').each((_, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      if (text && href) {
        relevantData.planningApplications.push({
          title: text,
          link: href
        });
      }
    });

    // Extract contact information
    $('a[href^="mailto:"], a:contains("contact"), a:contains("phone")').each((_, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      if (text && (href || text.includes('@') || /\d{3,}/.test(text))) {
        relevantData.contacts.push({
          text,
          link: href || null,
          type: href?.startsWith('mailto:') ? 'email' : 'other'
        });
      }
    });

    // Extract document links
    $('a[href*=".pdf"], a[href*="document"], a[href*=".csv"], a[href*=".xlsx"]').each((_, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      if (text && href) {
        const extension = href.split('.').pop()?.toLowerCase();
        relevantData.documents.push({
          title: text,
          link: href,
          type: extension || 'unknown'
        });
      }
    });

    return relevantData;
  }

  async testUrl(url) {
    try {
      this.results.totalPages++;
      
      const html = await this.makeRequest(url);
      const analysis = this.analyzePageContent(url, html);
      
      this.results.successfulScrapes++;
      this.results.extractedData.links += analysis.links;
      this.results.extractedData.text += analysis.textLength;
      this.results.extractedData.structuredData += 
        analysis.structuredData.meetings + 
        analysis.structuredData.planning + 
        analysis.structuredData.documents + 
        analysis.structuredData.dataFiles;
      
      this.results.pageAnalysis.push(analysis);
      
      console.log(`✅ Successfully analyzed: ${analysis.title || url}`);
      console.log(`   Links: ${analysis.links}, Text: ${Math.round(analysis.textLength/1000)}k chars`);
      console.log(`   Relevant data: ${analysis.relevantContent.councilMeetings.length} meetings, ${analysis.relevantContent.documents.length} documents\n`);
      
      // Add delay to be respectful
      await this.delay(1000);
      
      return analysis;
    } catch (error) {
      console.error(`❌ Failed to analyze ${url}:`, error.message);
      this.results.errors.push({ url, error: error.message });
      return null;
    }
  }

  async evaluateScrapeQuality() {
    console.log('🔍 Testing key Bolton Council URLs...\n');
    
    for (const url of this.testUrls) {
      await this.testUrl(url);
    }
    
    // Test additional URLs found in the links
    const additionalUrls = [];
    for (const analysis of this.results.pageAnalysis) {
      if (analysis?.relevantContent) {
        analysis.relevantContent.councilMeetings.forEach(meeting => {
          if (meeting.link && meeting.link.startsWith('/')) {
            additionalUrls.push(`https://www.bolton.gov.uk${meeting.link}`);
          }
        });
      }
    }
    
    // Test a few additional URLs (max 5 to avoid overwhelming)
    const testAdditional = additionalUrls.slice(0, 3);
    if (testAdditional.length > 0) {
      console.log('🔗 Testing additional discovered URLs...\n');
      for (const url of testAdditional) {
        await this.testUrl(url);
      }
    }
  }

  async generateQualityReport() {
    const report = {
      summary: {
        totalPages: this.results.totalPages,
        successfulScrapes: this.results.successfulScrapes,
        successRate: ((this.results.successfulScrapes / this.results.totalPages) * 100).toFixed(1) + '%',
        totalLinks: this.results.extractedData.links,
        totalText: `${Math.round(this.results.extractedData.text / 1000)}k characters`,
        structuredDataPoints: this.results.extractedData.structuredData,
        errors: this.results.errors.length
      },
      dataQuality: {
        meetingsFound: this.results.pageAnalysis.reduce((sum, p) => sum + (p?.relevantContent?.councilMeetings?.length || 0), 0),
        documentsFound: this.results.pageAnalysis.reduce((sum, p) => sum + (p?.relevantContent?.documents?.length || 0), 0),
        planningAppsFound: this.results.pageAnalysis.reduce((sum, p) => sum + (p?.relevantContent?.planningApplications?.length || 0), 0),
        contactsFound: this.results.pageAnalysis.reduce((sum, p) => sum + (p?.relevantContent?.contacts?.length || 0), 0)
      },
      sampleData: {
        meetings: this.results.pageAnalysis.flatMap(p => p?.relevantContent?.councilMeetings || []).slice(0, 5),
        documents: this.results.pageAnalysis.flatMap(p => p?.relevantContent?.documents || []).slice(0, 5),
        contacts: this.results.pageAnalysis.flatMap(p => p?.relevantContent?.contacts || []).slice(0, 3)
      },
      pageDetails: this.results.pageAnalysis.map(p => ({
        url: p?.url,
        title: p?.title,
        links: p?.links,
        dataPoints: p?.structuredData
      })),
      errors: this.results.errors
    };

    return report;
  }

  async saveReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `scraper-quality-report-${timestamp}.json`;
    
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    console.log(`📊 Detailed report saved to: ${filename}`);
  }

  printReport(report) {
    console.log('\n📈 SCRAPER QUALITY REPORT');
    console.log('========================\n');
    
    console.log('📊 Summary:');
    console.log(`   Pages tested: ${report.summary.totalPages}`);
    console.log(`   Success rate: ${report.summary.successRate}`);
    console.log(`   Links extracted: ${report.summary.totalLinks}`);
    console.log(`   Text extracted: ${report.summary.totalText}`);
    console.log(`   Structured data points: ${report.summary.structuredDataPoints}`);
    console.log(`   Errors: ${report.summary.errors}\n`);
    
    console.log('🎯 Data Quality:');
    console.log(`   Council meetings found: ${report.dataQuality.meetingsFound}`);
    console.log(`   Documents found: ${report.dataQuality.documentsFound}`);
    console.log(`   Planning applications: ${report.dataQuality.planningAppsFound}`);
    console.log(`   Contacts found: ${report.dataQuality.contactsFound}\n`);
    
    if (report.sampleData.meetings.length > 0) {
      console.log('📅 Sample meetings found:');
      report.sampleData.meetings.forEach(meeting => {
        console.log(`   - ${meeting.title} (${meeting.link})`);
      });
      console.log('');
    }
    
    if (report.sampleData.documents.length > 0) {
      console.log('📄 Sample documents found:');
      report.sampleData.documents.forEach(doc => {
        console.log(`   - ${doc.title} [${doc.type}] (${doc.link})`);
      });
      console.log('');
    }
    
    if (report.errors.length > 0) {
      console.log('❌ Errors encountered:');
      report.errors.forEach(error => {
        console.log(`   - ${error.url}: ${error.error}`);
      });
      console.log('');
    }
    
    // Quality assessment
    let qualityScore = 0;
    if (report.summary.successRate >= '80.0%') qualityScore += 25;
    if (report.dataQuality.meetingsFound > 0) qualityScore += 25;
    if (report.dataQuality.documentsFound > 0) qualityScore += 25;
    if (report.summary.structuredDataPoints > 10) qualityScore += 25;
    
    console.log('🏆 Quality Assessment:');
    console.log(`   Overall Score: ${qualityScore}/100`);
    
    if (qualityScore >= 90) console.log('   Rating: Excellent - Production ready! 🌟');
    else if (qualityScore >= 70) console.log('   Rating: Good - Minor improvements needed 👍');
    else if (qualityScore >= 50) console.log('   Rating: Fair - Needs optimization ⚠️');
    else console.log('   Rating: Poor - Significant improvements needed ❌');
    
    console.log('\n🚀 Recommendations:');
    if (report.summary.errors > 0) {
      console.log('   • Review and fix URL access issues');
    }
    if (report.dataQuality.meetingsFound < 5) {
      console.log('   • Improve meeting data extraction selectors');
    }
    if (report.dataQuality.documentsFound < 5) {
      console.log('   • Enhance document discovery mechanisms');
    }
    if (report.summary.structuredDataPoints < 10) {
      console.log('   • Add more structured data extraction patterns');
    }
    
    console.log('   • Consider adding planning application extraction');
    console.log('   • Implement more robust error handling');
    console.log('   • Add data validation and cleaning');
  }

  async run() {
    await this.evaluateScrapeQuality();
    const report = await this.generateQualityReport();
    
    this.printReport(report);
    await this.saveReport(report);
    
    return report;
  }
}

// Run the test
const tester = new ScraperQualityTest();
tester.run().then(() => {
  console.log('\n✅ Scraper quality evaluation complete!');
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
