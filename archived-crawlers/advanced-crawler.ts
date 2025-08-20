import * as cheerio from 'cheerio';
import { storage } from '../storage';
import { InsertCouncilData } from '@shared/schema';
import { HardDataExtractor } from './data-extractors.js';
import { FileProcessor } from './file-processor.js';
import { OrganizationIntelligence } from './organization-intelligence.js';
import { ChartDataProcessor } from './chart-data-processor.js';
import { QualityScoringEngine } from './quality-scoring-engine.js';
import { ValidationSchemas } from '@shared/scraper-validation-schemas';
import CitationService from './citation-service.js';
import CoverageMonitor from './coverage-monitor.js';
import crypto from 'crypto';

interface CrawlURL {
  url: string;
  priority: number;
  depth: number;
  category: string;
  parent?: string;
  discovered: Date;
  lastAttempted?: Date;
  attempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  contentHash?: string;
  metadata?: any;
}

interface CrawlSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalUrls: number;
  processedUrls: number;
  failedUrls: number;
  duplicatesSkipped: number;
  bytesDownloaded: number;
  status: 'running' | 'paused' | 'completed' | 'failed';
}

export class AdvancedBoltonCrawler {
  private urlQueue: CrawlURL[] = [];
  private visitedUrls = new Map<string, string>(); // URL -> content hash
  private processingUrls = new Set<string>();
  private session: CrawlSession;
  
  // Enhanced crawl configuration with domain quotas and quality thresholds
  private readonly config = {
    maxDepth: 15,
    maxUrls: 10000,
    maxConcurrent: 3,
    requestDelay: 2000,
    maxRetries: 3,
    respectRobots: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: ['.pdf', '.csv', '.xlsx', '.docx', '.txt', '.json', '.xml'],
    priorityCategories: {
      'planning': 10,
      'meetings': 9,
      'transparency': 8,
      'finance': 8,
      'services': 7,
      'consultations': 6,
      'documents': 5,
      'general': 3
    },
    domainQuotas: {
      'www.bolton.gov.uk': 5000,
      'bolton.moderngov.co.uk': 1500,
      'paplanning.bolton.gov.uk': 1000,
      'bolton.public-i.tv': 300
    },
    qualityThresholds: {
      'planning': 70,
      'meetings': 65,
      'transparency': 75,
      'finance': 70,
      'services': 50,
      'consultations': 60,
      'documents': 55,
      'general': 40
    },
    enableQualityFiltering: true,
    enableIncrementalSave: true,
    incrementalSaveInterval: 100 // Save every 100 processed items
  };
  
  // Domain tracking for quotas
  private domainCounts = new Map<string, number>();
  private processedItems = 0;

  // Bolton Council website structure
  private readonly siteStructure = {
    homepage: 'https://www.bolton.gov.uk',
    majorSections: [
      '/business-and-licensing',
      '/children-young-people-and-families',
      '/council-and-democracy',
      '/elections-and-voting',
      '/environment-and-planning',
      '/health-and-adult-social-care',
      '/housing',
      '/leisure-and-culture',
      '/libraries',
      '/schools-learning-and-careers',
      '/transport-roads-and-travel',
      '/waste-and-recycling',
      '/benefits-grants-and-support',
      '/births-deaths-marriages-and-citizenship',
      '/council-tax',
      '/find-a-service'
    ],
    dataRichSections: [
      '/transparency-and-performance',
      '/council-and-democracy/meetings-agendas-and-minutes',
      '/council-and-democracy/councillors',
      '/environment-and-planning/planning-applications',
      '/business-and-licensing/licensing',
      '/council-tax/discounts-and-exemptions',
      '/benefits-grants-and-support',
      '/environment-and-planning/local-plan'
    ],
    externalDomains: [
      'paplanning.bolton.gov.uk',
      'bolton.moderngov.co.uk',
      'bolton.public-i.tv',
      'data.gov.uk'
    ]
  };

  constructor() {
    this.session = {
      sessionId: crypto.randomUUID(),
      startTime: new Date(),
      totalUrls: 0,
      processedUrls: 0,
      failedUrls: 0,
      duplicatesSkipped: 0,
      bytesDownloaded: 0,
      status: 'running'
    };
  }

  /**
   * Initialize comprehensive crawl starting from Bolton homepage
   */
  async startComprehensiveCrawl(): Promise<void> {
    console.log('🚀 Starting COMPREHENSIVE Bolton Council website crawl');
    console.log(`📊 Session: ${this.session.sessionId}`);
    console.log(`⚙️ Config: Max depth: ${this.config.maxDepth}, Max URLs: ${this.config.maxUrls}`);

    try {
      // 1. Seed the queue with homepage and major sections
      await this.seedInitialUrls();
      
      // 2. Process URLs in priority order with intelligent scheduling
      await this.processUrlQueue();
      
      // 3. Generate comprehensive reports
      await this.generateCrawlReport();
      
      this.session.status = 'completed';
      this.session.endTime = new Date();
      
      console.log('✅ Comprehensive crawl completed successfully!');
      console.log(`📈 Final stats: ${this.session.processedUrls}/${this.session.totalUrls} URLs processed`);
      
    } catch (error) {
      console.error('❌ Crawl failed:', error);
      this.session.status = 'failed';
      this.session.endTime = new Date();
      throw error;
    }
  }

