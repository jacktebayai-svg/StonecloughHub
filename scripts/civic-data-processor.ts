import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { 
  councillorSchema, 
  meetingSchema, 
  serviceSchema, 
  planningApplicationSchema,
  documentSchema,
  statisticalDataSchema
} from '../shared/enhanced-schema.js';

// Raw scraped data schemas
const rawScrapedDataSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
  content: z.string(),
  dataType: z.string(),
  category: z.string(),
  metadata: z.object({
    contentLength: z.number(),
    wordCount: z.number(),
    linkCount: z.number(),
    crawledAt: z.string()
  }),
  extractedData: z.record(z.any()).optional(),
  crawledAt: z.string(),
  quality: z.number()
});

interface ProcessedCivicData {
  councillors: any[];
  meetings: any[];
  services: any[];
  planningApplications: any[];
  documents: any[];
  statistics: any[];
  rawPages: any[];
}

export class CivicDataProcessor {
  private basePath: string;
  private processedData: ProcessedCivicData;

  constructor(basePath: string = './') {
    this.basePath = basePath;
    this.processedData = {
      councillors: [],
      meetings: [],
      services: [],
      planningApplications: [],
      documents: [],
      statistics: [],
      rawPages: []
    };
  }

  async processAllData(): Promise<ProcessedCivicData> {
    console.log('🏛️ Starting civic data processing...');
    
    // Process different data sources
    await this.processScrapedData();
    await this.processFocusedData();
    await this.processComprehensiveData();
    
    console.log('✅ Civic data processing complete!');
    console.log(`📊 Processed: ${this.processedData.councillors.length} councillors, ${this.processedData.meetings.length} meetings, ${this.processedData.services.length} services`);
    
    return this.processedData;
  }

