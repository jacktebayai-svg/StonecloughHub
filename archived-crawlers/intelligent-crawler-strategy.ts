import * as cheerio from 'cheerio';
import crypto from 'crypto';

export interface CrawlTarget {
  domain: string;
  priority: number;
  crawlFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  specialRules: CrawlRule[];
  contentTypes: string[];
  expectedDataTypes: string[];
  healthStatus: 'active' | 'slow' | 'unstable' | 'down';
  lastSuccessful: Date | null;
  averageResponseTime: number;
  errorRate: number;
}

export interface CrawlRule {
  type: 'include_path' | 'exclude_path' | 'priority_boost' | 'custom_selector' | 'rate_limit';
  pattern: string;
  value?: any;
  description: string;
}

export interface ContentAnalysisResult {
  contentType: 'meeting' | 'planning' | 'finance' | 'transparency' | 'service' | 'consultation' | 'document' | 'other';
  importance: number; // 1-10
  freshness: number; // 1-10 based on recency
  structure: 'structured' | 'semi-structured' | 'unstructured';
  extractableData: {
    tables: number;
    forms: number;
    lists: number;
    contacts: number;
    dates: number;
    amounts: number;
    links: number;
  };
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: 'simple' | 'moderate' | 'complex';
  confidence: number; // 0-1
}

export interface IntelligentUrlQueue {
  url: string;
  discoveredAt: Date;
  lastAttempted: Date | null;
  attempts: number;
  priority: number;
  dynamicPriority: number; // Calculated based on analysis
  category: string;
  parentUrl: string | null;
  depth: number;
  expectedContent: ContentAnalysisResult | null;
  scheduling: {
    nextScheduled: Date;
    interval: number; // in milliseconds
    adaptive: boolean;
  };
  status: 'pending' | 'analyzing' | 'processing' | 'completed' | 'failed' | 'skipped' | 'deferred';
  metadata: {
    estimatedProcessingTime: number;
    estimatedValue: number;
    changeFrequency: 'never' | 'yearly' | 'monthly' | 'weekly' | 'daily' | 'hourly' | 'always';
    lastModified: Date | null;
    contentHash: string | null;
    fileSize: number | null;
  };
}

export class IntelligentCrawlingStrategy {
  private crawlTargets: Map<string, CrawlTarget> = new Map();
  private urlQueue: IntelligentUrlQueue[] = [];
  private contentAnalyzer: ContentAnalyzer;
  private priorityCalculator: PriorityCalculator;
  private changeDetector: ChangeDetector;
  
  constructor() {
    this.contentAnalyzer = new ContentAnalyzer();
    this.priorityCalculator = new PriorityCalculator();
    this.changeDetector = new ChangeDetector();
    this.initializeCrawlTargets();
  }

  /**
   * Initialize crawl targets with Bolton Council domains
   */
  private initializeCrawlTargets(): void {
    const boltonTargets: CrawlTarget[] = [
      {
        domain: 'www.bolton.gov.uk',
        priority: 10,
        crawlFrequency: 'daily',
        specialRules: [
          {
            type: 'priority_boost',
            pattern: '/council-and-democracy/meetings-agendas-and-minutes',
            value: 5,
            description: 'Boost priority for meeting content'
          },
          {
            type: 'include_path',
            pattern: '/transparency-and-performance',
            description: 'Include all transparency data'
          },
          {
            type: 'exclude_path',
            pattern: '/waste-and-recycling/bin-collection-calendar',
            description: 'Skip bin collection calendars (high volume, low value)'
          },
          {
            type: 'rate_limit',
            pattern: '*',
            value: 2000, // 2 second delay
            description: 'Respectful crawling of main site'
          }
        ],
        contentTypes: ['text/html', 'application/pdf', 'application/json'],
        expectedDataTypes: ['council_meeting', 'service', 'transparency_data', 'council_document'],
        healthStatus: 'active',
        lastSuccessful: null,
        averageResponseTime: 1500,
        errorRate: 0.05
      },
      {
        domain: 'bolton.moderngov.co.uk',
        priority: 9,
        crawlFrequency: 'hourly', // More frequent for meeting data
        specialRules: [
          {
            type: 'custom_selector',
            pattern: '.mgMainTable',
            description: 'Use specific selectors for ModernGov data'
          },
          {
            type: 'priority_boost',
            pattern: 'ieListDocuments.aspx',
            value: 3,
            description: 'Prioritize document listings'
          }
        ],
        contentTypes: ['text/html', 'application/pdf'],
        expectedDataTypes: ['council_meeting', 'council_document'],
        healthStatus: 'active',
        lastSuccessful: null,
        averageResponseTime: 2000,
        errorRate: 0.03
      },
      {
        domain: 'paplanning.bolton.gov.uk',
        priority: 8,
        crawlFrequency: 'daily',
        specialRules: [
          {
            type: 'include_path',
            pattern: '/online-applications/search.do',
            description: 'Focus on planning applications'
          },
          {
            type: 'custom_selector',
            pattern: '.searchresults',
            description: 'Extract from planning search results'
          }
        ],
        contentTypes: ['text/html'],
        expectedDataTypes: ['planning_application'],
        healthStatus: 'active',
        lastSuccessful: null,
        averageResponseTime: 3000,
        errorRate: 0.08
      },
      {
        domain: 'data.gov.uk',
        priority: 6,
        crawlFrequency: 'weekly', // Data doesn't change frequently
        specialRules: [
          {
            type: 'include_path',
            pattern: '/dataset.*bolton',
            description: 'Only Bolton-related datasets'
          }
        ],
        contentTypes: ['text/html', 'text/csv', 'application/json', 'application/xml'],
        expectedDataTypes: ['open_data', 'dataset'],
        healthStatus: 'active',
        lastSuccessful: null,
        averageResponseTime: 5000,
        errorRate: 0.02
      }
    ];

    boltonTargets.forEach(target => {
      this.crawlTargets.set(target.domain, target);
    });
  }

