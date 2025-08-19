import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { HardDataExtractor } from './data-extractors.js';
import type { BudgetItem, SpendingRecord, StatisticalData, Document } from '@shared/enhanced-schema';

/**
 * File Processing System
 * Handles downloading and processing of council documents (PDF, CSV, Excel)
 * to extract structured data for resident insights
 */

export class FileProcessor {
  private static readonly SUPPORTED_TYPES = [
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly DOWNLOAD_DIR = './scraped_data/files/';

  /**
   * Download and process a file from URL
   */
  static async processFile(fileUrl: string, sourceUrl: string): Promise<{
    document: Document;
    extractedData: {
      budgetItems: BudgetItem[];
      spendingRecords: SpendingRecord[];
      statisticalData: StatisticalData[];
      structuredData: any[];
    };
  }> {
    try {
      console.log(`📄 Processing file: ${fileUrl}`);
      
      // Download file
      const { filePath, fileInfo } = await this.downloadFile(fileUrl, sourceUrl);
      
      // Create document record
      const document: Document = {
        title: fileInfo.title,
        description: `Downloaded from ${sourceUrl}`,
        type: this.categorizeDocument(fileInfo.title, fileInfo.fileType),
        department: this.inferDepartment(fileInfo.title, sourceUrl),
        fileUrl,
        fileType: fileInfo.fileType,
        fileSize: fileInfo.size,
        publishDate: new Date(),
        category: this.categorizeByContent(fileInfo.title),
        tags: this.extractTags(fileInfo.title),
        lastUpdated: new Date()
      };

      // Process file based on type
      let extractedData = {
        budgetItems: [] as BudgetItem[],
        spendingRecords: [] as SpendingRecord[],
        statisticalData: [] as StatisticalData[],
        structuredData: [] as any[]
      };

      if (fileInfo.fileType.includes('pdf')) {
        extractedData = await this.processPDF(filePath, sourceUrl);
      } else if (fileInfo.fileType.includes('csv')) {
        extractedData = await this.processCSV(filePath, sourceUrl);
      } else if (fileInfo.fileType.includes('excel') || fileInfo.fileType.includes('spreadsheet')) {
        extractedData = await this.processExcel(filePath, sourceUrl);
      } else if (fileInfo.fileType.includes('text')) {
        extractedData = await this.processText(filePath, sourceUrl);
      }

      // Store extracted data in document
      document.extractedData = {
        totalItems: extractedData.budgetItems.length + 
                   extractedData.spendingRecords.length + 
                   extractedData.statisticalData.length,
        processingDate: new Date(),
        dataTypes: this.getDataTypes(extractedData)
      };

      console.log(`✅ Processed ${document.title}: ${document.extractedData.totalItems} data items`);
      
      return { document, extractedData };
      
    } catch (error) {
      console.error(`❌ Error processing file ${fileUrl}:`, error);
      throw error;
    }
  }

  /**
   * Download file from URL
   */
  private static async downloadFile(fileUrl: string, sourceUrl: string): Promise<{
    filePath: string;
    fileInfo: {
      title: string;
      fileType: string;
      size: number;
    };
  }> {
    try {
      const response = await fetch(fileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BoltonHubBot/1.0)',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const contentLength = parseInt(response.headers.get('content-length') || '0');

      if (contentLength > this.MAX_FILE_SIZE) {
        throw new Error(`File too large: ${contentLength} bytes`);
      }

      if (!this.isSupportedType(contentType)) {
        throw new Error(`Unsupported file type: ${contentType}`);
      }

      // Generate filename
      const urlPath = new URL(fileUrl).pathname;
      const fileName = urlPath.split('/').pop() || `file_${Date.now()}`;
      const filePath = `${this.DOWNLOAD_DIR}${fileName}`;

      // Ensure directory exists
      await import('fs/promises').then(fs => fs.mkdir(this.DOWNLOAD_DIR, { recursive: true }));

      // Download file
      const fileStream = createWriteStream(filePath);
      await pipeline(response.body!, fileStream);

      return {
        filePath,
        fileInfo: {
          title: fileName,
          fileType: contentType,
          size: contentLength
        }
      };

    } catch (error) {
      console.error(`Failed to download ${fileUrl}:`, error);
      throw error;
    }
  }

  /**
   * Process PDF files (requires pdf-parse or similar)
   */
  private static async processPDF(filePath: string, sourceUrl: string): Promise<any> {
    console.log('📋 Processing PDF file...');
    
    try {
      // Note: In a real implementation, you'd use a library like pdf-parse
      // For now, we'll simulate PDF text extraction
      const fs = await import('fs/promises');
      const fileContent = await fs.readFile(filePath);
      
      // Simulate PDF text extraction
      const extractedText = `PDF Content from ${filePath} - Contains budget and financial data`;
      
      // Process the extracted text
      const hardData = HardDataExtractor.extractFinancialData(extractedText, sourceUrl);
      const metrics = HardDataExtractor.extractPerformanceMetrics(extractedText, sourceUrl);
      const statistics = HardDataExtractor.extractStatisticalData(extractedText, sourceUrl);

      return {
        budgetItems: hardData.budgetItems,
        spendingRecords: hardData.spendingRecords,
        statisticalData: [...statistics, ...metrics.map(m => ({
          category: 'Performance',
          subcategory: m.service,
          metric: m.metric,
          value: m.value,
          unit: m.unit,
          period: m.period,
          date: m.date,
          sourceDocument: sourceUrl,
          confidence: 'medium',
          lastUpdated: new Date()
        }))],
        structuredData: hardData.structuredData
      };
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      return this.getEmptyData();
    }
  }

  /**
   * Process CSV files
   */
  private static async processCSV(filePath: string, sourceUrl: string): Promise<any> {
    console.log('📊 Processing CSV file...');
    
    try {
      const fs = await import('fs/promises');
      const csvContent = await fs.readFile(filePath, 'utf-8');
      
      const lines = csvContent.split('\n');
      const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
      
      const budgetItems: BudgetItem[] = [];
      const spendingRecords: SpendingRecord[] = [];
      const statisticalData: StatisticalData[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
        
        if (cells.length >= headers.length) {
          const rowData = this.processCSVRow(headers, cells, sourceUrl);
          
          if (rowData.type === 'budget') {
            budgetItems.push(rowData.data as BudgetItem);
          } else if (rowData.type === 'spending') {
            spendingRecords.push(rowData.data as SpendingRecord);
          } else if (rowData.type === 'statistical') {
            statisticalData.push(rowData.data as StatisticalData);
          }
        }
      }

      console.log(`📈 CSV processed: ${budgetItems.length} budget items, ${spendingRecords.length} spending records, ${statisticalData.length} statistics`);

      return {
        budgetItems,
        spendingRecords,
        statisticalData,
        structuredData: []
      };
      
    } catch (error) {
      console.error('Error processing CSV:', error);
      return this.getEmptyData();
    }
  }

  /**
   * Process Excel files (requires xlsx or similar)
   */
  private static async processExcel(filePath: string, sourceUrl: string): Promise<any> {
    console.log('📈 Processing Excel file...');
    
    try {
      // Note: In a real implementation, you'd use a library like xlsx
      // For now, we'll simulate Excel processing
      console.log('Excel processing would happen here with xlsx library');
      
      return this.getEmptyData();
      
    } catch (error) {
      console.error('Error processing Excel:', error);
      return this.getEmptyData();
    }
  }

  /**
   * Process text files
   */
  private static async processText(filePath: string, sourceUrl: string): Promise<any> {
    console.log('📝 Processing text file...');
    
    try {
      const fs = await import('fs/promises');
      const textContent = await fs.readFile(filePath, 'utf-8');
      
      const hardData = HardDataExtractor.extractFinancialData(`<body>${textContent}</body>`, sourceUrl);
      const quantData = HardDataExtractor.extractQuantitativeData(textContent, sourceUrl);
      
      const statisticalData = quantData.map((item, index) => ({
        category: 'Text Data',
        metric: `${item.type}_${index}`,
        value: item.value,
        unit: item.unit,
        period: 'current',
        date: new Date(),
        sourceDocument: sourceUrl,
        confidence: item.confidence,
        lastUpdated: new Date()
      }));

      return {
        budgetItems: hardData.budgetItems,
        spendingRecords: hardData.spendingRecords,
        statisticalData,
        structuredData: hardData.structuredData
      };
      
    } catch (error) {
      console.error('Error processing text:', error);
      return this.getEmptyData();
    }
  }

  /**
   * Process CSV row into appropriate data structure
   */
  private static processCSVRow(headers: string[], cells: string[], sourceUrl: string): {
    type: 'budget' | 'spending' | 'statistical';
    data: any;
  } {
    const now = new Date();
    const lowerHeaders = headers.map(h => h.toLowerCase());
    
    // Check if it's financial data
    const amountIndex = lowerHeaders.findIndex(h => 
      h.includes('amount') || h.includes('cost') || h.includes('budget') || h.includes('spend')
    );
    
    if (amountIndex >= 0) {
      const amount = this.parseAmount(cells[amountIndex]);
      
      if (amount > 0) {
        const departmentIndex = lowerHeaders.findIndex(h => 
          h.includes('department') || h.includes('service')
        );
        const descriptionIndex = lowerHeaders.findIndex(h => 
          h.includes('description') || h.includes('detail')
        );
        
        // Determine if budget or spending
        if (lowerHeaders.some(h => h.includes('budget') || h.includes('allocation'))) {
          return {
            type: 'budget',
            data: {
              department: cells[departmentIndex] || 'General',
              category: 'CSV Import',
              amount,
              currency: 'GBP',
              year: now.getFullYear(),
              description: cells[descriptionIndex] || 'Budget item',
              sourceDocument: sourceUrl,
              lastUpdated: now
            } as BudgetItem
          };
        } else {
          return {
            type: 'spending',
            data: {
              transactionDate: now,
              supplier: cells[departmentIndex] || 'Unknown',
              department: 'General',
              description: cells[descriptionIndex] || 'Spending item',
              amount,
              category: 'CSV Import',
              sourceUrl,
              extractedAt: now
            } as SpendingRecord
          };
        }
      }
    }
    
    // Otherwise treat as statistical data
    const valueIndex = lowerHeaders.findIndex(h => 
      /\d/.test(cells[headers.indexOf(h)]) && !h.includes('date') && !h.includes('year')
    );
    
    if (valueIndex >= 0) {
      const value = parseFloat(cells[valueIndex].replace(/[^0-9.-]/g, ''));
      
      if (!isNaN(value)) {
        return {
          type: 'statistical',
          data: {
            category: 'CSV Data',
            metric: headers[valueIndex],
            value,
            unit: this.extractUnit(cells[valueIndex]),
            period: 'current',
            date: now,
            sourceDocument: sourceUrl,
            confidence: 'high',
            lastUpdated: now
          } as StatisticalData
        };
      }
    }

    // Default to empty statistical data
    return {
      type: 'statistical',
      data: {
        category: 'CSV Data',
        metric: 'Unknown',
        value: 0,
        unit: 'count',
        period: 'current',
        date: now,
        sourceDocument: sourceUrl,
        confidence: 'low',
        lastUpdated: now
      } as StatisticalData
    };
  }

  // Helper methods

  private static isSupportedType(contentType: string): boolean {
    return this.SUPPORTED_TYPES.some(type => contentType.includes(type));
  }

  private static categorizeDocument(title: string, fileType: string): Document['type'] {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('budget')) return 'budget';
    if (lowerTitle.includes('policy')) return 'policy';
    if (lowerTitle.includes('strategy')) return 'strategy';
    if (lowerTitle.includes('report')) return 'report';
    if (lowerTitle.includes('agenda')) return 'agenda';
    if (lowerTitle.includes('minutes')) return 'minutes';
    if (lowerTitle.includes('consultation')) return 'consultation';
    if (fileType.includes('csv') || fileType.includes('excel')) return 'data';
    
    return 'report';
  }

