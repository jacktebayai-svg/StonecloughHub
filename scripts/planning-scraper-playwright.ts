import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { PlanningApplication, PlanningApplicationSchema } from '@shared/scraper-validation-schemas';
import { storage } from '../server/storage';
import { InsertCouncilData } from '@shared/schema';
import * as cheerio from 'cheerio';

export class PlanningApplicationsScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  
  private readonly baseUrl = 'https://paplanning.bolton.gov.uk/online-applications';
  private readonly maxApplications = 1000;
  private readonly requestDelay = 2000;
  
  private scrapedApplications: PlanningApplication[] = [];
  private processedReferences = new Set<string>();

  /**
   * Initialize browser and scraping session
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Planning Applications Scraper...');
    
    this.browser = await chromium.launch({
      headless: true, // Set to false for debugging
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-GB',
      timezoneId: 'Europe/London',
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    // Block unnecessary resources for faster scraping
    await this.context.route('**/*', (route, request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    this.page = await this.context.newPage();
    
    // Handle console logs and errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Browser console error: ${msg.text()}`);
      }
    });

    this.page.on('pageerror', error => {
      console.error(`Browser page error: ${error.message}`);
    });
  }

  /**
   * Main scraping orchestrator
   */
  async scrapeAllApplications(): Promise<void> {
    try {
      await this.initialize();
      
      console.log('📋 Starting comprehensive planning applications scrape...');
      
      // Scrape recent applications (weekly list)
      await this.scrapeWeeklyApplications();
      
      // Scrape from advanced search (last 6 months)
      await this.scrapeRecentApplications();
      
      // Store all applications in database
      await this.storeApplications();
      
      console.log(`✅ Scraping completed! Total applications: ${this.scrapedApplications.length}`);
      
    } catch (error) {
      console.error('❌ Planning scraper failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Scrape weekly applications list
   */
  private async scrapeWeeklyApplications(): Promise<void> {
    console.log('📅 Scraping weekly applications...');
    
    const weeklyUrl = `${this.baseUrl}/search.do?action=weeklyList`;
    
    try {
      await this.page!.goto(weeklyUrl, { waitUntil: 'networkidle' });
      await this.waitWithDelay();
      
      // Extract application links from weekly list
      const applicationLinks = await this.page!.evaluate(() => {
        const links: string[] = [];
        const anchorElements = document.querySelectorAll('a[href*="applicationDetails"]');
        
        anchorElements.forEach(anchor => {
          const href = anchor.getAttribute('href');
          if (href && !links.includes(href)) {
            links.push(href);
          }
        });
        
        return links;
      });
      
      console.log(`📊 Found ${applicationLinks.length} applications in weekly list`);
      
      // Process each application
      for (const link of applicationLinks.slice(0, 100)) { // Limit for testing
        try {
          const fullUrl = link.startsWith('http') ? link : `https://paplanning.bolton.gov.uk${link}`;
          await this.scrapeApplicationDetails(fullUrl);
          await this.waitWithDelay();
        } catch (error) {
          console.error(`❌ Error processing application link ${link}:`, error);
          continue;
        }
      }
      
    } catch (error) {
      console.error('❌ Error scraping weekly applications:', error);
    }
  }

  /**
   * Scrape from advanced search form
   */
  private async scrapeRecentApplications(): Promise<void> {
    console.log('🔍 Scraping from advanced search...');
    
    const advancedSearchUrl = `${this.baseUrl}/advancedSearchResults.do?action=firstPage`;
    
    try {
      await this.page!.goto(`${this.baseUrl}/search.do?action=advanced`, { waitUntil: 'networkidle' });
      await this.waitWithDelay();
      
      // Fill in search form for last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      await this.fillSearchForm(sixMonthsAgo, new Date());
      
      // Submit search
      await this.page!.click('input[type=\"submit\"][value=\"Search\"]');
      await this.page!.waitForLoadState('networkidle');
      await this.waitWithDelay();
      
      // Process paginated results
      await this.processPaginatedResults();
      
    } catch (error) {
      console.error('❌ Error scraping recent applications:', error);
    }
  }

  /**
   * Fill advanced search form
   */
  private async fillSearchForm(fromDate: Date, toDate: Date): Promise<void> {
    try {
      // Fill date range
      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];
      
      await this.page!.fill('input[name=\"searchCriteria.receivedDateFrom\"]', fromDateStr);
      await this.page!.fill('input[name=\"searchCriteria.receivedDateTo\"]', toDateStr);
      
      // Select application types if available
      const applicationTypes = ['Full', 'Outline', 'Reserved Matters', 'Householder'];
      
      for (const type of applicationTypes) {
        const checkbox = `input[type=\"checkbox\"][value*=\"${type}\"]`;
        if (await this.page!.isVisible(checkbox)) {
          await this.page!.check(checkbox);
        }
      }
      
    } catch (error) {
      console.error('❌ Error filling search form:', error);
    }
  }

  /**
   * Process paginated search results
   */
  private async processPaginatedResults(): Promise<void> {
    let currentPage = 1;
    const maxPages = 20; // Limit to prevent infinite loops
    
    while (currentPage <= maxPages) {
      console.log(`📄 Processing results page ${currentPage}...`);
      
      try {
        // Extract application links from current page
        const applicationLinks = await this.page!.evaluate(() => {
          const links: string[] = [];
          const anchorElements = document.querySelectorAll('a[href*=\"applicationDetails\"]');
          
          anchorElements.forEach(anchor => {
            const href = anchor.getAttribute('href');
            if (href && !links.includes(href)) {
              links.push(href);
            }
          });
          
          return links;
        });
        
        console.log(`📊 Found ${applicationLinks.length} applications on page ${currentPage}`);
        
        // Process applications from this page
        for (const link of applicationLinks) {
          try {
            const fullUrl = link.startsWith('http') ? link : `https://paplanning.bolton.gov.uk${link}`;
            await this.scrapeApplicationDetails(fullUrl);
            await this.waitWithDelay();
          } catch (error) {
            console.error(`❌ Error processing application ${link}:`, error);
            continue;
          }
        }
        
        // Try to go to next page
        const nextButton = this.page!.locator('a:text(\"Next\"), input[value=\"Next\"]').first();
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await this.page!.waitForLoadState('networkidle');
          await this.waitWithDelay();
          currentPage++;
        } else {
          console.log('📄 No more pages available');
          break;
        }
        
      } catch (error) {
        console.error(`❌ Error processing page ${currentPage}:`, error);
        break;
      }
    }
  }

  /**
   * Scrape individual application details
   */
  private async scrapeApplicationDetails(applicationUrl: string): Promise<void> {
    try {
      await this.page!.goto(applicationUrl, { waitUntil: 'networkidle' });
      await this.waitWithDelay();
      
      // Get page content
      const content = await this.page!.content();
      const $ = cheerio.load(content);
      
      // Extract application data
      const applicationData = this.extractApplicationData($, applicationUrl);
      
      if (applicationData && !this.processedReferences.has(applicationData.reference)) {
        this.processedReferences.add(applicationData.reference);
        this.scrapedApplications.push(applicationData);
        console.log(`✅ Scraped application: ${applicationData.reference} - ${applicationData.address}`);
      }
      
    } catch (error) {
      console.error(`❌ Error scraping application details from ${applicationUrl}:`, error);
    }
  }

  /**
   * Extract application data from HTML
   */
  private extractApplicationData($: cheerio.CheerioAPI, sourceUrl: string): PlanningApplication | null {
    try {
      // Extract reference number
      const reference = this.extractFieldValue($, ['Application No', 'Reference', 'Application Number']);
      if (!reference) return null;
      
      // Extract address
      const address = this.extractFieldValue($, ['Address', 'Site Address', 'Location']);
      if (!address) return null;
      
      // Extract proposal
      const proposal = this.extractFieldValue($, ['Proposal', 'Development', 'Description']);
      if (!proposal) return null;
      
      // Extract status
      const statusText = this.extractFieldValue($, ['Status', 'Decision', 'Current Status']) || 'pending';
      const status = this.normalizeStatus(statusText);
      
      // Extract dates
      const receivedDateStr = this.extractFieldValue($, ['Received', 'Date Received', 'Received Date']);
      const decisionDateStr = this.extractFieldValue($, ['Decision Date', 'Date of Decision']);
      
      const receivedDate = receivedDateStr ? new Date(receivedDateStr) : new Date();
      const decisionDate = decisionDateStr ? new Date(decisionDateStr) : null;
      
      // Extract other fields
      const applicantName = this.extractFieldValue($, ['Applicant', 'Agent', 'Applicant Name']);
      const caseOfficer = this.extractFieldValue($, ['Case Officer', 'Officer', 'Planning Officer']);
      const developmentType = this.extractFieldValue($, ['Development Type', 'Application Type']);
      const parish = this.extractFieldValue($, ['Parish', 'Ward', 'Electoral Ward']);
      
      // Extract consultation end date
      const consultationDateStr = this.extractFieldValue($, ['Consultation', 'Comment By', 'Consultation End']);
      const consultationEndDate = consultationDateStr ? new Date(consultationDateStr) : null;
      
      // Extract document URLs
      const documentUrls = this.extractDocumentUrls($);
      
      // Extract coordinates (if available in map links)
      const coordinates = this.extractCoordinates($);
      
      const application: PlanningApplication = {
        reference: reference.trim(),
        address: address.trim(),
        proposal: proposal.trim(),
        status,
        receivedDate,
        decisionDate,
        applicantName: applicantName?.trim() || null,
        coordinates,
        documentUrls,
        sourceUrl,
        caseOfficer: caseOfficer?.trim() || null,
        consultationEndDate,
        developmentType: developmentType?.trim() || null,
        parish: parish?.trim() || null
      };
      
      // Validate the data
      return PlanningApplicationSchema.parse(application);
      
    } catch (error) {
      console.error('❌ Error extracting application data:', error);
      return null;
    }
  }

  /**
   * Extract field value using multiple possible labels
   */
  private extractFieldValue($: cheerio.CheerioAPI, labels: string[]): string | null {
    for (const label of labels) {
      // Try different selectors
      const selectors = [
        `td:contains("${label}"):first + td`,
        `th:contains("${label}"):first + td`,
        `dt:contains("${label}"):first + dd`,
        `.field-label:contains("${label}"):first ~ .field-value`,
        `strong:contains("${label}"):first`,
        `label:contains("${label}"):first ~ *`
      ];
      
      for (const selector of selectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          if (text && text !== label && text.length > 0) {
            return text;
          }
        }
      }
      
      // Try case-insensitive search
      const caseInsensitive = $(`*:contains("${label}")`).filter((_, el) => {
        return $(el).text().toLowerCase().includes(label.toLowerCase());
      }).first().next().text().trim();
      
      if (caseInsensitive) return caseInsensitive;
    }
    
    return null;
  }

  /**
   * Normalize status values
   */
  private normalizeStatus(status: string): PlanningApplication['status'] {
    const lower = status.toLowerCase();
    
    if (lower.includes('approved') || lower.includes('granted')) return 'approved';
    if (lower.includes('refused') || lower.includes('rejected')) return 'rejected';
    if (lower.includes('withdrawn')) return 'withdrawn';
    if (lower.includes('review') || lower.includes('consideration')) return 'under_review';
    
    return 'pending';
  }

  /**
   * Extract document URLs
   */
  private extractDocumentUrls($: cheerio.CheerioAPI): string[] {
    const urls: string[] = [];
    
    // Look for document links
    $('a[href*=".pdf"], a[href*="documents"], a[href*="associated"]').each((_, link) => {
      const href = $(link).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') 
          ? href 
          : `https://paplanning.bolton.gov.uk${href}`;
        if (!urls.includes(fullUrl)) {
          urls.push(fullUrl);
        }
      }
    });
    
    return urls;
  }

  /**
   * Extract coordinates from map links or embedded maps
   */
  private extractCoordinates($: cheerio.CheerioAPI): { lat: number; lng: number } | null {
    // Look for Google Maps or other map service links
    const mapLinks = $('a[href*="maps.google"], a[href*="openstreetmap"], a[href*="bing.com/maps"]');
    
    mapLinks.each((_, link) => {
      const href = $(link).attr('href') || '';
      
      // Extract coordinates from Google Maps URLs
      const googleMatch = href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (googleMatch) {
        return {
          lat: parseFloat(googleMatch[1]),
          lng: parseFloat(googleMatch[2])
        };
      }
      
      // Extract from other coordinate patterns
      const coordMatch = href.match(/(?:lat|latitude)=(-?\d+\.\d+).*(?:lng|longitude|lon)=(-?\d+\.\d+)/);
      if (coordMatch) {
        return {
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2])
        };
      }
    });
    
    return null;
  }

  /**
   * Store applications in database
   */
  private async storeApplications(): Promise<void> {
    console.log(`💾 Storing ${this.scrapedApplications.length} planning applications...`);
    
    let stored = 0;
    let errors = 0;
    
    for (const application of this.scrapedApplications) {
      try {
        const councilData: InsertCouncilData = {
          title: `Planning Application: ${application.reference}`,
          description: `${application.proposal} at ${application.address}`,
          dataType: 'planning_application',
          sourceUrl: application.sourceUrl,
          date: application.receivedDate,
          location: application.address,
          status: application.status,
          metadata: {
            ...application,
            type: 'planning_application',
            scrapedAt: new Date().toISOString(),
            documentCount: application.documentUrls.length
          }
        };
        
        await storage.createCouncilData(councilData);
        stored++;
        
      } catch (error) {
        console.error(`❌ Error storing application ${application.reference}:`, error);
        errors++;
      }
    }
    
    console.log(`✅ Storage complete: ${stored} stored, ${errors} errors`);
  }

  /**
   * Wait with random delay to avoid detection
   */
  private async waitWithDelay(): Promise<void> {
    const delay = this.requestDelay + (Math.random() * 1000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    try {
      if (this.page) await this.page.close();
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

// Export for use in other scripts
export const planningApplicationsScraper = new PlanningApplicationsScraper();

// Run directly if this file is executed
if (require.main === module) {
  planningApplicationsScraper.scrapeAllApplications()
    .then(() => {
      console.log('🎉 Planning applications scraping completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Planning applications scraping failed:', error);
      process.exit(1);
    });
}