  private async processScrapedData() {
    const scrapedDataPath = path.join(this.basePath, 'scraped_data');
    
    try {
      const files = await fs.readdir(scrapedDataPath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      console.log(`📁 Processing ${jsonFiles.length} scraped data files...`);
      
      for (const file of jsonFiles) {
        await this.processScrapedFile(path.join(scrapedDataPath, file));
      }
    } catch (error) {
      console.log('⚠️ Scraped data directory not found or empty');
    }
  }

  private async processFocusedData() {
    const focusedDataPath = path.join(this.basePath, 'focused-bolton-data/raw-data');
    
    try {
      const files = await fs.readdir(focusedDataPath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      console.log(`📁 Processing ${jsonFiles.length} focused data files...`);
      
      for (const file of jsonFiles) {
        await this.processFocusedFile(path.join(focusedDataPath, file));
      }
    } catch (error) {
      console.log('⚠️ Focused data directory not found or empty');
    }
  }

  private async processComprehensiveData() {
    const comprehensiveDataPath = path.join(this.basePath, 'comprehensive-bolton-data/raw-data');
    
    try {
      const files = await fs.readdir(comprehensiveDataPath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      console.log(`📁 Processing ${jsonFiles.length} comprehensive data files...`);
      
      for (const file of jsonFiles) {
        await this.processComprehensiveFile(path.join(comprehensiveDataPath, file));
      }
    } catch (error) {
      console.log('⚠️ Comprehensive data directory not found or empty');
    }
  }

  private async processScrapedFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      // Determine data type and process accordingly
      if (data.dataType === 'council_meeting') {
        this.extractMeetingData(data);
      } else if (data.dataType === 'council_page') {
        this.extractPageData(data);
      } else if (data.chartType) {
        this.extractChartData(data);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  private async processFocusedFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      // Process array of scraped data
      if (Array.isArray(data)) {
        for (const item of data) {
          this.processScrapedItem(item);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error processing focused file ${filePath}:`, error.message);
    }
  }

  private async processComprehensiveFile(filePath: string) {
    // Similar processing for comprehensive data
    await this.processFocusedFile(filePath);
  }

  private processScrapedItem(item: any) {
    try {
      // Validate against raw schema
      const validatedItem = rawScrapedDataSchema.parse(item);
      
      // Extract specific data types
      if (validatedItem.dataType === 'councillor') {
        this.extractCouncillorFromContent(validatedItem);
      } else if (validatedItem.dataType === 'council_meeting') {
        this.extractMeetingFromContent(validatedItem);
      } else if (validatedItem.dataType === 'service_form') {
        this.extractServiceFromContent(validatedItem);
      } else if (validatedItem.dataType === 'planning_application') {
        this.extractPlanningFromContent(validatedItem);
      } else if (validatedItem.dataType === 'financial_info') {
        this.extractFinancialFromContent(validatedItem);
      }
      
      // Always store raw page data
      this.processedData.rawPages.push({
        url: validatedItem.url,
        title: validatedItem.title,
        description: validatedItem.description,
        category: validatedItem.category,
        contentLength: validatedItem.metadata.contentLength,
        quality: validatedItem.quality,
        crawledAt: new Date(validatedItem.crawledAt)
      });
      
    } catch (error) {
      // Skip invalid items but log for debugging
      console.log(`⚠️ Skipping invalid item: ${error.message}`);
    }
  }

  private extractCouncillorFromContent(data: any) {
    // Extract councillor information from HTML content
    const councillorData = {
      name: this.extractName(data.content),
      ward: this.extractWard(data.content),
      party: this.extractParty(data.content),
      email: this.extractEmail(data.content),
      committees: this.extractCommittees(data.content),
      responsibilities: this.extractResponsibilities(data.content),
      lastUpdated: new Date()
    };
    
    // Only add if we have minimum required data
    if (councillorData.name && councillorData.ward) {
      this.processedData.councillors.push(councillorData);
    }
  }

  private extractMeetingFromContent(data: any) {
    const meetingData = {
      title: data.title,
      committee: this.extractCommittee(data.content),
      date: this.extractDate(data.content) || new Date(),
      status: 'completed' as const,
      publicAccess: true,
      attendees: this.extractAttendees(data.content),
      decisions: this.extractDecisions(data.content),
      lastUpdated: new Date()
    };
    
    this.processedData.meetings.push(meetingData);
  }

  private extractServiceFromContent(data: any) {
    const serviceData = {
      name: data.title,
      description: data.description,
      department: this.extractDepartment(data.content),
      category: data.category,
      onlineAccess: this.hasOnlineAccess(data.content),
      lastUpdated: new Date()
    };
    
    this.processedData.services.push(serviceData);
  }

  private extractPlanningFromContent(data: any) {
    // Extract planning application details
    const planningData = {
      applicationNumber: this.extractApplicationNumber(data.content),
      address: this.extractAddress(data.content),
      description: data.description,
      status: this.extractPlanningStatus(data.content) || 'pending',
      submissionDate: this.extractDate(data.content) || new Date(),
      ward: this.extractWard(data.content),
      lastUpdated: new Date()
    };
    
    if (planningData.applicationNumber || planningData.address) {
      this.processedData.planningApplications.push(planningData);
    }
  }

  private extractFinancialFromContent(data: any) {
    // Extract financial/statistical data for charts
    const stats = this.extractFinancialStats(data.content);
    this.processedData.statistics.push(...stats);
  }

  private extractMeetingData(data: any) {
    // Direct meeting data processing
    this.extractMeetingFromContent(data);
  }

  private extractPageData(data: any) {
    // Process general page data
    this.processScrapedItem(data);
  }

  private extractChartData(data: any) {
    // Process chart/visualization data
    const chartStats = {
      category: data.category || 'General',
      subcategory: data.subcategory || 'Unknown',
      metric: data.title,
      value: 0, // Parse from dataPoints
      unit: data.unit || 'count',
      period: 'current',
      date: new Date(),
      sourceDocument: 'Chart Data',
      lastUpdated: new Date()
    };
    
    if (data.dataPoints) {
      for (const point of data.dataPoints) {
        this.processedData.statistics.push({
          ...chartStats,
          metric: point.label,
          value: point.value || 0
        });
      }
    }
  }

  // Helper extraction methods
  private extractName(content: string): string {
    const nameMatch = content.match(/Councillor\s+([^<]+)/i);
    return nameMatch ? nameMatch[1].trim() : '';
  }

  private extractWard(content: string): string {
    const wardMatch = content.match(/<p>([^<]+)<\/p>/);
    return wardMatch ? wardMatch[1].trim() : '';
  }

  private extractParty(content: string): string {
    const parties = ['Labour', 'Conservative', 'Liberal Democrat', 'Independent', 'Communities First'];
    for (const party of parties) {
      if (content.includes(party)) return party;
    }
    return '';
  }

  private extractEmail(content: string): string {
    const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return emailMatch ? emailMatch[1] : '';
  }

  private extractCommittees(content: string): string[] {
    // Extract committee memberships from content
    return [];
  }

  private extractResponsibilities(content: string): string[] {
    // Extract responsibilities from content
    return [];
  }

  private extractCommittee(content: string): string {
    return 'General Committee'; // Default, could be smarter
  }

  private extractDate(content: string): Date | null {
    const dateMatch = content.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/);
    return dateMatch ? new Date(dateMatch[0]) : null;
  }

  private extractAttendees(content: string): string[] {
    return [];
  }

  private extractDecisions(content: string): string[] {
    return [];
  }

  private extractDepartment(content: string): string {
    return 'General'; // Could be extracted from URL or content
  }

  private hasOnlineAccess(content: string): boolean {
    return content.includes('online') || content.includes('digital');
  }

  private extractApplicationNumber(content: string): string {
    const appNumMatch = content.match(/Application\s*Number[:\s]*([A-Z0-9\/]+)/i);
    return appNumMatch ? appNumMatch[1] : '';
  }

  private extractAddress(content: string): string {
    // Extract address from planning content
    return '';
  }

  private extractPlanningStatus(content: string): 'pending' | 'approved' | 'rejected' | 'withdrawn' {
    if (content.includes('approved')) return 'approved';
    if (content.includes('rejected')) return 'rejected';
    if (content.includes('withdrawn')) return 'withdrawn';
    return 'pending';
  }

  private extractFinancialStats(content: string): any[] {
    // Extract financial statistics from content
    return [];
  }

  async saveProcessedData() {
    const outputDir = path.join(this.basePath, 'processed-civic-data');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Save each data type separately
    for (const [type, data] of Object.entries(this.processedData)) {
      const filePath = path.join(outputDir, `${type}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`💾 Saved ${data.length} ${type} records to ${filePath}`);
    }
  }
}

// CLI runner
async function main() {
  const processor = new CivicDataProcessor();
  const processedData = await processor.processAllData();
  await processor.saveProcessedData();
  
  console.log('\n📈 Processing Summary:');
  console.log(`Councillors: ${processedData.councillors.length}`);
  console.log(`Meetings: ${processedData.meetings.length}`);
  console.log(`Services: ${processedData.services.length}`);
  console.log(`Planning Apps: ${processedData.planningApplications.length}`);
  console.log(`Documents: ${processedData.documents.length}`);
  console.log(`Statistics: ${processedData.statistics.length}`);
  console.log(`Raw Pages: ${processedData.rawPages.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
