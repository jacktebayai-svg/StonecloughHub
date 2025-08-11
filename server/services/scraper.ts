import * as cheerio from 'cheerio';
import { storage } from '../storage';
import { InsertCouncilData } from '@shared/schema';

interface PlanningApplication {
  reference: string;
  address: string;
  proposal: string;
  status: string;
  dateReceived: Date;
  decisionDate?: Date;
  applicant?: string;
}

interface CouncilMeeting {
  title: string;
  date: Date;
  agenda?: string;
  minutes?: string;
  committee: string;
}

interface CouncilSpending {
  department: string;
  amount: number;
  description: string;
  date: Date;
  supplier?: string;
}

export class BoltonCouncilScraper {
  private planningBaseUrl = 'https://paplanning.bolton.gov.uk/online-applications';
  private councilBaseUrl = 'https://www.bolton.gov.uk';
  private meetingsUrl = 'https://bolton.moderngov.co.uk';
  private openDataUrl = 'https://opendata.bolton.gov.uk';
  private webcastUrl = 'https://bolton.public-i.tv';
  private maxRetries = 3;
  private delayBetweenRequests = 1000; // 1 second for faster processing
  private maxDepth = 7; // Maximum depth layers
  private minFilesPerLayer = 20; // Minimum files per layer
  private visitedUrls = new Set<string>();
  private currentDepth = 0;

  async scrapeAndStoreData(): Promise<void> {
    try {
      console.log('🚀 Starting comprehensive multi-layer data scrape from Bolton Council...');
      console.log(`📊 Configuration: Max Depth: ${this.maxDepth}, Min Files/Layer: ${this.minFilesPerLayer}`);
      
      // Reset state for new scrape
      this.visitedUrls.clear();
      this.currentDepth = 0;
      
      // Run comprehensive scrapers with deep crawling
      await Promise.allSettled([
        this.scrapeDeepPlanningApplications(),
        this.scrapeDeepCouncilMeetings(),
        this.scrapeDeepCouncilSpending(),
        this.scrapeCouncilDocuments(),
        this.scrapeCommitteePages(),
        this.scrapeTransparencyData()
      ]);
      
      console.log(`✅ Data scrape completed successfully. Visited ${this.visitedUrls.size} unique URLs`);
    } catch (error) {
      console.error('❌ Error during data scraping:', error);
      throw error;
    }
  }

