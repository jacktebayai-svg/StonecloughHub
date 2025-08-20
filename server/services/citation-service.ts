import { z } from 'zod';
import { Pool } from 'pg';
import { citationMetadataSchema, multipleSourcesSchema, type CitationMetadata, type MultipleSources } from '../../shared/enhanced-schema.ts';

/**
 * Citation Service for managing source verification and fact-checking
 */
export class CitationService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Store citation metadata for a council data item
   */
  async storeCitation(councilDataId: string, citation: CitationMetadata): Promise<void> {
    const validatedCitation = citationMetadataSchema.parse(citation);

    const query = `
      UPDATE enhanced_council_data 
      SET 
        file_url = $2,
        parent_page_url = $3,
        citation_metadata = $4,
        updated_at = NOW()
      WHERE id = $1
    `;

    await this.pool.query(query, [
      councilDataId,
      validatedCitation.fileUrl,
      validatedCitation.parentPageUrl,
      JSON.stringify(validatedCitation)
    ]);
  }

  /**
   * Store multiple sources for comprehensive fact-checking
   */
  async storeMultipleSources(councilDataId: string, sources: MultipleSources): Promise<void> {
    const validatedSources = multipleSourcesSchema.parse(sources);

    const query = `
      UPDATE enhanced_council_data 
      SET 
        citation_metadata = $2,
        extraction_confidence = $3,
        updated_at = NOW()
      WHERE id = $1
    `;

    await this.pool.query(query, [
      councilDataId,
      JSON.stringify(validatedSources),
      this.getConfidenceScore(validatedSources.overallConfidence)
    ]);
  }

  /**
   * Retrieve citation information for a council data item
   */
  async getCitation(councilDataId: string): Promise<CitationMetadata | null> {
    const query = `
      SELECT 
        source_url,
        file_url,
        parent_page_url,
        source_title,
        citation_metadata,
        extraction_confidence,
        scraped_at,
        source_domain
      FROM enhanced_council_data 
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [councilDataId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    
    // Build citation from database fields
    const citation: CitationMetadata = {
      sourceUrl: row.source_url,
      fileUrl: row.file_url || undefined,
      parentPageUrl: row.parent_page_url || undefined,
      title: row.source_title || undefined,
      confidence: this.scoreToConfidence(row.extraction_confidence),
      dateAdded: row.scraped_at ? new Date(row.scraped_at) : undefined,
      ...((row.citation_metadata && typeof row.citation_metadata === 'object') ? row.citation_metadata : {})
    };

    return citationMetadataSchema.parse(citation);
  }

  /**
   * Get all sources for fact-checking
   */
  async getAllSources(councilDataId: string): Promise<MultipleSources | null> {
    const citation = await this.getCitation(councilDataId);
    if (!citation) return null;

    // For now, return single source wrapped in multiple sources format
    // This can be enhanced to track multiple sources per item
    const multipleSources: MultipleSources = {
      sources: [citation],
      primarySource: citation,
      overallConfidence: citation.confidence || 'medium',
      lastVerified: citation.dateAdded
    };

    return multipleSourcesSchema.parse(multipleSources);
  }

  /**
   * Verify and update source accessibility
   */
  async verifySource(url: string): Promise<{
    accessible: boolean;
    status: number;
    lastChecked: Date;
    redirectUrl?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'StonecloughHub Citation Verifier/1.0'
        }
      });

      const result = {
        accessible: response.ok,
        status: response.status,
        lastChecked: new Date(),
        redirectUrl: response.url !== url ? response.url : undefined
      };

      // Store verification result
      await this.storeVerificationResult(url, result);
      
      return result;
    } catch (error) {
      const result = {
        accessible: false,
        status: 0,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      await this.storeVerificationResult(url, result);
      return result;
    }
  }

  /**
   * Find items with broken or missing citations
   */
  async findBrokenCitations(): Promise<Array<{
    id: string;
    title: string;
    sourceUrl: string;
    lastChecked?: Date;
    error?: string;
  }>> {
    const query = `
      SELECT 
        id,
        title,
        source_url,
        citation_metadata->>'lastChecked' as last_checked,
        citation_metadata->>'error' as error
      FROM enhanced_council_data 
      WHERE 
        status = 'active' 
        AND (
          source_url IS NULL 
          OR citation_metadata->>'accessible' = 'false'
          OR citation_metadata->>'lastChecked' < NOW() - INTERVAL '30 days'
        )
      ORDER BY updated_at DESC
      LIMIT 100
    `;

    const result = await this.pool.query(query);
    
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      sourceUrl: row.source_url,
      lastChecked: row.last_checked ? new Date(row.last_checked) : undefined,
      error: row.error || undefined
    }));
  }

  /**
   * Generate citation report for data quality assessment
   */
  async generateCitationReport(): Promise<{
    totalItems: number;
    itemsWithCitations: number;
    itemsWithFiles: number;
    itemsWithParentPages: number;
    verifiedSources: number;
    brokenSources: number;
    confidenceDistribution: Record<string, number>;
    domainBreakdown: Record<string, number>;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(source_url) as items_with_citations,
        COUNT(file_url) as items_with_files,
        COUNT(parent_page_url) as items_with_parent_pages,
        COUNT(*) FILTER (WHERE citation_metadata->>'accessible' = 'true') as verified_sources,
        COUNT(*) FILTER (WHERE citation_metadata->>'accessible' = 'false') as broken_sources,
        extraction_confidence,
        source_domain
      FROM enhanced_council_data 
      WHERE status = 'active' AND archived = FALSE
      GROUP BY ROLLUP(extraction_confidence, source_domain)
    `;

    const result = await this.pool.query(query);

    // Process results into report format
    const report = {
      totalItems: 0,
      itemsWithCitations: 0,
      itemsWithFiles: 0,
      itemsWithParentPages: 0,
      verifiedSources: 0,
      brokenSources: 0,
      confidenceDistribution: {} as Record<string, number>,
      domainBreakdown: {} as Record<string, number>
    };

    result.rows.forEach(row => {
      if (!row.extraction_confidence && !row.source_domain) {
        // Summary row
        report.totalItems = parseInt(row.total_items);
        report.itemsWithCitations = parseInt(row.items_with_citations);
        report.itemsWithFiles = parseInt(row.items_with_files);
        report.itemsWithParentPages = parseInt(row.items_with_parent_pages);
        report.verifiedSources = parseInt(row.verified_sources);
        report.brokenSources = parseInt(row.broken_sources);
      } else if (row.extraction_confidence && !row.source_domain) {
        // Confidence breakdown
        const confidence = this.scoreToConfidence(row.extraction_confidence);
        report.confidenceDistribution[confidence] = parseInt(row.total_items);
      } else if (row.source_domain && !row.extraction_confidence) {
        // Domain breakdown
        report.domainBreakdown[row.source_domain] = parseInt(row.total_items);
      }
    });

    return report;
  }

  /**
   * Update citation metadata for existing items
   */
  async updateExistingCitations(): Promise<{
    processed: number;
    updated: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const query = `
      SELECT id, source_url, file_url, parent_page_url, source_title, extraction_confidence
      FROM enhanced_council_data 
      WHERE 
        status = 'active' 
        AND source_url IS NOT NULL 
        AND citation_metadata IS NULL
      LIMIT 1000
    `;

    const result = await this.pool.query(query);
    const stats = { processed: 0, updated: 0, errors: [] as Array<{ id: string; error: string }> };

    for (const row of result.rows) {
      try {
        stats.processed++;

        const citation: CitationMetadata = {
          sourceUrl: row.source_url,
          fileUrl: row.file_url || undefined,
          parentPageUrl: row.parent_page_url || undefined,
          title: row.source_title || undefined,
          confidence: this.scoreToConfidence(row.extraction_confidence) || 'medium',
          dateAdded: new Date()
        };

        await this.storeCitation(row.id, citation);
        stats.updated++;

      } catch (error) {
        stats.errors.push({
          id: row.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return stats;
  }

  /**
   * Store source verification result
   */
  private async storeVerificationResult(url: string, result: {
    accessible: boolean;
    status: number;
    lastChecked: Date;
    redirectUrl?: string;
    error?: string;
  }): Promise<void> {
    const updateQuery = `
      UPDATE enhanced_council_data 
      SET citation_metadata = COALESCE(citation_metadata, '{}'::jsonb) || $2
      WHERE source_url = $1 OR file_url = $1
    `;

    const verificationData = {
      accessible: result.accessible,
      status: result.status,
      lastChecked: result.lastChecked.toISOString(),
      redirectUrl: result.redirectUrl,
      error: result.error
    };

    await this.pool.query(updateQuery, [url, JSON.stringify(verificationData)]);
  }

  /**
   * Convert confidence score to text
   */
  private scoreToConfidence(score: number | null): 'low' | 'medium' | 'high' {
    if (!score) return 'medium';
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Convert confidence text to score
   */
  private getConfidenceScore(confidence: 'low' | 'medium' | 'high'): number {
    switch (confidence) {
      case 'high': return 0.9;
      case 'medium': return 0.7;
      case 'low': return 0.4;
    }
  }

  /**
   * Extract deep-link information from a URL
   */
  extractDeepLinkInfo(url: string): {
    isDirectFile: boolean;
    fileType?: string;
    isDomainSpecific: boolean;
    domain: string;
    suggestedType: CitationMetadata['type'];
  } {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const path = urlObj.pathname.toLowerCase();
    const extension = path.split('.').pop();

    const isDirectFile = ['pdf', 'csv', 'xlsx', 'xls', 'doc', 'docx'].includes(extension || '');
    
    let suggestedType: CitationMetadata['type'] = 'page';
    
    // Determine type based on URL patterns
    if (path.includes('planning') || path.includes('application')) {
      suggestedType = 'planning';
    } else if (path.includes('meeting') || path.includes('agenda') || path.includes('minutes')) {
      suggestedType = 'meeting';
    } else if (path.includes('spending') || path.includes('expenditure') || path.includes('payment')) {
      suggestedType = 'spending';
    } else if (path.includes('budget') || path.includes('finance')) {
      suggestedType = 'budget';
    } else if (isDirectFile) {
      suggestedType = 'document';
    }

    return {
      isDirectFile,
      fileType: isDirectFile ? extension : undefined,
      isDomainSpecific: domain.includes('gov.uk') || domain.includes('council'),
      domain,
      suggestedType
    };
  }

  /**
   * Generate citation markup for UI rendering
   */
  generateCitationMarkup(citation: CitationMetadata): {
    primaryLink: string;
    secondaryLink?: string;
    displayText: string;
    metadata: Record<string, any>;
  } {
    const linkInfo = this.extractDeepLinkInfo(citation.sourceUrl);
    
    return {
      primaryLink: citation.fileUrl || citation.sourceUrl,
      secondaryLink: citation.fileUrl ? (citation.parentPageUrl || citation.sourceUrl) : undefined,
      displayText: citation.title || linkInfo.domain,
      metadata: {
        type: citation.type || linkInfo.suggestedType,
        confidence: citation.confidence,
        fileType: citation.fileType || linkInfo.fileType,
        domain: linkInfo.domain,
        isDirectFile: linkInfo.isDirectFile,
        dateAdded: citation.dateAdded
      }
    };
  }

  /**
   * Bulk verify all sources in the database
   */
  async bulkVerifySources(limit: number = 100): Promise<{
    verified: number;
    broken: number;
    errors: number;
    processed: number;
  }> {
    const query = `
      SELECT DISTINCT source_url 
      FROM enhanced_council_data 
      WHERE 
        source_url IS NOT NULL 
        AND (
          citation_metadata->>'lastChecked' IS NULL 
          OR citation_metadata->>'lastChecked' < NOW() - INTERVAL '7 days'
        )
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    const stats = { verified: 0, broken: 0, errors: 0, processed: 0 };

    for (const row of result.rows) {
      try {
        stats.processed++;
        const verification = await this.verifySource(row.source_url);
        
        if (verification.accessible) {
          stats.verified++;
        } else {
          stats.broken++;
        }
      } catch (error) {
        stats.errors++;
        console.error(`Error verifying ${row.source_url}:`, error);
      }

      // Add delay to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return stats;
  }

  /**
   * Find duplicate content based on URL patterns
   */
  async findDuplicateSources(): Promise<Array<{
    sourceUrl: string;
    duplicateIds: string[];
    count: number;
  }>> {
    const query = `
      SELECT 
        source_url,
        array_agg(id) as duplicate_ids,
        COUNT(*) as count
      FROM enhanced_council_data 
      WHERE source_url IS NOT NULL
      GROUP BY source_url
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 50
    `;

    const result = await this.pool.query(query);
    
    return result.rows.map(row => ({
      sourceUrl: row.source_url,
      duplicateIds: row.duplicate_ids,
      count: parseInt(row.count)
    }));
  }

  /**
   * Update source URLs with enhanced citation information
   */
  async enhanceExistingCitations(): Promise<void> {
    const query = `
      SELECT id, source_url, file_url, parent_page_url
      FROM enhanced_council_data 
      WHERE citation_metadata IS NULL AND source_url IS NOT NULL
      LIMIT 500
    `;

    const result = await this.pool.query(query);

    for (const row of result.rows) {
      try {
        const linkInfo = this.extractDeepLinkInfo(row.source_url);
        
        const citation: CitationMetadata = {
          sourceUrl: row.source_url,
          fileUrl: row.file_url || undefined,
          parentPageUrl: row.parent_page_url || undefined,
          type: linkInfo.suggestedType,
          confidence: 'medium',
          dateAdded: new Date(),
          fileType: linkInfo.fileType,
          extractionMethod: 'enhanced_crawler'
        };

        await this.storeCitation(row.id, citation);
      } catch (error) {
        console.error(`Error enhancing citation for ${row.id}:`, error);
      }
    }
  }

  /**
   * Generate confidence score for multiple sources
   */
  private calculateOverallConfidence(sources: CitationMetadata[]): 'low' | 'medium' | 'high' {
    if (sources.length === 0) return 'low';
    
    const scores = sources.map(s => {
      switch (s.confidence) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
      }
    });

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    if (average >= 2.5) return 'high';
    if (average >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Create citation link with proper formatting
   */
  createCitationLink(citation: CitationMetadata, options: {
    includeFileLink?: boolean;
    includeParentLink?: boolean;
    format?: 'inline' | 'block' | 'compact';
  } = {}): string {
    const { includeFileLink = true, includeParentLink = true, format = 'inline' } = options;
    
    const linkInfo = this.extractDeepLinkInfo(citation.sourceUrl);
    let html = '';

    if (format === 'compact') {
      const primaryUrl = citation.fileUrl || citation.sourceUrl;
      const title = citation.title || linkInfo.domain;
      return `<a href="${primaryUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline text-sm">${title}</a>`;
    }

    if (format === 'block') {
      html += '<div class="citation-block border-l-4 border-blue-500 pl-4 py-2 my-2 bg-gray-50">';
    }

    // Primary link
    const primaryUrl = citation.fileUrl || citation.sourceUrl;
    const primaryTitle = citation.title || linkInfo.domain;
    html += `<a href="${primaryUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline font-medium">${primaryTitle}</a>`;

    // File type badge
    if (linkInfo.fileType) {
      html += ` <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded ml-1">${linkInfo.fileType.toUpperCase()}</span>`;
    }

    // Secondary link (parent page)
    if (includeParentLink && citation.fileUrl && citation.parentPageUrl && citation.parentPageUrl !== citation.sourceUrl) {
      const parentDomain = this.extractDeepLinkInfo(citation.parentPageUrl).domain;
      html += `<br><small class="text-gray-600">Found on: <a href="${citation.parentPageUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${parentDomain}</a></small>`;
    }

    if (format === 'block') {
      html += '</div>';
    }

    return html;
  }
}

export default CitationService;
