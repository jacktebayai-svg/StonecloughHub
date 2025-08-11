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
  private councilBaseUrl = 'https://www.bolton.gov.uk/council';
  private maxRetries = 3;
  private delayBetweenRequests = 2000; // 2 seconds

  async scrapeAndStoreData(): Promise<void> {
    try {
      console.log('🚀 Starting comprehensive data scrape from Bolton Council...');
      
      // Run scrapers in parallel for efficiency
      await Promise.allSettled([
        this.scrapePlanningApplications(),
        this.scrapeCouncilMeetings(),
        this.scrapeCouncilSpending()
      ]);
      
      console.log('✅ Data scrape completed successfully');
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

  private async scrapePlanningApplications(): Promise<void> {
    console.log('📋 Scraping planning applications from Bolton Council...');
    
    try {
      // Initial search page to get application links
      const searchUrl = `${this.planningBaseUrl}/search.do?action=simple&searchType=Application`;
      const searchHtml = await this.makeRequest(searchUrl);
      const $ = cheerio.load(searchHtml);

      // Extract application links from search results
      const applicationLinks: string[] = [];
      $('a[href*="applicationDetails.do"]').each((_, element) => {
        const link = $(element).attr('href');
        if (link) {
          applicationLinks.push(`${this.planningBaseUrl}${link}`);
        }
      });

      console.log(`📊 Found ${applicationLinks.length} planning application links`);

      // Process each application (limit to prevent overwhelming)
      const limitedLinks = applicationLinks.slice(0, 20);
      
      for (const [index, link] of limitedLinks.entries()) {
        try {
          await this.delay(this.delayBetweenRequests);
          console.log(`🔍 Processing application ${index + 1}/${limitedLinks.length}`);
          
          const appHtml = await this.makeRequest(link);
          const app$ = cheerio.load(appHtml);
          
          const application = this.extractPlanningApplicationData(app$);
          
          if (application) {
            await this.storePlanningApplication(application);
          }
        } catch (error) {
          console.error(`❌ Error processing planning application ${link}:`, error);
          continue;
        }
      }
      
    } catch (error) {
      console.error('❌ Error scraping planning applications:', error);
      throw error;
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

  private async scrapeCouncilMeetings(): Promise<void> {
    console.log('🏛️ Scraping council meetings from Bolton Council...');
    
    try {
      const meetingsUrl = `${this.councilBaseUrl}/meetings-agendas-and-minutes`;
      const html = await this.makeRequest(meetingsUrl);
      const $ = cheerio.load(html);

      // Look for meeting links and committee pages
      const meetingLinks: string[] = [];
      $('a[href*="meeting"], a[href*="committee"], a[href*="agenda"]').each((_, element) => {
        const link = $(element).attr('href');
        if (link) {
          const fullLink = link.startsWith('http') ? link : `${this.councilBaseUrl}${link}`;
          meetingLinks.push(fullLink);
        }
      });

      console.log(`📊 Found ${meetingLinks.length} potential meeting links`);

      // Process a limited number of meeting links
      const limitedLinks = [...new Set(meetingLinks)].slice(0, 15);
      
      for (const [index, link] of limitedLinks.entries()) {
        try {
          await this.delay(this.delayBetweenRequests);
          console.log(`🔍 Processing meeting ${index + 1}/${limitedLinks.length}`);
          
          const meetingHtml = await this.makeRequest(link);
          const meeting$ = cheerio.load(meetingHtml);
          
          const meeting = this.extractCouncilMeetingData(meeting$, link);
          
          if (meeting) {
            await this.storeCouncilMeeting(meeting);
          }
        } catch (error) {
          console.error(`❌ Error processing meeting ${link}:`, error);
          continue;
        }
      }
      
    } catch (error) {
      console.error('❌ Error scraping council meetings:', error);
      throw error;
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

  private async scrapeCouncilSpending(): Promise<void> {
    console.log('💷 Scraping council spending data...');
    
    try {
      // Look for spending/transparency data on the council website
      const transparencyUrl = `${this.councilBaseUrl}/transparency`;
      const spendingUrl = `${this.councilBaseUrl}/spending`;
      
      const urls = [transparencyUrl, spendingUrl];
      
      for (const url of urls) {
        try {
          const html = await this.makeRequest(url);
          const $ = cheerio.load(html);
          
          // Look for spending reports, CSV files, or financial data
          $('a[href*=".csv"], a[href*="spend"], a[href*="payment"]').each(async (_, element) => {
            const link = $(element).attr('href');
            const text = $(element).text().trim();
            
            if (link && text.toLowerCase().includes('spend')) {
              // Store reference to spending data
              await this.storeSpendingReference(text, link, url);
            }
          });
          
        } catch (error) {
          console.log(`⚠️ Could not access ${url}, continuing...`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error scraping council spending:', error);
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