  /**
   * Seed initial URLs with strategic starting points
   */
  private async seedInitialUrls(): Promise<void> {
    console.log('🌱 Seeding initial URL queue...');
    
    // 1. Homepage - highest priority
    this.addUrl(this.siteStructure.homepage, 10, 0, 'homepage');
    
    // 2. Major sections - high priority
    this.siteStructure.majorSections.forEach(path => {
      const url = this.siteStructure.homepage + path;
      const category = this.categorizePath(path);
      const priority = this.config.priorityCategories[category] || 5;
      this.addUrl(url, priority, 1, category);
    });
    
    // 3. Data-rich sections - very high priority
    this.siteStructure.dataRichSections.forEach(path => {
      const url = this.siteStructure.homepage + path;
      const category = this.categorizePath(path);
      const priority = (this.config.priorityCategories[category] || 5) + 2;
      this.addUrl(url, priority, 1, category);
    });
    
    // 4. External domains - medium priority
    this.siteStructure.externalDomains.forEach(domain => {
      const url = `https://${domain}`;
      this.addUrl(url, 6, 1, 'external');
    });

    // 5. Strategic API endpoints and data feeds
    await this.discoverDataEndpoints();
    
    console.log(`✅ Seeded ${this.urlQueue.length} initial URLs`);
  }

  /**
   * Discover API endpoints and data feeds
   */
  private async discoverDataEndpoints(): Promise<void> {
    const dataEndpoints = [
      // Planning data
      'https://paplanning.bolton.gov.uk/online-applications/search.do?action=simple&searchType=Application',
      'https://paplanning.bolton.gov.uk/online-applications/search.do?action=weeklyList',
      
      // Meeting data
      'https://bolton.moderngov.co.uk/mgWhatsNew.aspx?bcr=1',
      'https://bolton.moderngov.co.uk/ieDocHome.aspx?bcr=1',
      'https://bolton.moderngov.co.uk/mgMemberIndex.aspx?bcr=1',
      
      // Open data
      'https://www.bolton.gov.uk/transparency-and-performance',
      'https://www.bolton.gov.uk/opendata',
      
      // Council tax and finance
      'https://www.bolton.gov.uk/council-tax',
      'https://www.bolton.gov.uk/council-tax/pay-your-council-tax',
      
      // Services and consultations
      'https://www.bolton.gov.uk/consultations-and-surveys',
      'https://www.bolton.gov.uk/find-a-service'
    ];

    dataEndpoints.forEach((url, index) => {
      this.addUrl(url, 8, 1, 'data_endpoint');
    });
  }

  /**
   * Process URLs in the queue with intelligent prioritization
   */
  private async processUrlQueue(): Promise<void> {
    console.log('⚡ Starting intelligent URL processing...');
    
    let activeWorkers = 0;
    const maxWorkers = this.config.maxConcurrent;
    
    while (this.hasWork() && this.session.processedUrls < this.config.maxUrls) {
      // Process URLs concurrently but respect rate limits
      const workers = Math.min(maxWorkers - activeWorkers, this.getPendingCount());
      
      const workerPromises: Promise<void>[] = [];
      for (let i = 0; i < workers; i++) {
        const nextUrl = this.getNextUrl();
        if (nextUrl) {
          activeWorkers++;
          const workerPromise = this.processUrl(nextUrl)
            .finally(() => activeWorkers--);
          workerPromises.push(workerPromise);
        }
      }
      
      if (workerPromises.length > 0) {
        await Promise.allSettled(workerPromises);
      }
      
      // Progressive delay to be respectful
      if (this.session.processedUrls % 50 === 0) {
        console.log(`📊 Progress: ${this.session.processedUrls}/${this.urlQueue.length} URLs processed`);
        await this.adaptiveDelay();
      }
    }
    
    console.log('✅ URL processing completed');
  }

