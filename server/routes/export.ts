import { Router } from "express";
import { isAuthenticated, isAdmin } from "../auth";
import { storage } from "../storage";
import { z } from "zod";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs/promises";

const router = Router();

// Export validation schema
const exportRequestSchema = z.object({
  format: z.enum(['csv', 'json']),
  type: z.enum(['businesses', 'users', 'discussions', 'articles', 'surveys', 'council_data']),
  filters: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
  }).optional(),
  limit: z.number().min(1).max(10000).optional(),
});

// Public API endpoints (no authentication required)
router.get('/api/v1/council-data', async (req, res) => {
  try {
    const { type, limit = 100, offset = 0, format = 'json' } = req.query;

    const data = await storage.getCouncilData(
      type as string,
      Math.min(parseInt(limit as string) || 100, 1000) // Max 1000 items per request
    );

    if (format === 'csv') {
      const csvData = await convertToCSV(data, 'council_data');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="council-data.csv"`);
      return res.send(csvData);
    }

    res.json({
      data,
      meta: {
        total: data.length,
        limit: parseInt(limit as string) || 100,
        offset: parseInt(offset as string) || 0,
        format,
      },
      links: {
        self: `/api/export/api/v1/council-data?${new URLSearchParams(req.query as any)}`,
        csv: `/api/export/api/v1/council-data?${new URLSearchParams({ ...req.query as any, format: 'csv' })}`,
      },
    });

  } catch (error) {
    console.error('Council data API error:', error);
    res.status(500).json({ error: 'Failed to fetch council data' });
  }
});

router.get('/api/v1/businesses', async (req, res) => {
  try {
    const { category, limit = 100, verified_only = 'true', format = 'json' } = req.query;

    let businesses = await storage.getBusinesses(
      category as string,
      Math.min(parseInt(limit as string) || 100, 1000)
    );

    // Filter to verified only for public API
    if (verified_only === 'true') {
      businesses = businesses.filter(b => b.isVerified);
    }

    // Remove sensitive fields for public API
    const publicBusinesses = businesses.map(business => ({
      id: business.id,
      name: business.name,
      description: business.description,
      category: business.category,
      address: business.address,
      phone: business.phone,
      email: business.email,
      website: business.website,
      imageUrl: business.imageUrl,
      isVerified: business.isVerified,
      isPremium: business.isPremium,
      createdAt: business.createdAt,
    }));

    if (format === 'csv') {
      const csvData = await convertToCSV(publicBusinesses, 'businesses');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="businesses.csv"`);
      return res.send(csvData);
    }

    res.json({
      data: publicBusinesses,
      meta: {
        total: publicBusinesses.length,
        limit: parseInt(limit as string) || 100,
        format,
      },
      links: {
        self: `/api/export/api/v1/businesses?${new URLSearchParams(req.query as any)}`,
        csv: `/api/export/api/v1/businesses?${new URLSearchParams({ ...req.query as any, format: 'csv' })}`,
      },
    });

  } catch (error) {
    console.error('Businesses API error:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// Stats endpoint for public consumption
router.get('/api/v1/stats', async (req, res) => {
  try {
    const stats = await storage.getCouncilDataStats();
    
    // Add community stats
    const [businessCount, discussionCount, articleCount] = await Promise.all([
      storage.getBusinesses().then(b => b.filter(business => business.isVerified).length),
      storage.getForumDiscussions().then(d => d.length),
      storage.getBlogArticles().then(a => a.length),
    ]);

    const communityStats = {
      council: stats,
      community: {
        verifiedBusinesses: businessCount,
        forumDiscussions: discussionCount,
        blogArticles: articleCount,
      },
      lastUpdated: new Date().toISOString(),
    };

    res.json(communityStats);

  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Admin-only export endpoints
router.post('/admin/export', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { format, type, filters = {}, limit = 1000 } = exportRequestSchema.parse(req.body);

    let data: any[] = [];
    let filename = '';

    // Fetch data based on type
    switch (type) {
      case 'businesses':
        data = await storage.getBusinesses(filters.category, limit);
        filename = `businesses-export-${Date.now()}`;
        break;
      
      case 'discussions':
        data = await storage.getForumDiscussions(filters.category, limit);
        filename = `discussions-export-${Date.now()}`;
        break;
      
      case 'articles':
        data = await storage.getBlogArticles(limit);
        filename = `articles-export-${Date.now()}`;
        break;
      
      case 'surveys':
        data = await storage.getSurveys(filters.status);
        filename = `surveys-export-${Date.now()}`;
        break;
      
      case 'council_data':
        data = await storage.getCouncilData(filters.category, limit);
        filename = `council-data-export-${Date.now()}`;
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    // Apply date filters if provided
    if (filters.dateFrom || filters.dateTo) {
      data = data.filter(item => {
        const itemDate = new Date(item.createdAt || item.date);
        if (filters.dateFrom && itemDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && itemDate > new Date(filters.dateTo)) return false;
        return true;
      });
    }

    if (format === 'csv') {
      const csvData = await convertToCSV(data, type);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.json({
        exportInfo: {
          type,
          format,
          timestamp: new Date().toISOString(),
          totalRecords: data.length,
          filters,
        },
        data,
      });
    }

  } catch (error) {
    console.error('Admin export error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid export request', details: error.errors });
    }
    res.status(500).json({ error: 'Export failed' });
  }
});

// Batch export endpoint for multiple data types
router.post('/admin/batch-export', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { types, format = 'json', filters = {} } = req.body;

    if (!Array.isArray(types) || types.length === 0) {
      return res.status(400).json({ error: 'Types array is required' });
    }

    const results: any = {};
    
    for (const type of types) {
      try {
        let data: any[] = [];
        
        switch (type) {
          case 'businesses':
            data = await storage.getBusinesses();
            break;
          case 'discussions':
            data = await storage.getForumDiscussions();
            break;
          case 'articles':
            data = await storage.getBlogArticles();
            break;
          case 'surveys':
            data = await storage.getSurveys();
            break;
          case 'council_data':
            data = await storage.getCouncilData();
            break;
        }
        
        results[type] = {
          count: data.length,
          data: data,
        };
      } catch (typeError) {
        results[type] = {
          error: typeError instanceof Error ? typeError.message : 'Unknown error',
        };
      }
    }

    const filename = `batch-export-${Date.now()}`;
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.json({
        exportInfo: {
          types,
          format,
          timestamp: new Date().toISOString(),
          filters,
        },
        results,
      });
    }

    res.status(400).json({ error: 'CSV format not supported for batch exports' });

  } catch (error) {
    console.error('Batch export error:', error);
    res.status(500).json({ error: 'Batch export failed' });
  }
});