  /**
   * Add URL to intelligent queue with analysis
   */
  async addUrlToQueue(url: string, parentUrl: string | null = null, depth: number = 0): Promise<void> {
    // Check if URL already exists
    if (this.urlQueue.some(item => item.url === url)) {
      return;
    }

    const domain = this.extractDomain(url);
    const target = this.crawlTargets.get(domain);
    
    if (!target) {
      console.log(`⚠️ Unknown domain: ${domain}, skipping URL: ${url}`);
      return;
    }

    // Pre-analyze URL for initial categorization
    const initialCategory = this.categorizeUrlPath(url);
    const basePriority = this.calculateBasePriority(url, target, initialCategory);

    const queueItem: IntelligentUrlQueue = {
      url,
      discoveredAt: new Date(),
      lastAttempted: null,
      attempts: 0,
      priority: basePriority,
      dynamicPriority: basePriority,
      category: initialCategory,
      parentUrl,
      depth,
      expectedContent: null, // Will be filled by analysis
      scheduling: {
        nextScheduled: new Date(),
        interval: this.calculateInitialInterval(target.crawlFrequency),
        adaptive: true
      },
      status: 'pending',
      metadata: {
        estimatedProcessingTime: 5000, // Default 5 seconds
        estimatedValue: basePriority,
        changeFrequency: 'weekly', // Default assumption
        lastModified: null,
        contentHash: null,
        fileSize: null
      }
    };

    this.urlQueue.push(queueItem);
    console.log(`📎 Added to intelligent queue: ${url} (priority: ${basePriority}, category: ${initialCategory})`);
  }

  /**
   * Get next URL to process with intelligent scheduling
   */
  getNextUrl(): IntelligentUrlQueue | null {
    const now = new Date();
    
    // Filter URLs that are ready to be processed
    const readyUrls = this.urlQueue.filter(item => 
      item.status === 'pending' && 
      item.scheduling.nextScheduled <= now &&
      item.attempts < 3
    );

    if (readyUrls.length === 0) {
      return null;
    }

    // Sort by dynamic priority (highest first), then by scheduling priority
    readyUrls.sort((a, b) => {
      // First by priority
      const priorityDiff = b.dynamicPriority - a.dynamicPriority;
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by how overdue the item is
      const aOverdue = now.getTime() - a.scheduling.nextScheduled.getTime();
      const bOverdue = now.getTime() - b.scheduling.nextScheduled.getTime();
      return bOverdue - aOverdue;
    });

    return readyUrls[0];
  }