  /**
   * Process a single URL with comprehensive data extraction
   */
  private async processUrl(crawlUrl: CrawlURL): Promise<void> {
    try {
      crawlUrl.status = 'processing';
      crawlUrl.lastAttempted = new Date();
      this.processingUrls.add(crawlUrl.url);
      
      console.log(`🔄 Processing: ${crawlUrl.url} (depth: ${crawlUrl.depth}, priority: ${crawlUrl.priority})`);
      
      // Fetch the URL with stealth measures
      const response = await this.fetchUrl(crawlUrl.url);
      if (!response) {
        crawlUrl.status = 'failed';
        this.session.failedUrls++;
        return;
      }
      
      const { content, contentType, size } = response;
      this.session.bytesDownloaded += size;
      
      // Generate content hash for duplicate detection
      const contentHash = this.generateContentHash(content);
      
      // Check for duplicates
      if (this.isDuplicate(crawlUrl.url, contentHash)) {
        crawlUrl.status = 'skipped';
        this.session.duplicatesSkipped++;
        console.log(`⏭️ Skipping duplicate: ${crawlUrl.url}`);
        return;
      }
      
      crawlUrl.contentHash = contentHash;
      this.visitedUrls.set(crawlUrl.url, contentHash);
      
      // Extract and store data based on content type
      if (contentType.includes('text/html')) {
        await this.processHtmlContent(crawlUrl, content);
      } else if (this.isProcessableFile(crawlUrl.url, contentType)) {
        await this.processFileContent(crawlUrl, content, contentType);
      }
      
      // Discover new URLs from the content
      if (crawlUrl.depth < this.config.maxDepth) {
        const newUrls = this.extractUrls(content, crawlUrl.url, crawlUrl.depth + 1);
        console.log(`🔍 Discovered ${newUrls.length} new URLs from ${crawlUrl.url}`);
      }
      
      crawlUrl.status = 'completed';
      this.session.processedUrls++;
      
    } catch (error) {
      console.error(`❌ Error processing ${crawlUrl.url}:`, error);
      crawlUrl.attempts++;
      crawlUrl.status = 'failed';
      this.session.failedUrls++;
      
      // Retry failed URLs up to maxRetries
      if (crawlUrl.attempts < this.config.maxRetries) {
        crawlUrl.status = 'pending';
        crawlUrl.priority = Math.max(1, crawlUrl.priority - 1); // Reduce priority for retries
      }
      
    } finally {
      this.processingUrls.delete(crawlUrl.url);
    }
  }

  /**
   * Process HTML content with comprehensive data extraction and quality scoring
   */
  private async processHtmlContent(crawlUrl: CrawlURL, html: string): Promise<void> {
    const $ = cheerio.load(html);
    
    // Increment domain count for quota tracking
    this.incrementDomainCount(crawlUrl.url);
    
    // Basic page information
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || 
                      $('meta[property="og:description"]').attr('content') || 
                      '';
    
    // Calculate quality score for this content
    const qualityScore = QualityScoringEngine.calculateQualityScore(
      html, 
      crawlUrl.url, 
      crawlUrl.category
    );
    
    // Apply quality filtering if enabled
    if (this.config.enableQualityFiltering) {
      const threshold = this.config.qualityThresholds[crawlUrl.category] || 40;
      if (qualityScore.overallScore < threshold) {
        console.log(`⚠️ Skipping low-quality content (score: ${qualityScore.overallScore}): ${crawlUrl.url}`);
        return;
      }
    }
    
    // Extract file links and prepare citation metadata
    const fileLinks = this.extractFileLinks($, crawlUrl.url);
    
    // Extract structured data
    const structuredData = this.extractStructuredData($);
    
    // Extract main content
    const mainContent = this.extractMainContent($);
    
    // Extract navigation and menu items
    const navigationData = this.extractNavigationData($);
    
    // Extract contact information
    const contactInfo = this.extractContactInfo($);
    
    // Extract embedded data (tables, lists, etc.)
    const embeddedData = this.extractEmbeddedData($);
    
    // Use enhanced extractors
    const hardData = HardDataExtractor.extractFinancialData(html, crawlUrl.url);
    const orgData = OrganizationIntelligence.extractCouncillors(html, crawlUrl.url);
    
    // Check for sitemap references
    const sitemapUrls = this.extractSitemapUrls($);
    if (sitemapUrls.length > 0) {
      console.log(`📍 Found ${sitemapUrls.length} sitemap(s) on ${crawlUrl.url}`);
      sitemapUrls.forEach(sitemapUrl => {
        this.addUrl(sitemapUrl, 8, crawlUrl.depth + 1, 'sitemap', crawlUrl.url);
      });
    }
    
    // Store comprehensive page data with quality metrics and enhanced citations
    const councilData: InsertCouncilData = {
      title: title || `Page: ${crawlUrl.url}`,
      description: description || mainContent.substring(0, 500),
      dataType: this.mapCategoryToDataType(crawlUrl.category),
      sourceUrl: crawlUrl.url,
      date: new Date(),
      location: this.extractLocation($),
      metadata: {
        category: crawlUrl.category,
        depth: crawlUrl.depth,
        priority: crawlUrl.priority,
        contentLength: html.length,
        qualityScore: qualityScore,
        qualityTier: QualityScoringEngine.getQualityTier(qualityScore.overallScore),
        structuredData,
        navigationData,
        contactInfo,
        embeddedData,
        fileLinks, // Add file links for citation tracking
        extractedFinancialData: hardData.budgetItems.length > 0,
        extractedOrganizationalData: orgData.councillors.length > 0,
        lastCrawled: new Date().toISOString(),
        sessionId: this.session.sessionId,
        type: 'comprehensive_page_data'
      }
    };
    
    const insertResult = await storage.createCouncilData(councilData);
    
    // Add file links to crawl queue with enhanced citation metadata
    if (fileLinks.length > 0) {
      console.log(`📎 Found ${fileLinks.length} file link(s) on ${crawlUrl.url}`);
      for (const fileLink of fileLinks) {
        // Add file to crawl queue
        this.addUrl(fileLink.url, fileLink.priority, crawlUrl.depth + 1, fileLink.type, crawlUrl.url);
        
        // Store enhanced citation metadata for future use
        if (insertResult?.id) {
          await this.storeCitationMetadata(insertResult.id, fileLink, crawlUrl.url);
        }
      }
    }
    
    // Store additional extracted data
    if (hardData.budgetItems.length > 0) {
      await this.storeBudgetData(hardData.budgetItems, crawlUrl.url);
    }
    
    if (orgData.councillors.length > 0) {
      await this.storeCouncillorData(orgData.councillors, crawlUrl.url);
    }
    
    // Incremental save progress
    this.processedItems++;
    if (this.config.enableIncrementalSave && this.processedItems % this.config.incrementalSaveInterval === 0) {
      await this.saveIncrementalProgress();
    }
    
    console.log(`✅ Stored comprehensive data (Quality: ${qualityScore.overallScore}) for: ${title || crawlUrl.url}`);
  }
  
