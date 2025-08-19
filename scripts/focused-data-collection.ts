#!/usr/bin/env tsx

/**
 * Focused Bolton Council Data Collection Script
 * 
 * This script performs a focused crawl of key Bolton Council pages
 * to quickly populate the database with essential data for demonstrations.
 * 
 * Features:
 * - Incremental data saving
 * - Limited scope for faster completion
 * - Progress preservation if interrupted
 * - Real-time data export
 */

import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { URL } from 'url';

interface CrawlResult {
  url: string;
  title: string;
  description: string;
  content: string;
  dataType: string;
  category: string;
  metadata: any;
  extractedData: any;
  crawledAt: Date;
  quality: number;
}

interface CrawlStats {
  totalUrls: number;
  processedUrls: number;
  failedUrls: number;
  dataTypes: { [key: string]: number };
  categories: { [key: string]: number };
  totalContent: number;
  averageQuality: number;
  startTime: Date;
  endTime?: Date;
}

class FocusedBoltonCrawler {
  private results: CrawlResult[] = [];
  private visitedUrls = new Set<string>();
  private urlQueue: string[] = [];
  private stats: CrawlStats;
  private outputDir: string;
  private saveInterval: number = 10; // Save every 10 pages

  constructor() {
    this.stats = {
      totalUrls: 0,
      processedUrls: 0,
      failedUrls: 0,
      dataTypes: {},
      categories: {},
      totalContent: 0,
      averageQuality: 0,
      startTime: new Date()
    };
    this.outputDir = './focused-bolton-data';
  }

  async start(): Promise<void> {
    console.log('🚀 Starting Focused Bolton Council Data Collection');
    console.log('=================================================');
    console.log(`📅 Started at: ${this.stats.startTime.toISOString()}`);
    console.log('📋 Target: 100 high-quality pages with real council data');
    console.log('');

    try {
      // Create output directory
      await this.setupOutputDirectory();

      // Initialize with focused seed URLs
      await this.initializeFocusedSeeds();

      // Process URLs with incremental saving
      await this.processUrlsWithSaving();

      // Generate final reports
      await this.generateReports();

      this.stats.endTime = new Date();
      const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();

      console.log('\n🎉 Focused Data Collection Completed!');
      console.log('=====================================');
      console.log(`⏱️  Total time: ${Math.round(duration / 1000 / 60)} minutes`);
      console.log(`📊 URLs processed: ${this.stats.processedUrls}`);
      console.log(`📄 Pages collected: ${this.results.length}`);
      console.log(`💾 Total content: ${Math.round(this.stats.totalContent / 1024 / 1024)}MB`);
      console.log(`⭐ Average quality: ${Math.round(this.stats.averageQuality * 100)}%`);
      console.log(`📁 Data saved to: ${this.outputDir}`);

    } catch (error) {
      console.error('❌ Crawl failed:', error);
      // Save what we have before throwing
      await this.saveProgress();
      throw error;
    }
  }

