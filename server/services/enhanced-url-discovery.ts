import * as cheerio from 'cheerio';
import { intelligentCrawlingStrategy } from './intelligent-crawler-strategy';
import { ComprehensiveMonitor } from './monitoring-system';
import crypto from 'crypto';

export interface UrlDiscoveryResult {
  discoveredUrls: string[];
  categories: { [url: string]: string };
  priorities: { [url: string]: number };
  patterns: DiscoveredPattern[];
  sitemapUrls: string[];
  apiEndpoints: string[];
  dataFeeds: string[];
  socialLinks: string[];
  externalRefs: string[];
  statistics: DiscoveryStatistics;
}

export interface DiscoveredPattern {
  pattern: string;
  type: 'list_page' | 'detail_page' | 'archive' | 'search_results' | 'api_endpoint' | 'data_feed';
  confidence: number;
  examples: string[];
  metadata: any;
}

export interface DiscoveryStatistics {
  totalFound: number;
  duplicatesSkipped: number;
  categorized: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  processingTime: number;
  uniqueDomains: number;
  patternsDetected: number;
}

export interface SmartUrlFilter {
  includePatterns: RegExp[];
  excludePatterns: RegExp[];
  categoryRules: CategoryRule[];
  qualityThresholds: {
    minContentLength: number;
    maxRedirects: number;
    requiresStructuredData: boolean;
    excludeFormPages: boolean;
  };
  temporalRules: {
    excludeOlderThan?: Date;
    prioritizeNewerThan?: Date;
    archiveDetection: boolean;
  };
}

export interface CategoryRule {
  pattern: RegExp;
  category: string;
  priority: number;
  selectors?: string[];
  metadata?: any;
}

export class EnhancedUrlDiscovery {
  private monitor: ComprehensiveMonitor;
  private discoveredPatterns: Map<string, DiscoveredPattern> = new Map();
  private urlDatabase: Map<string, UrlMetadata> = new Map();
  
  constructor() {
    this.monitor = new ComprehensiveMonitor();
    this.initializePatternDetectors();
  }

  /**
   * Discover URLs from page content with intelligent analysis
   */
  async discoverUrls(
    content: string,
    baseUrl: string,
    depth: number = 0,
    filters?: SmartUrlFilter
  ): Promise<UrlDiscoveryResult> {
    const timingId = this.monitor.startTiming('url_discovery');
    const startTime = Date.now();
    
    try {
      const $ = cheerio.load(content);
      const domain = new URL(baseUrl).hostname;
      
      console.log(`🔍 Discovering URLs from: ${baseUrl} (depth: ${depth})`);
      
      // Initialize result structure
      const result: UrlDiscoveryResult = {
        discoveredUrls: [],
        categories: {},
        priorities: {},
        patterns: [],
        sitemapUrls: [],
        apiEndpoints: [],
        dataFeeds: [],
        socialLinks: [],
        externalRefs: [],
        statistics: {
          totalFound: 0,
          duplicatesSkipped: 0,
          categorized: 0,
          highPriority: 0,
          mediumPriority: 0,
          lowPriority: 0,
          processingTime: 0,
          uniqueDomains: 0,
          patternsDetected: 0
        }
      };
      
      // 1. Extract all potential URLs
      const rawUrls = this.extractAllUrls($, baseUrl);
      
      // 2. Process and categorize URLs
      const processedUrls = await this.processUrls(rawUrls, baseUrl, filters);
      
      // 3. Discover special URL types
      const specialUrls = this.discoverSpecialUrls($, baseUrl);
      
      // 4. Detect URL patterns
      const patterns = this.detectUrlPatterns(processedUrls.concat(specialUrls.apiEndpoints));
      
      // 5. Apply intelligent filtering and prioritization
      const filteredUrls = this.applyIntelligentFiltering(processedUrls, patterns, depth);
      
      // 6. Generate priorities and categories
      await this.generatePrioritiesAndCategories(filteredUrls, baseUrl, content, $);
      
      // 7. Add URLs to intelligent strategy
      await this.addToIntelligentQueue(filteredUrls, baseUrl, depth);
      
      // 8. Compile results
      result.discoveredUrls = filteredUrls;
      result.patterns = Array.from(this.discoveredPatterns.values());
      result.sitemapUrls = specialUrls.sitemapUrls;
      result.apiEndpoints = specialUrls.apiEndpoints;
      result.dataFeeds = specialUrls.dataFeeds;
      result.socialLinks = specialUrls.socialLinks;
      result.externalRefs = specialUrls.externalRefs;
      
      // 9. Generate statistics
      result.statistics = this.generateStatistics(result, startTime);
      
      this.monitor.endTiming(timingId, 'url_discovery', true, {
        urlsFound: result.discoveredUrls.length,
        patternsDetected: result.patterns.length,
        domain
      });
      
      console.log(`✅ URL Discovery completed: ${result.discoveredUrls.length} URLs found, ${result.patterns.length} patterns detected`);
      
      return result;
      
    } catch (error) {
      this.monitor.endTiming(timingId, 'url_discovery', false);
      this.monitor.recordError(error as Error, {
        operation: 'url_discovery',
        url: baseUrl,
        timestamp: new Date(),
        depth
      });
      throw error;
    }
  }

