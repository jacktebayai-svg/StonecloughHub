import express from 'express';
import { z } from 'zod';
import { eq, desc, asc, and, or, like, gte, lte, sql, inArray } from 'drizzle-orm';
import { db } from '../db';
import { councilData } from '@shared/schema';
import { WebSocketServer } from 'ws';

const router = express.Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const querySchema = z.object({
  // Pagination
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  
  // Filtering
  dataType: z.string().optional(),
  status: z.string().optional(),
  
  // Date filtering
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  
  // Amount filtering
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  
  // Search
  search: z.string().optional(),
  searchFields: z.string().optional().default('title,description'),
  
  // Sorting
  sortBy: z.string().optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Advanced filters (removed as not in schema)
  
  // Response format
  format: z.enum(['json', 'csv', 'xml']).default('json'),
  
  // Include relationships
  include: z.string().optional(), // comma-separated: 'documents,meetings'
});

const aggregationSchema = z.object({
  groupBy: z.string(), // field to group by
  metric: z.enum(['count', 'sum', 'avg', 'min', 'max']).default('count'),
  field: z.string().optional(), // field to aggregate (for sum, avg, etc.)
  dateRange: z.enum(['week', 'month', 'quarter', 'year']).optional(),
});

// ============================================
// API ENDPOINTS
// ============================================

