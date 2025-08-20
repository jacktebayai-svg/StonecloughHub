import * as cheerio from 'cheerio';
import { QualityScore, QualityScoreSchema } from '@shared/scraper-validation-schemas';

export class QualityScoringEngine {
  /**
   * Calculate comprehensive quality score for scraped content
   */
  static calculateQualityScore(
    html: string, 
    url: string, 
    category: string,
    metadata: any = {}
  ): QualityScore {
    const $ = cheerio.load(html);
    
    const factors = this.extractQualityFactors($, html, url, metadata);
    const components = this.calculateScoreComponents(factors, category);
    const overallScore = this.calculateOverallScore(components);
    const recommendations = this.generateRecommendations(factors, components);

    const score: QualityScore = {
      overallScore,
      components,
      factors,
      category,
      recommendations
    };

    // Validate the score
    return QualityScoreSchema.parse(score);
  }

  /**
   * Extract quality factors from content
   */
  private static extractQualityFactors(
    $: cheerio.CheerioAPI, 
    html: string, 
    url: string,
    metadata: any
  ): QualityScore['factors'] {
    // Structured data detection
    const hasStructuredData = this.detectStructuredData($);
    
    // Table detection
    const tables = $('table');
    const hasTables = tables.length > 0 && this.hasSignificantTables(tables);
    
    // Financial data detection
    const hasFinancialData = this.detectFinancialData(html);
    
    // Contact information detection
    const hasContactInfo = this.detectContactInfo($);
    
    // Navigation page detection (generally lower quality for data extraction)
    const isNavigationPage = this.detectNavigationPage($, url);
    
    // Content length
    const contentLength = this.getMainContentLength($);
    
    // Last modified date
    const lastModified = this.extractLastModified($, metadata);

    return {
      hasStructuredData,
      hasTables,
      hasFinancialData,
      hasContactInfo,
      isNavigationPage,
      contentLength,
      lastModified
    };
  }

  /**
   * Calculate individual score components
   */
  private static calculateScoreComponents(
    factors: QualityScore['factors'], 
    category: string
  ): QualityScore['components'] {
    // Content Quality (0-100)
    let contentQuality = 0;
    if (factors.contentLength > 500) contentQuality += 30;
    if (factors.contentLength > 1500) contentQuality += 20;
    if (factors.hasFinancialData) contentQuality += 25;
    if (factors.hasContactInfo) contentQuality += 10;
    if (factors.isNavigationPage) contentQuality -= 30; // Penalty for nav pages
    if (factors.contentLength > 5000) contentQuality += 15;
    contentQuality = Math.max(0, Math.min(100, contentQuality));

    // Structured Data Presence (0-100)
    let structuredDataPresence = 0;
    if (factors.hasStructuredData) structuredDataPresence += 40;
    if (factors.hasTables) structuredDataPresence += 35;
    if (factors.hasFinancialData) structuredDataPresence += 25;
    structuredDataPresence = Math.max(0, Math.min(100, structuredDataPresence));

    // Recency (0-100)
    let recency = 50; // Default middle score
    if (factors.lastModified) {
      const daysSinceUpdate = (new Date().getTime() - factors.lastModified.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate <= 30) recency = 100;
      else if (daysSinceUpdate <= 90) recency = 80;
      else if (daysSinceUpdate <= 180) recency = 60;
      else if (daysSinceUpdate <= 365) recency = 40;
      else if (daysSinceUpdate <= 730) recency = 20;
      else recency = 10;
    }

    // Completeness (0-100)
    let completeness = 20; // Base score
    if (factors.hasContactInfo) completeness += 15;
    if (factors.hasStructuredData) completeness += 20;
    if (factors.hasTables) completeness += 20;
    if (factors.hasFinancialData) completeness += 25;
    completeness = Math.max(0, Math.min(100, completeness));

    // Reliability (0-100)
    let reliability = 60; // Base score for gov.uk domains
    if (category === 'planning' || category === 'meetings' || category === 'transparency') {
      reliability += 20; // High-value categories
    }
    if (factors.hasStructuredData) reliability += 10;
    if (factors.hasTables) reliability += 10;
    if (factors.isNavigationPage) reliability -= 20;
    reliability = Math.max(0, Math.min(100, reliability));

    return {
      contentQuality,
      structuredDataPresence,
      recency,
      completeness,
      reliability
    };
  }

  /**
   * Calculate weighted overall score
   */
  private static calculateOverallScore(components: QualityScore['components']): number {
    const weights = {
      contentQuality: 0.25,
      structuredDataPresence: 0.30, // Higher weight for structured data
      recency: 0.15,
      completeness: 0.15,
      reliability: 0.15
    };

    const score = 
      (components.contentQuality * weights.contentQuality) +
      (components.structuredDataPresence * weights.structuredDataPresence) +
      (components.recency * weights.recency) +
      (components.completeness * weights.completeness) +
      (components.reliability * weights.reliability);

    return Math.round(score);
  }

  /**
   * Generate improvement recommendations
   */
  private static generateRecommendations(
    factors: QualityScore['factors'],
    components: QualityScore['components']
  ): string[] {
    const recommendations: string[] = [];

    if (!factors.hasStructuredData) {
      recommendations.push('Add structured data markup (JSON-LD, microdata) to improve searchability');
    }

    if (!factors.hasTables && factors.hasFinancialData) {
      recommendations.push('Consider presenting financial data in tabular format');
    }

    if (factors.contentLength < 500) {
      recommendations.push('Expand content with more detailed information');
    }

    if (!factors.hasContactInfo) {
      recommendations.push('Include contact information for inquiries');
    }

    if (components.recency < 60) {
      recommendations.push('Update content more frequently to maintain relevance');
    }

    if (factors.isNavigationPage) {
      recommendations.push('Consider adding direct links to specific data resources');
    }

    if (components.structuredDataPresence < 50) {
      recommendations.push('Increase use of structured data formats (tables, lists, forms)');
    }

    return recommendations;
  }