  private async makeRequest(url: string, retries = 0): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if (retries < this.maxRetries) {
        console.log(`⚠️ Request failed, retrying (${retries + 1}/${this.maxRetries}): ${url}`);
        await this.delay(this.delayBetweenRequests * (retries + 1));
        return this.makeRequest(url, retries + 1);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async scrapeDeepPlanningApplications(): Promise<void> {
    console.log('🏗️ Starting deep planning applications scrape...');
    
    try {
      const planningUrls = [
        `${this.planningBaseUrl}/search.do?action=simple&searchType=Application`,
        `${this.planningBaseUrl}/search.do?action=weeklyList`,
        `${this.planningBaseUrl}/search.do?action=advanced&searchType=Application`,
        `${this.planningBaseUrl}/appealSearch.do?action=simple&searchType=Appeal`,
        `${this.planningBaseUrl}/search.do?action=simple&searchType=Enforcement`
      ];
      
      await this.crawlDeep(planningUrls, 'planning', this.extractAndStorePlanningData.bind(this));
    } catch (error) {
      console.error('❌ Error in deep planning applications scrape:', error);
    }
  }

  private async crawlDeep(startUrls: string[], dataType: string, processor: (url: string, html: string, depth: number) => Promise<void>): Promise<void> {
    let currentLayer = [...startUrls];
    
    for (let depth = 0; depth < this.maxDepth && currentLayer.length > 0; depth++) {
      console.log(`🔍 Layer ${depth + 1}: Processing ${currentLayer.length} URLs for ${dataType}`);
      
      const nextLayer: string[] = [];
      let processedCount = 0;
      
      // Process at least minFilesPerLayer URLs from current layer
      const urlsToProcess = currentLayer.slice(0, Math.max(this.minFilesPerLayer, currentLayer.length));
      
      for (const url of urlsToProcess) {
        if (this.visitedUrls.has(url)) continue;
        
        try {
          await this.delay(this.delayBetweenRequests);
          const html = await this.makeRequest(url);
          this.visitedUrls.add(url);
          
          // Process current page
          await processor(url, html, depth);
          
          // Extract links for next layer
          const newLinks = this.extractLinksFromPage(html, url, dataType);
          nextLayer.push(...newLinks);
          
          processedCount++;
          
          if (processedCount % 5 === 0) {
            console.log(`📊 Layer ${depth + 1}: Processed ${processedCount}/${urlsToProcess.length} URLs`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing ${url} at depth ${depth}:`, error);
          continue;
        }
      }
      
      // Prepare next layer (remove duplicates and already visited)
      currentLayer = [...new Set(nextLayer)].filter(url => !this.visitedUrls.has(url));
      console.log(`✅ Layer ${depth + 1} complete. Found ${currentLayer.length} new URLs for next layer`);
    }
  }

  private extractLinksFromPage(html: string, baseUrl: string, dataType: string): string[] {
    const $ = cheerio.load(html);
    const links: string[] = [];
    
    // Extract relevant links based on data type
    const selectors = this.getLinkSelectors(dataType);
    
    selectors.forEach(selector => {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
          const fullUrl = this.resolveUrl(href, baseUrl);
          if (fullUrl && this.isRelevantUrl(fullUrl, dataType)) {
            links.push(fullUrl);
          }
        }
      });
    });
    
    return links;
  }

  private getLinkSelectors(dataType: string): string[] {
    switch (dataType) {
      case 'planning':
        return [
          'a[href*="applicationDetails.do"]',
          'a[href*="search.do"]',
          'a[href*="weeklyList"]',
          'a[href*="appeal"]',
          'a[href*="enforcement"]',
          'a[href*="planning"]',
          'a[href*=".pdf"]',
          'a[href*="document"]'
        ];
      case 'council':
        return [
          'a[href*="meeting"]',
          'a[href*="committee"]',
          'a[href*="agenda"]',
          'a[href*="minutes"]',
          'a[href*="council"]',
          'a[href*="decision"]',
          'a[href*=".pdf"]',
          'a[href*="transparency"]'
        ];
      case 'spending':
        return [
          'a[href*="spending"]',
          'a[href*="transparency"]',
          'a[href*="finance"]',
          'a[href*="budget"]',
          'a[href*=".csv"]',
          'a[href*=".xlsx"]',
          'a[href*="payment"]',
          'a[href*="procurement"]'
        ];
      default:
        return ['a[href]'];
    }
  }

  private resolveUrl(href: string, baseUrl: string): string | null {
    try {
      if (href.startsWith('http')) return href;
      
      const base = new URL(baseUrl);
      if (href.startsWith('/')) {
        return `${base.protocol}//${base.host}${href}`;
      }
      
      const basePath = base.pathname.replace(/\/[^\/]*$/, '/');
      return `${base.protocol}//${base.host}${basePath}${href}`;
    } catch (error) {
      return null;
    }
  }

  private isRelevantUrl(url: string, dataType: string): boolean {
    const lowerUrl = url.toLowerCase();
    
    // Must be from Bolton Council domains
    if (!lowerUrl.includes('bolton.gov.uk') && !lowerUrl.includes('paplanning.bolton.gov.uk')) {
      return false;
    }
    
    // Filter based on data type
    switch (dataType) {
      case 'planning':
        return lowerUrl.includes('planning') || 
               lowerUrl.includes('application') || 
               lowerUrl.includes('appeal') ||
               lowerUrl.includes('enforcement');
      case 'council':
        return lowerUrl.includes('council') || 
               lowerUrl.includes('meeting') || 
               lowerUrl.includes('committee') ||
               lowerUrl.includes('agenda') ||
               lowerUrl.includes('minutes');
      case 'spending':
        return lowerUrl.includes('spending') || 
               lowerUrl.includes('transparency') || 
               lowerUrl.includes('finance') ||
               lowerUrl.includes('budget');
      default:
        return true;
    }
  }

  private async extractAndStorePlanningData(url: string, html: string, depth: number): Promise<void> {
    const $ = cheerio.load(html);
    
    // Extract planning applications from the page
    $('a[href*="applicationDetails.do"]').each(async (_, element) => {
      const link = $(element).attr('href');
      if (link) {
        const fullLink = this.resolveUrl(link, url);
        if (fullLink && !this.visitedUrls.has(fullLink)) {
          try {
            const appHtml = await this.makeRequest(fullLink);
            const app$ = cheerio.load(appHtml);
            const application = this.extractPlanningApplicationData(app$);
            
            if (application) {
              await this.storePlanningApplication(application);
            }
          } catch (error) {
            console.error(`❌ Error extracting planning data from ${fullLink}:`, error);
          }
        }
      }
    });
    
    // Also store page metadata if it contains relevant information
    const title = $('title').text().trim();
    if (title.includes('Planning') || title.includes('Application')) {
      await this.storePageMetadata(url, title, 'planning_page', depth);
    }
  }

  private extractPlanningApplicationData($: cheerio.CheerioAPI): PlanningApplication | null {
    try {
      const reference = $('td:contains("Application Number:")').next().text().trim();
      const address = $('td:contains("Address:")').next().text().trim();
      const proposal = $('td:contains("Proposal:")').next().text().trim();
      const status = $('td:contains("Status:")').next().text().trim();
      const dateReceivedStr = $('td:contains("Date Received:")').next().text().trim();
      
      if (!reference || !address) return null;

      return {
        reference,
        address,
        proposal: proposal || 'No proposal description available',
        status: status || 'Unknown',
        dateReceived: this.parseDate(dateReceivedStr) || new Date(),
        applicant: $('td:contains("Applicant:")').next().text().trim() || undefined
      };
    } catch (error) {
      console.error('❌ Error extracting planning application data:', error);
      return null;
    }
  }

  private async storePlanningApplication(app: PlanningApplication): Promise<void> {
    try {
      const councilData: InsertCouncilData = {
        title: `Planning Application: ${app.reference}`,
        description: `${app.proposal} at ${app.address}`,
        dataType: 'planning_application',
        sourceUrl: `${this.planningBaseUrl}/search.do?action=simple&searchType=Application`,
        status: app.status,
        date: app.dateReceived,
        location: app.address,
        metadata: {
          reference: app.reference,
          applicant: app.applicant,
          type: 'planning_application'
        }
      };

      await storage.createCouncilData(councilData);
      console.log(`✅ Stored planning application: ${app.reference}`);
    } catch (error) {
      console.error('❌ Error storing planning application:', error);
    }
  }

  private async scrapeDeepCouncilMeetings(): Promise<void> {
    console.log('🏛️ Starting deep council meetings scrape...');
    
    try {
      const councilUrls = [
        `${this.meetingsUrl}`, // Main meetings portal
        `${this.meetingsUrl}/mgWhatsNew.aspx?bcr=1`, // What's new feed
        `${this.meetingsUrl}/ieDocHome.aspx?bcr=1`, // Browse meetings
        `${this.meetingsUrl}/mgMemberIndex.aspx?bcr=1`, // Councillors
        `${this.councilBaseUrl}/cabinet-committees/cabinet-committee-meetings`,
        `${this.councilBaseUrl}/opendata` // Open data portal
      ];
      
      await this.crawlDeep(councilUrls, 'council', this.extractAndStoreCouncilData.bind(this));
    } catch (error) {
      console.error('❌ Error in deep council meetings scrape:', error);
    }
  }

  private async scrapeDeepCouncilSpending(): Promise<void> {
    console.log('💷 Starting deep council spending scrape...');
    
    try {
      const spendingUrls = [
        `${this.openDataUrl}`, // Open data portal
        `${this.councilBaseUrl}/opendata`, // Alternative open data
        `${this.councilBaseUrl}/transparency-and-performance`, // Transparency hub
        `${this.councilBaseUrl}/finance-and-legal`, // Finance section
        `${this.councilBaseUrl}/budget`, // Budget information
        `${this.meetingsUrl}/ieDocHome.aspx?bcr=1` // Meeting documents that may contain financial data
      ];
      
      await this.crawlDeep(spendingUrls, 'spending', this.extractAndStoreSpendingData.bind(this));
    } catch (error) {
      console.error('❌ Error in deep spending scrape:', error);
    }
  }

  private async scrapeCouncilDocuments(): Promise<void> {
    console.log('📄 Starting council documents scrape...');
    
    try {
      const documentUrls = [
        `${this.councilBaseUrl}/publications`,
        `${this.councilBaseUrl}/documents`,
        `${this.councilBaseUrl}/reports`,
        `${this.councilBaseUrl}/policies`,
        `${this.councilBaseUrl}/strategies`
      ];
      
      await this.crawlDeep(documentUrls, 'documents', this.extractAndStoreDocumentData.bind(this));
    } catch (error) {
      console.error('❌ Error in documents scrape:', error);
    }
  }

  private async scrapeCommitteePages(): Promise<void> {
    console.log('🏢 Starting committee pages scrape...');
    
    try {
      const committeeUrls = [
        `${this.councilBaseUrl}/planning-committee`,
        `${this.councilBaseUrl}/licensing-committee`,
        `${this.councilBaseUrl}/audit-committee`,
        `${this.councilBaseUrl}/standards-committee`,
        `${this.councilBaseUrl}/overview-scrutiny`
      ];
      
      await this.crawlDeep(committeeUrls, 'committees', this.extractAndStoreCommitteeData.bind(this));
    } catch (error) {
      console.error('❌ Error in committee pages scrape:', error);
    }
  }

  private async scrapeTransparencyData(): Promise<void> {
    console.log('🔍 Starting transparency data scrape...');
    
    try {
      const transparencyUrls = [
        `${this.councilBaseUrl}/transparency`,
        `${this.councilBaseUrl}/foi-requests`,
        `${this.councilBaseUrl}/open-data`,
        `${this.councilBaseUrl}/data-protection`,
        `${this.councilBaseUrl}/information-governance`
      ];
      
      await this.crawlDeep(transparencyUrls, 'transparency', this.extractAndStoreTransparencyData.bind(this));
    } catch (error) {
      console.error('❌ Error in transparency data scrape:', error);
    }
  }

  private async extractAndStoreCouncilData(url: string, html: string, depth: number): Promise<void> {
    const $ = cheerio.load(html);
    
    // Extract meeting information
    const meeting = this.extractCouncilMeetingData($, url);
    if (meeting) {
      await this.storeCouncilMeeting(meeting);
    }
    
    await this.storePageMetadata(url, $('title').text().trim(), 'council_page', depth);
  }

  private async extractAndStoreSpendingData(url: string, html: string, depth: number): Promise<void> {
    const $ = cheerio.load(html);
    
    // Look for CSV/Excel files and spending data
    $('a[href*=".csv"], a[href*=".xlsx"], a[href*="spend"]').each(async (_, element) => {
      const link = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (link && text.toLowerCase().includes('spend')) {
        await this.storeSpendingReference(text, link, url);
      }
    });
    
    await this.storePageMetadata(url, $('title').text().trim(), 'spending_page', depth);
  }

  private async extractAndStoreDocumentData(url: string, html: string, depth: number): Promise<void> {
    const $ = cheerio.load(html);
    
    // Extract document links
    $('a[href*=".pdf"], a[href*="document"], a[href*="report"]').each(async (_, element) => {
      const link = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (link && text) {
        const fullLink = this.resolveUrl(link, url);
        if (fullLink) {
          await this.storeDocumentReference(text, fullLink, url, depth);
        }
      }
    });
    
    await this.storePageMetadata(url, $('title').text().trim(), 'document_page', depth);
  }

  private async extractAndStoreCommitteeData(url: string, html: string, depth: number): Promise<void> {
    const $ = cheerio.load(html);
    
    const title = $('h1').first().text().trim() || $('title').text().trim();
    if (title.includes('Committee') || title.includes('Meeting')) {
      const meeting: CouncilMeeting = {
        title,
        date: new Date(),
        committee: this.extractCommitteeName(title),
        agenda: $('a:contains("Agenda")').attr('href'),
        minutes: $('a:contains("Minutes")').attr('href')
      };
      
      await this.storeCouncilMeeting(meeting);
    }
    
    await this.storePageMetadata(url, title, 'committee_page', depth);
  }

  private async extractAndStoreTransparencyData(url: string, html: string, depth: number): Promise<void> {
    const $ = cheerio.load(html);
    
    // Extract transparency information
    $('a[href*="foi"], a[href*="freedom"], a[href*="information"]').each(async (_, element) => {
      const link = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (link && text) {
        const fullLink = this.resolveUrl(link, url);
        if (fullLink) {
          await this.storeTransparencyReference(text, fullLink, url);
        }
      }
    });
    
    await this.storePageMetadata(url, $('title').text().trim(), 'transparency_page', depth);
  }

  private extractCommitteeName(title: string): string {
    if (title.includes('Planning')) return 'Planning Committee';
    if (title.includes('Licensing')) return 'Licensing Committee';
    if (title.includes('Audit')) return 'Audit Committee';
    if (title.includes('Standards')) return 'Standards Committee';
    if (title.includes('Cabinet')) return 'Cabinet';
    if (title.includes('Overview')) return 'Overview and Scrutiny';
    return 'General Committee';
  }

  private async storePageMetadata(url: string, title: string, pageType: string, depth: number): Promise<void> {
    if (!title || title.length < 5) return;
    
    try {
      const councilData: InsertCouncilData = {
        title: `${pageType}: ${title}`,
        description: `Page discovered at depth ${depth + 1} during deep crawling`,
        dataType: 'council_page',
        sourceUrl: url,
        date: new Date(),
        metadata: {
          pageType,
          depth: depth + 1,
          type: 'page_metadata'
        }
      };

      await storage.createCouncilData(councilData);
    } catch (error) {
      console.error('❌ Error storing page metadata:', error);
    }
  }

  private async storeDocumentReference(title: string, link: string, sourceUrl: string, depth: number): Promise<void> {
    try {
      const councilData: InsertCouncilData = {
        title: `Document: ${title}`,
        description: `Council document found at depth ${depth + 1}`,
        dataType: 'council_document',
        sourceUrl: link,
        date: new Date(),
        metadata: {
          documentLink: link,
          parentPage: sourceUrl,
          depth: depth + 1,
          type: 'document_reference'
        }
      };

      await storage.createCouncilData(councilData);
    } catch (error) {
      console.error('❌ Error storing document reference:', error);
    }
  }

  private async storeTransparencyReference(title: string, link: string, sourceUrl: string): Promise<void> {
    try {
      const councilData: InsertCouncilData = {
        title: `Transparency: ${title}`,
        description: 'Transparency and freedom of information data',
        dataType: 'transparency_data',
        sourceUrl: link,
        date: new Date(),
        metadata: {
          transparencyLink: link,
          parentPage: sourceUrl,
          type: 'transparency_reference'
        }
      };

      await storage.createCouncilData(councilData);
    } catch (error) {
      console.error('❌ Error storing transparency reference:', error);
    }
  }

  private extractCouncilMeetingData($: cheerio.CheerioAPI, sourceUrl: string): CouncilMeeting | null {
    try {
      const title = $('h1').first().text().trim() || 
                   $('title').text().trim() || 
                   'Council Meeting';
                   
      // Look for date information in various formats
      const dateText = $('time').attr('datetime') || 
                      $('span:contains("Date:")').next().text() ||
                      $('td:contains("Date:")').next().text() ||
                      $('.date').text();
                      
      const committee = title.includes('Planning') ? 'Planning Committee' :
                       title.includes('Cabinet') ? 'Cabinet' :
                       title.includes('Council') ? 'Full Council' :
                       'General Committee';

      return {
        title,
        date: this.parseDate(dateText) || new Date(),
        committee,
        agenda: $('a:contains("Agenda")').attr('href') || undefined,
        minutes: $('a:contains("Minutes")').attr('href') || undefined
      };
    } catch (error) {
      console.error('❌ Error extracting council meeting data:', error);
      return null;
    }
  }

  private async storeCouncilMeeting(meeting: CouncilMeeting): Promise<void> {
    try {
      const councilData: InsertCouncilData = {
        title: meeting.title,
        description: `${meeting.committee} meeting scheduled`,
        dataType: 'council_meeting',
        sourceUrl: `${this.councilBaseUrl}/meetings-agendas-and-minutes`,
        date: meeting.date,
        metadata: {
          committee: meeting.committee,
          agenda: meeting.agenda,
          minutes: meeting.minutes,
          type: 'council_meeting'
        }
      };

      await storage.createCouncilData(councilData);
      console.log(`✅ Stored council meeting: ${meeting.title}`);
    } catch (error) {
      console.error('❌ Error storing council meeting:', error);
    }
  }



  private async storeSpendingReference(title: string, link: string, sourceUrl: string): Promise<void> {
    try {
      const councilData: InsertCouncilData = {
        title: `Council Spending: ${title}`,
        description: 'Council spending data available for download',
        dataType: 'council_spending',
        sourceUrl: link.startsWith('http') ? link : `${this.councilBaseUrl}${link}`,
        amount: 0, // Would need to parse the actual file to get amounts
        date: new Date(),
        metadata: {
          dataLink: link,
          type: 'spending_reference'
        }
      };

      await storage.createCouncilData(councilData);
      console.log(`✅ Stored spending reference: ${title}`);
    } catch (error) {
      console.error('❌ Error storing spending reference:', error);
    }
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Clean up the date string
    const cleaned = dateStr.replace(/[^\w\s\/\-:]/g, '').trim();
    
    // Try multiple date formats
    const dateFormats = [
      /\d{1,2}\/\d{1,2}\/\d{4}/,  // DD/MM/YYYY or MM/DD/YYYY
      /\d{4}-\d{1,2}-\d{1,2}/,     // YYYY-MM-DD
      /\d{1,2}-\d{1,2}-\d{4}/,     // DD-MM-YYYY
    ];
    
    for (const format of dateFormats) {
      const match = cleaned.match(format);
      if (match) {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Fallback: try parsing directly
    const date = new Date(cleaned);
    return !isNaN(date.getTime()) ? date : null;
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing connections to Bolton Council websites...');
      
      const planningResponse = await fetch(this.planningBaseUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BoltonHubBot/1.0)' }
      });
      
      const councilResponse = await fetch(this.councilBaseUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BoltonHubBot/1.0)' }
      });
      
      const planningOk = planningResponse.ok;
      const councilOk = councilResponse.ok;
      
      console.log(`📋 Planning portal: ${planningOk ? '✅' : '❌'}`);
      console.log(`🏛️ Council website: ${councilOk ? '✅' : '❌'}`);
      
      return planningOk && councilOk;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

export const scraper = new BoltonCouncilScraper();