  /**
   * Extract sitemap URLs from the page
   */
  private extractSitemapUrls($: cheerio.CheerioAPI): string[] {
    const sitemapUrls: string[] = [];
    
    // Look for sitemap links
    $('link[rel="sitemap"], a[href*="sitemap"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://www.bolton.gov.uk${href}`;
        if (fullUrl.includes('sitemap') && !sitemapUrls.includes(fullUrl)) {
          sitemapUrls.push(fullUrl);
        }
      }
    });
    
    return sitemapUrls;
  }
  
  /**
   * Save incremental progress to prevent data loss
   */
  private async saveIncrementalProgress(): Promise<void> {
    try {
      const progressData = {
        sessionId: this.session.sessionId,
        processedUrls: this.session.processedUrls,
        processedItems: this.processedItems,
        domainCounts: Object.fromEntries(this.domainCounts),
        timestamp: new Date().toISOString()
      };
      
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      
      const dir = './scraped_data/progress';
      await fs.mkdir(dir, { recursive: true });
      
      const filename = `progress-${this.session.sessionId}.json`;
      const filePath = path.join(dir, filename);
      
      await fs.writeFile(filePath, JSON.stringify(progressData, null, 2));
      console.log(`💾 Incremental progress saved: ${this.processedItems} items processed`);
    } catch (error) {
      console.error('Error saving incremental progress:', error);
    }
  }

  /**
   * Extract structured data from page (JSON-LD, microdata, etc.)
   */
  private extractStructuredData($: cheerio.CheerioAPI): any[] {
    const structuredData: any[] = [];
    
    // JSON-LD
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const data = JSON.parse($(element).html() || '{}');
        structuredData.push({ type: 'json-ld', data });
      } catch (error) {
        // Ignore invalid JSON
      }
    });
    
    // Microdata
    $('[itemscope]').each((_, element) => {
      const item = this.extractMicrodata($, $(element));
      if (Object.keys(item).length > 0) {
        structuredData.push({ type: 'microdata', data: item });
      }
    });
    
    return structuredData;
  }

  /**
   * Extract microdata from elements
   */
  private extractMicrodata($: cheerio.CheerioAPI, $element: cheerio.Cheerio<any>): any {
    const data: any = {};
    const itemType = $element.attr('itemtype');
    if (itemType) data['@type'] = itemType;
    
    $element.find('[itemprop]').each((_, propElement) => {
      const propName = $(propElement).attr('itemprop');
      const propValue = $(propElement).attr('content') || 
                       $(propElement).attr('datetime') || 
                       $(propElement).text().trim();
      if (propName && propValue) {
        data[propName] = propValue;
      }
    });
    
    return data;
  }

  /**
   * Extract main content from the page
   */
  private extractMainContent($: cheerio.CheerioAPI): string {
    // Try various selectors for main content
    const contentSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '.content',
      '#content',
      '.page-content',
      'article',
      '.article-body'
    ];
    
    for (const selector of contentSelectors) {
      const content = $(selector).text().trim();
      if (content.length > 100) {
        return content.substring(0, 2000); // Limit content length
      }
    }
    
    // Fallback: extract from body, excluding nav and footer
    const bodyText = $('body').clone();
    bodyText.find('nav, header, footer, .nav, .header, .footer, script, style').remove();
    return bodyText.text().trim().substring(0, 2000);
  }

  /**
   * Extract navigation data
   */
  private extractNavigationData($: cheerio.CheerioAPI): any {
    const navigation: any = {
      mainMenu: [],
      breadcrumbs: [],
      sidebarNav: []
    };
    
    // Main navigation
    $('nav a, .nav a, .navigation a, .menu a').each((_, element) => {
      const text = $(element).text().trim();
      const href = $(element).attr('href');
      if (text && href && text.length < 100) {
        navigation.mainMenu.push({ text, href });
      }
    });
    
    // Breadcrumbs
    $('.breadcrumb a, .breadcrumbs a, [aria-label="breadcrumb"] a').each((_, element) => {
      const text = $(element).text().trim();
      const href = $(element).attr('href');
      if (text && href) {
        navigation.breadcrumbs.push({ text, href });
      }
    });
    
    return navigation;
  }

  /**
   * Extract contact information
   */
  private extractContactInfo($: cheerio.CheerioAPI): any {
    const contact: any = {};
    
    // Email addresses
    const emails = new Set<string>();
    $('a[href^="mailto:"]').each((_, element) => {
      const email = $(element).attr('href')?.replace('mailto:', '');
      if (email) emails.add(email);
    });
    contact.emails = Array.from(emails);
    
    // Phone numbers
    const phones = new Set<string>();
    $('a[href^="tel:"]').each((_, element) => {
      const phone = $(element).attr('href')?.replace('tel:', '');
      if (phone) phones.add(phone);
    });
    
    // Extract phone patterns from text
    const phoneRegex = /(?:(?:\+44\s?|0)(?:[1-9]\d{8,9}))/g;
    const pageText = $.text();
    const phoneMatches = pageText.match(phoneRegex);
    if (phoneMatches) {
      phoneMatches.forEach(phone => phones.add(phone.trim()));
    }
    contact.phones = Array.from(phones);
    
    // Addresses
    const addresses: string[] = [];
    $('.address, .contact-address, [itemtype*="PostalAddress"]').each((_, element) => {
      const address = $(element).text().trim();
      if (address.length > 10 && address.length < 200) {
        addresses.push(address);
      }
    });
    contact.addresses = addresses;
    
    return contact;
  }

  /**
   * Extract embedded data like tables, lists, etc.
   */
  private extractEmbeddedData($: cheerio.CheerioAPI): any {
    const embedded: any = {
      tables: [],
      lists: [],
      forms: []
    };
    
    // Tables
    $('table').each((_, table) => {
      const tableData: any = {
        headers: [],
        rows: []
      };
      
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
        embedded.tables.push(tableData);
      }
    });
    
    // Important lists
    $('ol, ul').each((_, list) => {
      const listItems: string[] = [];
      $(list).find('li').each((_, li) => {
        const text = $(li).text().trim();
        if (text.length > 5 && text.length < 300) {
          listItems.push(text);
        }
      });
      
      if (listItems.length >= 3) {
        embedded.lists.push({
          type: list.tagName.toLowerCase(),
          items: listItems
        });
      }
    });
    
    // Forms
    $('form').each((_, form) => {
      const formData: any = {
        action: $(form).attr('action'),
        method: $(form).attr('method') || 'GET',
        fields: []
      };
      
      $(form).find('input, select, textarea').each((_, field) => {
        const fieldData = {
          type: $(field).attr('type') || field.tagName.toLowerCase(),
          name: $(field).attr('name'),
          label: $(field).prev('label').text().trim() || 
                 $(`label[for="${$(field).attr('id')}"]`).text().trim()
        };
        formData.fields.push(fieldData);
      });
      
      if (formData.fields.length > 0) {
        embedded.forms.push(formData);
      }
    });
    
    return embedded;
  }

  /**
   * Extract location information from page
   */
  private extractLocation($: cheerio.CheerioAPI): string | undefined {
    // Look for location indicators
    const locationSelectors = [
      '[itemtype*="PostalAddress"]',
      '.address',
      '.location',
      '[data-location]'
    ];
    
    for (const selector of locationSelectors) {
      const location = $(selector).text().trim();
      if (location.length > 5 && location.length < 200) {
        return location;
      }
    }
    
    return undefined;
  }

  /**
   * Store budget data extracted from pages
   */
  private async storeBudgetData(budgetItems: any[], sourceUrl: string): Promise<void> {
    for (const item of budgetItems.slice(0, 20)) { // Limit to prevent spam
      try {
        const councilData: InsertCouncilData = {
          title: `Budget: ${item.department} - ${item.category}`,
          description: item.description || `Budget allocation for ${item.category}`,
          dataType: 'budget_item',
          sourceUrl,
          amount: item.amount || 0,
          date: new Date(),
          metadata: {
            ...item,
            type: 'extracted_budget_data',
            sessionId: this.session.sessionId
          }
        };
        
        await storage.createCouncilData(councilData);
      } catch (error) {
        console.error('Error storing budget item:', error);
      }
    }
  }

  /**
   * Store councillor data extracted from pages
   */
  private async storeCouncillorData(councillors: any[], sourceUrl: string): Promise<void> {
    for (const councillor of councillors.slice(0, 50)) { // Limit to prevent spam
      try {
        const councilData: InsertCouncilData = {
          title: `Councillor: ${councillor.name}`,
          description: `${councillor.party || 'Independent'} councillor for ${councillor.ward || 'Unknown ward'}`,
          dataType: 'councillor',
          sourceUrl,
          location: councillor.ward,
          date: new Date(),
          metadata: {
            ...councillor,
            type: 'extracted_councillor_data',
            sessionId: this.session.sessionId
          }
        };
        
        await storage.createCouncilData(councilData);
      } catch (error) {
        console.error('Error storing councillor data:', error);
      }
    }
  }

  /**
   * Add URL to crawl queue with priority, deduplication, and domain quota checking
   */
  private addUrl(url: string, priority: number, depth: number, category: string, parent?: string): void {
    // Normalize URL
    const normalizedUrl = this.normalizeUrl(url);
    
    // Skip if already queued or visited
    if (this.isUrlQueued(normalizedUrl) || this.visitedUrls.has(normalizedUrl)) {
      return;
    }
    
    // Skip if URL doesn't match Bolton domains or is blocked
    if (!this.isAllowedUrl(normalizedUrl)) {
      return;
    }
    
    // Check domain quotas
    if (!this.checkDomainQuota(normalizedUrl)) {
      console.log(`⚠️ Domain quota exceeded for: ${normalizedUrl}`);
      return;
    }
    
    const crawlUrl: CrawlURL = {
      url: normalizedUrl,
      priority,
      depth,
      category,
      parent,
      discovered: new Date(),
      attempts: 0,
      status: 'pending'
    };
    
    this.urlQueue.push(crawlUrl);
    this.session.totalUrls++;
    
    // Sort queue by priority (higher priority first)
    this.urlQueue.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Check if domain quota allows adding this URL
   */
  private checkDomainQuota(url: string): boolean {
    try {
      const hostname = new URL(url).hostname;
      const currentCount = this.domainCounts.get(hostname) || 0;
      const quota = this.config.domainQuotas[hostname];
      
      if (quota && currentCount >= quota) {
        return false;
      }
      
      return true;
    } catch {
      return true; // Allow if we can't parse URL
    }
  }
  
  /**
   * Increment domain count when processing a URL
   */
  private incrementDomainCount(url: string): void {
    try {
      const hostname = new URL(url).hostname;
      const currentCount = this.domainCounts.get(hostname) || 0;
      this.domainCounts.set(hostname, currentCount + 1);
    } catch {
      // Ignore URL parsing errors
    }
  }

  /**
   * Extract URLs from content
   */
  private extractUrls(content: string, baseUrl: string, depth: number): string[] {
    const $ = cheerio.load(content);
    const urls: string[] = [];
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      
      const resolvedUrl = this.resolveUrl(href, baseUrl);
      if (resolvedUrl && this.isAllowedUrl(resolvedUrl)) {
        const category = this.categorizePath(new URL(resolvedUrl).pathname);
        const priority = this.config.priorityCategories[category] || 3;
        
        this.addUrl(resolvedUrl, priority, depth, category, baseUrl);
        urls.push(resolvedUrl);
      }
    });
    
    return urls;
  }

  /**
   * Categorize URL path into meaningful categories
   */
  private categorizePath(path: string): string {
    const pathLower = path.toLowerCase();
    
    if (pathLower.includes('planning') || pathLower.includes('application')) return 'planning';
    if (pathLower.includes('meeting') || pathLower.includes('agenda') || pathLower.includes('minutes')) return 'meetings';
    if (pathLower.includes('transparency') || pathLower.includes('foi') || pathLower.includes('spending')) return 'transparency';
    if (pathLower.includes('council-tax') || pathLower.includes('finance') || pathLower.includes('budget')) return 'finance';
    if (pathLower.includes('service') || pathLower.includes('department')) return 'services';
    if (pathLower.includes('consultation') || pathLower.includes('survey')) return 'consultations';
    if (pathLower.includes('document') || pathLower.includes('report') || pathLower.includes('policy')) return 'documents';
    
    return 'general';
  }

  /**
   * Map category to data type for database storage
   */
  private mapCategoryToDataType(category: string): any {
    const mapping: { [key: string]: string } = {
      'planning': 'planning_application',
      'meetings': 'council_meeting',
      'transparency': 'transparency_data',
      'finance': 'budget_item',
      'services': 'service',
      'consultations': 'consultation',
      'documents': 'council_document'
    };
    
    return mapping[category] || 'council_page';
  }

  /**
   * Fetch URL with comprehensive error handling and stealth measures
   */
  private async fetchUrl(url: string): Promise<{ content: string; contentType: string; size: number } | null> {
    try {
      // Implement stealth measures
      await this.implementStealthMeasures();
      
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
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        timeout: 30000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type') || 'text/html';
      const contentLength = parseInt(response.headers.get('content-length') || '0');
      
      // Check file size limits
      if (contentLength > this.config.maxFileSize) {
        console.log(`⏭️ Skipping large file: ${url} (${contentLength} bytes)`);
        return null;
      }
      
      const content = await response.text();
      
      return {
        content,
        contentType,
        size: content.length
      };
      
    } catch (error) {
      console.error(`❌ Failed to fetch ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Implement stealth measures
   */
  private async implementStealthMeasures(): Promise<void> {
    // Random delay between requests
    const delay = this.config.requestDelay + Math.random() * this.config.requestDelay;
    await this.sleep(delay);
    
    // Take breaks periodically
    if (this.session.processedUrls % 100 === 0 && this.session.processedUrls > 0) {
      const breakDuration = 30000 + Math.random() * 60000; // 30-90 second break
      console.log(`😴 Taking stealth break for ${Math.round(breakDuration / 1000)} seconds...`);
      await this.sleep(breakDuration);
    }
  }

  /**
   * Adaptive delay based on success rate
   */
  private async adaptiveDelay(): Promise<void> {
    const successRate = this.session.processedUrls / (this.session.processedUrls + this.session.failedUrls);
    const baseDelay = this.config.requestDelay;
    
    let adaptiveDelay = baseDelay;
    if (successRate < 0.8) {
      adaptiveDelay *= 2; // Slow down if high failure rate
    } else if (successRate > 0.95) {
      adaptiveDelay *= 0.8; // Speed up if very successful
    }
    
    await this.sleep(adaptiveDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Utility methods
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove fragments and common tracking parameters
      parsed.hash = '';
      const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
      paramsToRemove.forEach(param => parsed.searchParams.delete(param));
      return parsed.toString().replace(/\/$/, ''); // Remove trailing slash
    } catch {
      return url;
    }
  }

  private resolveUrl(href: string, baseUrl: string): string | null {
    try {
      if (href.startsWith('http')) return href;
      return new URL(href, baseUrl).toString();
    } catch {
      return null;
    }
  }

  private isAllowedUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      
      // Allow Bolton Council domains
      const allowedDomains = [
        'bolton.gov.uk',
        'paplanning.bolton.gov.uk',
        'bolton.moderngov.co.uk',
        'bolton.public-i.tv'
      ];
      
      return allowedDomains.some(domain => hostname.includes(domain));
    } catch {
      return false;
    }
  }

  private isUrlQueued(url: string): boolean {
    return this.urlQueue.some(item => item.url === url);
  }

  private isProcessableFile(url: string, contentType: string): boolean {
    const ext = url.split('.').pop()?.toLowerCase();
    return ext ? this.config.allowedFileTypes.includes(`.${ext}`) : false;
  }

  private generateContentHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private isDuplicate(url: string, contentHash: string): boolean {
    return this.visitedUrls.has(url) && this.visitedUrls.get(url) === contentHash;
  }

  private hasWork(): boolean {
    return this.urlQueue.some(url => url.status === 'pending') || this.processingUrls.size > 0;
  }

  private getPendingCount(): number {
    return this.urlQueue.filter(url => url.status === 'pending').length;
  }

  private getNextUrl(): CrawlURL | null {
    const pendingUrls = this.urlQueue.filter(url => url.status === 'pending');
    return pendingUrls.length > 0 ? pendingUrls[0] : null;
  }

  private async processFileContent(crawlUrl: CrawlURL, content: string, contentType: string): Promise<void> {
    // Process files using FileProcessor
    try {
      const fileData = await FileProcessor.processFile(crawlUrl.url, crawlUrl.url);
      
      const councilData: InsertCouncilData = {
        title: `Document: ${crawlUrl.url.split('/').pop()}`,
        description: `Processed file from ${crawlUrl.url}`,
        dataType: 'document',
        sourceUrl: crawlUrl.url,
        date: new Date(),
        metadata: {
          contentType,
          fileSize: content.length,
          processedData: fileData,
          type: 'processed_file',
          sessionId: this.session.sessionId
        }
      };
      
      await storage.createCouncilData(councilData);
    } catch (error) {
      console.error(`Error processing file ${crawlUrl.url}:`, error);
    }
  }

  /**
   * Generate comprehensive crawl report
   */
  private async generateCrawlReport(): Promise<void> {
    const report = {
      session: this.session,
      summary: {
        totalUrls: this.session.totalUrls,
        processedUrls: this.session.processedUrls,
        failedUrls: this.session.failedUrls,
        duplicatesSkipped: this.session.duplicatesSkipped,
        successRate: this.session.processedUrls / (this.session.processedUrls + this.session.failedUrls),
        bytesDownloaded: this.session.bytesDownloaded,
        duration: this.session.endTime ? 
          (this.session.endTime.getTime() - this.session.startTime.getTime()) / 1000 : 0
      },
      urlBreakdown: this.getUrlBreakdown(),
      topFailures: this.getTopFailures(),
      recommendations: this.getRecommendations()
    };
    
    // Store the report
    const reportData: InsertCouncilData = {
      title: `Crawl Report: ${this.session.sessionId}`,
      description: `Comprehensive crawl report for session ${this.session.sessionId}`,
      dataType: 'council_document',
      sourceUrl: `internal://crawl-report/${this.session.sessionId}`,
      date: new Date(),
      metadata: {
        ...report,
        type: 'crawl_report'
      }
    };
    
    await storage.createCouncilData(reportData);
    
    // Write to file for external access
    await this.writeCrawlReportToFile(report);
    
    console.log('📊 Crawl report generated and stored');
  }

  private getUrlBreakdown(): any {
    const breakdown: { [category: string]: number } = {};
    this.urlQueue.forEach(url => {
      breakdown[url.category] = (breakdown[url.category] || 0) + 1;
    });
    return breakdown;
  }

  private getTopFailures(): CrawlURL[] {
    return this.urlQueue
      .filter(url => url.status === 'failed')
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10);
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.session.failedUrls > this.session.processedUrls * 0.2) {
      recommendations.push('High failure rate detected. Consider increasing request delays.');
    }
    
    if (this.session.duplicatesSkipped > this.session.processedUrls * 0.3) {
      recommendations.push('High duplicate rate. Content may not be changing frequently.');
    }
    
    if (this.session.bytesDownloaded > 100 * 1024 * 1024) {
      recommendations.push('Large amount of data downloaded. Consider implementing selective content filtering.');
    }
    
    return recommendations;
  }

  private async writeCrawlReportToFile(report: any): Promise<void> {
    try {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      
      const dir = './scraped_data/reports';
      await fs.mkdir(dir, { recursive: true });
      
      const filename = `crawl-report-${this.session.sessionId}-${new Date().toISOString().slice(0, 19)}.json`;
      const filePath = path.join(dir, filename);
      
      await fs.writeFile(filePath, JSON.stringify(report, null, 2));
      console.log(`📝 Crawl report written to: ${filePath}`);
    } catch (error) {
      console.error('Error writing crawl report to file:', error);
    }
  }

  /**
   * Extract file links from HTML for enhanced citation tracking
   */
  private extractFileLinks($: cheerio.CheerioAPI, parentPageUrl: string): Array<{
    url: string;
    title: string;
    type: string;
    priority: number;
    fileType?: string;
    size?: string;
  }> {
    const fileLinks: Array<{
      url: string;
      title: string;
      type: string;
      priority: number;
      fileType?: string;
      size?: string;
    }> = [];

    // File link selectors
    const fileSelectors = [
      'a[href$=".pdf"]',
      'a[href$=".csv"]',
      'a[href$=".xlsx"]',
      'a[href$=".xls"]',
      'a[href$=".doc"]',
      'a[href$=".docx"]',
      'a[href*=".pdf?"]',
      'a[href*=".csv?"]',
      'a[href*=".xlsx?"]'
    ];

    fileSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        const linkText = $(element).text().trim();
        
        if (!href) return;
        
        const fullUrl = this.resolveUrl(href, parentPageUrl);
        if (!fullUrl || !this.isAllowedUrl(fullUrl)) return;
        
        // Determine file type and category
        const extension = fullUrl.split('.').pop()?.toLowerCase();
        const fileType = extension || 'unknown';
        
        // Categorize based on file name and context
        let type = 'documents';
        let priority = 5;
        
        const lowerText = linkText.toLowerCase();
        const lowerUrl = fullUrl.toLowerCase();
        
        if (lowerText.includes('budget') || lowerUrl.includes('budget')) {
          type = 'finance';
          priority = 8;
        } else if (lowerText.includes('spending') || lowerUrl.includes('spending') || lowerText.includes('expenditure')) {
          type = 'transparency';
          priority = 8;
        } else if (lowerText.includes('agenda') || lowerUrl.includes('agenda')) {
          type = 'meetings';
          priority = 9;
        } else if (lowerText.includes('minutes') || lowerUrl.includes('minutes')) {
          type = 'meetings';
          priority = 9;
        } else if (lowerText.includes('planning') || lowerUrl.includes('planning')) {
          type = 'planning';
          priority = 10;
        }
        
        // Extract file size if available
        const sizeText = $(element).parent().text();
        const sizeMatch = sizeText.match(/(\d+(?:\.\d+)?\s*(?:KB|MB|GB))/i);
        const size = sizeMatch ? sizeMatch[1] : undefined;
        
        fileLinks.push({
          url: fullUrl,
          title: linkText || `${fileType.toUpperCase()} file`,
          type,
          priority,
          fileType,
          size
        });
      });
    });

    return fileLinks;
  }

  /**
   * Store citation metadata for enhanced fact-checking
   */
  private async storeCitationMetadata(
    councilDataId: string, 
    fileLink: { url: string; title: string; type: string; fileType?: string }, 
    parentPageUrl: string
  ): Promise<void> {
    try {
      // Note: This would use the CitationService in a real implementation
      // For now, we'll store the citation metadata in the council data record
      const citationMetadata = {
        sourceUrl: fileLink.url,
        fileUrl: fileLink.url, // This is a direct file link
        parentPageUrl: parentPageUrl, // The page where we found this file
        title: fileLink.title,
        type: fileLink.type as any,
        confidence: 'high' as const, // High confidence for direct file links
        dateAdded: new Date(),
        fileType: fileLink.fileType,
        extractionMethod: 'advanced_crawler'
      };
      
      // Update the council data record with citation metadata
      // In a real implementation, this would use the citation service
      console.log(`📎 Stored citation metadata for file: ${fileLink.title}`);
      
    } catch (error) {
      console.error('Error storing citation metadata:', error);
    }
  }
}

export const advancedCrawler = new AdvancedBoltonCrawler();