  /**
   * Detect structured data in content
   */
  private static detectStructuredData($: cheerio.CheerioAPI): boolean {
    // Check for JSON-LD
    if ($('script[type="application/ld+json"]').length > 0) return true;
    
    // Check for microdata
    if ($('[itemscope], [itemprop], [itemtype]').length > 0) return true;
    
    // Check for RDFa
    if ($('[property], [typeof], [resource]').length > 0) return true;
    
    // Check for Open Graph
    if ($('meta[property^="og:"]').length > 0) return true;
    
    return false;
  }

  /**
   * Check if tables contain significant data
   */
  private static hasSignificantTables(tables: cheerio.Cheerio<any>): boolean {
    let significantTables = 0;
    
    tables.each((_, table) => {
      const rows = cheerio(table).find('tr').length;
      const cells = cheerio(table).find('td, th').length;
      
      // Consider table significant if it has multiple rows and cells
      if (rows >= 3 && cells >= 6) {
        significantTables++;
      }
    });
    
    return significantTables > 0;
  }

  /**
   * Detect financial data in content
   */
  private static detectFinancialData(html: string): boolean {
    const financialPatterns = [
      /£[\d,]+(?:\.\d{2})?/g, // UK currency
      /\$[\d,]+(?:\.\d{2})?/g, // US currency
      /[\d,]+(?:\.\d{2})?\s*(?:million|billion|thousand|k|m|bn)/gi,
      /budget/gi,
      /spending/gi,
      /cost/gi,
      /revenue/gi,
      /expenditure/gi,
      /allocation/gi,
      /procurement/gi
    ];
    
    return financialPatterns.some(pattern => pattern.test(html));
  }

  /**
   * Detect contact information
   */
  private static detectContactInfo($: cheerio.CheerioAPI): boolean {
    // Email addresses
    if ($('a[href^="mailto:"]').length > 0) return true;
    
    // Phone numbers
    if ($('a[href^="tel:"]').length > 0) return true;
    
    // Address patterns
    const addressSelectors = [
      '.address', '.contact', '.contact-info', 
      '[itemtype*="PostalAddress"]', '[itemtype*="ContactPoint"]'
    ];
    
    return addressSelectors.some(selector => $(selector).length > 0);
  }

  /**
   * Detect if page is primarily navigation
   */
  private static detectNavigationPage($: cheerio.CheerioAPI, url: string): boolean {
    const navIndicators = [
      // URL patterns
      /\/index\.|\/home|\/menu|\/navigation|\/sitemap/i.test(url),
      
      // High ratio of links to content
      $('a').length > 20 && this.getMainContentLength($) < 1000,
      
      // Common navigation elements
      $('.menu, .nav, .navigation, .sitemap').length > 0,
      
      // Breadcrumb-heavy pages
      $('.breadcrumb, .breadcrumbs').length > 1
    ];
    
    return navIndicators.some(indicator => indicator);
  }

  /**
   * Get main content length
   */
  private static getMainContentLength($: cheerio.CheerioAPI): number {
    const contentSelectors = [
      'main', '[role="main"]', '.main-content', 
      '.content', '#content', 'article', '.article-body'
    ];
    
    for (const selector of contentSelectors) {
      const content = $(selector).text().trim();
      if (content.length > 100) {
        return content.length;
      }
    }
    
    // Fallback: body content minus nav/header/footer
    const bodyClone = $('body').clone();
    bodyClone.find('nav, header, footer, .nav, .header, .footer, script, style').remove();
    return bodyClone.text().trim().length;
  }

  /**
   * Extract last modified date
   */
  private static extractLastModified($: cheerio.CheerioAPI, metadata: any): Date | null {
    // Check metadata first
    if (metadata.lastModified && metadata.lastModified instanceof Date) {
      return metadata.lastModified;
    }
    
    // Check meta tags
    const lastModifiedMeta = $('meta[name="last-modified"], meta[property="article:modified_time"]').attr('content');
    if (lastModifiedMeta) {
      const date = new Date(lastModifiedMeta);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Check structured data
    const structuredData = $('script[type="application/ld+json"]');
    structuredData.each((_, script) => {
      try {
        const data = JSON.parse($(script).html() || '{}');
        if (data.dateModified || data.datePublished) {
          const date = new Date(data.dateModified || data.datePublished);
          if (!isNaN(date.getTime())) return date;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
    
    return null;
  }

  /**
   * Get quality tier based on score
   */
  static getQualityTier(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 45) return 'fair';
    return 'poor';
  }

  /**
   * Filter content by minimum quality score
   */
  static meetsQualityThreshold(score: QualityScore, category: string): boolean {
    const thresholds = {
      'planning': 70,
      'meetings': 65,
      'transparency': 75,
      'finance': 70,
      'services': 50,
      'consultations': 60,
      'documents': 55,
      'general': 40
    };

    const threshold = thresholds[category as keyof typeof thresholds] || 40;
    return score.overallScore >= threshold;
  }
}
