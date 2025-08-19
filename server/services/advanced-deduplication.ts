import crypto from 'crypto';
import { ComprehensiveMonitor } from './monitoring-system';
import { enhancedStorage } from './enhanced-storage';
import * as cheerio from 'cheerio';

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  confidence: number;
  duplicateType: DuplicateType;
  similarItems: SimilarItem[];
  primaryItem?: SimilarItem;
  recommendations: DeduplicationRecommendation[];
  processingTime: number;
}

export interface SimilarItem {
  id: string;
  title: string;
  url: string;
  similarity: number;
  matchingStrategy: MatchingStrategy;
  matchedFields: MatchedField[];
  contentHash?: string;
  semanticHash?: string;
  lastUpdated: Date;
  qualityScore?: number;
}

export interface MatchedField {
  fieldName: string;
  similarity: number;
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'partial';
  sourceValue: string;
  targetValue: string;
}

export interface DeduplicationRecommendation {
  action: 'merge' | 'keep_primary' | 'mark_duplicate' | 'needs_review' | 'ignore';
  confidence: number;
  reasoning: string;
  mergeStrategy?: MergeStrategy;
  fieldsToMerge?: string[];
  alternativeActions?: string[];
}

export interface DeduplicationReport {
  sessionId: string;
  totalItemsProcessed: number;
  duplicatesFound: number;
  duplicatesResolved: number;
  mergesPerformed: number;
  itemsMarkedForReview: number;
  qualityImprovements: QualityImprovement[];
  processingTime: number;
  strategies: { [strategy: string]: StrategyStats };
}

export interface QualityImprovement {
  itemId: string;
  beforeQuality: number;
  afterQuality: number;
  improvementType: string;
  changes: string[];
}

export interface StrategyStats {
  itemsProcessed: number;
  duplicatesFound: number;
  averageConfidence: number;
  processingTime: number;
  successRate: number;
}

export type DuplicateType = 
  | 'exact_duplicate'
  | 'near_duplicate'
  | 'semantic_duplicate'
  | 'partial_duplicate'
  | 'structural_duplicate'
  | 'temporal_duplicate';

export type MatchingStrategy = 
  | 'content_hash'
  | 'title_similarity'
  | 'semantic_analysis'
  | 'url_pattern'
  | 'temporal_proximity'
  | 'structural_similarity'
  | 'combined_features';

export type MergeStrategy = 
  | 'keep_highest_quality'
  | 'merge_complementary'
  | 'keep_most_recent'
  | 'keep_most_complete'
  | 'manual_review';

export class AdvancedDeduplicationEngine {
  private monitor: ComprehensiveMonitor;
  private contentHashCache: Map<string, string> = new Map();
  private semanticCache: Map<string, number[]> = new Map();
  private similarityThresholds: { [strategy: string]: number };
  
  constructor() {
    this.monitor = new ComprehensiveMonitor();
    this.initializeSimilarityThresholds();
  }