// Individual record export
router.get('/admin/:type/:id/export', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { format = 'json' } = req.query;

    let data: any = null;
    let filename = '';

    switch (type) {
      case 'business':
        data = await storage.getBusiness(id);
        filename = `business-${id}`;
        break;
      case 'discussion':
        data = await storage.getForumDiscussion(id);
        // Include replies
        if (data) {
          const replies = await storage.getForumReplies(id);
          data.replies = replies;
        }
        filename = `discussion-${id}`;
        break;
      case 'article':
        data = await storage.getBlogArticle(id);
        filename = `article-${id}`;
        break;
      case 'survey':
        data = await storage.getSurvey(id);
        // Include results
        if (data) {
          const results = await storage.getSurveyResults(id);
          data.results = results;
        }
        filename = `survey-${id}`;
        break;
    }

    if (!data) {
      return res.status(404).json({ error: 'Record not found' });
    }

    if (format === 'csv') {
      const csvData = await convertToCSV([data], type);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csvData);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    return res.json(data);

  } catch (error) {
    console.error('Individual export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Data backup endpoint
router.post('/admin/backup', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { includeUploads = false } = req.body;
    
    // Get all data
    const [businesses, discussions, articles, surveys, councilData, users] = await Promise.all([
      storage.getBusinesses(),
      storage.getForumDiscussions(),
      storage.getBlogArticles(),
      storage.getSurveys(),
      storage.getCouncilData(),
      // Note: Be careful with user data - consider privacy implications
    ]);

    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        includeUploads,
      },
      data: {
        businesses,
        discussions,
        articles,
        surveys,
        councilData,
        // users: users, // Uncomment if user backup is needed
      },
    };

    const filename = `stoneclough-hub-backup-${Date.now()}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.json(backupData);

  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Backup failed' });
  }
});

// Helper function to convert data to CSV
async function convertToCSV(data: any[], type: string): Promise<string> {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create header row
  let csv = headers.join(',') + '\n';
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      
      // Handle JSON objects/arrays
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      // Handle strings with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return String(value);
    });
    
    csv += values.join(',') + '\n';
  }

  return csv;
}

export default router;