  private static inferDepartment(title: string, sourceUrl: string): string {
    const lowerTitle = title.toLowerCase();
    const lowerUrl = sourceUrl.toLowerCase();
    
    if (lowerTitle.includes('planning') || lowerUrl.includes('planning')) return 'Planning';
    if (lowerTitle.includes('finance') || lowerUrl.includes('finance')) return 'Finance';
    if (lowerTitle.includes('housing') || lowerUrl.includes('housing')) return 'Housing';
    if (lowerTitle.includes('education') || lowerUrl.includes('education')) return 'Education';
    if (lowerTitle.includes('transport') || lowerUrl.includes('transport')) return 'Transport';
    if (lowerTitle.includes('environment') || lowerUrl.includes('environment')) return 'Environment';
    
    return 'General';
  }

  private static categorizeByContent(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('financial') || lowerTitle.includes('budget') || lowerTitle.includes('spend')) {
      return 'Financial';
    }
    if (lowerTitle.includes('performance') || lowerTitle.includes('metric') || lowerTitle.includes('kpi')) {
      return 'Performance';
    }
    if (lowerTitle.includes('policy') || lowerTitle.includes('strategy')) {
      return 'Policy';
    }
    if (lowerTitle.includes('consultation') || lowerTitle.includes('engagement')) {
      return 'Public Engagement';
    }
    
