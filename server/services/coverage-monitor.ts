import { storage } from '../storage';
import { InsertCouncilData } from '@shared/schema';
import { CoverageMetrics, CoverageMetricsSchema } from '@shared/scraper-validation-schemas';

interface CrawlError {
  type: '404' | 'timeout' | 'parsing_error' | 'access_denied' | 'server_error';
  url: string;
  message: string;
  timestamp: Date;
  domain: string;
  category: string;
  retryCount: number;
  resolved: boolean;
}

interface DomainStats {
  domain: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  avgResponseTime: number;
  lastCrawled: Date;
  commonErrors: string[];
}

interface CategoryCoverage {
  category: string;
  dataType: string;
  expectedCount: number;
  actualCount: number;
  coveragePercentage: number;
  lastUpdated: Date;
  gaps: string[];
}

export class CoverageMonitor {
  private static errors: Map<string, CrawlError> = new Map();
  private static domainStats: Map<string, DomainStats> = new Map();
  private static redirectMaps: Map<string, string> = new Map(); // old URL -> new URL
  
  private static readonly EXPECTED_COVERAGE = {
    'www.bolton.gov.uk': {
      'transparency': 50,
      'services': 200,
      'council-tax': 25,
      'planning': 100,
      'housing': 75
    },
    'bolton.moderngov.co.uk': {
      'meetings': 500,
      'councillors': 60,
      'committees': 20
    },
    'paplanning.bolton.gov.uk': {
      'planning_applications': 2000,
      'decisions': 1500
    }
  };

  /**
   * Log an error during crawling
   */
  static logError(
    type: CrawlError['type'],
    url: string,
    message: string,
    category: string = 'general'
  ): void {
    const domain = this.extractDomain(url);
    const errorId = `${domain}-${type}-${url}`;
    
    const existingError = this.errors.get(errorId);
    const error: CrawlError = {
      type,
      url,
      message,
      timestamp: new Date(),
      domain,
      category,
      retryCount: existingError ? existingError.retryCount + 1 : 1,
      resolved: false
    };
    
    this.errors.set(errorId, error);
    
    // Update domain stats
    this.updateDomainStats(domain, false);
    
    console.log(`🚨 Logged ${type} error for ${url}: ${message}`);
  }

  /**
   * Log a successful crawl
   */
  static logSuccess(url: string, responseTime: number, category: string = 'general'): void {
    const domain = this.extractDomain(url);
    this.updateDomainStats(domain, true, responseTime);
  }

  /**
   * Log a redirect mapping
   */
  static logRedirect(oldUrl: string, newUrl: string): void {
    this.redirectMaps.set(oldUrl, newUrl);
    console.log(`🔄 Logged redirect: ${oldUrl} -> ${newUrl}`);
  }

