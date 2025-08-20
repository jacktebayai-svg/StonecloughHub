import { storage } from '../server/storage';
import { FileProcessor } from '../server/services/file-processor';
import { coverageMonitor } from '../server/services/coverage-monitor';
import { InsertCouncilData } from '@shared/schema';
import { SpendingRecordSchema, BudgetItemSchema } from '@shared/scraper-validation-schemas';
import * as cheerio from 'cheerio';

export class SpendingDataScraper {
  private readonly baseUrl = 'https://www.bolton.gov.uk';
  private readonly requestDelay = 2000;
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB
  
  // Known transparency and spending data URLs
  private readonly transparencyUrls = [
    '/transparency-and-performance',
    '/transparency-and-performance/spending-over-500',
    '/transparency-and-performance/payments-to-suppliers',
    '/transparency-and-performance/procurement-and-contracts',
    '/transparency-and-performance/budget-and-spending',
    '/transparency-and-performance/annual-accounts',
    '/transparency-and-performance/senior-salaries',
    '/council-and-democracy/budget-and-policy-framework',
    '/council-and-democracy/council-budget',
    '/business-and-licensing/procurement-opportunities',
    '/business-and-licensing/contracts-register'
  ];

  private processedFiles = new Set<string>();
  private scrapedData = {
    spendingRecords: [] as any[],
    budgetItems: [] as any[],
    contractData: [] as any[],
    salaryData: [] as any[]
  };

  /**
   * Main scraping orchestrator for spending and budget data
   */
  async scrapeAllSpendingData(): Promise<void> {
    console.log('💰 Starting comprehensive spending data scrape...');
    
    try {
      // 1. Scrape transparency pages for data files
      await this.scrapeTransparencyPages();
      
      // 2. Target known spending datasets
      await this.scrapeKnownDatasets();
      
      // 3. Process discovered files
      await this.processDiscoveredFiles();
      
      // 4. Store normalized data
      await this.storeNormalizedData();
      
      // 5. Generate spending report
      await this.generateSpendingReport();
      
      console.log(`✅ Spending data scrape completed!`);
      console.log(`📊 Results: ${this.scrapedData.spendingRecords.length} spending records, ${this.scrapedData.budgetItems.length} budget items`);
      
    } catch (error) {
      console.error('❌ Spending data scrape failed:', error);
      coverageMonitor.logError('parsing_error', 'spending-scraper', error.message, 'transparency');
      throw error;
    }
  }

  /**
   * Scrape transparency pages for data files
   */
  private async scrapeTransparencyPages(): Promise<void> {
    console.log('🔍 Scraping transparency pages for data files...');
    
    for (const path of this.transparencyUrls) {
      const url = `${this.baseUrl}${path}`;
      
      try {
        console.log(`📄 Checking: ${url}`);
        
        const startTime = Date.now();
        const response = await this.fetchWithRetry(url);
        const responseTime = Date.now() - startTime;
        
        if (!response) {
          coverageMonitor.logError('404', url, 'Failed to fetch transparency page', 'transparency');
          continue;
        }
        
        coverageMonitor.logSuccess(url, responseTime, 'transparency');
        
        const $ = cheerio.load(response);
        
        // Extract file links (CSV, Excel, PDF)
        const fileLinks = this.extractDataFileLinks($, url);
        console.log(`📁 Found ${fileLinks.length} data files on ${url}`);
        
        // Process each file
        for (const fileLink of fileLinks) {
          await this.processDataFile(fileLink, url);
          await this.delay();
        }
        
      } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error);
        coverageMonitor.logError('parsing_error', url, error.message, 'transparency');
        continue;
      }
      