    return 'General';
  }

  private static extractTags(title: string): string[] {
    const tags = [];
    const lowerTitle = title.toLowerCase();
    
    const tagKeywords = [
      'budget', 'spending', 'finance', 'policy', 'strategy', 'consultation',
      'performance', 'planning', 'housing', 'transport', 'education',
      'environment', 'health', 'social', 'economic', 'development'
    ];

    tagKeywords.forEach(keyword => {
      if (lowerTitle.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return tags;
  }

  private static parseAmount(amountStr: string): number {
    const cleaned = amountStr.replace(/[£$,\s]/g, '');
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : amount;
  }

  private static extractUnit(text: string): string {
    const unitMatch = text.match(/\d+(?:\.\d+)?\s*(%|£|\$|days?|hours?|weeks?|months?|years?|people|\w+)/i);
    return unitMatch ? unitMatch[1] : 'count';
  }

  private static getDataTypes(data: any): string[] {
    const types = [];
    
    if (data.budgetItems.length > 0) types.push('budget');
    if (data.spendingRecords.length > 0) types.push('spending');
    if (data.statisticalData.length > 0) types.push('statistical');
    if (data.structuredData.length > 0) types.push('structured');
    
    return types;
  }

  private static getEmptyData() {
    return {
      budgetItems: [],
      spendingRecords: [],
      statisticalData: [],
      structuredData: []
    };
  }
}
