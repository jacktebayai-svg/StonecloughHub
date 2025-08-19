import { db } from '../db';
import { councilData, type InsertCouncilData, type CouncilData } from '@shared/schema';
import { eq, desc, sql, count, and, or, like, gte, lte, inArray, isNotNull, isNull } from 'drizzle-orm';
import crypto from 'crypto';

export interface AdvancedSearchParams {
  // Text search
  query?: string;
  fullText?: boolean;
  
  // Filters
  category?: string | string[];
  dataType?: string | string[];
  ward?: string | string[];
  status?: string | string[];
  department?: string | string[];
  
  // Date ranges
  dateFrom?: Date;
  dateTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  
  // Numerical ranges
  minAmount?: number;
  maxAmount?: number;
  
  // Geographic
  hasLocation?: boolean;
  postcode?: string;
  constituency?: string;
  
  // Quality and metadata
  quality?: string | string[];
  hasStructuredData?: boolean;
  hasContactInfo?: boolean;
  hasFinancialData?: boolean;
  
  // Content characteristics
  minContentLength?: number;
  maxContentLength?: number;
  language?: string;
  tags?: string[];
  
  // Sorting and pagination
  sortBy?: 'relevance' | 'date' | 'created' | 'amount' | 'quality' | 'title' | 'views';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  
  // Advanced options
  includeArchived?: boolean;
  includePrivate?: boolean;
  sessionId?: string;
  excludeTypes?: string[];
  similarity?: {
    to: string;
    threshold?: number;
  };
}

export interface SearchResult {
  items: CouncilData[];
  totalCount: number;
  facets: {
    categories: { [key: string]: number };
    dataTypes: { [key: string]: number };
    wards: { [key: string]: number };
    departments: { [key: string]: number };
    statuses: { [key: string]: number };
    qualities: { [key: string]: number };
    dateRange: { earliest: Date; latest: Date };
    amountRange: { min: number; max: number };
  };
  searchStats: {
    totalResults: number;
    searchTime: number;
    queryComplexity: number;
    suggestedFilters: Array<{ field: string; value: string; count: number }>;
  };
  relatedItems?: CouncilData[];
  aggregations?: {
    byMonth: Array<{ month: string; count: number }>;
    byCategory: Array<{ category: string; count: number; totalAmount?: number }>;
    qualityDistribution: Array<{ quality: string; percentage: number }>;
  };
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  similarItems: Array<{
    id: string;
    title: string;
    similarity: number;
    url: string;
    reason: 'exact_hash' | 'similar_content' | 'same_url' | 'similar_title';
  }>;
  recommendations: string[];
}

export interface DataQualityReport {
  id: string;
  overallScore: number;
  completeness: number;
  accuracy: number;
  freshness: number;
  consistency: number;
  issues: Array<{
    field: string;
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    suggestion: string;
  }>;
  strengths: string[];
  improvements: string[];
}

export class EnhancedBoltonStorage {
  
  /**
   * Advanced search with comprehensive filtering and faceting
   */
  async advancedSearch(params: AdvancedSearchParams): Promise<SearchResult> {
    const startTime = Date.now();
    
    // Build base query
    let baseQuery = db.select().from(councilData);
    const conditions: any[] = [];
    
    // Text search with full-text support
    if (params.query) {
      if (params.fullText) {
        conditions.push(
          sql`to_tsvector('english', ${councilData.title} || ' ' || coalesce(${councilData.description}, '')) @@ plainto_tsquery('english', ${params.query})`
        );
      } else {
        const searchTerm = `%${params.query.toLowerCase()}%`;
        conditions.push(
          or(
            sql`LOWER(${councilData.title}) LIKE ${searchTerm}`,
            sql`LOWER(${councilData.description}) LIKE ${searchTerm}`,
            sql`LOWER(${councilData.location}) LIKE ${searchTerm}`,
            sql`${councilData.metadata}::text ILIKE ${searchTerm}`
          )
        );
      }
    }
    
    // Category filters
    if (params.category) {
      const categories = Array.isArray(params.category) ? params.category : [params.category];
      conditions.push(inArray(councilData.dataType as any, categories));
    }
    
    // Data type filters
    if (params.dataType) {
      const types = Array.isArray(params.dataType) ? params.dataType : [params.dataType];
      conditions.push(inArray(councilData.dataType as any, types));
    }
    
    // Ward filters
    if (params.ward) {
      const wards = Array.isArray(params.ward) ? params.ward : [params.ward];
      conditions.push(
        or(
          ...wards.map(ward => sql`${councilData.location} ILIKE ${'%' + ward + '%'}`)
        )
      );
    }
    
    // Status filters
    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      conditions.push(inArray(councilData.status as any, statuses));
    }
    