  /**
   * Analyze content and update URL priority
   */
  async analyzeAndUpdatePriority(queueItem: IntelligentUrlQueue, content: string, contentType: string): Promise<void> {
    queueItem.status = 'analyzing';
    
    try {
      // Perform content analysis
      const analysis = await this.contentAnalyzer.analyzeContent(content, contentType, queueItem.url);
      queueItem.expectedContent = analysis;
      
      // Update dynamic priority based on analysis
      queueItem.dynamicPriority = this.priorityCalculator.calculateDynamicPriority(
        queueItem.priority,
        analysis,
        queueItem.metadata
      );
      
      // Update metadata based on analysis
      queueItem.metadata.estimatedValue = analysis.importance;
      queueItem.metadata.changeFrequency = this.estimateChangeFrequency(analysis);
      queueItem.metadata.contentHash = crypto.createHash('md5').update(content).digest('hex');
      queueItem.metadata.fileSize = content.length;
      
      // Detect if content has changed
      const hasChanged = await this.changeDetector.detectChange(queueItem);
      
      // Update scheduling based on change frequency and importance
      if (queueItem.scheduling.adaptive) {
        queueItem.scheduling.interval = this.calculateAdaptiveInterval(
          analysis,
          queueItem.metadata.changeFrequency,
          hasChanged
        );
      }
      
      console.log(`🧠 Analyzed ${queueItem.url}: type=${analysis.contentType}, importance=${analysis.importance}, priority=${queueItem.dynamicPriority}`);
      
    } catch (error) {
      console.error(`❌ Analysis failed for ${queueItem.url}:`, error);
      // Keep original priority if analysis fails
    } finally {
      queueItem.status = 'pending';
    }
  }

  /**
   * Mark URL as completed and schedule next crawl
   */
  markCompleted(queueItem: IntelligentUrlQueue, success: boolean): void {
    queueItem.status = success ? 'completed' : 'failed';
    queueItem.lastAttempted = new Date();
    
    if (!success) {
      queueItem.attempts++;
      // Exponential backoff for failed attempts
      queueItem.scheduling.interval *= Math.pow(2, queueItem.attempts);
    }
    
    // Schedule next crawl
    queueItem.scheduling.nextScheduled = new Date(
      Date.now() + queueItem.scheduling.interval
    );
    
    // Reset status for re-crawling
    if (success) {
      queueItem.status = 'pending';
      queueItem.attempts = 0;
    }
  }

