#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import * as cheerio from 'cheerio';

// Load environment variables
config();

interface CrawlResult {
  id: string;
  title: string;
  url: string;
  content: string;
  dataType: string;
  category: string;
  extractedData: any;
  qualityScore: number;
  citationInfo: any;
  scrapedAt: string;
  sourceUrl: string;
  fileLinks: string[];
  metadata: any;
}

interface QualityScore {
  overallScore: number;
  contentScore: number;
  structureScore: number;
  contactScore: number;
  factors: {
    hasTitle: boolean;
    hasHeadings: boolean;
    hasStructuredData: boolean;
    hasContactInfo: boolean;
    hasTables: boolean;
    contentLength: number;
  };
}

/**
 * Enhanced Local Crawler
 * Crawls Bolton Council websites and stores data locally as JSON files
 */
class EnhancedLocalCrawler {
  private outputDir: string;
  private crawledUrls: Set<string> = new Set();
  private results: CrawlResult[] = [];

  constructor(outputDir: string = './scraped_data/enhanced') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  /**
   * Start the enhanced crawling process
   */
  async crawl(): Promise<void> {
    console.log('🚀 Starting Enhanced Local Crawler');
    console.log('=' .repeat(60));
    console.log(`📁 Output directory: ${this.outputDir}`);
    
    const startUrls = [
      'https://www.bolton.gov.uk/council-meetings',
      'https://www.bolton.gov.uk/transparency',
      'https://www.bolton.gov.uk/council-tax',
      'https://www.bolton.gov.uk/budgets-spending',
      'https://bolton.moderngov.co.uk/mgListCommittees.aspx'
    ];

    for (const url of startUrls) {
      try {
        console.log(`\n🕸️ Crawling: ${url}`);
        await this.crawlPage(url);
        
        // Add delay to be respectful
        await this.delay(2000);
        
      } catch (error) {
        console.error(`❌ Failed to crawl ${url}:`, error);
      }
    }

    await this.saveResults();
    this.generateSummary();
  }