    // Date range filters
    if (params.dateFrom) {
      conditions.push(gte(councilData.date, params.dateFrom));
    }
    if (params.dateTo) {
      conditions.push(lte(councilData.date, params.dateTo));
    }
    if (params.createdFrom) {
      conditions.push(gte(councilData.createdAt, params.createdFrom));
    }
    if (params.createdTo) {
      conditions.push(lte(councilData.createdAt, params.createdTo));
    }
    
    // Amount range filters
    if (params.minAmount !== undefined) {
      conditions.push(gte(councilData.amount, params.minAmount));
    }
    if (params.maxAmount !== undefined) {
      conditions.push(lte(councilData.amount, params.maxAmount));
    }
    
    // Geographic filters
    if (params.hasLocation === true) {
      conditions.push(isNotNull(councilData.location));
    } else if (params.hasLocation === false) {
      conditions.push(isNull(councilData.location));
    }
    
    // Metadata filters
    if (params.hasStructuredData) {
      conditions.push(sql`${councilData.metadata} ? 'structuredData'`);
    }
    if (params.hasContactInfo) {
      conditions.push(sql`${councilData.metadata} ? 'contactInfo'`);
    }
    if (params.hasFinancialData) {
      conditions.push(sql`${councilData.metadata} ? 'extractedFinancialData'`);
    }
    
    // Content length filters
    if (params.minContentLength) {
      conditions.push(sql`LENGTH(${councilData.description}) >= ${params.minContentLength}`);
    }
    if (params.maxContentLength) {
      conditions.push(sql`LENGTH(${councilData.description}) <= ${params.maxContentLength}`);
    }
    
    // Tag filters
    if (params.tags && params.tags.length > 0) {
      conditions.push(
        or(
          ...params.tags.map(tag => 
            sql`${councilData.metadata}->>'tags' LIKE ${'%' + tag + '%'}`
          )
        )
      );
    }
    
    // Session filters
    if (params.sessionId) {
      conditions.push(sql`${councilData.metadata}->>'sessionId' = ${params.sessionId}`);
    }
    
    // Exclude types
    if (params.excludeTypes && params.excludeTypes.length > 0) {
      conditions.push(sql`${councilData.dataType} NOT IN (${params.excludeTypes.map(t => sql`${t}`).join(', ')})`);
    }
    
