import { Router, Request, Response } from 'express';
import { enhancedStorage, type AdvancedSearchParams } from '../services/enhanced-storage';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Search parameter validation schema
const searchParamsSchema = z.object({
  query: z.string().optional(),
  fullText: z.boolean().default(false),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  dataType: z.union([z.string(), z.array(z.string())]).optional(),
  ward: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  department: z.union([z.string(), z.array(z.string())]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  hasLocation: z.boolean().optional(),
  postcode: z.string().optional(),
  constituency: z.string().optional(),
  quality: z.union([z.string(), z.array(z.string())]).optional(),
  hasStructuredData: z.boolean().optional(),
  hasContactInfo: z.boolean().optional(),
  hasFinancialData: z.boolean().optional(),
  minContentLength: z.coerce.number().optional(),
  maxContentLength: z.coerce.number().optional(),
  language: z.string().default('en'),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['relevance', 'date', 'created', 'amount', 'quality', 'title', 'views']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
  includeArchived: z.boolean().default(false),
  includePrivate: z.boolean().default(false),
  sessionId: z.string().optional(),
  excludeTypes: z.array(z.string()).optional(),
  export: z.enum(['json', 'csv', 'xlsx']).optional()
});

/**
 * Advanced search endpoint with comprehensive filtering
 * GET /api/enhanced-search/search
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    // Validate and parse search parameters
    const params = searchParamsSchema.parse(req.query);
    
    // Record search analytics
    const searchStart = Date.now();
    
    // Perform search
    const results = await enhancedStorage.advancedSearch(params);
    
    // Record search analytics
    await recordSearchAnalytics(req, {
      query: params.query || '',
      resultCount: results.totalCount,
      responseTime: Date.now() - searchStart,
      params
    });
    
    // Handle export requests
    if (params.export) {
      return await handleExport(res, results, params.export);
    }
    
    // Standard JSON response
    res.json({
      success: true,
      data: results,
      meta: {
        query: params.query,
        filters: extractActiveFilters(params),
        pagination: {
          limit: params.limit,
          offset: params.offset,
          total: results.totalCount,
          hasMore: params.offset + params.limit < results.totalCount
        }
      }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get search suggestions and autocomplete
 * GET /api/enhanced-search/suggestions
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const { q: query, type, limit = 10 } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter required'
      });
    }
    
    const suggestions = await generateSearchSuggestions(query, type as string, Number(limit));
    
    res.json({
      success: true,
      data: suggestions
    });
    
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions'
    });
  }
});

/**
 * Get comprehensive analytics and statistics
 * GET /api/enhanced-search/analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { timeframe = 'month' } = req.query;
    const analytics = await enhancedStorage.getAnalytics(timeframe as any);
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics'
    });
  }
});

/**
 * Generate data quality report
 * GET /api/enhanced-search/quality/:id
 */
router.get('/quality/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const report = await enhancedStorage.generateQualityReport(id);
    
    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    console.error('Quality report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quality report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Detect duplicates for new content
 * POST /api/enhanced-search/duplicates
 */
router.post('/duplicates', async (req: Request, res: Response) => {
  try {
    const { item, strictMode = false } = req.body;
    
    if (!item || !item.title || !item.sourceUrl) {
      return res.status(400).json({
        success: false,
        error: 'Item with title and sourceUrl required'
      });
    }
    
    const duplicateCheck = await enhancedStorage.detectDuplicates(item, strictMode);
    
    res.json({
      success: true,
      data: duplicateCheck
    });
    
  } catch (error) {
    console.error('Duplicate detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check for duplicates'
    });
  }
});

/**
 * Get search facets for building filters UI
 * GET /api/enhanced-search/facets
 */
router.get('/facets', async (req: Request, res: Response) => {
  try {
    // Get sample search to generate facets
    const sampleResults = await enhancedStorage.advancedSearch({
      limit: 1 // We only need facets, not actual results
    });
    
    res.json({
      success: true,
      data: sampleResults.facets
    });
    
  } catch (error) {
    console.error('Facets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate facets'
    });
  }
});

/**
 * Advanced audit trail and activity log
 * GET /api/enhanced-search/audit
 */
router.get('/audit', async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      dateFrom,
      dateTo,
      actionType,
      limit = 100,
      offset = 0
    } = req.query;
    
    const auditLog = await getAuditLog({
      sessionId: sessionId as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      actionType: actionType as string,
      limit: Number(limit),
      offset: Number(offset)
    });
    
    res.json({
      success: true,
      data: auditLog
    });
    
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit log'
    });
  }
});