  /**
   * Crawl a single page
   */
  private async crawlPage(url: string): Promise<void> {
    if (this.crawledUrls.has(url)) {
      return;
    }

    this.crawledUrls.add(url);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'StonecloughHub Enhanced Crawler/1.0 (+https://github.com/stoneclough-community-initiative)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract basic information
      const title = $('title').first().text().trim() || 
                   $('h1').first().text().trim() || 
                   'Untitled Page';
      
      const content = $('main, .content, body').first().text().trim();
      
      // Calculate quality score
      const qualityScore = this.calculateQualityScore(html, url);
      
      // Extract structured data
      const extractedData = this.extractStructuredData($, url);
      
      // Find file links
      const fileLinks = this.extractFileLinks($, url);
      
      // Generate citation info
      const citationInfo = this.generateCitationInfo(url, title, fileLinks);
      
      // Determine data type and category
      const { dataType, category } = this.classifyContent(url, title, content);
      
      const result: CrawlResult = {
        id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        url,
        content: content.substring(0, 2000), // Limit content length
        dataType,
        category,
        extractedData,
        qualityScore: qualityScore.overallScore,
        citationInfo,
        scrapedAt: new Date().toISOString(),
        sourceUrl: url,
        fileLinks,
        metadata: {
          qualityDetails: qualityScore,
          responseHeaders: {
            contentType: response.headers.get('content-type'),
            lastModified: response.headers.get('last-modified')
          },
          urlAnalysis: this.analyzeUrl(url)
        }
      };

      this.results.push(result);
      
      console.log(`✅ Processed: ${title}`);
      console.log(`   Quality Score: ${qualityScore.overallScore}/100`);
      console.log(`   File Links: ${fileLinks.length}`);
      console.log(`   Data Type: ${dataType} (${category})`);

    } catch (error) {
      console.error(`❌ Error crawling ${url}:`, error);
    }
  }

  /**
   * Calculate quality score for content
   */
  private calculateQualityScore(html: string, url: string): QualityScore {
    const $ = cheerio.load(html);
    
    const factors = {
      hasTitle: $('title').length > 0 && $('title').text().trim().length > 0,
      hasHeadings: $('h1, h2, h3').length > 0,
      hasStructuredData: $('table, ul, ol, dl').length > 0,
      hasContactInfo: html.includes('@') && (html.includes('.gov.uk') || html.includes('tel:')),
      hasTables: $('table').length > 0,
      contentLength: $('body').text().trim().length
    };

    let contentScore = 0;
    if (factors.contentLength > 1000) contentScore = 40;
    else if (factors.contentLength > 500) contentScore = 30;
    else if (factors.contentLength > 200) contentScore = 20;
    else contentScore = 10;

    let structureScore = 0;
    if (factors.hasTitle) structureScore += 10;
    if (factors.hasHeadings) structureScore += 15;
    if (factors.hasStructuredData) structureScore += 15;
    if (factors.hasTables) structureScore += 10;

    let contactScore = 0;
    if (factors.hasContactInfo) contactScore = 20;

    const overallScore = Math.min(100, contentScore + structureScore + contactScore);

    return {
      overallScore,
      contentScore,
      structureScore,
      contactScore,
      factors
    };
  }

  /**
   * Extract structured data from page
   */
  private extractStructuredData($: cheerio.CheerioAPI, url: string): any {
    const data: any = {
      tables: [],
      lists: [],
      amounts: [],
      dates: [],
      contacts: []
    };

    // Extract tables
    $('table').each((i, table) => {
      const headers = $(table).find('th').map((i, th) => $(th).text().trim()).get();
      const rows = $(table).find('tr').map((i, tr) => {
        return $(tr).find('td').map((i, td) => $(td).text().trim()).get();
      }).get();
      
      if (headers.length > 0 || rows.length > 0) {
        data.tables.push({ headers, rows: rows.filter(row => row.length > 0) });
      }
    });

    // Extract amounts (£ symbols)
    const text = $.text();
    const amountMatches = text.match(/£[\d,]+(?:\.\d{2})?/g) || [];
    data.amounts = amountMatches.map(amount => ({
      amount,
      context: this.extractContext(text, amount)
    }));

    // Extract dates
    const dateMatches = text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b|\b\d{1,2}\s+\w+\s+\d{4}\b/g) || [];
    data.dates = dateMatches;

    // Extract email addresses
    const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    data.contacts = emailMatches;

    return data;
  }

  /**
   * Extract file links from page
   */
  private extractFileLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const fileExtensions = ['.pdf', '.csv', '.xlsx', '.xls', '.doc', '.docx'];
    const links: string[] = [];

    $('a[href]').each((i, link) => {
      const href = $(link).attr('href');
      if (href) {
        const url = this.resolveUrl(href, baseUrl);
        if (fileExtensions.some(ext => url.toLowerCase().includes(ext))) {
          links.push(url);
        }
      }
    });

    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Generate citation information
   */
  private generateCitationInfo(url: string, title: string, fileLinks: string[]): any {
    return {
      sourceUrl: url,
      title,
      fileUrls: fileLinks,
      parentPageUrl: url,
      dateAccessed: new Date().toISOString(),
      domain: new URL(url).hostname,
      isGovernmentSite: url.includes('.gov.uk'),
      confidence: fileLinks.length > 0 ? 'high' : 'medium'
    };
  }

  /**
   * Classify content type and category
   */
  private classifyContent(url: string, title: string, content: string): { dataType: string; category: string } {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    if (urlLower.includes('meeting') || titleLower.includes('meeting') || titleLower.includes('agenda')) {
      return { dataType: 'meeting', category: 'governance' };
    }
    
    if (urlLower.includes('budget') || urlLower.includes('spending') || contentLower.includes('budget')) {
      return { dataType: 'budget', category: 'finance' };
    }
    
    if (urlLower.includes('planning') || titleLower.includes('planning')) {
      return { dataType: 'planning', category: 'development' };
    }
    
    if (urlLower.includes('transparency') || titleLower.includes('transparency')) {
      return { dataType: 'transparency', category: 'governance' };
    }

    return { dataType: 'general', category: 'information' };
  }

  /**
   * Analyze URL for patterns
   */
  private analyzeUrl(url: string): any {
    const urlObj = new URL(url);
    return {
      domain: urlObj.hostname,
      path: urlObj.pathname,
      isSecure: urlObj.protocol === 'https:',
      isGovernment: urlObj.hostname.includes('.gov.uk'),
      pathSegments: urlObj.pathname.split('/').filter(Boolean)
    };
  }

  /**
   * Resolve relative URLs to absolute
   */
  private resolveUrl(href: string, baseUrl: string): string {
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return href;
    }
  }

  /**
   * Extract context around a matched string
   */
  private extractContext(text: string, match: string, contextLength: number = 50): string {
    const index = text.indexOf(match);
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + match.length + contextLength);
    
    return text.substring(start, end).trim();
  }

  /**
   * Add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Save results to JSON file
   */
  private async saveResults(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `enhanced-crawl-results-${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    await fs.promises.writeFile(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved to: ${filepath}`);
  }

  /**
   * Generate crawl summary
   */
  private generateSummary(): void {
    const summary = {
      totalResults: this.results.length,
      averageQuality: this.results.reduce((sum, r) => sum + r.qualityScore, 0) / this.results.length,
      dataTypes: this.groupBy(this.results, 'dataType'),
      categories: this.groupBy(this.results, 'category'),
      totalFileLinks: this.results.reduce((sum, r) => sum + r.fileLinks.length, 0),
      highQualityItems: this.results.filter(r => r.qualityScore > 70).length
    };

    console.log('\n📊 ENHANCED CRAWL SUMMARY');
    console.log('=' .repeat(60));
    console.log(`📈 Total Results: ${summary.totalResults}`);
    console.log(`⭐ Average Quality: ${summary.averageQuality.toFixed(1)}/100`);
    console.log(`🏆 High Quality Items: ${summary.highQualityItems}`);
    console.log(`📎 Total File Links: ${summary.totalFileLinks}`);
    
    console.log('\n📊 Data Types:');
    Object.entries(summary.dataTypes).forEach(([type, count]) => {
      console.log(`  • ${type}: ${count}`);
    });
    
    console.log('\n📊 Categories:');
    Object.entries(summary.categories).forEach(([category, count]) => {
      console.log(`  • ${category}: ${count}`);
    });

    console.log('\n🎯 Enhanced Features Demonstrated:');
    console.log('  ✅ Quality scoring with detailed analysis');
    console.log('  ✅ Structured data extraction (tables, amounts, dates)');
    console.log('  ✅ File link discovery and citation tracking');
    console.log('  ✅ Content classification and categorization');
    console.log('  ✅ URL analysis and metadata collection');
    console.log('  ✅ Local JSON storage with timestamps');
  }

  /**
   * Group results by property
   */
  private groupBy(items: any[], property: string): Record<string, number> {
    return items.reduce((groups, item) => {
      const key = item[property] || 'unknown';
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const crawler = new EnhancedLocalCrawler();
    await crawler.crawl();
    
    console.log('\n🎉 Enhanced crawling completed successfully!');
    console.log('📁 Check the scraped_data/enhanced directory for results');
    
  } catch (error) {
    console.error('\n💥 Enhanced crawling failed:', error);
    process.exit(1);
  }
}

// Run the crawler
main();