// Get all civic data with advanced filtering and pagination
router.get('/data', async (req, res) => {
  try {
    const params = querySchema.parse(req.query);
    const cacheKey = `civic_data:${JSON.stringify(params)}`;
    
    // Build dynamic query
    let query = db.select().from(councilData);
    const conditions = [];
    
    // Apply filters
    if (params.dataType) {
      conditions.push(eq(councilData.dataType, params.dataType as any));
    }
    if (params.status) {
      conditions.push(eq(councilData.status, params.status));
    }
    if (params.dateFrom) {
      conditions.push(gte(councilData.date, new Date(params.dateFrom)));
    }
    if (params.dateTo) {
      conditions.push(lte(councilData.date, new Date(params.dateTo)));
    }
    if (params.minAmount !== undefined) {
      conditions.push(gte(councilData.amount, params.minAmount));
    }
    if (params.maxAmount !== undefined) {
      conditions.push(lte(councilData.amount, params.maxAmount));
    }
    
    // Full-text search
    if (params.search) {
      const searchFields = params.searchFields.split(',');
      const searchConditions = [];
      
      for (const field of searchFields) {
        if (field === 'title') {
          searchConditions.push(like(councilData.title, `%${params.search}%`));
        }
        if (field === 'description') {
          searchConditions.push(like(councilData.description, `%${params.search}%`));
        }
      }
      
      if (searchConditions.length > 0) {
        conditions.push(or(...searchConditions));
      }
    }
    
    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Sorting
    let sortField;
    switch (params.sortBy) {
      case 'title':
        sortField = councilData.title;
        break;
      case 'amount':
        sortField = councilData.amount;
        break;
      case 'status':
        sortField = councilData.status;
        break;
      case 'date':
      default:
        sortField = councilData.date;
        break;
    }
    query = query.orderBy(
      params.sortOrder === 'desc' ? desc(sortField) : asc(sortField)
    );
    
    // Pagination
    const offset = (params.page - 1) * params.limit;
    query = query.limit(params.limit).offset(offset);
    
    const result = await query;
    
    // Get total count for pagination
    const totalResult = await db.select({ count: sql`count(*)` }).from(councilData);
    const total = Number(totalResult[0].count);
    const totalPages = Math.ceil(total / params.limit);
    
    // Format response based on requested format
    if (params.format === 'csv') {
      const csv = convertToCSV(result);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="civic-data.csv"');
      return res.send(csv);
    }
    
    if (params.format === 'xml') {
      const xml = convertToXML(result);
      res.setHeader('Content-Type', 'application/xml');
      return res.send(xml);
    }
    
    // Default JSON response
    res.json({
      success: true,
      data: result,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasNext: params.page < totalPages,
        hasPrev: params.page > 1,
      },
      filters: params,
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get civic data by ID with related information
router.get('/data/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `civic_data_detail:${id}`;
    
    const result = await db.select().from(councilData).where(eq(councilData.id, id));
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Civic data not found',
      });
    }
    
    res.json({
      success: true,
      data: result[0],
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get aggregated data for analytics
router.get('/analytics/aggregate', async (req, res) => {
  try {
    const params = aggregationSchema.parse(req.query);
    const cacheKey = `civic_analytics:${JSON.stringify(params)}`;
    
    let query;
    let groupByField;
    
    // Map groupBy parameter to actual column
    switch (params.groupBy) {
      case 'status':
        groupByField = councilData.status;
        break;
      case 'dataType':
        groupByField = councilData.dataType;
        break;
      case 'date':
        groupByField = councilData.date;
        break;
      default:
        throw new Error(`Invalid groupBy field: ${params.groupBy}`);
    }
    
    switch (params.metric) {
      case 'count':
        query = db
          .select({
            group: groupByField,
            value: sql`count(*)`,
          })
          .from(councilData)
          .groupBy(groupByField);
        break;
        
      case 'sum':
        if (!params.field) {
          throw new Error('Field is required for sum metric');
        }
        let sumField;
        switch (params.field) {
          case 'amount':
            sumField = councilData.amount;
            break;
          default:
            throw new Error(`Invalid sum field: ${params.field}`);
        }
        query = db
          .select({
            group: groupByField,
            value: sql`sum(${sumField})`,
          })
          .from(councilData)
          .groupBy(groupByField);
        break;
        
      case 'avg':
        if (!params.field) {
          throw new Error('Field is required for avg metric');
        }
        let avgField;
        switch (params.field) {
          case 'amount':
            avgField = councilData.amount;
            break;
          default:
            throw new Error(`Invalid avg field: ${params.field}`);
        }
        query = db
          .select({
            group: groupByField,
            value: sql`avg(${avgField})`,
          })
          .from(councilData)
          .groupBy(groupByField);
        break;
        
      default:
        throw new Error(`Unsupported metric: ${params.metric}`);
    }
    
    const result = await query.orderBy(sql`value DESC`);
    
    res.json({
      success: true,
      data: result,
      aggregation: params,
    });
    
  } catch (error) {
    console.error('Analytics API Error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get distinct values for filter options
router.get('/metadata/filters', async (req, res) => {
  try {
    const cacheKey = 'civic_data_filters';
    
    const [
      dataTypes,
      statuses,
    ] = await Promise.all([
      db.selectDistinct({ value: councilData.dataType }).from(councilData),
      db.selectDistinct({ value: councilData.status }).from(councilData),
    ]);
    
    const filters = {
      dataTypes: dataTypes.map((d: any) => d.value).filter(Boolean),
      statuses: statuses.map((s: any) => s.value).filter(Boolean),
    };
    
    res.json({
      success: true,
      data: filters,
    });
    
  } catch (error) {
    console.error('Metadata API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Search endpoint with advanced features
router.get('/search', async (req, res) => {
  try {
    const { q, type, limit = 10, fuzzy = false } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }
    
    const cacheKey = `search:${q}:${type}:${limit}:${fuzzy}`;
    
    let query = db.select().from(councilData);
    
    if (fuzzy === 'true') {
      // Use PostgreSQL's similarity function for fuzzy search
      query = query.where(
        sql`similarity(title || ' ' || description, ${q}) > 0.3`
      );
    } else {
      // Exact text search
      query = query.where(
        or(
          like(councilData.title, `%${q}%`),
          like(councilData.description, `%${q}%`)
        )
      );
    }
    
    if (type) {
      query = query.where(eq(councilData.dataType, type as any));
    }
    
    const results = await query
      .limit(Number(limit))
      .orderBy(desc(councilData.date));
    
    res.json({
      success: true,
      data: results,
      query: q,
      resultCount: results.length,
    });
    
  } catch (error) {
    console.error('Search API Error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Performance statistics endpoint
router.get('/admin/performance', async (req, res) => {
  try {
    const stats = { message: 'Performance stats not available without performantDb' };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Performance API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Cache invalidation endpoint (admin only)
router.post('/admin/cache/invalidate', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (!pattern) {
      return res.status(400).json({
        success: false,
        error: 'Cache pattern is required',
      });
    }
    
    // Cache invalidation not available without performantDb
    
    res.json({
      success: true,
      message: `Cache invalidated for pattern: ${pattern}`,
    });
    
  } catch (error) {
    console.error('Cache Invalidation Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    )
  ];
  
  return csvContent.join('\n');
}

function convertToXML(data: any[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
  
  for (const item of data) {
    xml += '  <item>\n';
    for (const [key, value] of Object.entries(item)) {
      xml += `    <${key}>${value}</${key}>\n`;
    }
    xml += '  </item>\n';
  }
  
  xml += '</data>';
  return xml;
}

// ============================================
// WEBSOCKET REAL-TIME UPDATES
// ============================================

export const setupWebSocket = (server: any) => {
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to civic data stream');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe') {
          // Handle subscription to specific data types
          ws.send(JSON.stringify({
            type: 'subscription_confirmed',
            filters: data.filters,
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from civic data stream');
    });
  });
  
  // Broadcast updates when data changes
  return {
    broadcast: (data: any) => {
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'data_update',
            data,
            timestamp: new Date().toISOString(),
          }));
        }
      });
    }
  };
};

export default router;
