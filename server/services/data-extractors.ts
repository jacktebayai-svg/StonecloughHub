import * as cheerio from 'cheerio';
import { 
  BudgetItem, SpendingRecord, PerformanceMetric, StatisticalData, 
  ChartData, InsertCouncilDataEnhanced 
} from '@shared/enhanced-schema';

/**
 * Hard Data Extraction Module
 * Specialized for extracting financial, statistical, and quantitative information
 * from Bolton Council websites and documents
 */

export class HardDataExtractor {
  
  /**
   * Extract financial data from spending pages and budget documents
   */
  static extractFinancialData(html: string, sourceUrl: string): {
    budgetItems: BudgetItem[];
    spendingRecords: SpendingRecord[];
    structuredData: any[];
  } {
    const $ = cheerio.load(html);
    const budgetItems: BudgetItem[] = [];
    const spendingRecords: SpendingRecord[] = [];
    const structuredData: any[] = [];

    // Extract budget information from tables
    $('table').each((_, table) => {
      const $table = $(table);
      const headers = $table.find('thead th, tr:first-child td').map((_, el) => $(el).text().trim().toLowerCase()).get();
      
      if (this.isFinancialTable(headers)) {
        $table.find('tbody tr, tr:not(:first-child)').each((_, row) => {
          const cells = $(row).find('td').map((_, cell) => $(cell).text().trim()).get();
          
          if (cells.length >= 2) {
            const financialData = this.parseFinancialRow(headers, cells, sourceUrl);
            if (financialData.type === 'budget') {
              budgetItems.push(financialData.data as BudgetItem);
            } else if (financialData.type === 'spending') {
              spendingRecords.push(financialData.data as SpendingRecord);
            }
          }
        });
      }
    });

    // Extract financial figures from text content
    const textFinancialData = this.extractFinancialFromText($.text(), sourceUrl);
    structuredData.push(...textFinancialData);

    return { budgetItems, spendingRecords, structuredData };
  }