  /**
   * Get crawling statistics
   */
  getStatistics(): {
    queueSize: number;
    readyToProcess: number;
    byCategory: { [category: string]: number };
    byStatus: { [status: string]: number };
    averagePriority: number;
    nextScheduled: Date | null;
    estimatedProcessingTime: number;
  } {
    const now = new Date();
    const readyUrls = this.urlQueue.filter(item => 
      item.status === 'pending' && item.scheduling.nextScheduled <= now
    );
    
    const byCategory: { [key: string]: number } = {};
    const byStatus: { [key: string]: number } = {};
    let totalPriority = 0;
    let totalEstimatedTime = 0;
    
    this.urlQueue.forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      totalPriority += item.dynamicPriority;
      totalEstimatedTime += item.metadata.estimatedProcessingTime;
    });
    
    const nextScheduled = this.urlQueue
      .filter(item => item.status === 'pending')
      .map(item => item.scheduling.nextScheduled)
      .sort((a, b) => a.getTime() - b.getTime())[0] || null;
    
    return {
      queueSize: this.urlQueue.length,
      readyToProcess: readyUrls.length,
      byCategory,
      byStatus,
      averagePriority: this.urlQueue.length > 0 ? totalPriority / this.urlQueue.length : 0,
      nextScheduled,
      estimatedProcessingTime: totalEstimatedTime
    };
  }

  // Private helper methods
  
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  private categorizeUrlPath(url: string): string {
    const path = new URL(url).pathname.toLowerCase();
    
    if (path.includes('meeting') || path.includes('agenda') || path.includes('minutes')) return 'meetings';
    if (path.includes('planning') || path.includes('application')) return 'planning';
    if (path.includes('transparency') || path.includes('foi') || path.includes('spending')) return 'transparency';
    if (path.includes('council-tax') || path.includes('finance') || path.includes('budget')) return 'finance';
    if (path.includes('service') || path.includes('department')) return 'services';
    if (path.includes('consultation') || path.includes('survey')) return 'consultations';
    if (path.includes('document') || path.includes('report') || path.includes('policy')) return 'documents';
    
    return 'general';
  }

  private calculateBasePriority(url: string, target: CrawlTarget, category: string): number {
    let priority = target.priority;
    
    // Apply category-based priority
    const categoryPriorities = {
      'meetings': 9,
      'planning': 8,
      'transparency': 8,
      'finance': 7,
      'services': 6,
      'consultations': 5,
      'documents': 4,
      'general': 3
    };
    
    priority += categoryPriorities[category] || 3;
    
    // Apply special rules
    target.specialRules.forEach(rule => {
      if (rule.type === 'priority_boost' && url.includes(rule.pattern)) {
        priority += rule.value || 0;
      }
    });
    
    return Math.min(priority, 20); // Cap at 20
  }

  private calculateInitialInterval(frequency: CrawlTarget['crawlFrequency']): number {
    const intervals = {
      'realtime': 60 * 1000, // 1 minute
      'hourly': 60 * 60 * 1000, // 1 hour
      'daily': 24 * 60 * 60 * 1000, // 1 day
      'weekly': 7 * 24 * 60 * 60 * 1000, // 1 week
      'monthly': 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    
    return intervals[frequency] || intervals['daily'];
  }

  private estimateChangeFrequency(analysis: ContentAnalysisResult): IntelligentUrlQueue['metadata']['changeFrequency'] {
    // Estimate based on content type and structure
    if (analysis.contentType === 'meeting') return 'weekly';
    if (analysis.contentType === 'planning') return 'daily';
    if (analysis.contentType === 'finance') return 'monthly';
    if (analysis.contentType === 'transparency') return 'monthly';
    if (analysis.contentType === 'service') return 'yearly';
    if (analysis.contentType === 'consultation') return 'weekly';
    if (analysis.contentType === 'document') return 'yearly';
    
    return 'weekly'; // Default
  }

  private calculateAdaptiveInterval(
    analysis: ContentAnalysisResult,
    changeFrequency: string,
    hasChanged: boolean
  ): number {
    const baseIntervals = {
      'never': 365 * 24 * 60 * 60 * 1000, // 1 year
      'yearly': 30 * 24 * 60 * 60 * 1000, // 1 month
      'monthly': 7 * 24 * 60 * 60 * 1000, // 1 week
      'weekly': 24 * 60 * 60 * 1000, // 1 day
      'daily': 4 * 60 * 60 * 1000, // 4 hours
      'hourly': 60 * 60 * 1000, // 1 hour
      'always': 30 * 60 * 1000 // 30 minutes
    };
    
    let interval = baseIntervals[changeFrequency] || baseIntervals['weekly'];
    
    // Adjust based on importance
    if (analysis.importance >= 8) {
      interval *= 0.5; // Check more frequently for important content
    } else if (analysis.importance <= 3) {
      interval *= 2; // Check less frequently for unimportant content
    }
    
    // Adjust based on recent changes
    if (hasChanged) {
      interval *= 0.7; // Check more frequently if content is changing
    }
    
    // Ensure reasonable bounds
    interval = Math.max(interval, 30 * 60 * 1000); // Minimum 30 minutes
    interval = Math.min(interval, 365 * 24 * 60 * 60 * 1000); // Maximum 1 year
    
    return interval;
  }
}

class ContentAnalyzer {
  async analyzeContent(content: string, contentType: string, url: string): Promise<ContentAnalysisResult> {
    const $ = cheerio.load(content);
    
    // Determine content type
    const detectedContentType = this.detectContentType(content, url, $);
    
    // Calculate importance based on various factors
    const importance = this.calculateImportance(content, detectedContentType, $);
    
    // Calculate freshness
    const freshness = this.calculateFreshness($);
    
    // Determine structure
    const structure = this.analyzeStructure($);
    
    // Extract data elements
    const extractableData = this.analyzeExtractableData($);
    
    // Extract keywords
    const keywords = this.extractKeywords(content);
    
    // Analyze sentiment
    const sentiment = this.analyzeSentiment(content);
    
    // Determine complexity
    const complexity = this.analyzeComplexity($, content);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(detectedContentType, structure, extractableData);
    
    return {
      contentType: detectedContentType,
      importance,
      freshness,
      structure,
      extractableData,
      keywords,
      sentiment,
      complexity,
      confidence
    };
  }