    // Apply all conditions
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }
    
    // Get total count for pagination
    const countQuery = db.select({ count: count() }).from(councilData);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    const [{ count: totalCount }] = await countQuery;
    
    // Apply sorting
    const sortBy = params.sortBy || 'date';
    const sortOrder = params.sortOrder || 'desc';
    
    switch (sortBy) {
      case 'date':
        baseQuery = baseQuery.orderBy(sortOrder === 'desc' ? desc(councilData.date) : councilData.date);
        break;
      case 'created':
        baseQuery = baseQuery.orderBy(sortOrder === 'desc' ? desc(councilData.createdAt) : councilData.createdAt);
        break;
      case 'amount':
        baseQuery = baseQuery.orderBy(sortOrder === 'desc' ? desc(councilData.amount) : councilData.amount);
        break;
      case 'title':
        baseQuery = baseQuery.orderBy(sortOrder === 'desc' ? desc(councilData.title) : councilData.title);
        break;
      case 'relevance':
        if (params.query && params.fullText) {
          baseQuery = baseQuery.orderBy(
            sql`ts_rank_cd(to_tsvector('english', ${councilData.title} || ' ' || coalesce(${councilData.description}, '')), plainto_tsquery('english', ${params.query})) DESC`
          );
        } else {
          baseQuery = baseQuery.orderBy(desc(councilData.createdAt));
        }
        break;
      default:
        baseQuery = baseQuery.orderBy(desc(councilData.date));
    }
    
    // Apply pagination
    const limit = Math.min(params.limit || 50, 200); // Max 200 results per page
    const offset = params.offset || 0;
    baseQuery = baseQuery.limit(limit).offset(offset);
    
    // Execute main query
    const items = await baseQuery;
    
    // Generate facets
    const facets = await this.generateFacets(conditions);
    
    // Generate aggregations
    const aggregations = await this.generateAggregations(conditions);
    
    // Find related items if query provided
    let relatedItems: CouncilData[] = [];
    if (params.query && items.length > 0) {
      relatedItems = await this.findRelatedItems(items[0], 5);
    }
    
    const searchTime = Date.now() - startTime;
    
    return {
      items,
      totalCount,
      facets,
      aggregations,
      relatedItems,
      searchStats: {
        totalResults: totalCount,
        searchTime,
        queryComplexity: conditions.length,
        suggestedFilters: await this.generateSuggestedFilters(params, items)
      }
    };
  }
  
  /**
   * Generate search facets for filtering
   */
  private async generateFacets(conditions: any[]): Promise<SearchResult['facets']> {
    const baseWhere = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Categories facet
    const categoriesQuery = db.select({
      category: councilData.dataType,
      count: count()
    }).from(councilData).groupBy(councilData.dataType);
    
    if (baseWhere) categoriesQuery.where(baseWhere);
    const categoriesResult = await categoriesQuery;
    const categories = Object.fromEntries(
      categoriesResult.map(r => [r.category, r.count])
    );
    
    // Data types facet (if different from categories)
    const dataTypes = categories; // Same for now
    
    // Wards facet
    const wardsQuery = db.select({
      location: councilData.location,
      count: count()
    }).from(councilData)
    .where(and(baseWhere || sql`1=1`, isNotNull(councilData.location)))
    .groupBy(councilData.location);
    
    const wardsResult = await wardsQuery;
    const wards = Object.fromEntries(
      wardsResult.map(r => [r.location || 'Unknown', r.count])
    );
    
    // Departments (extracted from metadata)
    const departments: { [key: string]: number } = {};
    
    // Status facet
    const statusQuery = db.select({
      status: councilData.status,
      count: count()
    }).from(councilData)
    .where(and(baseWhere || sql`1=1`, isNotNull(councilData.status)))
    .groupBy(councilData.status);
    
    const statusResult = await statusQuery;
    const statuses = Object.fromEntries(
      statusResult.map(r => [r.status || 'Unknown', r.count])
    );
    
    // Quality placeholder (would need to be implemented in schema)
    const qualities: { [key: string]: number } = { 'High': 0, 'Medium': 0, 'Low': 0 };
    
    // Date range
    const dateRangeQuery = db.select({
      earliest: sql<Date>`MIN(${councilData.date})`,
      latest: sql<Date>`MAX(${councilData.date})`
    }).from(councilData);
    
    if (baseWhere) dateRangeQuery.where(baseWhere);
    const [dateRange] = await dateRangeQuery;
    
    // Amount range
    const amountRangeQuery = db.select({
      min: sql<number>`MIN(${councilData.amount})`,
      max: sql<number>`MAX(${councilData.amount})`
    }).from(councilData)
    .where(and(baseWhere || sql`1=1`, isNotNull(councilData.amount)));
    
    const [amountRange] = await amountRangeQuery;
    
    return {
      categories,
      dataTypes,
      wards,
      departments,
      statuses,
      qualities,
      dateRange: {
        earliest: dateRange.earliest || new Date(),
        latest: dateRange.latest || new Date()
      },
      amountRange: {
        min: amountRange.min || 0,
        max: amountRange.max || 0
      }
    };
  }
  
  /**
   * Generate search aggregations for analytics
   */
  private async generateAggregations(conditions: any[]): Promise<SearchResult['aggregations']> {
    const baseWhere = conditions.length > 0 ? and(...conditions) : undefined;
    
    // By month aggregation
    const byMonthQuery = db.select({
      month: sql<string>`TO_CHAR(${councilData.date}, 'YYYY-MM')`,
      count: count()
    }).from(councilData)
    .groupBy(sql`TO_CHAR(${councilData.date}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${councilData.date}, 'YYYY-MM') DESC`)
    .limit(12);
    
    if (baseWhere) byMonthQuery.where(baseWhere);
    const byMonth = await byMonthQuery;
    
    // By category with amounts
    const byCategoryQuery = db.select({
      category: councilData.dataType,
      count: count(),
      totalAmount: sql<number>`SUM(COALESCE(${councilData.amount}, 0))`
    }).from(councilData)
    .groupBy(councilData.dataType)
    .orderBy(desc(count()));
    
    if (baseWhere) byCategoryQuery.where(baseWhere);
    const byCategory = await byCategoryQuery;
    
    // Quality distribution (placeholder)
    const qualityDistribution = [
      { quality: 'High', percentage: 25 },
      { quality: 'Medium', percentage: 50 },
      { quality: 'Low', percentage: 25 }
    ];
    
    return {
      byMonth,
      byCategory: byCategory.map(c => ({
        category: c.category,
        count: c.count,
        totalAmount: c.totalAmount
      })),
      qualityDistribution
    };
  }
  
  /**
   * Find items related to a given item
   */
  private async findRelatedItems(item: CouncilData, limit: number = 5): Promise<CouncilData[]> {
    // Find related items based on:
    // 1. Same category
    // 2. Similar location
    // 3. Similar timeframe
    // 4. Similar amounts (for financial data)
    
    const conditions: any[] = [
      sql`${councilData.id} != ${item.id}` // Exclude the current item
    ];
    
    // Same category with higher weight
    const sameCategory = await db.select().from(councilData)
      .where(and(
        eq(councilData.dataType, item.dataType),
        sql`${councilData.id} != ${item.id}`
      ))
      .orderBy(desc(councilData.date))
      .limit(3);
    
    // Similar location
    let sameLocation: CouncilData[] = [];
    if (item.location) {
      sameLocation = await db.select().from(councilData)
        .where(and(
          sql`${councilData.location} ILIKE ${'%' + item.location + '%'}`,
          sql`${councilData.id} != ${item.id}`,
          sql`${councilData.dataType} != ${item.dataType}` // Different category
        ))
        .orderBy(desc(councilData.date))
        .limit(2);
    }
    
    // Combine and deduplicate
    const allRelated = [...sameCategory, ...sameLocation];
    const uniqueRelated = Array.from(
      new Map(allRelated.map(item => [item.id, item])).values()
    ).slice(0, limit);
    
    return uniqueRelated;
  }
  
  /**
   * Generate suggested filters based on search results
   */
  private async generateSuggestedFilters(
    params: AdvancedSearchParams, 
    items: CouncilData[]
  ): Promise<Array<{ field: string; value: string; count: number }>> {
    const suggestions: Array<{ field: string; value: string; count: number }> = [];
    
    // Analyze current results to suggest refinements
    const categoryCount: { [key: string]: number } = {};
    const locationCount: { [key: string]: number } = {};
    
    items.forEach(item => {
      categoryCount[item.dataType] = (categoryCount[item.dataType] || 0) + 1;
      if (item.location) {
        locationCount[item.location] = (locationCount[item.location] || 0) + 1;
      }
    });
    
    // Suggest popular categories not already filtered
    if (!params.category) {
      Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([category, count]) => {
          suggestions.push({
            field: 'category',
            value: category,
            count
          });
        });
    }
    
    // Suggest popular locations
    if (!params.ward && Object.keys(locationCount).length > 0) {
      Object.entries(locationCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .forEach(([location, count]) => {
          suggestions.push({
            field: 'ward',
            value: location,
            count
          });
        });
    }
    
    return suggestions;
  }
  
  /**
   * Detect duplicates using multiple strategies
   */
  async detectDuplicates(
    newItem: InsertCouncilData,
    strictMode: boolean = false
  ): Promise<DuplicateDetectionResult> {
    const similarItems: DuplicateDetectionResult['similarItems'] = [];
    const recommendations: string[] = [];
    
    // Strategy 1: Content hash comparison (for exact duplicates)
    const contentHash = this.generateContentHash(
      newItem.title + (newItem.description || '') + newItem.sourceUrl
    );
    
    const exactDuplicates = await db.select().from(councilData)
      .where(sql`${councilData.metadata}->>'contentHash' = ${contentHash}`)
      .limit(5);
    
    exactDuplicates.forEach(item => {
      similarItems.push({
        id: item.id,
        title: item.title,
        similarity: 1.0,
        url: item.sourceUrl || '',
        reason: 'exact_hash'
      });
    });
    
    // Strategy 2: Same URL
    if (newItem.sourceUrl) {
      const sameUrl = await db.select().from(councilData)
        .where(eq(councilData.sourceUrl, newItem.sourceUrl))
        .limit(3);
      
      sameUrl.forEach(item => {
        if (!similarItems.find(s => s.id === item.id)) {
          similarItems.push({
            id: item.id,
            title: item.title,
            similarity: 0.95,
            url: item.sourceUrl || '',
            reason: 'same_url'
          });
        }
      });
    }
    
    // Strategy 3: Similar title (fuzzy matching)
    if (strictMode) {
      const titleWords = newItem.title.toLowerCase().split(' ').filter(w => w.length > 3);
      if (titleWords.length > 0) {
        const titlePattern = titleWords.join('|');
        const similarTitles = await db.select().from(councilData)
          .where(sql`${councilData.title} ~* ${titlePattern}`)
          .limit(5);
        
        similarTitles.forEach(item => {
          if (!similarItems.find(s => s.id === item.id)) {
            const similarity = this.calculateTitleSimilarity(newItem.title, item.title);
            if (similarity > 0.7) {
              similarItems.push({
                id: item.id,
                title: item.title,
                similarity,
                url: item.sourceUrl || '',
                reason: 'similar_title'
              });
            }
          }
        });
      }
    }
    
    // Generate recommendations
    if (similarItems.length > 0) {
      recommendations.push(`Found ${similarItems.length} potentially duplicate items`);
      
      const exactMatches = similarItems.filter(s => s.similarity >= 0.95).length;
      if (exactMatches > 0) {
        recommendations.push(`${exactMatches} exact or near-exact matches found - consider skipping`);
      }
      
      const similarMatches = similarItems.filter(s => s.similarity >= 0.7 && s.similarity < 0.95).length;
      if (similarMatches > 0) {
        recommendations.push(`${similarMatches} similar items found - review for potential duplicates`);
      }
    } else {
      recommendations.push('No duplicates detected - safe to proceed');
    }
    
    return {
      isDuplicate: similarItems.length > 0 && similarItems[0].similarity >= 0.9,
      similarItems: similarItems.sort((a, b) => b.similarity - a.similarity),
      recommendations
    };
  }
  
  /**
   * Generate comprehensive data quality report
   */
  async generateQualityReport(itemId: string): Promise<DataQualityReport> {
    const [item] = await db.select().from(councilData).where(eq(councilData.id, itemId));
    
    if (!item) {
      throw new Error('Item not found');
    }
    
    const issues: DataQualityReport['issues'] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];
    
    let completenessScore = 0;
    let accuracyScore = 80; // Default assumption
    let freshnessScore = 0;
    let consistencyScore = 0;
    
    // Completeness checks
    const requiredFields = [
      { field: 'title', weight: 20 },
      { field: 'description', weight: 15 },
      { field: 'dataType', weight: 20 },
      { field: 'sourceUrl', weight: 10 },
      { field: 'date', weight: 15 },
      { field: 'location', weight: 10, optional: true },
      { field: 'metadata', weight: 10 }
    ];
    
    requiredFields.forEach(({ field, weight, optional }) => {
      const value = item[field as keyof typeof item];
      if (value && (typeof value !== 'string' || value.trim().length > 0)) {
        completenessScore += weight;
        strengths.push(`${field} is properly filled`);
      } else if (!optional) {
        issues.push({
          field,
          issue: `Missing required field: ${field}`,
          severity: 'high',
          suggestion: `Please provide a value for ${field}`
        });
        improvements.push(`Add ${field} information`);
      }
    });
    
    // Content quality checks
    if (item.description) {
      if (item.description.length < 20) {
        issues.push({
          field: 'description',
          issue: 'Description is very short',
          severity: 'medium',
          suggestion: 'Consider adding more detailed description'
        });
      } else if (item.description.length > 1000) {
        strengths.push('Rich, detailed description provided');
      }
    }
    
    // URL validation
    if (item.sourceUrl) {
      try {
        new URL(item.sourceUrl);
        strengths.push('Valid source URL provided');
      } catch {
        issues.push({
          field: 'sourceUrl',
          issue: 'Invalid URL format',
          severity: 'medium',
          suggestion: 'Ensure URL is properly formatted'
        });
        accuracyScore -= 10;
      }
    }
    
    // Freshness calculation
    const now = new Date();
    const itemAge = now.getTime() - new Date(item.createdAt).getTime();
    const daysSinceCreation = itemAge / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation <= 7) {
      freshnessScore = 100;
      strengths.push('Very recent data');
    } else if (daysSinceCreation <= 30) {
      freshnessScore = 80;
      strengths.push('Recent data');
    } else if (daysSinceCreation <= 90) {
      freshnessScore = 60;
    } else if (daysSinceCreation <= 365) {
      freshnessScore = 40;
      improvements.push('Data is aging - consider updating');
    } else {
      freshnessScore = 20;
      issues.push({
        field: 'date',
        issue: 'Data is over a year old',
        severity: 'medium',
        suggestion: 'Verify if data is still current'
      });
    }
    
    // Consistency checks (compare with similar items)
    const similarItems = await db.select().from(councilData)
      .where(and(
        eq(councilData.dataType, item.dataType),
        sql`${councilData.id} != ${item.id}`
      ))
      .limit(10);
    
    if (similarItems.length > 0) {
      // Check if metadata structure is consistent
      const hasMetadata = !!item.metadata && Object.keys(item.metadata as any).length > 0;
      const similarWithMetadata = similarItems.filter(s => 
        !!s.metadata && Object.keys(s.metadata as any).length > 0
      );
      
      if (hasMetadata && similarWithMetadata.length > 0) {
        consistencyScore = 80;
        strengths.push('Consistent metadata structure with similar items');
      } else if (!hasMetadata && similarWithMetadata.length === 0) {
        consistencyScore = 60;
      } else {
        consistencyScore = 40;
        improvements.push('Metadata structure differs from similar items');
      }
    } else {
      consistencyScore = 70; // Neutral when no similar items
    }
    
    // Calculate overall score
    const overallScore = Math.round(
      (completenessScore * 0.3 + 
       accuracyScore * 0.25 + 
       freshnessScore * 0.25 + 
       consistencyScore * 0.2)
    );
    
    // Additional suggestions based on score
    if (overallScore < 60) {
      improvements.push('Overall data quality needs significant improvement');
    } else if (overallScore < 80) {
      improvements.push('Data quality is good but can be enhanced');
    } else {
      strengths.push('High-quality data record');
    }
    
    return {
      id: itemId,
      overallScore,
      completeness: Math.round(completenessScore),
      accuracy: accuracyScore,
      freshness: freshnessScore,
      consistency: consistencyScore,
      issues,
      strengths,
      improvements
    };
  }
  
  /**
   * Get comprehensive analytics and statistics
   */
  async getAnalytics(timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<{
    overview: {
      totalRecords: number;
      newRecords: number;
      qualityScore: number;
      completenessRate: number;
    };
    categoryBreakdown: Array<{ category: string; count: number; percentage: number }>;
    trendData: Array<{ period: string; count: number; cumulativeCount: number }>;
    qualityDistribution: Array<{ quality: string; count: number }>;
    topWards: Array<{ ward: string; count: number }>;
    recentActivity: Array<{ date: string; count: number; type: string }>;
  }> {
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
    }
    
    // Overview statistics
    const [totalRecords] = await db.select({ count: count() }).from(councilData);
    const [newRecords] = await db.select({ count: count() }).from(councilData)
      .where(gte(councilData.createdAt, startDate));
    
    // Category breakdown
    const categoryBreakdown = await db.select({
      category: councilData.dataType,
      count: count()
    }).from(councilData)
    .groupBy(councilData.dataType)
    .orderBy(desc(count()));
    
    const totalForPercentage = categoryBreakdown.reduce((sum, cat) => sum + cat.count, 0);
    const categoryWithPercentage = categoryBreakdown.map(cat => ({
      category: cat.category,
      count: cat.count,
      percentage: Math.round((cat.count / totalForPercentage) * 100)
    }));
    
    // Trend data
    const trendData = await db.select({
      period: sql<string>`TO_CHAR(${councilData.createdAt}, 'YYYY-MM-DD')`,
      count: count()
    }).from(councilData)
    .where(gte(councilData.createdAt, startDate))
    .groupBy(sql`TO_CHAR(${councilData.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${councilData.createdAt}, 'YYYY-MM-DD')`);
    
    // Add cumulative counts
    let cumulative = 0;
    const trendWithCumulative = trendData.map(item => {
      cumulative += item.count;
      return {
        period: item.period,
        count: item.count,
        cumulativeCount: cumulative
      };
    });
    
    // Ward statistics
    const topWards = await db.select({
      ward: councilData.location,
      count: count()
    }).from(councilData)
    .where(isNotNull(councilData.location))
    .groupBy(councilData.location)
    .orderBy(desc(count()))
    .limit(10);
    
    // Recent activity (placeholder)
    const recentActivity = await db.select({
      date: sql<string>`DATE(${councilData.createdAt})`,
      count: count(),
      type: councilData.dataType
    }).from(councilData)
    .where(gte(councilData.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
    .groupBy(sql`DATE(${councilData.createdAt})`, councilData.dataType)
    .orderBy(sql`DATE(${councilData.createdAt}) DESC`)
    .limit(20);
    
    return {
      overview: {
        totalRecords: totalRecords.count,
        newRecords: newRecords.count,
        qualityScore: 75, // Placeholder - would calculate from quality reports
        completenessRate: 82 // Placeholder - would calculate from completeness checks
      },
      categoryBreakdown: categoryWithPercentage,
      trendData: trendWithCumulative,
      qualityDistribution: [
        { quality: 'High', count: Math.round(totalRecords.count * 0.3) },
        { quality: 'Medium', count: Math.round(totalRecords.count * 0.5) },
        { quality: 'Low', count: Math.round(totalRecords.count * 0.2) }
      ],
      topWards: topWards.map(w => ({ ward: w.ward || 'Unknown', count: w.count })),
      recentActivity: recentActivity.map(a => ({
        date: a.date,
        count: a.count,
        type: a.type
      }))
    };
  }
  
  // Utility methods
  private generateContentHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }
  
  private calculateTitleSimilarity(title1: string, title2: string): number {
    // Simple similarity calculation - could be enhanced with more sophisticated algorithms
    const words1 = title1.toLowerCase().split(' ');
    const words2 = title2.toLowerCase().split(' ');
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }
}

export const enhancedStorage = new EnhancedBoltonStorage();