  /**
   * Detect duplicates for a single item against the database
   */
  async detectDuplicates(
    newItem: any,
    options: DeduplicationOptions = {}
  ): Promise<DuplicateDetectionResult> {
    const timingId = this.monitor.startTiming('duplicate_detection');
    const startTime = Date.now();

    try {
      console.log(`🔍 Detecting duplicates for: ${newItem.title?.substring(0, 50)}...`);

      const strategies = options.strategies || this.getAllStrategies();
      const maxSimilarItems = options.maxSimilarItems || 10;
      const minConfidenceThreshold = options.minConfidence || 0.6;

      // Run multiple detection strategies
      const allSimilarItems: SimilarItem[] = [];
      const strategyResults = new Map<MatchingStrategy, SimilarItem[]>();

      for (const strategy of strategies) {
        const strategyStart = Date.now();
        const similarItems = await this.runDetectionStrategy(newItem, strategy, maxSimilarItems);
        strategyResults.set(strategy, similarItems);
        allSimilarItems.push(...similarItems);
        
        console.log(`  📊 ${strategy}: found ${similarItems.length} potential matches (${Date.now() - strategyStart}ms)`);
      }

      // Deduplicate and rank similar items
      const uniqueSimilarItems = this.consolidateSimilarItems(allSimilarItems);
      const rankedItems = uniqueSimilarItems
        .filter(item => item.similarity >= minConfidenceThreshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxSimilarItems);

      // Determine overall duplicate status and type
      const { isDuplicate, duplicateType, confidence } = this.assessDuplicateStatus(rankedItems, newItem);

      // Identify primary item (best candidate for merging)
      const primaryItem = this.identifyPrimaryItem(rankedItems, newItem);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        newItem, 
        rankedItems, 
        primaryItem, 
        duplicateType,
        confidence
      );

      const result: DuplicateDetectionResult = {
        isDuplicate,
        confidence,
        duplicateType,
        similarItems: rankedItems,
        primaryItem,
        recommendations,
        processingTime: Date.now() - startTime
      };

      this.monitor.endTiming(timingId, 'duplicate_detection', true, {
        duplicatesFound: rankedItems.length,
        confidence,
        isDuplicate
      });

      console.log(`✅ Duplicate detection completed: ${isDuplicate ? 'DUPLICATE' : 'UNIQUE'} (${Math.round(confidence * 100)}% confidence)`);

      return result;

    } catch (error) {
      this.monitor.endTiming(timingId, 'duplicate_detection', false);
      this.monitor.recordError(error as Error, {
        operation: 'duplicate_detection',
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Perform bulk deduplication on a dataset
   */
  async performBulkDeduplication(
    itemIds: string[],
    options: BulkDeduplicationOptions = {}
  ): Promise<DeduplicationReport> {
    const sessionId = crypto.randomUUID();
    const startTime = Date.now();

    console.log(`🚀 Starting bulk deduplication session: ${sessionId}`);
    console.log(`📊 Processing ${itemIds.length} items`);

    const report: DeduplicationReport = {
      sessionId,
      totalItemsProcessed: 0,
      duplicatesFound: 0,
      duplicatesResolved: 0,
      mergesPerformed: 0,
      itemsMarkedForReview: 0,
      qualityImprovements: [],
      processingTime: 0,
      strategies: {}
    };

    try {
      // Process items in batches
      const batchSize = options.batchSize || 50;
      const batches = this.createBatches(itemIds, batchSize);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} items)`);

        await this.processBatch(batch, report, options);

        // Progress update
        report.totalItemsProcessed += batch.length;
        const progressPct = Math.round((batchIndex + 1) / batches.length * 100);
        console.log(`⚡ Progress: ${progressPct}% complete`);

        // Optional delay between batches
        if (options.batchDelay && batchIndex < batches.length - 1) {
          await this.sleep(options.batchDelay);
        }
      }

      report.processingTime = Date.now() - startTime;

      console.log(`✅ Bulk deduplication completed:`);
      console.log(`   📊 Items processed: ${report.totalItemsProcessed}`);
      console.log(`   🔍 Duplicates found: ${report.duplicatesFound}`);
      console.log(`   🔗 Duplicates resolved: ${report.duplicatesResolved}`);
      console.log(`   ⚡ Processing time: ${Math.round(report.processingTime / 1000)}s`);

      return report;

    } catch (error) {
      console.error('❌ Bulk deduplication failed:', error);
      this.monitor.recordError(error as Error, {
        operation: 'bulk_deduplication',
        sessionId,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Merge duplicate items based on strategy
   */
  async mergeDuplicates(
    primaryItemId: string,
    duplicateItemIds: string[],
    strategy: MergeStrategy = 'keep_highest_quality'
  ): Promise<MergeResult> {
    const timingId = this.monitor.startTiming('duplicate_merge');

    try {
      console.log(`🔗 Merging duplicates: ${duplicateItemIds.length} items into ${primaryItemId}`);

      // Fetch all items
      const allItems = await this.fetchItemsById([primaryItemId, ...duplicateItemIds]);
      const primaryItem = allItems.find(item => item.id === primaryItemId);
      const duplicateItems = allItems.filter(item => item.id !== primaryItemId);

      if (!primaryItem) {
        throw new Error(`Primary item ${primaryItemId} not found`);
      }

      // Apply merge strategy
      const mergedData = await this.applyMergeStrategy(primaryItem, duplicateItems, strategy);

      // Update primary item with merged data
      await this.updateMergedItem(primaryItemId, mergedData);

      // Mark duplicates as merged
      await this.markItemsAsMerged(duplicateItemIds, primaryItemId);

      // Calculate quality improvement
      const qualityImprovement = this.calculateQualityImprovement(primaryItem, mergedData);

      const result: MergeResult = {
        mergedItemId: primaryItemId,
        originalItemIds: duplicateItemIds,
        strategy,
        mergedFields: Object.keys(mergedData),
        qualityImprovement,
        success: true
      };

      this.monitor.endTiming(timingId, 'duplicate_merge', true, {
        itemsMerged: duplicateItemIds.length,
        strategy,
        qualityImprovement: qualityImprovement.improvement
      });

      console.log(`✅ Merge completed: ${duplicateItemIds.length} items merged into ${primaryItemId}`);

      return result;

    } catch (error) {
      this.monitor.endTiming(timingId, 'duplicate_merge', false);
      this.monitor.recordError(error as Error, {
        operation: 'duplicate_merge',
        primaryItemId,
        duplicateItemIds: duplicateItemIds.join(','),
        timestamp: new Date()
      });
      throw error;
    }
  }

  // Private methods for different detection strategies

  private async runDetectionStrategy(
    newItem: any,
    strategy: MatchingStrategy,
    maxResults: number
  ): Promise<SimilarItem[]> {
    switch (strategy) {
      case 'content_hash':
        return this.detectByContentHash(newItem, maxResults);
      
      case 'title_similarity':
        return this.detectByTitleSimilarity(newItem, maxResults);
      
      case 'semantic_analysis':
        return this.detectBySemanticAnalysis(newItem, maxResults);
      
      case 'url_pattern':
        return this.detectByUrlPattern(newItem, maxResults);
      
      case 'temporal_proximity':
        return this.detectByTemporalProximity(newItem, maxResults);
      
      case 'structural_similarity':
        return this.detectByStructuralSimilarity(newItem, maxResults);
      
      case 'combined_features':
        return this.detectByCombinedFeatures(newItem, maxResults);
      
      default:
        return [];
    }
  }

  /**
   * Strategy 1: Content Hash Detection
   */
  private async detectByContentHash(newItem: any, maxResults: number): Promise<SimilarItem[]> {
    const contentToHash = this.extractContentForHashing(newItem);
    const newHash = this.generateContentHash(contentToHash);
    
    // Check cache first
    if (this.contentHashCache.has(newHash)) {
      const existingId = this.contentHashCache.get(newHash)!;
      const existingItem = await this.fetchItemById(existingId);
      
      if (existingItem) {
        return [{
          id: existingItem.id,
          title: existingItem.title,
          url: existingItem.source_url || '',
          similarity: 1.0,
          matchingStrategy: 'content_hash',
          matchedFields: [
            {
              fieldName: 'content_hash',
              similarity: 1.0,
              matchType: 'exact',
              sourceValue: newHash,
              targetValue: newHash
            }
          ],
          contentHash: newHash,
          lastUpdated: new Date(existingItem.updated_at)
        }];
      }
    }

    // Search database for matching hashes
    const query = `
      SELECT id, title, source_url, updated_at, quality_score,
             extraction_metadata->>'contentHash' as content_hash
      FROM enhanced_council_data 
      WHERE extraction_metadata->>'contentHash' = $1
        AND status = 'active'
      LIMIT $2
    `;

    try {
      const results = await enhancedStorage.executeQuery(query, [newHash, maxResults]);
      
      return results.rows.map(row => ({
        id: row.id,
        title: row.title,
        url: row.source_url || '',
        similarity: 1.0,
        matchingStrategy: 'content_hash' as MatchingStrategy,
        matchedFields: [
          {
            fieldName: 'content_hash',
            similarity: 1.0,
            matchType: 'exact',
            sourceValue: newHash,
            targetValue: row.content_hash
          }
        ],
        contentHash: row.content_hash,
        lastUpdated: new Date(row.updated_at),
        qualityScore: row.quality_score
      }));
    } catch (error) {
      console.error('Content hash detection failed:', error);
      return [];
    }
  }

  /**
   * Strategy 2: Title Similarity Detection
   */
  private async detectByTitleSimilarity(newItem: any, maxResults: number): Promise<SimilarItem[]> {
    const newTitle = newItem.title?.toLowerCase() || '';
    if (newTitle.length < 10) return []; // Skip very short titles

    // Use PostgreSQL's similarity functions for fuzzy matching
    const query = `
      SELECT id, title, source_url, updated_at, quality_score,
             similarity(LOWER(title), $1) as title_similarity
      FROM enhanced_council_data 
      WHERE similarity(LOWER(title), $1) > $2
        AND status = 'active'
        AND id != $3
      ORDER BY title_similarity DESC
      LIMIT $4
    `;

    try {
      const threshold = this.similarityThresholds.title_similarity;
      const results = await enhancedStorage.executeQuery(query, [
        newTitle, 
        threshold, 
        newItem.id || '00000000-0000-0000-0000-000000000000', // Exclude self
        maxResults
      ]);

      return results.rows.map(row => ({
        id: row.id,
        title: row.title,
        url: row.source_url || '',
        similarity: row.title_similarity,
        matchingStrategy: 'title_similarity' as MatchingStrategy,
        matchedFields: [
          {
            fieldName: 'title',
            similarity: row.title_similarity,
            matchType: 'fuzzy',
            sourceValue: newItem.title,
            targetValue: row.title
          }
        ],
        lastUpdated: new Date(row.updated_at),
        qualityScore: row.quality_score
      }));
    } catch (error) {
      console.error('Title similarity detection failed:', error);
      return [];
    }
  }

  /**
   * Strategy 3: Semantic Analysis Detection
   */
  private async detectBySemanticAnalysis(newItem: any, maxResults: number): Promise<SimilarItem[]> {
    // This would integrate with a semantic similarity service or use embeddings
    // For now, implement a simpler keyword-based approach
    
    const keywords = this.extractKeywords(newItem);
    if (keywords.length === 0) return [];

    const keywordQuery = keywords.map(k => `'${k}'`).join(' | ');
    
    const query = `
      SELECT id, title, description, source_url, updated_at, quality_score,
             ts_rank_cd(search_vector, plainto_tsquery('english', $1)) as semantic_rank
      FROM enhanced_council_data 
      WHERE search_vector @@ plainto_tsquery('english', $1)
        AND status = 'active'
        AND id != $2
      ORDER BY semantic_rank DESC
      LIMIT $3
    `;

    try {
      const results = await enhancedStorage.executeQuery(query, [
        keywords.join(' '),
        newItem.id || '00000000-0000-0000-0000-000000000000',
        maxResults
      ]);

      return results.rows.map(row => ({
        id: row.id,
        title: row.title,
        url: row.source_url || '',
        similarity: Math.min(row.semantic_rank * 5, 1.0), // Normalize rank to 0-1
        matchingStrategy: 'semantic_analysis' as MatchingStrategy,
        matchedFields: [
          {
            fieldName: 'semantic_content',
            similarity: Math.min(row.semantic_rank * 5, 1.0),
            matchType: 'semantic',
            sourceValue: keywords.join(', '),
            targetValue: row.title + ' ' + (row.description || '').substring(0, 100)
          }
        ],
        lastUpdated: new Date(row.updated_at),
        qualityScore: row.quality_score
      }));
    } catch (error) {
      console.error('Semantic analysis detection failed:', error);
      return [];
    }
  }

  /**
   * Strategy 4: URL Pattern Detection
   */
  private async detectByUrlPattern(newItem: any, maxResults: number): Promise<SimilarItem[]> {
    if (!newItem.source_url) return [];

    try {
      const url = new URL(newItem.source_url);
      const pathSegments = url.pathname.split('/').filter(seg => seg.length > 0);
      
      if (pathSegments.length < 2) return [];

      // Look for items with similar URL patterns
      const basePattern = pathSegments.slice(0, -1).join('/');
      
      const query = `
        SELECT id, title, source_url, updated_at, quality_score
        FROM enhanced_council_data 
        WHERE source_url LIKE $1
          AND source_url != $2
          AND status = 'active'
        LIMIT $3
      `;

      const results = await enhancedStorage.executeQuery(query, [
        `%${basePattern}%`,
        newItem.source_url,
        maxResults
      ]);

      return results.rows.map(row => {
        const similarity = this.calculateUrlSimilarity(newItem.source_url, row.source_url);
        return {
          id: row.id,
          title: row.title,
          url: row.source_url || '',
          similarity,
          matchingStrategy: 'url_pattern' as MatchingStrategy,
          matchedFields: [
            {
              fieldName: 'source_url',
              similarity,
              matchType: 'partial',
              sourceValue: newItem.source_url,
              targetValue: row.source_url
            }
          ],
          lastUpdated: new Date(row.updated_at),
          qualityScore: row.quality_score
        };
      });
    } catch (error) {
      console.error('URL pattern detection failed:', error);
      return [];
    }
  }

  /**
   * Strategy 5: Temporal Proximity Detection
   */
  private async detectByTemporalProximity(newItem: any, maxResults: number): Promise<SimilarItem[]> {
    const eventDate = newItem.event_date || newItem.created_at;
    if (!eventDate) return [];

    const searchDate = new Date(eventDate);
    const timePeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    const query = `
      SELECT id, title, source_url, event_date, created_at, updated_at, quality_score,
             ABS(EXTRACT(EPOCH FROM (COALESCE(event_date, created_at) - $1))) as time_diff_seconds
      FROM enhanced_council_data 
      WHERE ABS(EXTRACT(EPOCH FROM (COALESCE(event_date, created_at) - $1))) < $2
        AND status = 'active'
        AND id != $3
      ORDER BY time_diff_seconds ASC
      LIMIT $4
    `;

    try {
      const results = await enhancedStorage.executeQuery(query, [
        searchDate,
        timePeriod / 1000, // Convert to seconds
        newItem.id || '00000000-0000-0000-0000-000000000000',
        maxResults
      ]);

      return results.rows.map(row => {
        const timeDiffHours = row.time_diff_seconds / 3600;
        const similarity = Math.max(0, 1 - (timeDiffHours / (7 * 24))); // Similarity decreases over 7 days
        
        return {
          id: row.id,
          title: row.title,
          url: row.source_url || '',
          similarity,
          matchingStrategy: 'temporal_proximity' as MatchingStrategy,
          matchedFields: [
            {
              fieldName: 'event_date',
              similarity,
              matchType: 'partial',
              sourceValue: eventDate.toString(),
              targetValue: (row.event_date || row.created_at).toString()
            }
          ],
          lastUpdated: new Date(row.updated_at),
          qualityScore: row.quality_score
        };
      });
    } catch (error) {
      console.error('Temporal proximity detection failed:', error);
      return [];
    }
  }

  /**
   * Strategy 6: Structural Similarity Detection
   */
  private async detectByStructuralSimilarity(newItem: any, maxResults: number): Promise<SimilarItem[]> {
    // Analyze structural features like data type, category, and metadata structure
    const structure = {
      dataType: newItem.data_type,
      hasAmount: !!newItem.amount,
      hasLocation: !!newItem.location,
      categoryDepth: newItem.category ? newItem.category.split('/').length : 0,
      metadataKeys: newItem.metadata ? Object.keys(newItem.metadata).sort() : []
    };

    const query = `
      SELECT id, title, source_url, updated_at, quality_score, data_type, 
             amount, location, category, extraction_metadata
      FROM enhanced_council_data 
      WHERE data_type = $1
        AND status = 'active'
        AND id != $2
      LIMIT $3
    `;

    try {
      const results = await enhancedStorage.executeQuery(query, [
        structure.dataType,
        newItem.id || '00000000-0000-0000-0000-000000000000',
        maxResults * 2 // Get more results to filter by structure
      ]);

      const similarItems: SimilarItem[] = [];

      for (const row of results.rows) {
        const targetStructure = {
          dataType: row.data_type,
          hasAmount: !!row.amount,
          hasLocation: !!row.location,
          categoryDepth: row.category ? row.category.split('/').length : 0,
          metadataKeys: row.extraction_metadata ? Object.keys(row.extraction_metadata).sort() : []
        };

        const similarity = this.calculateStructuralSimilarity(structure, targetStructure);
        
        if (similarity >= this.similarityThresholds.structural_similarity) {
          similarItems.push({
            id: row.id,
            title: row.title,
            url: row.source_url || '',
            similarity,
            matchingStrategy: 'structural_similarity',
            matchedFields: [
              {
                fieldName: 'structure',
                similarity,
                matchType: 'partial',
                sourceValue: JSON.stringify(structure),
                targetValue: JSON.stringify(targetStructure)
              }
            ],
            lastUpdated: new Date(row.updated_at),
            qualityScore: row.quality_score
          });
        }
      }

      return similarItems
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults);

    } catch (error) {
      console.error('Structural similarity detection failed:', error);
      return [];
    }
  }

  /**
   * Strategy 7: Combined Features Detection
   */
  private async detectByCombinedFeatures(newItem: any, maxResults: number): Promise<SimilarItem[]> {
    // This strategy combines multiple signals for more accurate detection
    const features = this.extractCombinedFeatures(newItem);
    
    // Weight different feature types
    const weights = {
      titleSimilarity: 0.3,
      contentSimilarity: 0.25,
      structuralSimilarity: 0.2,
      temporalProximity: 0.15,
      urlSimilarity: 0.1
    };

    // For now, return results from title similarity as a placeholder
    // In a full implementation, this would combine results from all strategies
    return this.detectByTitleSimilarity(newItem, maxResults);
  }

  // Helper methods

  private initializeSimilarityThresholds(): void {
    this.similarityThresholds = {
      content_hash: 1.0,
      title_similarity: 0.75,
      semantic_analysis: 0.6,
      url_pattern: 0.7,
      temporal_proximity: 0.5,
      structural_similarity: 0.8,
      combined_features: 0.75
    };
  }

  private getAllStrategies(): MatchingStrategy[] {
    return [
      'content_hash',
      'title_similarity', 
      'semantic_analysis',
      'url_pattern',
      'temporal_proximity',
      'structural_similarity'
    ];
  }

  private consolidateSimilarItems(allItems: SimilarItem[]): SimilarItem[] {
    const uniqueItems = new Map<string, SimilarItem>();

    for (const item of allItems) {
      const existing = uniqueItems.get(item.id);
      if (!existing || item.similarity > existing.similarity) {
        uniqueItems.set(item.id, item);
      } else if (item.similarity === existing.similarity) {
        // Merge matching strategies
        existing.matchedFields.push(...item.matchedFields);
      }
    }

    return Array.from(uniqueItems.values());
  }

  private assessDuplicateStatus(
    similarItems: SimilarItem[], 
    newItem: any
  ): { isDuplicate: boolean; duplicateType: DuplicateType; confidence: number } {
    if (similarItems.length === 0) {
      return { isDuplicate: false, duplicateType: 'exact_duplicate', confidence: 0 };
    }

    const topItem = similarItems[0];
    let duplicateType: DuplicateType;
    let confidence = topItem.similarity;

    if (topItem.similarity >= 0.95) {
      duplicateType = 'exact_duplicate';
    } else if (topItem.similarity >= 0.85) {
      duplicateType = 'near_duplicate';
    } else if (topItem.matchingStrategy === 'semantic_analysis') {
      duplicateType = 'semantic_duplicate';
    } else if (topItem.matchingStrategy === 'structural_similarity') {
      duplicateType = 'structural_duplicate';
    } else if (topItem.matchingStrategy === 'temporal_proximity') {
      duplicateType = 'temporal_duplicate';
    } else {
      duplicateType = 'partial_duplicate';
    }

    const isDuplicate = confidence >= 0.7;

    return { isDuplicate, duplicateType, confidence };
  }

  private identifyPrimaryItem(similarItems: SimilarItem[], newItem: any): SimilarItem | undefined {
    if (similarItems.length === 0) return undefined;

    // Score items based on quality, recency, and completeness
    const scoredItems = similarItems.map(item => {
      let score = item.similarity * 0.4; // Base similarity score
      
      if (item.qualityScore) {
        score += item.qualityScore * 0.3; // Quality bonus
      }
      
      // Recency bonus (more recent = higher score)
      const daysSinceUpdate = (Date.now() - item.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - daysSinceUpdate / 365); // Decay over a year
      score += recencyScore * 0.2;
      
      // Completeness bonus (longer title = more complete)
      const completenessScore = Math.min(1, item.title.length / 100);
      score += completenessScore * 0.1;

      return { ...item, finalScore: score };
    });

    return scoredItems.sort((a, b) => b.finalScore - a.finalScore)[0];
  }

  private async generateRecommendations(
    newItem: any,
    similarItems: SimilarItem[],
    primaryItem: SimilarItem | undefined,
    duplicateType: DuplicateType,
    confidence: number
  ): Promise<DeduplicationRecommendation[]> {
    const recommendations: DeduplicationRecommendation[] = [];

    if (!primaryItem) {
      recommendations.push({
        action: 'ignore',
        confidence: 1.0,
        reasoning: 'No similar items found with sufficient confidence'
      });
      return recommendations;
    }

    if (confidence >= 0.95) {
      recommendations.push({
        action: 'mark_duplicate',
        confidence,
        reasoning: 'Very high similarity detected - likely exact duplicate',
        mergeStrategy: 'keep_highest_quality'
      });
    } else if (confidence >= 0.85) {
      recommendations.push({
        action: 'merge',
        confidence,
        reasoning: 'High similarity detected - merge to improve data quality',
        mergeStrategy: 'merge_complementary',
        fieldsToMerge: this.identifyFieldsToMerge(newItem, primaryItem)
      });
    } else if (confidence >= 0.7) {
      recommendations.push({
        action: 'needs_review',
        confidence,
        reasoning: 'Moderate similarity detected - manual review recommended',
        alternativeActions: ['merge', 'mark_duplicate', 'ignore']
      });
    } else {
      recommendations.push({
        action: 'keep_primary',
        confidence: 1 - confidence,
        reasoning: 'Low similarity - keep as separate items'
      });
    }

    return recommendations;
  }

  private identifyFieldsToMerge(newItem: any, primaryItem: SimilarItem): string[] {
    const fieldsToMerge: string[] = [];
    
    // Compare key fields and identify which ones could be merged
    const comparableFields = ['description', 'tags', 'metadata', 'location', 'amount'];
    
    for (const field of comparableFields) {
      if (newItem[field] && !primaryItem[field]) {
        fieldsToMerge.push(field);
      }
    }

    return fieldsToMerge;
  }

  private extractContentForHashing(item: any): string {
    // Extract the most relevant content for hashing
    const parts = [
      item.title || '',
      item.description || '',
      item.data_type || '',
      item.category || '',
      item.location || ''
    ];
    
    return parts.join('|').toLowerCase().trim();
  }

  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private extractKeywords(item: any): string[] {
    const text = [item.title, item.description, item.category].join(' ');
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Remove common stop words
    const stopWords = new Set(['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their']);
    
    return [...new Set(words.filter(word => !stopWords.has(word)))];
  }

  private calculateUrlSimilarity(url1: string, url2: string): number {
    try {
      const parsed1 = new URL(url1);
      const parsed2 = new URL(url2);
      
      if (parsed1.hostname !== parsed2.hostname) return 0;
      
      const path1 = parsed1.pathname.split('/');
      const path2 = parsed2.pathname.split('/');
      
      const maxLength = Math.max(path1.length, path2.length);
      let matches = 0;
      
      for (let i = 0; i < maxLength; i++) {
        if (path1[i] === path2[i]) matches++;
      }
      
      return matches / maxLength;
    } catch {
      return 0;
    }
  }

  private calculateStructuralSimilarity(struct1: any, struct2: any): number {
    let score = 0;
    let weights = 0;
    
    // Data type match
    if (struct1.dataType === struct2.dataType) {
      score += 0.4;
    }
    weights += 0.4;
    
    // Boolean field matches
    if (struct1.hasAmount === struct2.hasAmount) score += 0.15;
    if (struct1.hasLocation === struct2.hasLocation) score += 0.15;
    weights += 0.3;
    
    // Category depth similarity
    const depthDiff = Math.abs(struct1.categoryDepth - struct2.categoryDepth);
    const depthSimilarity = Math.max(0, 1 - depthDiff / 5);
    score += depthSimilarity * 0.15;
    weights += 0.15;
    
    // Metadata key overlap
    const keys1 = new Set(struct1.metadataKeys);
    const keys2 = new Set(struct2.metadataKeys);
    const intersection = new Set([...keys1].filter(key => keys2.has(key)));
    const union = new Set([...keys1, ...keys2]);
    const keyOverlap = union.size > 0 ? intersection.size / union.size : 1;
    score += keyOverlap * 0.15;
    weights += 0.15;
    
    return weights > 0 ? score / weights : 0;
  }

  private extractCombinedFeatures(item: any): any {
    return {
      titleLength: item.title?.length || 0,
      hasDescription: !!item.description,
      hasAmount: !!item.amount,
      hasLocation: !!item.location,
      dataType: item.data_type,
      category: item.category,
      wordCount: (item.title + ' ' + (item.description || '')).split(/\s+/).length,
      urlDepth: item.source_url ? item.source_url.split('/').length - 3 : 0
    };
  }

  private async processBatch(
    batch: string[], 
    report: DeduplicationReport, 
    options: BulkDeduplicationOptions
  ): Promise<void> {
    for (const itemId of batch) {
      try {
        const item = await this.fetchItemById(itemId);
        if (!item) continue;

        const detection = await this.detectDuplicates(item, {
          strategies: options.strategies,
          maxSimilarItems: 5,
          minConfidence: options.minConfidence || 0.7
        });

        if (detection.isDuplicate && detection.primaryItem) {
          report.duplicatesFound++;
          
          if (options.autoResolve && detection.confidence >= 0.9) {
            // Auto-resolve high-confidence duplicates
            await this.resolveDuplicate(item, detection);
            report.duplicatesResolved++;
          } else {
            // Mark for manual review
            report.itemsMarkedForReview++;
          }
        }
      } catch (error) {
        console.error(`Error processing item ${itemId}:`, error);
      }
    }
  }

  private async resolveDuplicate(item: any, detection: DuplicateDetectionResult): Promise<void> {
    const primaryRecommendation = detection.recommendations[0];
    
    if (primaryRecommendation.action === 'merge' && detection.primaryItem) {
      await this.mergeDuplicates(
        detection.primaryItem.id,
        [item.id],
        primaryRecommendation.mergeStrategy || 'keep_highest_quality'
      );
    } else if (primaryRecommendation.action === 'mark_duplicate') {
      await this.markItemAsDuplicate(item.id, detection.primaryItem?.id);
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Placeholder methods for database operations
  private async fetchItemById(id: string): Promise<any> {
    // Implementation would fetch from enhanced_council_data table
    return null;
  }

  private async fetchItemsById(ids: string[]): Promise<any[]> {
    // Implementation would fetch multiple items
    return [];
  }

  private async updateMergedItem(id: string, data: any): Promise<void> {
    // Implementation would update the item in database
  }

  private async markItemsAsMerged(itemIds: string[], primaryId: string): Promise<void> {
    // Implementation would mark items as merged
  }

  private async markItemAsDuplicate(itemId: string, primaryId?: string): Promise<void> {
    // Implementation would mark item as duplicate
  }

  private async applyMergeStrategy(primary: any, duplicates: any[], strategy: MergeStrategy): Promise<any> {
    // Implementation would merge data according to strategy
    return primary;
  }

  private calculateQualityImprovement(before: any, after: any): { improvement: number; details: string[] } {
    // Implementation would calculate quality improvement
    return { improvement: 0, details: [] };
  }
}

// Supporting interfaces
interface DeduplicationOptions {
  strategies?: MatchingStrategy[];
  maxSimilarItems?: number;
  minConfidence?: number;
}

interface BulkDeduplicationOptions extends DeduplicationOptions {
  batchSize?: number;
  batchDelay?: number;
  autoResolve?: boolean;
}

interface MergeResult {
  mergedItemId: string;
  originalItemIds: string[];
  strategy: MergeStrategy;
  mergedFields: string[];
  qualityImprovement: { improvement: number; details: string[] };
  success: boolean;
}

export const advancedDeduplicationEngine = new AdvancedDeduplicationEngine();
