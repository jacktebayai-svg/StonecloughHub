#!/usr/bin/env tsx

/**
 * Comprehensive Bolton Council Data Collection Script
 * 
 * This script performs an initial, comprehensive crawl of all Bolton Council
 * websites and portals to populate the database with real, live data for
 * launch demonstrations and presentations.
 * 
 * Coverage includes:
 * - Main Bolton Council website (www.bolton.gov.uk)
 * - Planning Portal (paplanning.bolton.gov.uk)
 * - ModernGov meetings system (bolton.moderngov.co.uk)
 * - Public-i video portal (bolton.public-i.tv)
 * - Open data sources and feeds
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

class ComprehensiveBoltonCrawler {
  private results: CrawlResult[] = [];
  private visitedUrls = new Set<string>();
  private urlQueue: string[] = [];
  private stats: CrawlStats;
  private outputDir: string;

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
    this.outputDir = './comprehensive-bolton-data';
  }

  async start(): Promise<void> {
    console.log('🚀 Starting Comprehensive Bolton Council Data Collection');
    console.log('=====================================================');
    console.log(`📅 Started at: ${this.stats.startTime.toISOString()}`);
    console.log('');

    try {
      // Create output directory
      await this.setupOutputDirectory();

      // Initialize with seed URLs
      await this.initializeSeedUrls();

      // Process all URLs in the queue
      await this.processUrlQueue();

      // Generate comprehensive reports and visualizations
      await this.generateComprehensiveReports();

      // Save all data
      await this.saveAllData();

      this.stats.endTime = new Date();
      const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();

      console.log('\n🎉 Comprehensive Data Collection Completed!');
      console.log('==========================================');
      console.log(`⏱️  Total time: ${Math.round(duration / 1000 / 60)} minutes`);
      console.log(`📊 URLs processed: ${this.stats.processedUrls}`);
      console.log(`📄 Pages collected: ${this.results.length}`);
      console.log(`💾 Total content: ${Math.round(this.stats.totalContent / 1024 / 1024)}MB`);
      console.log(`⭐ Average quality: ${Math.round(this.stats.averageQuality * 100)}%`);
      console.log(`📁 Data saved to: ${this.outputDir}`);

    } catch (error) {
      console.error('❌ Crawl failed:', error);
      throw error;
    }
  }

  private async setupOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(path.join(this.outputDir, 'raw-data'), { recursive: true });
      await fs.mkdir(path.join(this.outputDir, 'reports'), { recursive: true });
      await fs.mkdir(path.join(this.outputDir, 'visualizations'), { recursive: true });
      console.log(`📁 Output directory created: ${this.outputDir}`);
    } catch (error) {
      console.error('Failed to create output directory:', error);
      throw error;
    }
  }

  private async initializeSeedUrls(): Promise<void> {
    console.log('🌱 Initializing seed URLs...');

    const seedUrls = [
      // Main Bolton Council website sections
      'https://www.bolton.gov.uk',
      'https://www.bolton.gov.uk/council-and-democracy',
      'https://www.bolton.gov.uk/council-and-democracy/meetings-agendas-and-minutes',
      'https://www.bolton.gov.uk/council-and-democracy/councillors',
      'https://www.bolton.gov.uk/environment-and-planning',
      'https://www.bolton.gov.uk/environment-and-planning/planning-applications',
      'https://www.bolton.gov.uk/environment-and-planning/local-plan',
      'https://www.bolton.gov.uk/transparency-and-performance',
      'https://www.bolton.gov.uk/council-tax',
      'https://www.bolton.gov.uk/benefits-grants-and-support',
      'https://www.bolton.gov.uk/business-and-licensing',
      'https://www.bolton.gov.uk/consultations-and-surveys',

      // ModernGov meetings system
      'https://bolton.moderngov.co.uk/mgWhatsNew.aspx?bcr=1',
      'https://bolton.moderngov.co.uk/ieDocHome.aspx?bcr=1',
      'https://bolton.moderngov.co.uk/mgMemberIndex.aspx?bcr=1',
      'https://bolton.moderngov.co.uk/mgCalendarMonthView.aspx?bcr=1',

      // Planning portal
      'https://paplanning.bolton.gov.uk/online-applications/search.do?action=simple&searchType=Application',
      'https://paplanning.bolton.gov.uk/online-applications/search.do?action=weeklyList',

      // Open data and transparency
      'https://www.bolton.gov.uk/transparency-and-performance/spending',
      'https://www.bolton.gov.uk/transparency-and-performance/foi-requests',
      'https://www.bolton.gov.uk/transparency-and-performance/performance-data',

      // Services and departments
      'https://www.bolton.gov.uk/children-young-people-and-families',
      'https://www.bolton.gov.uk/health-and-adult-social-care',
      'https://www.bolton.gov.uk/housing',
      'https://www.bolton.gov.uk/leisure-and-culture',
      'https://www.bolton.gov.uk/libraries',
      'https://www.bolton.gov.uk/schools-learning-and-careers',
      'https://www.bolton.gov.uk/transport-roads-and-travel',
      'https://www.bolton.gov.uk/waste-and-recycling'
    ];

    // Add seed URLs to queue
    seedUrls.forEach(url => {
      if (!this.visitedUrls.has(url)) {
        this.urlQueue.push(url);
        this.stats.totalUrls++;
      }
    });

    console.log(`✅ Added ${seedUrls.length} seed URLs to queue`);
  }

  private async processUrlQueue(): Promise<void> {
    console.log(`\n🔄 Processing ${this.urlQueue.length} URLs...`);
    console.log('Progress will be shown every 10 pages\n');

    let concurrent = 0;
    const maxConcurrent = 3;
    const delay = 2000; // 2 second delay between requests

    while (this.urlQueue.length > 0 || concurrent > 0) {
      // Start new requests up to max concurrent limit
      while (concurrent < maxConcurrent && this.urlQueue.length > 0) {
        const url = this.urlQueue.shift()!;
        concurrent++;

        this.processUrl(url)
          .then(() => {
            concurrent--;
            
            // Progress update
            if (this.stats.processedUrls % 10 === 0) {
              const progress = Math.round((this.stats.processedUrls / this.stats.totalUrls) * 100);
              console.log(`📈 Progress: ${this.stats.processedUrls}/${this.stats.totalUrls} (${progress}%)`);
            }
          })
          .catch(error => {
            concurrent--;
            console.error(`❌ Error processing URL: ${error.message}`);
          });

        // Delay between starting requests
        if (this.urlQueue.length > 0) {
          await this.sleep(delay);
        }
      }

      // Wait a bit before checking again
      if (concurrent >= maxConcurrent) {
        await this.sleep(1000);
      }
    }

    console.log(`\n✅ All URLs processed!`);
  }

  private async processUrl(url: string): Promise<void> {
    if (this.visitedUrls.has(url)) {
      return;
    }

    this.visitedUrls.add(url);

    try {
      console.log(`🔍 Processing: ${url}`);

      // Fetch the page
      const response = await this.fetchWithRetry(url);
      if (!response) {
        this.stats.failedUrls++;
        return;
      }

      const { content, contentType } = response;

      // Extract data from the page
      const result = await this.extractDataFromPage(url, content, contentType);
      
      if (result) {
        this.results.push(result);
        this.updateStats(result);

        // Discover new URLs if we haven't found too many yet
        if (this.stats.totalUrls < 1000) { // Cap at 1000 URLs
          const newUrls = this.discoverNewUrls(content, url);
          newUrls.forEach(newUrl => {
            if (!this.visitedUrls.has(newUrl) && !this.urlQueue.includes(newUrl)) {
              this.urlQueue.push(newUrl);
              this.stats.totalUrls++;
            }
          });
        }
      }

      this.stats.processedUrls++;

    } catch (error) {
      console.error(`Failed to process ${url}:`, error.message);
      this.stats.failedUrls++;
    }
  }

  private async fetchWithRetry(url: string, maxRetries = 3): Promise<{ content: string; contentType: string } | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const userAgents = [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
        ];

        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

        const response = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 30000
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || 'text/html';
        const content = await response.text();

        return { content, contentType };

      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`Failed to fetch ${url} after ${maxRetries} attempts:`, error.message);
          return null;
        }
        
        console.warn(`Attempt ${attempt} failed for ${url}, retrying...`);
        await this.sleep(1000 * attempt); // Progressive backoff
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

    // Categorize the page
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
      lastModified: $('meta[name="last-modified"]').attr('content') || null,
      author: $('meta[name="author"]').attr('content') || null,
      keywords: $('meta[name="keywords"]').attr('content') || null,
      crawledAt: new Date().toISOString()
    };

    return {
      url,
      title,
      description,
      content: content.substring(0, 50000), // Limit content size
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
    const baseUrlObj = new URL(baseUrl);

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

    return [...new Set(newUrls)]; // Remove duplicates
  }

  private isValidBoltonUrl(hostname: string): boolean {
    const validDomains = [
      'bolton.gov.uk',
      'www.bolton.gov.uk',
      'paplanning.bolton.gov.uk',
      'bolton.moderngov.co.uk',
      'bolton.public-i.tv'
    ];

    return validDomains.some(domain => hostname.includes(domain));
  }

  private categorizePage(url: string, title: string, content: string): string {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    if (urlLower.includes('meeting') || titleLower.includes('meeting') || urlLower.includes('agenda')) {
      return 'Council Meetings';
    }
    if (urlLower.includes('planning') || titleLower.includes('planning')) {
      return 'Planning & Development';
    }
    if (urlLower.includes('council-tax') || titleLower.includes('council tax')) {
      return 'Council Tax';
    }
    if (urlLower.includes('transparency') || urlLower.includes('spending') || urlLower.includes('foi')) {
      return 'Transparency & Performance';
    }
    if (urlLower.includes('councillor') || titleLower.includes('councillor')) {
      return 'Councillors & Democracy';
    }
    if (urlLower.includes('service') || urlLower.includes('department')) {
      return 'Council Services';
    }
    if (urlLower.includes('consultation') || urlLower.includes('survey')) {
      return 'Consultations';
    }
    if (urlLower.includes('news') || urlLower.includes('press')) {
      return 'News & Updates';
    }
    if (urlLower.includes('housing') || titleLower.includes('housing')) {
      return 'Housing';
    }
    if (urlLower.includes('education') || urlLower.includes('school') || titleLower.includes('education')) {
      return 'Education & Schools';
    }
    if (urlLower.includes('health') || titleLower.includes('health')) {
      return 'Health & Social Care';
    }
    if (urlLower.includes('business') || titleLower.includes('business')) {
      return 'Business & Licensing';
    }

    return 'General';
  }

  private determineDataType(url: string, title: string, content: string, $: cheerio.CheerioAPI): string {
    if (url.includes('moderngov') || title.includes('Meeting') || title.includes('Agenda')) {
      return 'council_meeting';
    }
    if (url.includes('planning') && (url.includes('application') || content.includes('Planning Application'))) {
      return 'planning_application';
    }
    if (content.includes('Councillor') || url.includes('councillor')) {
      return 'councillor';
    }
    if (content.includes('£') || url.includes('spending') || url.includes('budget')) {
      return 'budget_item';
    }
    if ($('table').length > 0 && (content.includes('data') || url.includes('transparency'))) {
      return 'transparency_data';
    }
    if (url.includes('consultation') || title.includes('Consultation')) {
      return 'consultation';
    }
    if (url.includes('.pdf') || title.includes('Document') || title.includes('Report')) {
      return 'policy_document';
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
      $('table').each((_, table) => {
        const tableData: any = { headers: [], rows: [] };
        
        $(table).find('th').each((_, th) => {
          tableData.headers.push($(th).text().trim());
        });
        
        $(table).find('tr').each((_, tr) => {
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
      structured.contacts = contacts;
    }

    // Extract phone numbers
    const phones: string[] = [];
    $('a[href^="tel:"]').each((_, element) => {
      phones.push($(element).attr('href')!.replace('tel:', ''));
    });
    if (phones.length > 0) {
      structured.phones = phones;
    }

    // Extract dates
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g;
    const dates = $.text().match(dateRegex);
    if (dates && dates.length > 0) {
      structured.dates = [...new Set(dates)];
    }

    // Extract financial amounts
    const amountRegex = /£[\d,]+\.?\d*/g;
    const amounts = $.text().match(amountRegex);
    if (amounts && amounts.length > 0) {
      structured.amounts = [...new Set(amounts)];
    }

    // Extract document links
    const documents: string[] = [];
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')!;
      if (href.includes('.pdf') || href.includes('.doc') || href.includes('.csv')) {
        documents.push(href);
      }
    });
    if (documents.length > 0) {
      structured.documents = documents;
    }

    return structured;
  }

  private calculateQualityScore(title: string, description: string, content: string, extractedData: any): number {
    let score = 0;

    // Title quality (0-25 points)
    if (title.length > 10) score += 10;
    if (title.length > 30) score += 10;
    if (!title.includes('Untitled')) score += 5;

    // Description quality (0-20 points)
    if (description.length > 50) score += 10;
    if (description.length > 150) score += 10;

    // Content quality (0-30 points)
    if (content.length > 1000) score += 10;
    if (content.length > 5000) score += 10;
    const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).length;
    if (wordCount > 200) score += 10;

    // Structured data quality (0-25 points)
    if (extractedData.tables && extractedData.tables.length > 0) score += 8;
    if (extractedData.contacts && extractedData.contacts.length > 0) score += 5;
    if (extractedData.dates && extractedData.dates.length > 0) score += 4;
    if (extractedData.amounts && extractedData.amounts.length > 0) score += 4;
    if (extractedData.documents && extractedData.documents.length > 0) score += 4;

    return Math.min(100, score) / 100; // Return as 0-1 score
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

  private async generateComprehensiveReports(): Promise<void> {
    console.log('\n📊 Generating comprehensive reports...');

    // 1. Summary Report
    const summaryReport = {
      collectionInfo: {
        startTime: this.stats.startTime,
        endTime: this.stats.endTime,
        duration: this.stats.endTime ? 
          Math.round((this.stats.endTime.getTime() - this.stats.startTime.getTime()) / 1000 / 60) : 0,
        totalUrls: this.stats.totalUrls,
        processedUrls: this.stats.processedUrls,
        failedUrls: this.stats.failedUrls,
        successRate: Math.round((this.stats.processedUrls / this.stats.totalUrls) * 100)
      },
      contentAnalysis: {
        totalPages: this.results.length,
        totalContentMB: Math.round(this.stats.totalContent / 1024 / 1024),
        averageQuality: Math.round(this.stats.averageQuality * 100),
        dataTypeBreakdown: this.stats.dataTypes,
        categoryBreakdown: this.stats.categories
      },
      insights: this.generateInsights()
    };

    await fs.writeFile(
      path.join(this.outputDir, 'reports', 'summary-report.json'),
      JSON.stringify(summaryReport, null, 2)
    );

    // 2. Detailed Data Analysis
    const detailedAnalysis = {
      topQualityPages: this.results
        .sort((a, b) => b.quality - a.quality)
        .slice(0, 20)
        .map(r => ({
          url: r.url,
          title: r.title,
          category: r.category,
          quality: Math.round(r.quality * 100),
          contentLength: r.content.length
        })),
      
      dataRichPages: this.results
        .filter(r => Object.keys(r.extractedData).length > 0)
        .sort((a, b) => Object.keys(b.extractedData).length - Object.keys(a.extractedData).length)
        .slice(0, 20)
        .map(r => ({
          url: r.url,
          title: r.title,
          category: r.category,
          extractedDataTypes: Object.keys(r.extractedData),
          dataPointCount: Object.keys(r.extractedData).length
        })),

      categoryAnalysis: Object.entries(this.stats.categories).map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / this.results.length) * 100),
        averageQuality: Math.round(
          this.results
            .filter(r => r.category === category)
            .reduce((sum, r) => sum + r.quality, 0) / count * 100
        )
      }))
    };

    await fs.writeFile(
      path.join(this.outputDir, 'reports', 'detailed-analysis.json'),
      JSON.stringify(detailedAnalysis, null, 2)
    );

    // 3. Generate CSV exports for easy analysis
    await this.generateCsvExports();

    console.log('✅ Reports generated successfully!');
  }

  private generateInsights(): string[] {
    const insights: string[] = [];
    
    const totalPages = this.results.length;
    const highQualityPages = this.results.filter(r => r.quality > 0.8).length;
    
    insights.push(`Collected ${totalPages} pages across ${Object.keys(this.stats.categories).length} categories`);
    insights.push(`${Math.round((highQualityPages / totalPages) * 100)}% of pages are high-quality (80%+ score)`);
    
    const topCategory = Object.entries(this.stats.categories)
      .sort(([,a], [,b]) => b - a)[0];
    if (topCategory) {
      insights.push(`Most content found in "${topCategory[0]}" category (${topCategory[1]} pages)`);
    }
    
    const structuredDataPages = this.results.filter(r => 
      Object.keys(r.extractedData).length > 0
    ).length;
    insights.push(`${Math.round((structuredDataPages / totalPages) * 100)}% of pages contain structured data`);
    
    return insights;
  }

  private async generateCsvExports(): Promise<void> {
    // Pages overview CSV
    const pagesData = this.results.map(r => ({
      URL: r.url,
      Title: r.title.replace(/,/g, ';'), // Replace commas to avoid CSV issues
      Category: r.category,
      'Data Type': r.dataType,
      'Quality Score': Math.round(r.quality * 100),
      'Content Length': r.content.length,
      'Word Count': r.metadata.wordCount,
      'Links': r.metadata.linkCount,
      'Tables': r.metadata.tableCount,
      'Forms': r.metadata.formCount,
      'Crawled At': r.crawledAt.toISOString()
    }));

    const pagesCSV = this.convertToCSV(pagesData);
    await fs.writeFile(path.join(this.outputDir, 'reports', 'pages-overview.csv'), pagesCSV);

    // Category summary CSV
    const categoryData = Object.entries(this.stats.categories).map(([category, count]) => ({
      Category: category,
      'Page Count': count,
      'Percentage': Math.round((count / this.results.length) * 100),
      'Average Quality': Math.round(
        this.results
          .filter(r => r.category === category)
          .reduce((sum, r) => sum + r.quality, 0) / count * 100
      )
    }));

    const categoryCSV = this.convertToCSV(categoryData);
    await fs.writeFile(path.join(this.outputDir, 'reports', 'category-summary.csv'), categoryCSV);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  private async saveAllData(): Promise<void> {
    console.log('💾 Saving all collected data...');

    // Save complete dataset
    await fs.writeFile(
      path.join(this.outputDir, 'raw-data', 'complete-dataset.json'),
      JSON.stringify(this.results, null, 2)
    );

    // Save individual categories
    for (const category of Object.keys(this.stats.categories)) {
      const categoryData = this.results.filter(r => r.category === category);
      await fs.writeFile(
        path.join(this.outputDir, 'raw-data', `${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`),
        JSON.stringify(categoryData, null, 2)
      );
    }

    // Save crawl statistics
    await fs.writeFile(
      path.join(this.outputDir, 'crawl-stats.json'),
      JSON.stringify(this.stats, null, 2)
    );

    console.log('✅ All data saved successfully!');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const crawler = new ComprehensiveBoltonCrawler();
  
  try {
    await crawler.start();
    
    console.log('\n🎯 Launch-Ready Data Collection Complete!');
    console.log('========================================');
    console.log('Your comprehensive Bolton Council database is ready for:');
    console.log('• Launch demonstrations and presentations');
    console.log('• Data visualization and analytics');
    console.log('• Search and discovery showcasing');
    console.log('• API integration examples');
    console.log('• Performance and capability metrics');
    console.log('');
    console.log('📁 All data and reports saved to: ./comprehensive-bolton-data/');
    
  } catch (error) {
    console.error('❌ Collection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n🛑 Received shutdown signal. Saving current progress...');
  process.exit(0);
});

// Run immediately when the file is executed
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