  private detectContentType(content: string, url: string, $: cheerio.CheerioAPI): ContentAnalysisResult['contentType'] {
    const urlLower = url.toLowerCase();
    const contentLower = content.toLowerCase();
    const title = $('title').text().toLowerCase();
    
    // Meeting detection
    if (urlLower.includes('meeting') || urlLower.includes('agenda') || urlLower.includes('minutes') ||
        contentLower.includes('agenda item') || contentLower.includes('committee') ||
        title.includes('meeting') || title.includes('agenda')) {
      return 'meeting';
    }
    
    // Planning detection
    if (urlLower.includes('planning') || urlLower.includes('application') ||
        contentLower.includes('planning application') || contentLower.includes('planning permission')) {
      return 'planning';
    }
    
    // Finance detection
    if (urlLower.includes('budget') || urlLower.includes('finance') || urlLower.includes('spending') ||
        contentLower.includes('£') || contentLower.includes('budget') || 
        $('.budget-item, .financial-data, .spending-data').length > 0) {
      return 'finance';
    }
    
    // Transparency detection
    if (urlLower.includes('transparency') || urlLower.includes('foi') ||
        contentLower.includes('freedom of information') || contentLower.includes('transparency')) {
      return 'transparency';
    }
    
    // Service detection
    if (urlLower.includes('service') || urlLower.includes('department') ||
        title.includes('service') || $('.service-info').length > 0) {
      return 'service';
    }
    
    // Consultation detection
    if (urlLower.includes('consultation') || urlLower.includes('survey') ||
        contentLower.includes('consultation') || $('form').length > 2) {
      return 'consultation';
    }
    
    // Document detection
    if (urlLower.includes('document') || urlLower.includes('policy') || urlLower.includes('report') ||
        $('.document-link, .pdf-link').length > 5) {
      return 'document';
    }
    
    return 'other';
  }

  private calculateImportance(content: string, contentType: string, $: cheerio.CheerioAPI): number {
    let importance = 5; // Base importance
    
    // Content type importance
    const typeImportance = {
      'meeting': 9,
      'planning': 8,
      'finance': 8,
      'transparency': 7,
      'consultation': 6,
      'service': 5,
      'document': 4,
      'other': 3
    };
    importance = typeImportance[contentType] || 5;
    
    // Boost for structured data
    if ($('table').length > 0) importance += 1;
    if ($('.data-table, .structured-data').length > 0) importance += 2;
    
    // Boost for contact information
    if ($('a[href^="mailto:"], a[href^="tel:"]').length > 0) importance += 1;
    
    // Boost for financial data
    if (content.match(/£[\d,]+/g)) importance += 1;
    
    // Boost for dates (suggests timely content)
    if (content.match(/\d{1,2}\/\d{1,2}\/\d{4}/g)) importance += 1;
    
    // Reduce for very short content
    if (content.length < 500) importance -= 2;
    
    return Math.max(1, Math.min(10, importance));
  }

  private calculateFreshness($: cheerio.CheerioAPI): number {
    // Look for date indicators
    const dateElements = $('time, .date, .published, .updated, .last-modified').text();
    const dateMatches = dateElements.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/g);
    