  /**
   * Extract all URLs from page content
   */
  private extractAllUrls($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const urls = new Set<string>();
    const baseUrlObj = new URL(baseUrl);
    
    // Standard link extraction
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const resolvedUrl = this.resolveUrl(href, baseUrl);
        if (resolvedUrl) urls.add(resolvedUrl);
      }
    });
    
    // Form actions
    $('form[action]').each((_, element) => {
      const action = $(element).attr('action');
      if (action && action !== '#') {
        const resolvedUrl = this.resolveUrl(action, baseUrl);
        if (resolvedUrl) urls.add(resolvedUrl);
      }
    });
    
    // Image sources (for document links)
    $('img[src]').each((_, element) => {
      const src = $(element).attr('src');
      if (src && (src.includes('.pdf') || src.includes('document'))) {
        const resolvedUrl = this.resolveUrl(src, baseUrl);
        if (resolvedUrl) urls.add(resolvedUrl);
      }
    });
    
    // JavaScript-generated URLs (basic extraction)
    const scriptContent = $('script').text();
    const jsUrlMatches = scriptContent.match(/["']([^"']*(?:\.gov\.uk|bolton)[^"']*)["']/g);
    if (jsUrlMatches) {
      jsUrlMatches.forEach(match => {
        const url = match.replace(/["']/g, '');
        if (url.startsWith('http') || url.startsWith('/')) {
          const resolvedUrl = this.resolveUrl(url, baseUrl);
          if (resolvedUrl) urls.add(resolvedUrl);
        }
      });
    }
    
    // Meta refresh redirects
    $('meta[http-equiv="refresh"]').each((_, element) => {
      const content = $(element).attr('content');
      if (content) {
        const urlMatch = content.match(/url=([^;]+)/i);
        if (urlMatch) {
          const resolvedUrl = this.resolveUrl(urlMatch[1], baseUrl);
          if (resolvedUrl) urls.add(resolvedUrl);
        }
      }
    });
    
    // Canonical URLs
    $('link[rel="canonical"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const resolvedUrl = this.resolveUrl(href, baseUrl);
        if (resolvedUrl) urls.add(resolvedUrl);
      }
    });
    
    return Array.from(urls);
  }

  /**
   * Process and validate URLs
   */
  private async processUrls(
    urls: string[],
    baseUrl: string,
    filters?: SmartUrlFilter
  ): Promise<string[]> {
    const processedUrls: string[] = [];
    const domain = new URL(baseUrl).hostname;
    
    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        
        // Skip if not allowed domain
        if (!this.isAllowedDomain(urlObj.hostname)) {
          continue;
        }
        
        // Apply filters if provided
        if (filters && !this.passesFilters(url, filters)) {
          continue;
        }
        
        // Skip common unwanted URLs
        if (this.isUnwantedUrl(url)) {
          continue;
        }
        
        // Store metadata
        this.storeUrlMetadata(url, {
          discovered: new Date(),
          sourceUrl: baseUrl,
          category: 'unknown',
          priority: 5,
          validated: false
        });
        
        processedUrls.push(url);
        
      } catch (error) {
        // Invalid URL, skip
        continue;
      }
    }
    
    return processedUrls;
  }

  /**
   * Discover special types of URLs
   */
  private discoverSpecialUrls($: cheerio.CheerioAPI, baseUrl: string): {
    sitemapUrls: string[];
    apiEndpoints: string[];
    dataFeeds: string[];
    socialLinks: string[];
    externalRefs: string[];
  } {
    const result = {
      sitemapUrls: [] as string[],
      apiEndpoints: [] as string[],
      dataFeeds: [] as string[],
      socialLinks: [] as string[],
      externalRefs: [] as string[]
    };
    
    const domain = new URL(baseUrl).hostname;
    
    // Look for sitemap references
    $('a[href*="sitemap"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const resolvedUrl = this.resolveUrl(href, baseUrl);
        if (resolvedUrl) result.sitemapUrls.push(resolvedUrl);
      }
    });
    
    // Detect API endpoints
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && this.looksLikeApiEndpoint(href)) {
        const resolvedUrl = this.resolveUrl(href, baseUrl);
        if (resolvedUrl) result.apiEndpoints.push(resolvedUrl);
      }
    });
    
    // Find data feeds (RSS, JSON, XML, CSV)
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().toLowerCase();
      if (href && (
        href.includes('.rss') || href.includes('.xml') || 
        href.includes('.json') || href.includes('.csv') ||
        text.includes('feed') || text.includes('data')
      )) {
        const resolvedUrl = this.resolveUrl(href, baseUrl);
        if (resolvedUrl) result.dataFeeds.push(resolvedUrl);
      }
    });
    
    // Social media links
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && this.isSocialMediaUrl(href)) {
        result.socialLinks.push(href);
      }
    });
    
    // External references (non-gov.uk domains but relevant)
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.startsWith('http') && !href.includes(domain) && this.isRelevantExternal(href)) {
        result.externalRefs.push(href);
      }
    });
    
    return result;
  }

  /**
   * Detect URL patterns for intelligent crawling
   */
  private detectUrlPatterns(urls: string[]): DiscoveredPattern[] {
    const patterns: DiscoveredPattern[] = [];
    const urlGroups = new Map<string, string[]>();
    
    // Group URLs by similar patterns
    urls.forEach(url => {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
        
        // Generate pattern keys
        const basePattern = pathParts.slice(0, 2).join('/');
        const paramPattern = urlObj.search ? 'has_params' : 'no_params';
        
        const key = `${basePattern}:${paramPattern}`;
        
        if (!urlGroups.has(key)) {
          urlGroups.set(key, []);
        }
        urlGroups.get(key)!.push(url);
      } catch {
        // Skip invalid URLs
      }
    });
    
    // Analyze groups for patterns
    urlGroups.forEach((urls, key) => {
      if (urls.length >= 3) { // Minimum threshold for pattern detection
        const pattern = this.analyzeUrlGroup(urls);
        if (pattern) {
          patterns.push(pattern);
          this.discoveredPatterns.set(key, pattern);
        }
      }
    });
    
    return patterns;
  }

  /**
   * Analyze a group of URLs to detect patterns
   */
  private analyzeUrlGroup(urls: string[]): DiscoveredPattern | null {
    if (urls.length < 3) return null;
    
    try {
      const firstUrl = new URL(urls[0]);
      const pathBase = firstUrl.pathname.split('/').slice(0, -1).join('/');
      
      // Determine pattern type
      let type: DiscoveredPattern['type'] = 'detail_page';
      let confidence = 0.7;
      
      // Check for list pages
      if (urls.some(url => url.includes('list') || url.includes('index') || url.includes('search'))) {
        type = 'list_page';
        confidence = 0.8;
      }
      
      // Check for archives
      if (urls.some(url => url.includes('archive') || url.includes('history') || /\d{4}/.test(url))) {
        type = 'archive';
        confidence = 0.9;
      }
      
      // Check for API endpoints
      if (urls.some(url => url.includes('api') || url.includes('.json') || url.includes('.xml'))) {
        type = 'api_endpoint';
        confidence = 0.95;
      }
      
      // Generate pattern string
      const pattern = pathBase + '/*';
      
      return {
        pattern,
        type,
        confidence,
        examples: urls.slice(0, 5),
        metadata: {
          totalUrls: urls.length,
          commonPath: pathBase,
          hasParameters: urls.some(url => new URL(url).search.length > 0),
          estimatedTotal: urls.length * 2 // Rough estimate
        }
      };
      
    } catch {
      return null;
    }
  }

  /**
   * Apply intelligent filtering based on patterns and quality
   */
  private applyIntelligentFiltering(
    urls: string[],
    patterns: DiscoveredPattern[],
    depth: number
  ): string[] {
    const filtered: string[] = [];
    const maxUrlsPerDepth = [100, 200, 300, 150, 50][Math.min(depth, 4)]; // Adaptive limits
    
    // Score each URL
    const scoredUrls = urls.map(url => ({
      url,
      score: this.calculateUrlScore(url, patterns, depth)
    }));
    
    // Sort by score (highest first)
    scoredUrls.sort((a, b) => b.score - a.score);
    
    // Take top URLs based on depth
    return scoredUrls.slice(0, maxUrlsPerDepth).map(item => item.url);
  }

  /**
   * Calculate URL score for prioritization
   */
  private calculateUrlScore(url: string, patterns: DiscoveredPattern[], depth: number): number {
    let score = 5; // Base score
    
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      
      // Content type scoring
      if (path.includes('meeting') || path.includes('agenda')) score += 10;
      if (path.includes('planning') || path.includes('application')) score += 8;
      if (path.includes('transparency') || path.includes('spending')) score += 7;
      if (path.includes('council') || path.includes('democracy')) score += 6;
      if (path.includes('service')) score += 4;
      if (path.includes('news') || path.includes('press')) score += 3;
      
      // File type scoring
      if (path.endsWith('.pdf')) score += 5;
      if (path.endsWith('.csv') || path.endsWith('.json') || path.endsWith('.xml')) score += 8;
      
      // Pattern matching bonus
      patterns.forEach(pattern => {
        if (url.match(pattern.pattern.replace('*', '.*'))) {
          score += pattern.confidence * 5;
        }
      });
      
      // Depth penalty
      score -= depth * 2;
      
      // URL structure quality
      const pathParts = path.split('/').filter(part => part.length > 0);
      if (pathParts.length >= 2 && pathParts.length <= 6) score += 2; // Reasonable depth
      if (pathParts.some(part => part.length < 3)) score -= 1; // Very short segments
      
      // Parameter bonus/penalty
      const params = urlObj.searchParams;
      if (params.has('id') || params.has('ref') || params.has('page')) score += 1;
      if (Array.from(params.keys()).length > 5) score -= 2; // Too many parameters
      
    } catch {
      score = 1; // Invalid URL gets minimum score
    }
    
    return Math.max(1, Math.min(20, score));
  }

  /**
   * Generate priorities and categories for discovered URLs
   */
  private async generatePrioritiesAndCategories(
    urls: string[],
    baseUrl: string,
    content: string,
    $: cheerio.CheerioAPI
  ): Promise<void> {
    const contextKeywords = this.extractContextKeywords(content, $);
    
    for (const url of urls) {
      const category = this.categorizeUrl(url, contextKeywords);
      const priority = this.calculateUrlPriority(url, category, contextKeywords);
      
      const metadata = this.urlDatabase.get(url);
      if (metadata) {
        metadata.category = category;
        metadata.priority = priority;
        metadata.validated = true;
      }
    }
  }

  /**
   * Add discovered URLs to intelligent crawling queue
   */
  private async addToIntelligentQueue(
    urls: string[],
    parentUrl: string,
    depth: number
  ): Promise<void> {
    for (const url of urls) {
      await intelligentCrawlingStrategy.addUrlToQueue(url, parentUrl, depth + 1);
    }
  }

  /**
   * Generate comprehensive statistics
   */
  private generateStatistics(result: UrlDiscoveryResult, startTime: number): DiscoveryStatistics {
    const uniqueDomains = new Set(result.discoveredUrls.map(url => {
      try {
        return new URL(url).hostname;
      } catch {
        return 'unknown';
      }
    })).size;
    
    let highPriority = 0, mediumPriority = 0, lowPriority = 0;
    
    result.discoveredUrls.forEach(url => {
      const metadata = this.urlDatabase.get(url);
      if (metadata) {
        if (metadata.priority >= 8) highPriority++;
        else if (metadata.priority >= 5) mediumPriority++;
        else lowPriority++;
      }
    });
    
    return {
      totalFound: result.discoveredUrls.length,
      duplicatesSkipped: 0, // Could be enhanced to track this
      categorized: result.discoveredUrls.filter(url => {
        const metadata = this.urlDatabase.get(url);
        return metadata && metadata.category !== 'unknown';
      }).length,
      highPriority,
      mediumPriority,
      lowPriority,
      processingTime: Date.now() - startTime,
      uniqueDomains,
      patternsDetected: result.patterns.length
    };
  }

  // Helper methods
  
  private initializePatternDetectors(): void {
    // Initialize with known Bolton Council URL patterns
    const knownPatterns = [
      {
        pattern: '/council-and-democracy/meetings-agendas-and-minutes/*',
        type: 'list_page' as const,
        confidence: 0.95,
        examples: [],
        metadata: { category: 'meetings' }
      },
      {
        pattern: '/environment-and-planning/planning-applications/*',
        type: 'list_page' as const,
        confidence: 0.9,
        examples: [],
        metadata: { category: 'planning' }
      }
    ];
    
    knownPatterns.forEach(pattern => {
      this.discoveredPatterns.set(pattern.pattern, pattern);
    });
  }

  private resolveUrl(href: string, baseUrl: string): string | null {
    try {
      if (href.startsWith('http')) return href;
      if (href.startsWith('//')) return 'https:' + href;
      return new URL(href, baseUrl).toString();
    } catch {
      return null;
    }
  }

  private isAllowedDomain(hostname: string): boolean {
    const allowedDomains = [
      'bolton.gov.uk',
      'www.bolton.gov.uk',
      'paplanning.bolton.gov.uk',
      'bolton.moderngov.co.uk',
      'bolton.public-i.tv',
      'data.gov.uk'
    ];
    
    return allowedDomains.some(domain => hostname.includes(domain));
  }

  private passesFilters(url: string, filters: SmartUrlFilter): boolean {
    // Include patterns
    if (filters.includePatterns.length > 0) {
      if (!filters.includePatterns.some(pattern => pattern.test(url))) {
        return false;
      }
    }
    
    // Exclude patterns
    if (filters.excludePatterns.some(pattern => pattern.test(url))) {
      return false;
    }
    
    return true;
  }

  private isUnwantedUrl(url: string): boolean {
    const unwantedPatterns = [
      /\.(css|js|jpg|jpeg|png|gif|ico|svg)$/i,
      /\/print\//,
      /\/mobile\//,
      /logout|signin|login/,
      /javascript:|mailto:|tel:|ftp:/,
      /#[^\/]*$/,  // Just fragment, no path change
      /\/bin-collection/,
      /\/contact-form/
    ];
    
    return unwantedPatterns.some(pattern => pattern.test(url));
  }

  private looksLikeApiEndpoint(href: string): boolean {
    return href.includes('/api/') || 
           href.includes('.json') || 
           href.includes('.xml') ||
           href.includes('/data/') ||
           href.includes('format=json') ||
           href.includes('format=xml');
  }

  private isSocialMediaUrl(href: string): boolean {
    const socialDomains = ['facebook.com', 'twitter.com', 'linkedin.com', 'youtube.com', 'instagram.com'];
    return socialDomains.some(domain => href.includes(domain));
  }

  private isRelevantExternal(href: string): boolean {
    const relevantDomains = ['gov.uk', 'nhs.uk', 'police.uk'];
    const relevantKeywords = ['bolton', 'manchester', 'lancashire', 'northwest'];
    
    return relevantDomains.some(domain => href.includes(domain)) ||
           relevantKeywords.some(keyword => href.toLowerCase().includes(keyword));
  }

  private extractContextKeywords(content: string, $: cheerio.CheerioAPI): string[] {
    const title = $('title').text().toLowerCase();
    const h1 = $('h1').text().toLowerCase();
    const keywords = $('meta[name="keywords"]').attr('content')?.toLowerCase() || '';
    
    const combinedText = `${title} ${h1} ${keywords}`;
    return combinedText.split(/\W+/).filter(word => word.length > 3);
  }

  private categorizeUrl(url: string, contextKeywords: string[]): string {
    const path = url.toLowerCase();
    
    if (path.includes('meeting') || path.includes('agenda') || path.includes('minutes')) return 'meetings';
    if (path.includes('planning') || path.includes('application')) return 'planning';
    if (path.includes('transparency') || path.includes('spending') || path.includes('foi')) return 'transparency';
    if (path.includes('council-tax') || path.includes('finance') || path.includes('budget')) return 'finance';
    if (path.includes('service')) return 'services';
    if (path.includes('consultation') || path.includes('survey')) return 'consultations';
    if (path.includes('document') || path.includes('policy') || path.includes('report')) return 'documents';
    if (path.includes('news') || path.includes('press')) return 'news';
    
    // Context-based categorization
    if (contextKeywords.some(keyword => ['meeting', 'agenda', 'committee'].includes(keyword))) return 'meetings';
    if (contextKeywords.some(keyword => ['planning', 'development'].includes(keyword))) return 'planning';
    
    return 'general';
  }

  private calculateUrlPriority(url: string, category: string, contextKeywords: string[]): number {
    const categoryPriorities = {
      'meetings': 9,
      'planning': 8,
      'transparency': 8,
      'finance': 7,
      'services': 6,
      'consultations': 5,
      'documents': 4,
      'news': 3,
      'general': 2
    };
    
    let priority = categoryPriorities[category] || 2;
    
    // Boost based on file type
    if (url.includes('.pdf')) priority += 2;
    if (url.includes('.csv') || url.includes('.json')) priority += 3;
    
    // Boost based on context relevance
    if (contextKeywords.some(keyword => url.includes(keyword))) priority += 1;
    
    return Math.max(1, Math.min(10, priority));
  }

  private storeUrlMetadata(url: string, metadata: UrlMetadata): void {
    this.urlDatabase.set(url, metadata);
  }
}

interface UrlMetadata {
  discovered: Date;
  sourceUrl: string;
  category: string;
  priority: number;
  validated: boolean;
  lastChecked?: Date;
  responseTime?: number;
  contentType?: string;
  error?: string;
}

export const enhancedUrlDiscovery = new EnhancedUrlDiscovery();