  private async setupOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(path.join(this.outputDir, 'raw-data'), { recursive: true });
      await fs.mkdir(path.join(this.outputDir, 'reports'), { recursive: true });
      console.log(`📁 Output directory created: ${this.outputDir}`);
    } catch (error) {
      console.error('Failed to create output directory:', error);
      throw error;
    }
  }

  private async initializeFocusedSeeds(): Promise<void> {
    console.log('🌱 Initializing focused seed URLs...');

    const focusedSeeds = [
      // Main pages with rich content
      'https://www.bolton.gov.uk',
      'https://www.bolton.gov.uk/council',
      'https://www.bolton.gov.uk/news',

      // Council meetings (high-value data)
      'https://bolton.moderngov.co.uk/mgWhatsNew.aspx?bcr=1',
      'https://bolton.moderngov.co.uk/mgMemberIndex.aspx?bcr=1',
      'https://bolton.moderngov.co.uk/mgCalendarMonthView.aspx?bcr=1',

      // Planning (structured data)
      'https://paplanning.bolton.gov.uk/online-applications/search.do?action=simple&searchType=Application',
      'https://paplanning.bolton.gov.uk/online-applications/search.do?action=weeklyList',

      // Key services with data
      'https://www.bolton.gov.uk/council-tax',
      'https://www.bolton.gov.uk/benefits',
      'https://www.bolton.gov.uk/housing-council-tax',
      'https://www.bolton.gov.uk/business-licensing',

      // Libraries and leisure (good content)
      'https://www.bolton.gov.uk/libraries',
      'https://www.bolton.gov.uk/parks-pitches-courts',

      // Democracy and transparency
      'https://www.bolton.gov.uk/councillors-mayor',
      'https://www.bolton.gov.uk/consultations-petitions',

      // Services with forms and data
      'https://www.bolton.gov.uk/rubbish-recycling',
      'https://www.bolton.gov.uk/planning',
      'https://www.bolton.gov.uk/schools-children',
    ];

    focusedSeeds.forEach(url => {
      if (!this.visitedUrls.has(url)) {
        this.urlQueue.push(url);
        this.stats.totalUrls++;
      }
    });

    console.log(`✅ Added ${focusedSeeds.length} focused seed URLs to queue`);
  }

  private async processUrlsWithSaving(): Promise<void> {
    console.log(`\n🔄 Processing ${this.urlQueue.length} URLs with incremental saving...`);
    console.log('Progress saved every 10 pages processed\n');

    const maxUrls = 100; // Limit to 100 URLs for focused collection
    const delay = 1500; // 1.5 second delay

    while (this.urlQueue.length > 0 && this.stats.processedUrls < maxUrls) {
      const url = this.urlQueue.shift()!;
      
      try {
        console.log(`🔍 Processing (${this.stats.processedUrls + 1}/${Math.min(this.stats.totalUrls, maxUrls)}): ${url}`);

        const response = await this.fetchWithRetry(url);
        if (response) {
          const result = await this.extractDataFromPage(url, response.content, response.contentType);
          
          if (result) {
            this.results.push(result);
            this.updateStats(result);

            // Discover a few new URLs (limited to prevent explosion)
            if (this.stats.totalUrls < maxUrls) {
              const newUrls = this.discoverNewUrls(response.content, url)
                .slice(0, 3); // Limit to 3 new URLs per page
              
              newUrls.forEach(newUrl => {
                if (!this.visitedUrls.has(newUrl) && !this.urlQueue.includes(newUrl)) {
                  this.urlQueue.push(newUrl);
                  this.stats.totalUrls++;
                }
              });
            }
          }
        }

        this.stats.processedUrls++;

        // Save progress incrementally
        if (this.stats.processedUrls % this.saveInterval === 0) {
          await this.saveProgress();
          const quality = Math.round(this.stats.averageQuality * 100);
          console.log(`💾 Progress saved: ${this.results.length} pages, avg quality: ${quality}%`);
        }

        // Delay between requests
        await this.sleep(delay);

      } catch (error) {
        console.error(`❌ Failed to process ${url}:`, error.message);
        this.stats.failedUrls++;
      }
    }

    // Final save
    await this.saveProgress();
    console.log(`\n✅ Processing complete! Collected ${this.results.length} pages.`);
  }

  private async fetchWithRetry(url: string, maxRetries = 2): Promise<{ content: string; contentType: string } | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        const response = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'DNT': '1',
            'Connection': 'keep-alive'
          },
          timeout: 15000 // 15 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || 'text/html';
        const content = await response.text();

        return { content, contentType };

      } catch (error) {
        if (attempt === maxRetries) {
          console.warn(`⚠️  Skipping ${url} after ${maxRetries} attempts: ${error.message}`);
          return null;
        }
        
        await this.sleep(1000 * attempt);
      }
    }

    return null;
  }

  private async extractDataFromPage(url: string, content: string, contentType: string): Promise<CrawlResult | null> {
    if (!content || content.length < 100) {
      return null;
    }

    const $ = cheerio.load(content);

    // Basic page information
    const title = $('title').text().trim() || 'Untitled Page';
    const description = $('meta[name="description"]').attr('content') || 
                      $('meta[property="og:description"]').attr('content') || 
                      $('p').first().text().substring(0, 200) || '';

    // Categorize and type the page
    const category = this.categorizePage(url, title, content);
    const dataType = this.determineDataType(url, title, content, $);

    // Extract structured data
    const extractedData = this.extractStructuredData($, url);

    // Calculate quality score
    const quality = this.calculateQualityScore(title, description, content, extractedData);

    // Generate metadata
    const metadata = {
      url,
      title,
      contentLength: content.length,
      wordCount: content.replace(/<[^>]*>/g, ' ').split(/\s+/).length,
      linkCount: $('a[href]').length,
      imageCount: $('img').length,
      tableCount: $('table').length,
      formCount: $('form').length,
      headingCount: $('h1, h2, h3, h4, h5, h6').length,
      crawledAt: new Date().toISOString()
    };

    return {
      url,
      title,
      description,
      content: content.substring(0, 20000), // Limit content size for performance
      dataType,
      category,
      metadata,
      extractedData,
      crawledAt: new Date(),
      quality
    };
  }

  private discoverNewUrls(content: string, baseUrl: string): string[] {
    const $ = cheerio.load(content);
    const newUrls: string[] = [];

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      try {
        let fullUrl: string;
        if (href.startsWith('http')) {
          fullUrl = href;
        } else if (href.startsWith('//')) {
          fullUrl = 'https:' + href;
        } else {
          fullUrl = new URL(href, baseUrl).toString();
        }

        // Only include Bolton Council URLs
        const urlObj = new URL(fullUrl);
        if (this.isValidBoltonUrl(urlObj.hostname)) {
          newUrls.push(fullUrl);
        }
      } catch {
        // Invalid URL, skip
      }
    });

    return [...new Set(newUrls)].slice(0, 5); // Limit and dedupe
  }

  private isValidBoltonUrl(hostname: string): boolean {
    const validDomains = [
      'bolton.gov.uk',
      'www.bolton.gov.uk',
      'paplanning.bolton.gov.uk',
      'bolton.moderngov.co.uk'
    ];

    return validDomains.some(domain => hostname.includes(domain));
  }

  private categorizePage(url: string, title: string, content: string): string {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();

    if (urlLower.includes('meeting') || titleLower.includes('meeting') || urlLower.includes('agenda')) {
      return 'Council Meetings';
    }
    if (urlLower.includes('planning') || titleLower.includes('planning')) {
      return 'Planning & Development';
    }
    if (urlLower.includes('council-tax') || titleLower.includes('council tax')) {
      return 'Council Tax';
    }
    if (urlLower.includes('councillor') || titleLower.includes('councillor')) {
      return 'Councillors & Democracy';
    }
    if (urlLower.includes('news') || titleLower.includes('news')) {
      return 'News & Updates';
    }
    if (urlLower.includes('benefit') || titleLower.includes('benefit')) {
      return 'Benefits & Support';
    }
    if (urlLower.includes('housing') || titleLower.includes('housing')) {
      return 'Housing';
    }
    if (urlLower.includes('school') || titleLower.includes('school')) {
      return 'Education & Schools';
    }
    if (urlLower.includes('business') || titleLower.includes('business')) {
      return 'Business & Licensing';
    }
    if (urlLower.includes('library') || titleLower.includes('library')) {
      return 'Libraries & Leisure';
    }

    return 'General';
  }

  private determineDataType(url: string, title: string, content: string, $: cheerio.CheerioAPI): string {
    if (url.includes('moderngov') || title.includes('Meeting') || title.includes('Agenda')) {
      return 'council_meeting';
    }
    if (url.includes('planning') && url.includes('application')) {
      return 'planning_application';
    }
    if (content.includes('Councillor') || url.includes('councillor')) {
      return 'councillor';
    }
    if (content.includes('£') || url.includes('tax') || url.includes('benefit')) {
      return 'financial_info';
    }
    if ($('table').length > 0) {
      return 'data_table';
    }
    if ($('form').length > 0) {
      return 'service_form';
    }

    return 'council_page';
  }

  private extractStructuredData($: cheerio.CheerioAPI, url: string): any {
    const structured: any = {};

    // Extract tables
    if ($('table').length > 0) {
      structured.tables = [];
      $('table').slice(0, 3).each((_, table) => { // Limit to 3 tables
        const tableData: any = { headers: [], rows: [] };
        
        $(table).find('th').each((_, th) => {
          tableData.headers.push($(th).text().trim());
        });
        
        $(table).find('tr').slice(0, 10).each((_, tr) => { // Limit to 10 rows
          const row: string[] = [];
          $(tr).find('td').each((_, td) => {
            row.push($(td).text().trim());
          });
          if (row.length > 0) {
            tableData.rows.push(row);
          }
        });
        
        if (tableData.headers.length > 0 || tableData.rows.length > 0) {
          structured.tables.push(tableData);
        }
      });
    }

    // Extract contact information
    const contacts: string[] = [];
    $('a[href^="mailto:"]').each((_, element) => {
      contacts.push($(element).attr('href')!.replace('mailto:', ''));
    });
    if (contacts.length > 0) {
      structured.contacts = contacts.slice(0, 5); // Limit
    }

    // Extract dates
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g;
    const dates = $.text().match(dateRegex);
    if (dates && dates.length > 0) {
      structured.dates = [...new Set(dates)].slice(0, 10); // Limit and dedupe
    }

    // Extract financial amounts
    const amountRegex = /£[\d,]+\.?\d*/g;
    const amounts = $.text().match(amountRegex);
    if (amounts && amounts.length > 0) {
      structured.amounts = [...new Set(amounts)].slice(0, 10); // Limit and dedupe
    }

    return structured;
  }

  private calculateQualityScore(title: string, description: string, content: string, extractedData: any): number {
    let score = 0;

    // Title quality (0-25 points)
    if (title.length > 10) score += 10;
    if (title.length > 30) score += 15;

    // Description quality (0-20 points)
    if (description.length > 50) score += 10;
    if (description.length > 150) score += 10;

    // Content quality (0-30 points)
    if (content.length > 1000) score += 10;
    if (content.length > 5000) score += 20;

    // Structured data quality (0-25 points)
    if (extractedData.tables && extractedData.tables.length > 0) score += 10;
    if (extractedData.contacts && extractedData.contacts.length > 0) score += 5;
    if (extractedData.dates && extractedData.dates.length > 0) score += 5;
    if (extractedData.amounts && extractedData.amounts.length > 0) score += 5;

    return Math.min(100, score) / 100;
  }

  private updateStats(result: CrawlResult): void {
    // Update data type counts
    this.stats.dataTypes[result.dataType] = (this.stats.dataTypes[result.dataType] || 0) + 1;

    // Update category counts
    this.stats.categories[result.category] = (this.stats.categories[result.category] || 0) + 1;

    // Update content stats
    this.stats.totalContent += result.content.length;

    // Update quality average
    const currentAvg = this.stats.averageQuality;
    const count = this.results.length;
    this.stats.averageQuality = (currentAvg * (count - 1) + result.quality) / count;
  }

  private async saveProgress(): Promise<void> {
    try {
      // Save complete dataset
      await fs.writeFile(
        path.join(this.outputDir, 'raw-data', 'dataset.json'),
        JSON.stringify(this.results, null, 2)
      );

      // Save statistics
      await fs.writeFile(
        path.join(this.outputDir, 'crawl-stats.json'),
        JSON.stringify(this.stats, null, 2)
      );

      // Save individual categories
      for (const category of Object.keys(this.stats.categories)) {
        const categoryData = this.results.filter(r => r.category === category);
        const filename = category.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.json';
        await fs.writeFile(
          path.join(this.outputDir, 'raw-data', filename),
          JSON.stringify(categoryData, null, 2)
        );
      }

    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  private async generateReports(): Promise<void> {
    console.log('\n📊 Generating reports...');

    const summaryReport = {
      collectionInfo: {
        startTime: this.stats.startTime,
        endTime: this.stats.endTime,
        totalUrls: this.stats.totalUrls,
        processedUrls: this.stats.processedUrls,
        failedUrls: this.stats.failedUrls,
        successRate: Math.round((this.stats.processedUrls / this.stats.totalUrls) * 100)
      },
      contentAnalysis: {
        totalPages: this.results.length,
        totalContentKB: Math.round(this.stats.totalContent / 1024),
        averageQuality: Math.round(this.stats.averageQuality * 100),
        dataTypeBreakdown: this.stats.dataTypes,
        categoryBreakdown: this.stats.categories
      },
      topQualityPages: this.results
        .sort((a, b) => b.quality - a.quality)
        .slice(0, 10)
        .map(r => ({
          url: r.url,
          title: r.title,
          category: r.category,
          quality: Math.round(r.quality * 100)
        }))
    };

    await fs.writeFile(
      path.join(this.outputDir, 'reports', 'summary.json'),
      JSON.stringify(summaryReport, null, 2)
    );

    console.log('✅ Reports generated!');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const crawler = new FocusedBoltonCrawler();
  
  try {
    await crawler.start();
    
    console.log('\n🎯 Focused Data Collection Complete!');
    console.log('====================================');
    console.log('Ready for:');
    console.log('• Launch demonstrations');
    console.log('• Search functionality testing');
    console.log('• Data visualization');
    console.log('• API development');
    
  } catch (error) {
    console.error('❌ Collection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Received shutdown signal. Saving progress...');
  process.exit(0);
});

// Run immediately
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