    if (dateMatches && dateMatches.length > 0) {
      try {
        const latestDate = new Date(Math.max(...dateMatches.map(d => new Date(d).getTime())));
        const daysSinceUpdate = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate <= 7) return 10;
        if (daysSinceUpdate <= 30) return 8;
        if (daysSinceUpdate <= 90) return 6;
        if (daysSinceUpdate <= 365) return 4;
        return 2;
      } catch {
        // Invalid date format
      }
    }
    
    return 5; // Unknown freshness
  }

  private analyzeStructure($: cheerio.CheerioAPI): 'structured' | 'semi-structured' | 'unstructured' {
    const tables = $('table').length;
    const lists = $('ul, ol').length;
    const forms = $('form').length;
    const headings = $('h1, h2, h3, h4, h5, h6').length;
    
    const structureScore = tables * 3 + lists * 2 + forms * 2 + headings;
    
    if (structureScore >= 10) return 'structured';
    if (structureScore >= 4) return 'semi-structured';
    return 'unstructured';
  }

  private analyzeExtractableData($: cheerio.CheerioAPI): ContentAnalysisResult['extractableData'] {
    return {
      tables: $('table').length,
      forms: $('form').length,
      lists: $('ul, ol').length,
      contacts: $('a[href^="mailto:"], a[href^="tel:"]').length,
      dates: $.text().match(/\d{1,2}\/\d{1,2}\/\d{4}/g)?.length || 0,
      amounts: $.text().match(/£[\d,]+/g)?.length || 0,
      links: $('a[href]').length
    };
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const text = content.toLowerCase()
      .replace(/<[^>]*>/g, '') // Remove HTML
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize spaces
    
    const words = text.split(' ')
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 'more', 'very', 'what', 'know', 'just', 'first', 'get', 'has', 'had', 'let', 'put', 'say', 'she', 'may', 'use', 'her', 'than', 'call', 'its', 'now', 'find', 'long', 'down', 'way', 'who', 'oil', 'sit', 'set', 'run', 'eat', 'far', 'sea', 'eye', 'ask', 'own', 'try', 'kind', 'hand', 'high', 'year', 'work', 'part', 'last', 'good', 'man', 'day', 'get', 'use', 'her', 'new', 'now', 'old', 'see', 'him', 'two', 'how', 'its', 'our', 'out', 'one', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'may', 'put', 'say', 'she', 'too', 'use'].includes(word));
    
    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    // Return top keywords
    return Array.from(wordCount.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    // Very basic sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'approve', 'support', 'benefit', 'improve', 'success', 'positive', 'effective'];
    const negativeWords = ['bad', 'poor', 'reject', 'oppose', 'problem', 'issue', 'concern', 'negative', 'fail', 'decline'];
    
    const contentLower = content.toLowerCase();
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      const matches = contentLower.match(new RegExp(word, 'g'));
      if (matches) positiveCount += matches.length;
    });
    
    negativeWords.forEach(word => {
      const matches = contentLower.match(new RegExp(word, 'g'));
      if (matches) negativeCount += matches.length;
    });
    
    if (positiveCount > negativeCount * 1.2) return 'positive';
    if (negativeCount > positiveCount * 1.2) return 'negative';
    return 'neutral';
  }

  private analyzeComplexity($: cheerio.CheerioAPI, content: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = content.split(/\s+/).length;
    const tableCount = $('table').length;
    const formCount = $('form').length;
    const linkCount = $('a[href]').length;
    
    const complexityScore = 
      (wordCount > 2000 ? 2 : wordCount > 500 ? 1 : 0) +
      (tableCount > 3 ? 2 : tableCount > 0 ? 1 : 0) +
      (formCount > 1 ? 2 : formCount > 0 ? 1 : 0) +
      (linkCount > 50 ? 2 : linkCount > 10 ? 1 : 0);
    
    if (complexityScore >= 6) return 'complex';
    if (complexityScore >= 3) return 'moderate';
    return 'simple';
  }

  private calculateConfidence(
    contentType: string,
    structure: string,
    extractableData: ContentAnalysisResult['extractableData']
  ): number {
    let confidence = 0.7; // Base confidence
    
    // Higher confidence for structured content
    if (structure === 'structured') confidence += 0.2;
    else if (structure === 'semi-structured') confidence += 0.1;
    
    // Higher confidence if we detected specific content types with strong indicators
    if (contentType !== 'other') confidence += 0.15;
    
    // Higher confidence if there's extractable data
    const dataElements = extractableData.tables + extractableData.forms + extractableData.lists + extractableData.contacts;
    confidence += Math.min(0.15, dataElements * 0.02);
    
    return Math.min(1.0, confidence);
  }
}

class PriorityCalculator {
  calculateDynamicPriority(
    basePriority: number,
    analysis: ContentAnalysisResult,
    metadata: IntelligentUrlQueue['metadata']
  ): number {
    let priority = basePriority;
    
    // Adjust based on importance
    priority += (analysis.importance - 5); // -4 to +5
    
    // Adjust based on freshness
    priority += (analysis.freshness - 5) * 0.5; // -2 to +2.5
    
    // Boost structured content
    if (analysis.structure === 'structured') priority += 2;
    else if (analysis.structure === 'semi-structured') priority += 1;
    
    // Boost content with lots of extractable data
    const dataScore = Object.values(analysis.extractableData).reduce((sum, count) => sum + count, 0);
    priority += Math.min(3, dataScore * 0.1);
    
    // Boost based on confidence
    priority += (analysis.confidence - 0.5) * 2; // -1 to +1
    
    // Reduce priority for very frequent changes (might be noise)
    if (metadata.changeFrequency === 'always') priority -= 2;
    
    return Math.max(1, Math.min(20, Math.round(priority)));
  }
}

class ChangeDetector {
  private previousHashes = new Map<string, string>();
  
  async detectChange(queueItem: IntelligentUrlQueue): Promise<boolean> {
    if (!queueItem.metadata.contentHash) {
      return false; // Can't detect change without hash
    }
    
    const previousHash = this.previousHashes.get(queueItem.url);
    const hasChanged = previousHash !== undefined && previousHash !== queueItem.metadata.contentHash;
    
    // Store current hash for next comparison
    this.previousHashes.set(queueItem.url, queueItem.metadata.contentHash);
    
    return hasChanged;
  }
}

export const intelligentCrawlingStrategy = new IntelligentCrawlingStrategy();