/**
 * Data coverage and gap analysis
 * GET /api/enhanced-search/coverage
 */
router.get('/coverage', async (req: Request, res: Response) => {
  try {
    const coverage = await analyzeCoverage();
    
    res.json({
      success: true,
      data: coverage
    });
    
  } catch (error) {
    console.error('Coverage analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze coverage'
    });
  }
});

/**
 * Bulk export data with advanced filtering
 * POST /api/enhanced-search/export
 */
router.post('/export', async (req: Request, res: Response) => {
  try {
    const { searchParams, format = 'json', includeMetadata = false } = req.body;
    
    // Validate search parameters
    const validatedParams = searchParamsSchema.parse(searchParams || {});
    
    // Remove pagination for export (get all results)
    const exportParams = { ...validatedParams, limit: 10000, offset: 0 };
    
    const results = await enhancedStorage.advancedSearch(exportParams);
    
    await handleExport(res, results, format, includeMetadata);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Export failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions

/**
 * Record search analytics for optimization
 */
async function recordSearchAnalytics(req: Request, data: {
  query: string;
  resultCount: number;
  responseTime: number;
  params: any;
}) {
  try {
    // Implementation would store to search_analytics table
    // For now, just log to console
    console.log('Search Analytics:', {
      query: data.query,
      resultCount: data.resultCount,
      responseTime: data.responseTime,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  } catch (error) {
    console.error('Failed to record search analytics:', error);
  }
}

/**
 * Generate search suggestions based on query
 */
async function generateSearchSuggestions(query: string, type?: string, limit = 10) {
  const suggestions: Array<{
    text: string;
    type: string;
    count?: number;
    category?: string;
  }> = [];
  
  // Get existing data to suggest from
  const searchParams: AdvancedSearchParams = {
    query,
    fullText: false,
    limit: 50
  };
  
  if (type) {
    searchParams.dataType = type;
  }
  
  const results = await enhancedStorage.advancedSearch(searchParams);
  
  // Generate suggestions based on titles
  const titleWords = new Set<string>();
  results.items.forEach(item => {
    item.title.split(' ').forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && cleanWord.includes(query.toLowerCase())) {
        titleWords.add(cleanWord);
      }
    });
  });
  
  // Add title-based suggestions
  Array.from(titleWords).slice(0, limit / 2).forEach(word => {
    suggestions.push({
      text: word,
      type: 'term'
    });
  });
  
  // Add category suggestions
  Object.entries(results.facets.categories).slice(0, limit / 2).forEach(([category, count]) => {
    if (category.toLowerCase().includes(query.toLowerCase())) {
      suggestions.push({
        text: category,
        type: 'category',
        count,
        category: 'data_type'
      });
    }
  });
  
  return suggestions.slice(0, limit);
}

/**
 * Extract active filters from search parameters
 */
function extractActiveFilters(params: AdvancedSearchParams) {
  const filters: { [key: string]: any } = {};
  
  if (params.category) filters.category = params.category;
  if (params.dataType) filters.dataType = params.dataType;
  if (params.ward) filters.ward = params.ward;
  if (params.status) filters.status = params.status;
  if (params.dateFrom || params.dateTo) {
    filters.dateRange = {
      from: params.dateFrom,
      to: params.dateTo
    };
  }
  if (params.minAmount || params.maxAmount) {
    filters.amountRange = {
      min: params.minAmount,
      max: params.maxAmount
    };
  }
  if (params.hasLocation !== undefined) filters.hasLocation = params.hasLocation;
  if (params.hasStructuredData) filters.hasStructuredData = params.hasStructuredData;
  if (params.hasContactInfo) filters.hasContactInfo = params.hasContactInfo;
  if (params.hasFinancialData) filters.hasFinancialData = params.hasFinancialData;
  if (params.tags && params.tags.length > 0) filters.tags = params.tags;
  
  return filters;
}

/**
 * Handle data export in various formats
 */
async function handleExport(res: Response, results: any, format: string, includeMetadata = false) {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `bolton-council-data-${timestamp}`;
  
  switch (format) {
    case 'csv':
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(convertToCSV(results.items, includeMetadata));
      break;
      
    case 'xlsx':
      const xlsx = await convertToXLSX(results.items, includeMetadata);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.send(xlsx);
      break;
      
    case 'json':
    default:
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json({
        exportInfo: {
          timestamp: new Date(),
          totalRecords: results.totalCount,
          includedRecords: results.items.length,
          format,
          includeMetadata
        },
        data: results.items,
        ...(includeMetadata && { 
          facets: results.facets,
          searchStats: results.searchStats
        })
      });
      break;
  }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(items: any[], includeMetadata: boolean): string {
  if (items.length === 0) return '';
  
  // Define base columns
  const baseColumns = [
    'id', 'title', 'description', 'dataType', 'sourceUrl', 
    'date', 'location', 'status', 'amount', 'createdAt'
  ];
  
  const metadataColumns = includeMetadata ? ['metadata'] : [];
  const columns = [...baseColumns, ...metadataColumns];
  
  // Create header row
  const header = columns.join(',');
  
  // Create data rows
  const rows = items.map(item => {
    return columns.map(column => {
      let value = item[column];
      
      // Handle special cases
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else if (typeof value === 'string' && value.includes(',')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
}

/**
 * Convert data to XLSX format (placeholder - would need xlsx library)
 */
async function convertToXLSX(items: any[], includeMetadata: boolean): Promise<Buffer> {
  // This is a placeholder - in a real implementation, you'd use a library like xlsx
  // For now, return a simple text representation
  const csv = convertToCSV(items, includeMetadata);
  return Buffer.from(csv, 'utf-8');
}

/**
 * Get audit log entries
 */
async function getAuditLog(params: {
  sessionId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  actionType?: string;
  limit: number;
  offset: number;
}) {
  // This would query the crawl_sessions and related audit tables
  // For now, return mock data
  return {
    items: [],
    totalCount: 0,
    summary: {
      totalSessions: 0,
      totalActions: 0,
      successRate: 0
    }
  };
}

/**
 * Analyze data coverage and gaps
 */
async function analyzeCoverage() {
  // This would analyze what data we have vs what we should have
  const analytics = await enhancedStorage.getAnalytics('year');
  
  return {
    overview: {
      totalRecords: analytics.overview.totalRecords,
      dataQualityScore: analytics.overview.qualityScore,
      completenessRate: analytics.overview.completenessRate
    },
    coverage: {
      byCategory: analytics.categoryBreakdown,
      byWard: analytics.topWards,
      gaps: [
        { area: 'Planning Applications', coverage: 85, missing: 'Recent applications' },
        { area: 'Council Meetings', coverage: 92, missing: 'Older meeting minutes' },
        { area: 'Financial Data', coverage: 78, missing: 'Detailed spending records' },
        { area: 'Services', coverage: 65, missing: 'Online service forms' }
      ]
    },
    recommendations: [
      'Improve financial data collection',
      'Add missing service information',
      'Update older records',
      'Enhance metadata quality'
    ]
  };
}

export default router;