      await this.delay();
    }
  }

  /**
   * Target known spending datasets with direct URLs
   */
  private async scrapeKnownDatasets(): Promise<void> {
    console.log('🎯 Targeting known spending datasets...');
    
    const knownDatasets = [
      // Common UK council transparency file patterns
      `${this.baseUrl}/sites/default/files/spending_over_500.csv`,
      `${this.baseUrl}/sites/default/files/payments_to_suppliers.csv`,
      `${this.baseUrl}/sites/default/files/budget_allocation.xlsx`,
      `${this.baseUrl}/sites/default/files/procurement_contracts.csv`,
      `${this.baseUrl}/sites/default/files/senior_salaries.csv`,
      
      // Archive patterns (try different years)
      ...this.generateArchiveUrls()
    ];
    
    for (const datasetUrl of knownDatasets) {
      try {
        await this.processDataFile(datasetUrl, datasetUrl);
        await this.delay();
      } catch (error) {
        // Silent fail for speculative URLs
        console.log(`⏭️ Dataset not found: ${datasetUrl}`);
      }
    }
  }

  /**
   * Generate archive URLs for different years
   */
  private generateArchiveUrls(): string[] {
    const urls: string[] = [];
    const currentYear = new Date().getFullYear();
    
    // Check last 3 years
    for (let year = currentYear; year >= currentYear - 3; year--) {
      const yearUrls = [
        `${this.baseUrl}/sites/default/files/${year}/spending_over_500.csv`,
        `${this.baseUrl}/sites/default/files/${year}/payments_${year}.csv`,
        `${this.baseUrl}/sites/default/files/spending_${year}.xlsx`,
        `${this.baseUrl}/sites/default/files/budget_${year}.xlsx`,
        `${this.baseUrl}/transparency/${year}/spending-data.csv`
      ];
      urls.push(...yearUrls);
    }
    
    return urls;
  }

  /**
   * Extract data file links from a page
   */
  private extractDataFileLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const fileLinks: string[] = [];
    
    // Look for links to data files
    $('a[href]').each((_, link) => {
      const href = $(link).attr('href');
      if (!href) return;
      
      const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
      
      // Check if it's a data file
      if (this.isDataFile(fullUrl)) {
        const linkText = $(link).text().toLowerCase();
        
        // Prioritize spending and budget related files
        if (this.isSpendingRelated(linkText, fullUrl)) {
          fileLinks.push(fullUrl);
        }
      }
    });
    
    // Remove duplicates
    return [...new Set(fileLinks)];
  }

  /**
   * Check if URL points to a data file
   */
  private isDataFile(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.csv') || 
           lowerUrl.endsWith('.xlsx') || 
           lowerUrl.endsWith('.xls') ||
           lowerUrl.includes('spreadsheet') ||
           (lowerUrl.endsWith('.pdf') && this.isSpendingRelated('', url));
  }

  /**
   * Check if file is spending/budget related
   */
  private isSpendingRelated(linkText: string, url: string): boolean {
    const combined = `${linkText} ${url}`.toLowerCase();
    
    const spendingKeywords = [
      'spending', 'expenditure', 'payment', 'supplier', 'procurement',
      'budget', 'allocation', 'finance', 'cost', 'contract',
      'invoice', 'transaction', 'salary', 'wage', '£500', 'over 500'
    ];
    
    return spendingKeywords.some(keyword => combined.includes(keyword));
  }

  /**
   * Process individual data file
   */
  private async processDataFile(fileUrl: string, parentUrl: string): Promise<void> {
    if (this.processedFiles.has(fileUrl)) {
      console.log(`⏭️ Already processed: ${fileUrl}`);
      return;
    }
    
    try {
      console.log(`💾 Processing data file: ${fileUrl}`);
      
      // Use enhanced FileProcessor
      const result = await FileProcessor.processFile(fileUrl, parentUrl);
      
      // Store the file reference with both URLs
      const fileRecord: InsertCouncilData = {
        title: `Financial Data: ${result.document.title}`,
        description: result.document.description || 'Financial data file',
        dataType: 'transparency_data',
        sourceUrl: parentUrl, // Parent page URL
        date: new Date(),
        metadata: {
          fileUrl, // Direct file URL
          parentPageUrl: parentUrl, // Page where file was found
          fileType: result.document.fileType,
          fileSize: result.document.fileSize,
          extractedItemCount: result.extractedData.budgetItems.length + 
                             result.extractedData.spendingRecords.length,
          type: 'financial_data_file',
          processingDate: new Date().toISOString()
        }
      };
      
      await storage.createCouncilData(fileRecord);
      
      // Add to our collection for reporting
      this.scrapedData.spendingRecords.push(...result.extractedData.spendingRecords);
      this.scrapedData.budgetItems.push(...result.extractedData.budgetItems);
      
      this.processedFiles.add(fileUrl);
      
      console.log(`✅ Processed file: ${result.extractedData.budgetItems.length + result.extractedData.spendingRecords.length} records extracted`);
      
    } catch (error) {
      console.error(`❌ Error processing file ${fileUrl}:`, error);
      coverageMonitor.logError('parsing_error', fileUrl, error.message, 'transparency');
    }
  }

  /**
   * Process any remaining discovered files
   */
  private async processDiscoveredFiles(): Promise<void> {
    console.log('🔍 Processing any remaining discovered files...');
    
    // This would process any files found during the crawl but not yet processed
    // Implementation would depend on how files are queued during discovery
  }

  /**
   * Store normalized spending and budget data
   */
  private async storeNormalizedData(): Promise<void> {
    console.log(`💾 Storing normalized data...`);
    
    let storedSpending = 0;
    let storedBudget = 0;
    let errors = 0;
    
    // Store spending records
    for (const record of this.scrapedData.spendingRecords) {
      try {
        // Validate with schema
        const validatedRecord = SpendingRecordSchema.safeParse(record);
        if (validatedRecord.success) {
          const councilData: InsertCouncilData = {
            title: `Spending: ${validatedRecord.data.supplier}`,
            description: validatedRecord.data.description,
            dataType: 'council_spending',
            sourceUrl: validatedRecord.data.sourceUrl,
            amount: Math.round(validatedRecord.data.amount * 100), // Store as pence
            date: validatedRecord.data.transactionDate,
            metadata: {
              ...validatedRecord.data,
              type: 'spending_record',
              amountInPence: Math.round(validatedRecord.data.amount * 100),
              normalizedAt: new Date().toISOString()
            }
          };
          
          await storage.createCouncilData(councilData);
          storedSpending++;
        }
      } catch (error) {
        console.error('Error storing spending record:', error);
        errors++;
      }
    }
    
    // Store budget items
    for (const item of this.scrapedData.budgetItems) {
      try {
        const validatedItem = BudgetItemSchema.safeParse(item);
        if (validatedItem.success) {
          const councilData: InsertCouncilData = {
            title: `Budget: ${validatedItem.data.department} - ${validatedItem.data.category}`,
            description: validatedItem.data.description || `Budget allocation for ${validatedItem.data.category}`,
            dataType: 'budget_item',
            sourceUrl: validatedItem.data.sourceUrl,
            amount: Math.round(validatedItem.data.budgetedAmount * 100), // Store as pence
            date: new Date(validatedItem.data.year, 0, 1), // January 1st of budget year
            metadata: {
              ...validatedItem.data,
              type: 'budget_item',
              budgetedAmountInPence: Math.round(validatedItem.data.budgetedAmount * 100),
              actualAmountInPence: validatedItem.data.actualAmount ? 
                Math.round(validatedItem.data.actualAmount * 100) : null,
              normalizedAt: new Date().toISOString()
            }
          };
          
          await storage.createCouncilData(councilData);
          storedBudget++;
        }
      } catch (error) {
        console.error('Error storing budget item:', error);
        errors++;
      }
    }
    
    console.log(`✅ Storage complete: ${storedSpending} spending records, ${storedBudget} budget items, ${errors} errors`);
  }

  /**
   * Generate comprehensive spending report
   */
  private async generateSpendingReport(): Promise<void> {
    console.log('📊 Generating spending analysis report...');
    
    const report = {
      summary: {
        totalSpendingRecords: this.scrapedData.spendingRecords.length,
        totalBudgetItems: this.scrapedData.budgetItems.length,
        totalFilesProcessed: this.processedFiles.size,
        scrapingDate: new Date()
      },
      spendingAnalysis: this.analyzeSpendingData(),
      budgetAnalysis: this.analyzeBudgetData(),
      dataQuality: this.assessDataQuality(),
      recommendations: this.generateDataRecommendations()
    };
    
    // Store report
    const reportData: InsertCouncilData = {
      title: `Spending Data Report: ${new Date().toISOString().split('T')[0]}`,
      description: 'Comprehensive analysis of scraped spending and budget data',
      dataType: 'council_document',
      sourceUrl: `internal://spending-report/${Date.now()}`,
      date: new Date(),
      metadata: {
        ...report,
        type: 'spending_data_report'
      }
    };
    
    await storage.createCouncilData(reportData);
    
    // Write to file for external access
    await this.writeReportToFile(report);
    
    console.log('📊 Spending report generated and stored');
  }

  /**
   * Analyze spending data patterns
   */
  private analyzeSpendingData(): any {
    const spending = this.scrapedData.spendingRecords;
    
    if (spending.length === 0) {
      return { message: 'No spending data available for analysis' };
    }
    
    // Calculate totals by department
    const departmentTotals = new Map<string, number>();
    const supplierTotals = new Map<string, number>();
    const categoryTotals = new Map<string, number>();
    
    spending.forEach(record => {
      departmentTotals.set(record.department, 
        (departmentTotals.get(record.department) || 0) + record.amount);
      supplierTotals.set(record.supplier, 
        (supplierTotals.get(record.supplier) || 0) + record.amount);
      categoryTotals.set(record.category, 
        (categoryTotals.get(record.category) || 0) + record.amount);
    });
    
    return {
      totalAmount: spending.reduce((sum, r) => sum + r.amount, 0),
      averageTransaction: spending.reduce((sum, r) => sum + r.amount, 0) / spending.length,
      topDepartments: this.getTopEntries(departmentTotals, 10),
      topSuppliers: this.getTopEntries(supplierTotals, 10),
      topCategories: this.getTopEntries(categoryTotals, 10),
      dateRange: this.getDateRange(spending)
    };
  }

  /**
   * Analyze budget data patterns
   */
  private analyzeBudgetData(): any {
    const budget = this.scrapedData.budgetItems;
    
    if (budget.length === 0) {
      return { message: 'No budget data available for analysis' };
    }
    
    const departmentBudgets = new Map<string, number>();
    const categoryBudgets = new Map<string, number>();
    
    budget.forEach(item => {
      departmentBudgets.set(item.department, 
        (departmentBudgets.get(item.department) || 0) + item.budgetedAmount);
      categoryBudgets.set(item.category, 
        (categoryBudgets.get(item.category) || 0) + item.budgetedAmount);
    });
    
    return {
      totalBudget: budget.reduce((sum, i) => sum + i.budgetedAmount, 0),
      averageAllocation: budget.reduce((sum, i) => sum + i.budgetedAmount, 0) / budget.length,
      topDepartments: this.getTopEntries(departmentBudgets, 10),
      topCategories: this.getTopEntries(categoryBudgets, 10),
      yearsAvailable: [...new Set(budget.map(i => i.year))].sort()
    };
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(): any {
    const spending = this.scrapedData.spendingRecords;
    const budget = this.scrapedData.budgetItems;
    
    const spendingQuality = {
      completeness: this.calculateCompleteness(spending, ['supplier', 'department', 'amount', 'description']),
      duplicates: this.detectDuplicates(spending, 'spending'),
      anomalies: this.detectAnomalies(spending, 'spending')
    };
    
    const budgetQuality = {
      completeness: this.calculateCompleteness(budget, ['department', 'category', 'budgetedAmount']),
      duplicates: this.detectDuplicates(budget, 'budget'),
      anomalies: this.detectAnomalies(budget, 'budget')
    };
    
    return {
      spending: spendingQuality,
      budget: budgetQuality,
      overallScore: (spendingQuality.completeness + budgetQuality.completeness) / 2
    };
  }

  /**
   * Generate data-specific recommendations
   */
  private generateDataRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.scrapedData.spendingRecords.length < 100) {
      recommendations.push('Low spending record count. Consider expanding search to archive pages and alternative data sources.');
    }
    
    if (this.scrapedData.budgetItems.length < 50) {
      recommendations.push('Limited budget data found. Review budget publication schedules and formats.');
    }
    
    if (this.processedFiles.size < 5) {
      recommendations.push('Few data files processed. Expand file discovery mechanisms and format support.');
    }
    
    const qualityScore = this.assessDataQuality().overallScore;
    if (qualityScore < 70) {
      recommendations.push('Data quality below threshold. Implement additional validation and cleaning steps.');
    }
    
    return recommendations;
  }

  // Utility methods
  
  private async fetchWithRetry(url: string, maxRetries: number = 3): Promise<string | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; BoltonHubDataBot/1.0)',
            'Accept': 'text/html,*/*',
            'Accept-Language': 'en-GB,en-US;q=0.9'
          },
          timeout: 30000
        });
        
        if (response.ok) {
          return await response.text();
        } else if (response.status === 404) {
          return null; // Don't retry 404s
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = attempt * 2000; // Exponential backoff
        console.log(`🔄 Retry ${attempt}/${maxRetries} for ${url} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return null;
  }

  private async delay(): Promise<void> {
    const delay = this.requestDelay + (Math.random() * 1000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private getTopEntries(map: Map<string, number>, limit: number): Array<{name: string, amount: number}> {
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }

  private getDateRange(records: any[]): { earliest: Date | null, latest: Date | null } {
    if (records.length === 0) return { earliest: null, latest: null };
    
    const dates = records
      .map(r => r.transactionDate || r.date)
      .filter(d => d instanceof Date)
      .sort((a, b) => a.getTime() - b.getTime());
    
    return {
      earliest: dates[0] || null,
      latest: dates[dates.length - 1] || null
    };
  }

  private calculateCompleteness(records: any[], requiredFields: string[]): number {
    if (records.length === 0) return 0;
    
    let totalScore = 0;
    
    for (const record of records) {
      let fieldScore = 0;
      for (const field of requiredFields) {
        if (record[field] && record[field] !== '' && record[field] !== 'Unknown') {
          fieldScore++;
        }
      }
      totalScore += (fieldScore / requiredFields.length) * 100;
    }
    
    return totalScore / records.length;
  }

  private detectDuplicates(records: any[], type: string): number {
    const seen = new Set<string>();
    let duplicates = 0;
    
    for (const record of records) {
      const key = type === 'spending' 
        ? `${record.supplier}-${record.amount}-${record.transactionDate}`
        : `${record.department}-${record.category}-${record.budgetedAmount}`;
      
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    }
    
    return duplicates;
  }

  private detectAnomalies(records: any[], type: string): string[] {
    const anomalies: string[] = [];
    
    for (const record of records) {
      const amount = type === 'spending' ? record.amount : record.budgetedAmount;
      
      // Check for suspiciously high amounts
      if (amount > 10000000) { // £10M+
        anomalies.push(`Unusually high amount: £${amount.toLocaleString()}`);
      }
      
      // Check for negative amounts
      if (amount < 0) {
        anomalies.push(`Negative amount detected: £${amount}`);
      }
      
      // Check for missing critical fields
      if (type === 'spending' && (!record.supplier || record.supplier === 'Unknown')) {
        anomalies.push('Missing supplier information');
      }
    }
    
    return anomalies;
  }

  private async writeReportToFile(report: any): Promise<void> {
    try {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      
      const dir = './scraped_data/reports';
      await fs.mkdir(dir, { recursive: true });
      
      const filename = `spending-report-${new Date().toISOString().slice(0, 10)}.json`;
      const filePath = path.join(dir, filename);
      
      await fs.writeFile(filePath, JSON.stringify(report, null, 2));
      console.log(`📝 Spending report written to: ${filePath}`);
    } catch (error) {
      console.error('Error writing spending report to file:', error);
    }
  }
}

// Export for use in other scripts
export const spendingDataScraper = new SpendingDataScraper();

// Run directly if this file is executed
if (require.main === module) {
  spendingDataScraper.scrapeAllSpendingData()
    .then(() => {
      console.log('🎉 Spending data scraping completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Spending data scraping failed:', error);
      process.exit(1);
    });
}