  /**
   * Mark an error as resolved
   */
  static markErrorResolved(errorId: string): void {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      error.timestamp = new Date();
      this.errors.set(errorId, error);
    }
  }

  /**
   * Update domain statistics
   */
  private static updateDomainStats(domain: string, success: boolean, responseTime?: number): void {
    const existing = this.domainStats.get(domain) || {
      domain,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: 0,
      avgResponseTime: 0,
      lastCrawled: new Date(),
      commonErrors: []
    };
    
    existing.totalRequests++;
    existing.lastCrawled = new Date();
    
    if (success) {
      existing.successfulRequests++;
      if (responseTime) {
        existing.avgResponseTime = (existing.avgResponseTime * (existing.successfulRequests - 1) + responseTime) / existing.successfulRequests;
      }
    } else {
      existing.failedRequests++;
    }
    
    existing.successRate = (existing.successfulRequests / existing.totalRequests) * 100;
    
    this.domainStats.set(domain, existing);
  }

  /**
   * Generate comprehensive coverage report
   */
  static async generateCoverageReport(): Promise<{
    domainStats: DomainStats[];
    errorSummary: any;
    coverageMetrics: CoverageMetrics[];
    recommendations: string[];
    redirectMaps: Array<{old: string, new: string}>;
  }> {
    console.log('📊 Generating comprehensive coverage report...');
    
    // Get current data counts from database
    const coverageMetrics = await this.calculateCoverageMetrics();
    
    // Analyze errors
    const errorSummary = this.analyzeErrors();
    
    // Generate recommendations
    const recommendations = this.generateRecommendations();
    
    // Format redirect maps
    const redirectMaps = Array.from(this.redirectMaps.entries()).map(([old, newUrl]) => ({
      old,
      new: newUrl
    }));
    
    const report = {
      domainStats: Array.from(this.domainStats.values()),
      errorSummary,
      coverageMetrics,
      recommendations,
      redirectMaps
    };
    
    // Store the report in database
    await this.storeCoverageReport(report);
    
    return report;
  }

  /**
   * Calculate coverage metrics for each domain/category combination
   */
  private static async calculateCoverageMetrics(): Promise<CoverageMetrics[]> {
    const metrics: CoverageMetrics[] = [];
    
    for (const [domain, categories] of Object.entries(this.EXPECTED_COVERAGE)) {
      for (const [category, expectedCount] of Object.entries(categories)) {
        try {
          // Query database for actual counts
          // Note: This would need to be implemented with your specific storage interface
          const actualCount = await this.getActualDataCount(domain, category);
          
          const coverage = (actualCount / expectedCount) * 100;
          const issues = this.getIssuesForDomainCategory(domain, category);
          
          const metric: CoverageMetrics = {
            domain,
            category,
            dataType: this.mapCategoryToDataType(category),
            expectedCount,
            actualCount,
            coveragePercentage: Math.min(coverage, 100),
            lastCrawled: this.domainStats.get(domain)?.lastCrawled || new Date(),
            issues,
            recommendations: this.generateCategoryRecommendations(domain, category, coverage)
          };
          
          // Validate with schema
          const validatedMetric = CoverageMetricsSchema.parse(metric);
          metrics.push(validatedMetric);
          
        } catch (error) {
          console.error(`Error calculating coverage for ${domain}/${category}:`, error);
        }
      }
    }
    
    return metrics;
  }

  /**
   * Get actual data count from database (placeholder - needs storage implementation)
   */
  private static async getActualDataCount(domain: string, category: string): Promise<number> {
    // This would query your database for actual counts
    // For now, return a simulated count
    return Math.floor(Math.random() * 100) + 10;
  }

  /**
   * Get issues for a specific domain/category
   */
  private static getIssuesForDomainCategory(domain: string, category: string): Array<{
    type: '404' | 'timeout' | 'parsing_error' | 'access_denied';
    url: string;
    message: string;
    timestamp: Date;
  }> {
    const issues: Array<{
      type: '404' | 'timeout' | 'parsing_error' | 'access_denied';
      url: string;
      message: string;
      timestamp: Date;
    }> = [];
    
    for (const error of this.errors.values()) {
      if (error.domain === domain && error.category === category && !error.resolved) {
        issues.push({
          type: error.type as '404' | 'timeout' | 'parsing_error' | 'access_denied',
          url: error.url,
          message: error.message,
          timestamp: error.timestamp
        });
      }
    }
    
    return issues;
  }

  /**
   * Generate category-specific recommendations
   */
  private static generateCategoryRecommendations(domain: string, category: string, coverage: number): string[] {
    const recommendations: string[] = [];
    
    if (coverage < 50) {
      recommendations.push(`Low coverage detected for ${category}. Consider expanding crawl scope.`);
    }
    
    if (coverage < 25) {
      recommendations.push(`Critical coverage gap in ${category}. Review URL patterns and access permissions.`);
    }
    
    const domainErrors = Array.from(this.errors.values()).filter(e => 
      e.domain === domain && e.category === category && !e.resolved
    );
    
    if (domainErrors.length > 10) {
      recommendations.push(`High error rate in ${category}. Review site structure and error patterns.`);
    }
    
    const redirectCount = Array.from(this.redirectMaps.keys()).filter(url => 
      this.extractDomain(url) === domain
    ).length;
    
    if (redirectCount > 5) {
      recommendations.push(`Multiple redirects detected for ${domain}. Update URL seeds with current URLs.`);
    }
    
    return recommendations;
  }

  /**
   * Analyze errors and generate summary
   */
  private static analyzeErrors(): any {
    const errorsByType = new Map<string, number>();
    const errorsByDomain = new Map<string, number>();
    const recentErrors: CrawlError[] = [];
    const unresolvedErrors: CrawlError[] = [];
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    for (const error of this.errors.values()) {
      // Count by type
      errorsByType.set(error.type, (errorsByType.get(error.type) || 0) + 1);
      
      // Count by domain
      errorsByDomain.set(error.domain, (errorsByDomain.get(error.domain) || 0) + 1);
      
      // Recent errors (last 24 hours)
      if (error.timestamp > oneDayAgo) {
        recentErrors.push(error);
      }
      
      // Unresolved errors
      if (!error.resolved) {
        unresolvedErrors.push(error);
      }
    }
    
    return {
      totalErrors: this.errors.size,
      errorsByType: Object.fromEntries(errorsByType),
      errorsByDomain: Object.fromEntries(errorsByDomain),
      recentErrors: recentErrors.slice(0, 20), // Latest 20
      unresolvedErrors: unresolvedErrors.slice(0, 20), // Top 20 unresolved
      topErrorUrls: this.getTopErrorUrls(10)
    };
  }

  /**
   * Get URLs with the most errors
   */
  private static getTopErrorUrls(limit: number): Array<{url: string, count: number, errors: string[]}> {
    const urlErrors = new Map<string, string[]>();
    
    for (const error of this.errors.values()) {
      if (!urlErrors.has(error.url)) {
        urlErrors.set(error.url, []);
      }
      urlErrors.get(error.url)!.push(error.type);
    }
    
    return Array.from(urlErrors.entries())
      .map(([url, errors]) => ({
        url,
        count: errors.length,
        errors: [...new Set(errors)] // Unique error types
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze domain success rates
    for (const stats of this.domainStats.values()) {
      if (stats.successRate < 60) {
        recommendations.push(
          `${stats.domain} has low success rate (${stats.successRate.toFixed(1)}%). ` +
          `Consider increasing request delays or reviewing authentication.`
        );
      }
      
      if (stats.avgResponseTime > 10000) {
        recommendations.push(
          `${stats.domain} has slow response times (${(stats.avgResponseTime/1000).toFixed(1)}s average). ` +
          `Consider timeout adjustments or domain-specific throttling.`
        );
      }
    }
    
    // Analyze error patterns
    const errorCounts = this.analyzeErrors().errorsByType;
    
    if (errorCounts['404'] > 20) {
      recommendations.push(
        `High number of 404 errors (${errorCounts['404']}). Review and update URL patterns. ` +
        `Check redirect mappings for permanent URL changes.`
      );
    }
    
    if (errorCounts['timeout'] > 10) {
      recommendations.push(
        `Timeout errors detected (${errorCounts['timeout']}). Consider increasing timeout values ` +
        `or implementing retry logic with exponential backoff.`
      );
    }
    
    if (errorCounts['parsing_error'] > 15) {
      recommendations.push(
        `Parsing errors detected (${errorCounts['parsing_error']}). Review content extractors ` +
        `and add fallback parsing strategies.`
      );
    }
    
    // Check redirect patterns
    if (this.redirectMaps.size > 20) {
      recommendations.push(
        `Multiple URL redirects detected (${this.redirectMaps.size}). Update seed URLs ` +
        `with current locations to improve crawl efficiency.`
      );
    }
    
    return recommendations;
  }

  /**
   * Store coverage report in database
   */
  private static async storeCoverageReport(report: any): Promise<void> {
    try {
      const reportData: InsertCouncilData = {
        title: `Coverage Report: ${new Date().toISOString().split('T')[0]}`,
        description: 'Comprehensive crawl coverage and error analysis report',
        dataType: 'council_document',
        sourceUrl: `internal://coverage-report/${Date.now()}`,
        date: new Date(),
        metadata: {
          ...report,
          type: 'coverage_report',
          generatedAt: new Date().toISOString()
        }
      };
      
      await storage.createCouncilData(reportData);
      console.log('📊 Coverage report stored in database');
      
    } catch (error) {
      console.error('Error storing coverage report:', error);
    }
  }

  /**
   * Export error data for external analysis
   */
  static exportErrorData(): any {
    return {
      errors: Array.from(this.errors.values()),
      domainStats: Array.from(this.domainStats.values()),
      redirectMaps: Object.fromEntries(this.redirectMaps)
    };
  }

  /**
   * Import error data from external source
   */
  static importErrorData(data: any): void {
    if (data.errors) {
      for (const error of data.errors) {
        const errorId = `${error.domain}-${error.type}-${error.url}`;
        this.errors.set(errorId, error);
      }
    }
    
    if (data.domainStats) {
      for (const stats of data.domainStats) {
        this.domainStats.set(stats.domain, stats);
      }
    }
    
    if (data.redirectMaps) {
      for (const [oldUrl, newUrl] of Object.entries(data.redirectMaps)) {
        this.redirectMaps.set(oldUrl, newUrl as string);
      }
    }
    
    console.log('📥 Imported error data from external source');
  }

  /**
   * Clear old resolved errors
   */
  static clearOldErrors(daysOld: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let cleared = 0;
    for (const [errorId, error] of this.errors.entries()) {
      if (error.resolved && error.timestamp < cutoffDate) {
        this.errors.delete(errorId);
        cleared++;
      }
    }
    
    console.log(`🧹 Cleared ${cleared} old resolved errors`);
    return cleared;
  }

  /**
   * Get dashboard summary
   */
  static getDashboardSummary(): any {
    const totalErrors = this.errors.size;
    const unresolvedErrors = Array.from(this.errors.values()).filter(e => !e.resolved).length;
    const totalDomains = this.domainStats.size;
    const avgSuccessRate = Array.from(this.domainStats.values())
      .reduce((sum, stats) => sum + stats.successRate, 0) / totalDomains || 0;
    
    return {
      totalErrors,
      unresolvedErrors,
      resolvedErrors: totalErrors - unresolvedErrors,
      totalDomains,
      avgSuccessRate: avgSuccessRate.toFixed(1),
      totalRedirects: this.redirectMaps.size,
      lastUpdated: new Date()
    };
  }

  // Utility methods
  private static extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  private static mapCategoryToDataType(category: string): string {
    const mapping: { [key: string]: string } = {
      'transparency': 'transparency_data',
      'services': 'service',
      'council-tax': 'council_page',
      'planning': 'planning_application',
      'housing': 'service',
      'meetings': 'council_meeting',
      'councillors': 'councillor',
      'committees': 'council_meeting',
      'planning_applications': 'planning_application',
      'decisions': 'council_document'
    };
    
    return mapping[category] || 'council_page';
  }
}

// Export singleton for use in crawler
export const coverageMonitor = CoverageMonitor;
