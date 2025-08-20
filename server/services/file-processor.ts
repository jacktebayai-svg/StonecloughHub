import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { HardDataExtractor } from './data-extractors.js';
import { SpendingRecordSchema, BudgetItemSchema, StatisticalDataSchema } from '@shared/scraper-validation-schemas';
import type { BudgetItem, SpendingRecord, StatisticalData, Document } from '@shared/enhanced-schema';
import * as iconv from 'iconv-lite';
import { detect as detectEncoding } from 'chardet';
import PdfParserService from './pdf-parser-service.js';
import CitationService from './citation-service.js';

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
   * Enhanced PDF processing with structured extraction
   */
  private static async processPDF(filePath: string, sourceUrl: string): Promise<any> {
    console.log('📋 Processing PDF file with enhanced extraction...');
    
    try {
      const pdfParser = new PdfParserService();
      
      // Determine PDF type based on filename/source
      const isAgenda = filePath.toLowerCase().includes('agenda') || sourceUrl.toLowerCase().includes('agenda');
      const isMinutes = filePath.toLowerCase().includes('minutes') || sourceUrl.toLowerCase().includes('minutes');
      
      let parsedContent;
      
      if (isAgenda) {
        console.log('📅 Parsing as agenda document...');
        parsedContent = await pdfParser.parseAgendaPdf(filePath);
        
        // Convert agenda items to statistical data
        const statisticalData = parsedContent.agendaItems.map((item, index) => ({
          id: undefined,
          category: 'Meeting Agenda',
          subcategory: parsedContent.committee,
          metric: `Agenda Item ${item.itemNumber}`,
          value: index + 1, // Sequential numbering
          unit: 'item',
          period: 'meeting',
          date: parsedContent.meetingDate || new Date(),
          geography: undefined,
          demographic: undefined,
          sourceDocument: sourceUrl,
          methodology: `Extracted from ${parsedContent.meetingTitle}`,
          confidence: 'high' as const,
          lastUpdated: new Date()
        }));
        
        return {
          budgetItems: [],
          spendingRecords: [],
          statisticalData,
          structuredData: [{
            type: 'agenda',
            meetingTitle: parsedContent.meetingTitle,
            meetingDate: parsedContent.meetingDate,
            committee: parsedContent.committee,
            agendaItems: parsedContent.agendaItems,
            extractedAt: new Date(),
            sourceUrl
          }]
        };
        
      } else if (isMinutes) {
        console.log('📝 Parsing as minutes document...');
        parsedContent = await pdfParser.parseMinutesPdf(filePath);
        
        // Convert decisions to statistical data
        const statisticalData = parsedContent.decisions.map((decision, index) => ({
          id: undefined,
          category: 'Meeting Decisions',
          subcategory: parsedContent.committee,
          metric: `Decision ${index + 1}`,
          value: 1, // Each decision is one unit
          unit: 'decision',
          period: 'meeting',
          date: parsedContent.meetingDate || new Date(),
          geography: undefined,
          demographic: undefined,
          sourceDocument: sourceUrl,
          methodology: `Extracted from ${parsedContent.meetingTitle} minutes`,
          confidence: 'high' as const,
          lastUpdated: new Date()
        }));
        
        return {
          budgetItems: [],
          spendingRecords: [],
          statisticalData,
          structuredData: [{
            type: 'minutes',
            meetingTitle: parsedContent.meetingTitle,
            meetingDate: parsedContent.meetingDate,
            committee: parsedContent.committee,
            attendees: parsedContent.attendees,
            decisions: parsedContent.decisions,
            actions: parsedContent.actions,
            extractedAt: new Date(),
            sourceUrl
          }]
        };
        
      } else {
        console.log('📄 Parsing as general document...');
        parsedContent = await pdfParser.parsePdf(filePath, {
          extractAgendaItems: true,
          extractDecisions: true,
          extractAmounts: true,
          useOcr: false
        });
        
        // Convert amounts to spending records
        const spendingRecords = parsedContent.pages
          .flatMap(page => page.amounts
            .filter(amount => amount.confidence !== 'low')
            .map(amount => ({
              id: undefined,
              transactionDate: new Date(),
              supplier: 'PDF Extract',
              department: this.inferDepartment(parsedContent.metadata?.title || '', sourceUrl),
              description: amount.context,
              amount: amount.amount,
              paymentMethod: undefined,
              category: 'PDF Financial Data',
              invoiceNumber: undefined,
              sourceUrl,
              extractedAt: new Date()
            }))
          );
        
        // Convert other content to statistical data
        const statisticalData = [
          ...parsedContent.pages.flatMap(page => 
            page.agendaItems.map(item => ({
              id: undefined,
              category: 'Document Content',
              subcategory: 'Agenda Items',
              metric: item.title.substring(0, 100),
              value: 1,
              unit: 'item',
              period: 'document',
              date: new Date(),
              geography: undefined,
              demographic: undefined,
              sourceDocument: sourceUrl,
              methodology: `Extracted from page ${item.pageNumber}`,
              confidence: item.confidence,
              lastUpdated: new Date()
            }))
          ),
          ...parsedContent.pages.flatMap(page => 
            page.decisions.map(decision => ({
              id: undefined,
              category: 'Document Content',
              subcategory: 'Decisions',
              metric: decision.title.substring(0, 100),
              value: 1,
              unit: 'decision',
              period: 'document',
              date: new Date(),
              geography: undefined,
              demographic: undefined,
              sourceDocument: sourceUrl,
              methodology: `Extracted from page ${decision.pageNumber}`,
              confidence: decision.confidence,
              lastUpdated: new Date()
            }))
          )
        ];
        
        return {
          budgetItems: [],
          spendingRecords,
          statisticalData,
          structuredData: [{
            type: 'general_pdf',
            fullText: parsedContent.fullText,
            pageCount: parsedContent.pageCount,
            extractionMethod: parsedContent.extractionMethod,
            confidence: parsedContent.confidence,
            metadata: parsedContent.metadata,
            extractedAt: new Date(),
            sourceUrl
          }]
        };
      }
      
      // Cleanup temp files
      await pdfParser.cleanup();
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      return this.getEmptyData();
    }
  }

  /**
   * Enhanced CSV processing with encoding detection and robust parsing
   */
  private static async processCSV(filePath: string, sourceUrl: string): Promise<any> {
    console.log('📊 Processing CSV file with enhanced parsing...');
    
    try {
      const fs = await import('fs/promises');
      
      // Read file as buffer first for encoding detection
      const fileBuffer = await fs.readFile(filePath);
      
      // Detect encoding
      const detectedEncoding = detectEncoding(fileBuffer) || 'utf-8';
      console.log(`🔍 Detected encoding: ${detectedEncoding}`);
      
      // Convert to UTF-8 if needed
      let csvContent: string;
      try {
        csvContent = iconv.decode(fileBuffer, detectedEncoding);
      } catch (encodingError) {
        console.warn('⚠️ Encoding conversion failed, falling back to UTF-8');
        csvContent = fileBuffer.toString('utf-8');
      }
      
      // Robust CSV parsing
      const parseResult = this.parseCSVContent(csvContent);
      const { headers, rows, delimiter } = parseResult;
      
      console.log(`📋 CSV structure: ${headers.length} columns, ${rows.length} rows, delimiter: '${delimiter}'`);
      
      const budgetItems: BudgetItem[] = [];
      const spendingRecords: SpendingRecord[] = [];
      const statisticalData: StatisticalData[] = [];
      
      // Analyze headers to understand data structure
      const headerAnalysis = this.analyzeCSVHeaders(headers);
      console.log(`🔬 Header analysis:`, headerAnalysis);

      for (let i = 0; i < rows.length; i++) {
        const cells = rows[i];
        
        if (cells.length >= headers.length - 2) { // Allow some tolerance for missing cells
          try {
            const rowData = this.processEnhancedCSVRow(headers, cells, sourceUrl, headerAnalysis);
            
            if (rowData.type === 'budget' && rowData.data) {
              // Validate with Zod schema
              const validatedBudget = BudgetItemSchema.safeParse(rowData.data);
              if (validatedBudget.success) {
                budgetItems.push(validatedBudget.data);
              }
            } else if (rowData.type === 'spending' && rowData.data) {
              const validatedSpending = SpendingRecordSchema.safeParse(rowData.data);
              if (validatedSpending.success) {
                spendingRecords.push(validatedSpending.data);
              }
            } else if (rowData.type === 'statistical' && rowData.data) {
              const validatedStats = StatisticalDataSchema.safeParse(rowData.data);
              if (validatedStats.success) {
                statisticalData.push(validatedStats.data);
              }
            }
          } catch (rowError) {
            console.warn(`⚠️ Error processing row ${i + 1}:`, rowError);
            continue;
          }
        }
      }

      console.log(`📈 Enhanced CSV processed: ${budgetItems.length} budget items, ${spendingRecords.length} spending records, ${statisticalData.length} statistics`);

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
   * Parse CSV content with delimiter detection and proper quoting
   */
  private static parseCSVContent(content: string): {
    headers: string[];
    rows: string[][];
    delimiter: string;
  } {
    // Detect delimiter
    const possibleDelimiters = [',', ';', '\t', '|'];
    let bestDelimiter = ',';
    let maxColumns = 0;
    
    for (const delimiter of possibleDelimiters) {
      const firstLine = content.split('\n')[0] || '';
      const columns = this.parseCSVLine(firstLine, delimiter).length;
      if (columns > maxColumns) {
        maxColumns = columns;
        bestDelimiter = delimiter;
      }
    }
    
    // Split into lines and parse each
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const headers = this.parseCSVLine(lines[0] || '', bestDelimiter)
      .map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    const rows: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVLine(lines[i], bestDelimiter)
        .map(cell => cell.trim().replace(/^["']|["']$/g, ''));
      if (row.some(cell => cell.length > 0)) {
        rows.push(row);
      }
    }
    
    return { headers, rows, delimiter: bestDelimiter };
  }
  
  /**
   * Parse a single CSV line respecting quotes
   */
  private static parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
      } else if (inQuotes && char === quoteChar) {
        if (nextChar === quoteChar) {
          // Escaped quote
          current += char;
          i++; // Skip next character
        } else {
          inQuotes = false;
          quoteChar = '';
        }
      } else if (!inQuotes && char === delimiter) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }
  
  /**
   * Analyze CSV headers to understand data structure
   */
  private static analyzeCSVHeaders(headers: string[]): {
    financialColumns: number[];
    dateColumns: number[];
    textColumns: number[];
    categoryColumn: number | null;
    departmentColumn: number | null;
    descriptionColumn: number | null;
    dataType: 'spending' | 'budget' | 'statistical' | 'mixed';
  } {
    const analysis = {
      financialColumns: [] as number[],
      dateColumns: [] as number[],
      textColumns: [] as number[],
      categoryColumn: null as number | null,
      departmentColumn: null as number | null,
      descriptionColumn: null as number | null,
      dataType: 'mixed' as 'spending' | 'budget' | 'statistical' | 'mixed'
    };
    
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase();
      
      // Financial columns
      if (lowerHeader.includes('amount') || lowerHeader.includes('cost') || 
          lowerHeader.includes('budget') || lowerHeader.includes('spend') ||
          lowerHeader.includes('price') || lowerHeader.includes('value') ||
          lowerHeader.includes('£') || lowerHeader.includes('$')) {
        analysis.financialColumns.push(index);
      }
      
      // Date columns
      if (lowerHeader.includes('date') || lowerHeader.includes('time') ||
          lowerHeader.includes('received') || lowerHeader.includes('published') ||
          lowerHeader.includes('updated') || lowerHeader.includes('created')) {
        analysis.dateColumns.push(index);
      }
      
      // Category identification
      if (lowerHeader.includes('category') || lowerHeader.includes('type') ||
          lowerHeader.includes('classification')) {
        analysis.categoryColumn = index;
      }
      
      // Department identification
      if (lowerHeader.includes('department') || lowerHeader.includes('service') ||
          lowerHeader.includes('division') || lowerHeader.includes('team')) {
        analysis.departmentColumn = index;
      }
      
      // Description identification
      if (lowerHeader.includes('description') || lowerHeader.includes('detail') ||
          lowerHeader.includes('purpose') || lowerHeader.includes('summary')) {
        analysis.descriptionColumn = index;
      }
      
      // Text columns (fallback)
      if (!analysis.financialColumns.includes(index) && 
          !analysis.dateColumns.includes(index)) {
        analysis.textColumns.push(index);
      }
    });
    
    // Determine data type
    const hasSpendingIndicators = headers.some(h => 
      h.toLowerCase().includes('supplier') || h.toLowerCase().includes('transaction') ||
      h.toLowerCase().includes('invoice') || h.toLowerCase().includes('payment'));
    
    const hasBudgetIndicators = headers.some(h => 
      h.toLowerCase().includes('budget') || h.toLowerCase().includes('allocation') ||
      h.toLowerCase().includes('forecast'));
    
    if (hasSpendingIndicators) analysis.dataType = 'spending';
    else if (hasBudgetIndicators) analysis.dataType = 'budget';
    else if (analysis.financialColumns.length > 0) analysis.dataType = 'spending';
    else analysis.dataType = 'statistical';
    
    return analysis;
  }
  
  /**
   * Enhanced CSV row processing with header analysis
   */
  private static processEnhancedCSVRow(
    headers: string[], 
    cells: string[], 
    sourceUrl: string, 
    analysis: any
  ): {
    type: 'budget' | 'spending' | 'statistical';
    data: any;
  } {
    const now = new Date();
    
    // Extract key fields based on analysis
    const amount = this.extractAndParseAmount(cells, analysis.financialColumns);
    const transactionDate = this.extractAndParseDate(cells, analysis.dateColumns) || now;
    const department = analysis.departmentColumn !== null ? cells[analysis.departmentColumn] : 'General';
    const category = analysis.categoryColumn !== null ? cells[analysis.categoryColumn] : 'Uncategorized';
    const description = analysis.descriptionColumn !== null ? cells[analysis.descriptionColumn] : 'No description';
    
    if (analysis.dataType === 'budget' && amount > 0) {
      return {
        type: 'budget',
        data: {
          department: department || 'General',
          category: category || 'Uncategorized',
          subcategory: null,
          budgetedAmount: amount,
          actualAmount: null,
          variance: null,
          currency: 'GBP',
          year: transactionDate.getFullYear(),
          period: 'annual',
          description: description || null,
          sourceUrl,
          lastUpdated: now
        }
      };
    } else if (analysis.dataType === 'spending' && amount > 0) {
      // Look for supplier information
      const supplier = this.findSupplierField(headers, cells) || 'Unknown Supplier';
      
      return {
        type: 'spending',
        data: {
          transactionDate,
          supplier: supplier.trim(),
          department: department || 'General',
          description: description || 'Transaction',
          amount,
          category: category || 'General Spending',
          procurementMethod: null,
          invoiceNumber: this.findInvoiceNumber(headers, cells),
          sourceUrl,
          downloadUrl: sourceUrl,
          extractedAt: now
        }
      };
    } else {
      // Statistical data
      const value = amount || this.extractNumericValue(cells);
      const metric = this.determineMetricName(headers, analysis);
      
      return {
        type: 'statistical',
        data: {
          category: category || 'CSV Data',
          subcategory: null,
          metric: metric || 'Unknown Metric',
          value: value || 0,
          unit: this.determineUnit(cells, headers),
          period: this.determinePeriod(cells, headers),
          date: transactionDate,
          sourceDocument: sourceUrl,
          confidence: value > 0 ? 'high' : 'low',
          methodology: null,
          comparativePeriod: null,
          lastUpdated: now
        }
      };
    }
  }
  
  /**
   * Extract and parse amount from financial columns
   */
  private static extractAndParseAmount(cells: string[], financialColumns: number[]): number {
    for (const colIndex of financialColumns) {
      if (colIndex < cells.length) {
        const amount = this.parseAmount(cells[colIndex]);
        if (amount > 0) return amount;
      }
    }
    return 0;
  }
  
  /**
   * Extract and parse date from date columns
   */
  private static extractAndParseDate(cells: string[], dateColumns: number[]): Date | null {
    for (const colIndex of dateColumns) {
      if (colIndex < cells.length) {
        const dateStr = cells[colIndex].trim();
        if (dateStr) {
          const parsedDate = this.parseFlexibleDate(dateStr);
          if (parsedDate) return parsedDate;
        }
      }
    }
    return null;
  }
  
  /**
   * Flexible date parsing for various formats
   */
  private static parseFlexibleDate(dateStr: string): Date | null {
    // Remove common prefixes/suffixes
    const cleaned = dateStr.replace(/^(on|at|date:?)\s*/i, '').trim();
    
    // Try common date formats
    const formats = [
      // ISO formats
      /^(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
      // UK formats  
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
      // US formats
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, // MM/DD/YY(YY)
    ];
    
    // Try direct parsing first
    const directParse = new Date(cleaned);
    if (!isNaN(directParse.getTime()) && directParse.getFullYear() > 2000) {
      return directParse;
    }
    
    // Try manual parsing for specific formats
    for (const format of formats) {
      const match = cleaned.match(format);
      if (match) {
        let year: number, month: number, day: number;
        
        if (format.source.includes('YYYY')) {
          // ISO or YYYY first format
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1; // JS months are 0-indexed
          day = parseInt(match[3]);
        } else {
          // Assume DD/MM/YYYY for UK government data
          day = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          year = parseInt(match[3]);
          if (year < 100) year += 2000; // Handle 2-digit years
        }
        
        const parsedDate = new Date(year, month, day);
        if (!isNaN(parsedDate.getTime()) && year > 2000 && year < 2030) {
          return parsedDate;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Find supplier field in the data
   */
  private static findSupplierField(headers: string[], cells: string[]): string | null {
    const supplierHeaders = ['supplier', 'vendor', 'company', 'organisation', 'organization', 'payee'];
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase();
      if (supplierHeaders.some(s => header.includes(s))) {
        return cells[i] || null;
      }
    }
    
    return null;
  }
  
  /**
   * Find invoice number in the data
   */
  private static findInvoiceNumber(headers: string[], cells: string[]): string | null {
    const invoiceHeaders = ['invoice', 'reference', 'ref', 'number', 'id'];
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase();
      if (invoiceHeaders.some(s => header.includes(s))) {
        const value = cells[i];
        if (value && /^[A-Z0-9-]+$/i.test(value.trim())) {
          return value.trim();
        }
      }
    }
    
    return null;
  }
  
  /**
   * Extract numeric value from any cell
   */
  private static extractNumericValue(cells: string[]): number {
    for (const cell of cells) {
      const numMatch = cell.match(/([\d,]+(?:\.\d+)?)/);
      if (numMatch) {
        const num = parseFloat(numMatch[1].replace(/,/g, ''));
        if (!isNaN(num) && num > 0) return num;
      }
    }
    return 0;
  }
  
  /**
   * Determine metric name from headers
   */
  private static determineMetricName(headers: string[], analysis: any): string {
    if (analysis.financialColumns.length > 0) {
      return headers[analysis.financialColumns[0]] || 'Financial Metric';
    }
    
    // Find first non-date, non-department column
    for (let i = 0; i < headers.length; i++) {
      if (!analysis.dateColumns.includes(i) && 
          i !== analysis.departmentColumn && 
          i !== analysis.categoryColumn) {
        return headers[i] || `Metric_${i}`;
      }
    }
    
    return 'Unknown Metric';
  }
  
  /**
   * Determine unit from cell content and headers
   */
  private static determineUnit(cells: string[], headers: string[]): string {
    // Check cells for unit indicators
    for (const cell of cells) {
      const unitMatch = cell.match(/\d+\s*(%|£|\$|days?|hours?|weeks?|months?|years?|people)/i);
      if (unitMatch) return unitMatch[1];
    }
    
    // Check headers for unit indicators
    for (const header of headers) {
      if (header.toLowerCase().includes('percent')) return '%';
      if (header.toLowerCase().includes('pound') || header.includes('£')) return '£';
      if (header.toLowerCase().includes('count') || header.toLowerCase().includes('number')) return 'count';
    }
    
    return 'units';
  }
  
  /**
   * Determine time period from data
   */
  private static determinePeriod(cells: string[], headers: string[]): string {
    // Check for period indicators in headers or cells
    const combinedText = [...headers, ...cells].join(' ').toLowerCase();
    
    if (combinedText.includes('annual') || combinedText.includes('yearly')) return 'annual';
    if (combinedText.includes('quarter') || combinedText.includes('q1') || combinedText.includes('q2')) return 'quarterly';
    if (combinedText.includes('month') || combinedText.includes('monthly')) return 'monthly';
    if (combinedText.includes('week') || combinedText.includes('weekly')) return 'weekly';
    if (combinedText.includes('daily')) return 'daily';
    
    return 'unknown';
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