  /**
   * Extract performance metrics and KPIs
   */
  static extractPerformanceMetrics(html: string, sourceUrl: string): PerformanceMetric[] {
    const $ = cheerio.load(html);
    const metrics: PerformanceMetric[] = [];

    // Look for performance indicators in various formats
    const performanceSelectors = [
      '.performance-indicator',
      '.kpi',
      '.metric',
      '.statistic',
      '[data-metric]',
      '.dashboard-item'
    ];

    performanceSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const $el = $(element);
        const metric = this.parsePerformanceElement($el, sourceUrl);
        if (metric) metrics.push(metric);
      });
    });

    // Extract metrics from structured text patterns
    const textMetrics = this.extractMetricsFromText($.text(), sourceUrl);
    metrics.push(...textMetrics);

    return metrics;
  }

  /**
   * Extract statistical data suitable for charts
   */
  static extractStatisticalData(html: string, sourceUrl: string): StatisticalData[] {
    const $ = cheerio.load(html);
    const statistics: StatisticalData[] = [];

    // Extract from charts and graphs
    $('script').each((_, script) => {
      const scriptContent = $(script).html() || '';
      
      if (scriptContent.includes('Chart') || scriptContent.includes('data:')) {
        const chartData = this.parseChartScript(scriptContent, sourceUrl);
        statistics.push(...chartData);
      }
    });

    // Extract from data tables
    $('table.data-table, .statistics-table, [data-chart]').each((_, table) => {
      const tableStats = this.parseStatisticalTable($(table), sourceUrl);
      statistics.push(...tableStats);
    });

    return statistics;
  }

  /**
   * Extract demographic and area-based data
   */
  static extractDemographicData(html: string, sourceUrl: string): StatisticalData[] {
    const $ = cheerio.load(html);
    const demographics: StatisticalData[] = [];

    // Look for ward-specific data
    const wardPatterns = [
      /(\w+\s+ward)/gi,
      /ward\s+(\w+)/gi,
      /(bolton|horwich|westhoughton|farnworth|little lever)/gi
    ];

    wardPatterns.forEach(pattern => {
      const matches = $.text().matchAll(pattern);
      for (const match of matches) {
        const wardData = this.extractWardData(match, html, sourceUrl);
        if (wardData) demographics.push(wardData);
      }
    });

    return demographics;
  }

  /**
   * Extract quantitative data from various number patterns
   */
  static extractQuantitativeData(text: string, sourceUrl: string): Array<{
    type: string;
    value: number;
    unit: string;
    context: string;
    confidence: 'high' | 'medium' | 'low';
  }> {
    const quantData = [];

    // Financial patterns
    const financialPatterns = [
      /£([\d,]+(?:\.\d{2})?)\s*(million|billion|thousand)?/gi,
      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /([\d,]+(?:\.\d{2})?)\s*pence/gi
    ];

    // Percentage patterns
    const percentagePatterns = [
      /([\d.]+)%/g,
      /([\d.]+)\s*percent/gi
    ];

    // Count patterns
    const countPatterns = [
      /(\d{1,3}(?:,\d{3})*)\s*(people|residents|households|applications|cases)/gi,
      /(\d+)\s*(years?|months?|days?|hours?)/gi
    ];

    // Process financial data
    financialPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let value = parseFloat(match[1].replace(/,/g, ''));
        const multiplier = match[2]?.toLowerCase();
        
        if (multiplier === 'million') value *= 1000000;
        else if (multiplier === 'billion') value *= 1000000000;
        else if (multiplier === 'thousand') value *= 1000;

        quantData.push({
          type: 'financial',
          value,
          unit: 'GBP',
          context: this.getContext(text, match.index || 0),
          confidence: 'high'
        });
      }
    });

    // Process percentages
    percentagePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        quantData.push({
          type: 'percentage',
          value: parseFloat(match[1]),
          unit: '%',
          context: this.getContext(text, match.index || 0),
          confidence: 'high'
        });
      }
    });

    // Process counts
    countPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        quantData.push({
          type: 'count',
          value: parseInt(match[1].replace(/,/g, '')),
          unit: match[2],
          context: this.getContext(text, match.index || 0),
          confidence: 'medium'
        });
      }
    });

    return quantData;
  }

  // Helper methods

  private static isFinancialTable(headers: string[]): boolean {
    const financialKeywords = ['amount', 'cost', 'budget', 'spend', 'price', 'fee', '£', '$'];
    return headers.some(header => 
      financialKeywords.some(keyword => header.includes(keyword))
    );
  }

  private static parseFinancialRow(headers: string[], cells: string[], sourceUrl: string): {
    type: 'budget' | 'spending';
    data: Partial<BudgetItem | SpendingRecord>;
  } {
    const now = new Date();
    const baseData = {
      lastUpdated: now,
      sourceUrl,
      extractedAt: now
    };

    // Look for amount in cells
    const amountIndex = headers.findIndex(h => h.includes('amount') || h.includes('cost') || h.includes('£'));
    const descriptionIndex = headers.findIndex(h => h.includes('description') || h.includes('detail'));
    const departmentIndex = headers.findIndex(h => h.includes('department') || h.includes('service'));

    if (amountIndex >= 0 && cells[amountIndex]) {
      const amount = this.parseAmount(cells[amountIndex]);
      
      if (amount > 0) {
        const data = {
          ...baseData,
          amount,
          description: cells[descriptionIndex] || 'Unknown',
          department: cells[departmentIndex] || 'General',
          category: 'General Spending'
        };

        // Determine if it's budget or spending data
        if (headers.some(h => h.includes('budget') || h.includes('allocation'))) {
          return {
            type: 'budget',
            data: {
              ...data,
              year: new Date().getFullYear(),
              currency: 'GBP',
              sourceDocument: sourceUrl
            } as Partial<BudgetItem>
          };
        } else {
          return {
            type: 'spending',
            data: {
              ...data,
              transactionDate: now,
              supplier: 'Unknown'
            } as Partial<SpendingRecord>
          };
        }
      }
    }

    return {
      type: 'spending',
      data: {}
    };
  }

  private static parseAmount(amountStr: string): number {
    // Remove currency symbols and parse
    const cleaned = amountStr.replace(/[£$,\s]/g, '');
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : amount;
  }

  private static extractFinancialFromText(text: string, sourceUrl: string): any[] {
    const results = [];
    const quantData = this.extractQuantitativeData(text, sourceUrl);
    
    quantData.forEach(item => {
      if (item.type === 'financial' && item.value > 100) {
        results.push({
          type: 'extracted_financial',
          amount: item.value,
          unit: item.unit,
          context: item.context,
          confidence: item.confidence,
          sourceUrl
        });
      }
    });

    return results;
  }

  private static parsePerformanceElement($element: cheerio.Cheerio, sourceUrl: string): PerformanceMetric | null {
    const text = $element.text().trim();
    const title = $element.attr('title') || $element.find('[title]').attr('title') || '';
    
    // Extract numerical value
    const valueMatch = text.match(/([\d,]+(?:\.\d+)?)/);
    if (!valueMatch) return null;

    const value = parseFloat(valueMatch[1].replace(/,/g, ''));
    
    // Extract unit
    const unitMatch = text.match(/\d+(?:\.\d+)?\s*(%|days?|hours?|weeks?|months?|years?|\w+)/i);
    const unit = unitMatch ? unitMatch[1] : 'count';

    return {
      service: 'General',
      metric: title || text,
      value,
      unit,
      period: 'current',
      date: new Date(),
      sourceUrl,
      lastUpdated: new Date()
    };
  }

  private static extractMetricsFromText(text: string, sourceUrl: string): PerformanceMetric[] {
    const metrics = [];
    const quantData = this.extractQuantitativeData(text, sourceUrl);
    
    quantData.forEach((item, index) => {
      if (item.type === 'percentage' || item.type === 'count') {
        metrics.push({
          service: 'General',
          metric: `Extracted Metric ${index + 1}`,
          value: item.value,
          unit: item.unit,
          period: 'current',
          date: new Date(),
          sourceUrl,
          lastUpdated: new Date()
        });
      }
    });

    return metrics;
  }

  private static parseChartScript(script: string, sourceUrl: string): StatisticalData[] {
    const data = [];
    
    // Look for data arrays in JavaScript
    const dataMatches = script.match(/data\s*:\s*\[([\d,.\s]+)\]/g);
    const labelMatches = script.match(/labels?\s*:\s*\[(.*?)\]/g);
    
    if (dataMatches && labelMatches) {
      const values = dataMatches[0].match(/[\d.]+/g)?.map(Number) || [];
      const labels = labelMatches[0].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || [];
      
      values.forEach((value, index) => {
        if (labels[index]) {
          data.push({
            category: 'Chart Data',
            metric: labels[index],
            value,
            unit: 'count',
            period: 'current',
            date: new Date(),
            sourceDocument: sourceUrl,
            confidence: 'medium',
            lastUpdated: new Date()
          });
        }
      });
    }

    return data;
  }

  private static parseStatisticalTable($table: cheerio.Cheerio, sourceUrl: string): StatisticalData[] {
    const data = [];
    const headers = $table.find('thead th, tr:first-child td').map((_, el) => $(el).text().trim()).get();
    
    $table.find('tbody tr, tr:not(:first-child)').each((_, row) => {
      const cells = $(row).find('td').map((_, cell) => $(cell).text().trim()).get();
      
      cells.forEach((cell, index) => {
        const numMatch = cell.match(/([\d,]+(?:\.\d+)?)/);
        if (numMatch && headers[index]) {
          data.push({
            category: 'Table Data',
            metric: headers[index],
            value: parseFloat(numMatch[1].replace(/,/g, '')),
            unit: this.extractUnit(cell),
            period: 'current',
            date: new Date(),
            sourceDocument: sourceUrl,
            confidence: 'high',
            lastUpdated: new Date()
          });
        }
      });
    });

    return data;
  }

  private static extractWardData(match: RegExpExecArray, html: string, sourceUrl: string): StatisticalData | null {
    // Extract ward-specific data - placeholder implementation
    return null;
  }

  private static extractUnit(text: string): string {
    const unitMatch = text.match(/\d+(?:\.\d+)?\s*(%|£|\$|days?|hours?|weeks?|months?|years?|people|\w+)/i);
    return unitMatch ? unitMatch[1] : 'count';
  }

  private static getContext(text: string, position: number, contextLength: number = 100): string {
    const start = Math.max(0, position - contextLength);
    const end = Math.min(text.length, position + contextLength);
    return text.substring(start, end).trim();
  }
}
