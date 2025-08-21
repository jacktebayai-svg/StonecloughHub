import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { civicAPI } from '../lib/civic-api.js';
import { promises as fs } from 'fs';
import path from 'path';

const router = Router();

// In-memory cache for processed civic data
let civicDataCache: any = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load processed civic data
async function loadCivicData() {
  const now = Date.now();
  
  if (civicDataCache && (now - lastCacheUpdate) < CACHE_DURATION) {
    return civicDataCache;
  }
  
  try {
    const dataPath = path.join(process.cwd(), 'processed-civic-data');
    
    const data = {
      councillors: await loadDataFile(path.join(dataPath, 'councillors.json')),
      meetings: await loadDataFile(path.join(dataPath, 'meetings.json')),
      services: await loadDataFile(path.join(dataPath, 'services.json')),
      planningApplications: await loadDataFile(path.join(dataPath, 'planningApplications.json')),
      statistics: await loadDataFile(path.join(dataPath, 'statistics.json')),
      rawPages: await loadDataFile(path.join(dataPath, 'rawPages.json'))
    };
    
    civicDataCache = data;
    lastCacheUpdate = now;
    
    return data;
  } catch (error) {
    console.error('Error loading civic data:', error);
    return {
      councillors: [],
      meetings: [],
      services: [],
      planningApplications: [],
      statistics: [],
      rawPages: []
    };
  }
}

async function loadDataFile(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log(`Data file not found: ${filePath}`);
    return [];
  }
}

// Query parameters schema
const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
  category: z.string().optional(),
  ward: z.string().optional(),
  party: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('asc')
});

// Helper function for pagination and filtering
function paginateAndFilter(data: any[], query: any, searchFields: string[] = []) {
  let filtered = [...data];
  
  // Apply search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(item => 
      searchFields.some(field => 
        item[field]?.toString().toLowerCase().includes(searchTerm)
      )
    );
  }
  
  // Apply category filter
  if (query.category) {
    filtered = filtered.filter(item => 
      item.category?.toLowerCase() === query.category.toLowerCase()
    );
  }
  
  // Apply ward filter
  if (query.ward) {
    filtered = filtered.filter(item => 
      item.ward?.toLowerCase() === query.ward.toLowerCase()
    );
  }
  
  // Apply party filter
  if (query.party) {
    filtered = filtered.filter(item => 
      item.party?.toLowerCase() === query.party.toLowerCase()
    );
  }
  
  // Apply status filter
  if (query.status) {
    filtered = filtered.filter(item => 
      item.status?.toLowerCase() === query.status.toLowerCase()
    );
  }
  
  // Apply sorting
  if (query.sort) {
    filtered.sort((a, b) => {
      const aVal = a[query.sort] || '';
      const bVal = b[query.sort] || '';
      
      if (query.order === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
  }
  
  // Apply pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / query.limit);
  const startIndex = (query.page - 1) * query.limit;
  const endIndex = startIndex + query.limit;
  
  return {
    data: filtered.slice(startIndex, endIndex),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNext: query.page < totalPages,
      hasPrev: query.page > 1
    }
  };
}

// 🏛️ COUNCILLORS ENDPOINTS
router.get('/councillors', async (req: Request, res: Response) => {
  try {
    const query = querySchema.parse(req.query);
    const civicData = await loadCivicData();
    
    const result = paginateAndFilter(
      civicData.councillors,
      query,
      ['name', 'ward', 'party', 'email']
    );
    
    res.json({
      success: true,
      councillors: result.data,
      pagination: result.pagination,
      meta: {
        totalCouncillors: civicData.councillors.length,
        uniqueWards: [...new Set(civicData.councillors.map(c => c.ward))].length,
        uniqueParties: [...new Set(civicData.councillors.map(c => c.party))]
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch councillors',
      details: error.message 
    });
  }
});

router.get('/councillors/:id', async (req: Request, res: Response) => {
  try {
    const civicData = await loadCivicData();
    const councillor = civicData.councillors.find(c => c.id === req.params.id);
    
    if (!councillor) {
      return res.status(404).json({ 
        success: false, 
        error: 'Councillor not found' 
      });
    }
    
    res.json({ success: true, councillor });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch councillor' 
    });
  }
});

// 📅 MEETINGS ENDPOINTS
router.get('/meetings', async (req: Request, res: Response) => {
  try {
    const query = querySchema.parse(req.query);
    const civicData = await loadCivicData();
    
    const result = paginateAndFilter(
      civicData.meetings,
      query,
      ['title', 'committee', 'decisions']
    );
    
    res.json({
      success: true,
      meetings: result.data,
      pagination: result.pagination,
      meta: {
        totalMeetings: civicData.meetings.length,
        uniqueCommittees: [...new Set(civicData.meetings.map(m => m.committee))]
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch meetings' 
    });
  }
});

router.get('/meetings/upcoming', async (req: Request, res: Response) => {
  try {
    const civicData = await loadCivicData();
    const now = new Date();
    
    const upcomingMeetings = civicData.meetings
      .filter(m => new Date(m.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
    
    res.json({ success: true, meetings: upcomingMeetings });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch upcoming meetings' 
    });
  }
});

// 🏢 SERVICES ENDPOINTS
router.get('/services', async (req: Request, res: Response) => {
  try {
    const query = querySchema.parse(req.query);
    const civicData = await loadCivicData();
    
    const result = paginateAndFilter(
      civicData.services,
      query,
      ['name', 'description', 'department']
    );
    
    res.json({
      success: true,
      services: result.data,
      pagination: result.pagination,
      meta: {
        totalServices: civicData.services.length,
        uniqueDepartments: [...new Set(civicData.services.map(s => s.department))],
        onlineServices: civicData.services.filter(s => s.onlineAccess).length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch services' 
    });
  }
});

router.get('/services/categories', async (req: Request, res: Response) => {
  try {
    const civicData = await loadCivicData();
    
    const categories = civicData.services.reduce((acc, service) => {
      const category = service.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {});
    
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch service categories' 
    });
  }
});

// 🏗️ PLANNING APPLICATIONS ENDPOINTS
router.get('/planning-applications', async (req: Request, res: Response) => {
  try {
    const query = querySchema.parse(req.query);
    const civicData = await loadCivicData();
    
    const result = paginateAndFilter(
      civicData.planningApplications,
      query,
      ['applicationNumber', 'address', 'description']
    );
    
    res.json({
      success: true,
      applications: result.data,
      pagination: result.pagination,
      meta: {
        totalApplications: civicData.planningApplications.length,
        statusBreakdown: civicData.planningApplications.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch planning applications' 
    });
  }
});

// 📊 STATISTICS ENDPOINTS
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const query = querySchema.parse(req.query);
    const civicData = await loadCivicData();
    
    const result = paginateAndFilter(
      civicData.statistics,
      query,
      ['category', 'metric', 'subcategory']
    );
    
    res.json({
      success: true,
      statistics: result.data,
      pagination: result.pagination,
      meta: {
        totalStatistics: civicData.statistics.length,
        categories: [...new Set(civicData.statistics.map(s => s.category))]
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics' 
    });
  }
});

router.get('/statistics/dashboard', async (req: Request, res: Response) => {
  try {
    const civicData = await loadCivicData();
    
    // Create dashboard summary data
    const dashboard = {
      overview: {
        totalCouncillors: civicData.councillors.length,
        totalMeetings: civicData.meetings.length,
        totalServices: civicData.services.length,
        totalPlanningApps: civicData.planningApplications.length,
        onlineServices: civicData.services.filter(s => s.onlineAccess).length
      },
      chartData: {
        servicesByCategory: civicData.services.reduce((acc, service) => {
          const category = service.category || 'Other';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}),
        councillorsByParty: civicData.councillors.reduce((acc, councillor) => {
          const party = councillor.party || 'Unknown';
          acc[party] = (acc[party] || 0) + 1;
          return acc;
        }, {}),
        planningByStatus: civicData.planningApplications.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {}),
        meetingsByCommittee: civicData.meetings.reduce((acc, meeting) => {
          acc[meeting.committee] = (acc[meeting.committee] || 0) + 1;
          return acc;
        }, {})
      }
    };
    
    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard data' 
    });
  }
});

// 🔍 SEARCH ENDPOINT
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q: searchTerm, type, limit = 10 } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search term is required' 
      });
    }
    
    const civicData = await loadCivicData();
    const results: any = {};
    const searchStr = (searchTerm as string || '').toLowerCase();
    const maxResults = parseInt(limit as string) || 10;
    
    if (!type || type === 'councillors') {
      results.councillors = civicData.councillors
        .filter(c => 
          c.name?.toLowerCase().includes(searchStr) ||
          c.ward?.toLowerCase().includes(searchStr) ||
          c.party?.toLowerCase().includes(searchStr)
        )
        .slice(0, maxResults);
    }
    
    if (!type || type === 'meetings') {
      results.meetings = civicData.meetings
        .filter(m =>
          m.title?.toLowerCase().includes(searchStr) ||
          m.committee?.toLowerCase().includes(searchStr)
        )
        .slice(0, maxResults);
    }
    
    if (!type || type === 'services') {
      results.services = civicData.services
        .filter(s =>
          s.name?.toLowerCase().includes(searchStr) ||
          s.description?.toLowerCase().includes(searchStr)
        )
        .slice(0, maxResults);
    }
    
    if (!type || type === 'planning') {
      results.planningApplications = civicData.planningApplications
        .filter(p =>
          p.address?.toLowerCase().includes(searchStr) ||
          p.description?.toLowerCase().includes(searchStr) ||
          p.applicationNumber?.toLowerCase().includes(searchStr)
        )
        .slice(0, maxResults);
    }
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Search failed' 
    });
  }
});

// 📈 DATA OVERVIEW ENDPOINT
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const civicData = await loadCivicData();
    
    const overview = {
      dataHealth: {
        lastUpdate: lastCacheUpdate ? new Date(lastCacheUpdate) : null,
        totalRecords: Object.values(civicData).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
      },
      counts: {
        councillors: civicData.councillors.length,
        meetings: civicData.meetings.length,
        services: civicData.services.length,
        planningApplications: civicData.planningApplications.length,
        statistics: civicData.statistics.length,
        rawPages: civicData.rawPages.length
      },
      breakdown: {
        wards: [...new Set(civicData.councillors.map(c => c.ward).filter(Boolean))],
        parties: [...new Set(civicData.councillors.map(c => c.party).filter(Boolean))],
        committees: [...new Set(civicData.meetings.map(m => m.committee).filter(Boolean))],
        departments: [...new Set(civicData.services.map(s => s.department).filter(Boolean))],
        serviceCategories: [...new Set(civicData.services.map(s => s.category).filter(Boolean))]
      }
    };
    
    res.json({ success: true, overview });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch overview' 
    });
  }
});

// 🏛️ NEW DATABASE-POWERED ENDPOINTS

// Advanced services endpoint with database integration
router.get('/db/services', async (req: Request, res: Response) => {
  try {
    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      category: req.query.category as string,
      department: req.query.department as string,
      onlineOnly: req.query.onlineOnly === 'true',
      search: req.query.search as string,
    };

    const result = await civicAPI.getServices(options);
    
    res.set({
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-API-Version': '2.0',
      'X-Query-Time': `${result.performance.queryTime}ms`
    });
    
    res.json(result);
  } catch (error) {
    console.error('Civic Services API Error:', error);
    res.status(500).json({ error: 'Failed to fetch civic services' });
  }
});

// Advanced meetings endpoint
router.get('/db/meetings', async (req: Request, res: Response) => {
  try {
    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      committee: req.query.committee as string,
      status: req.query.status as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      publicOnly: req.query.publicOnly === 'true',
    };

    const result = await civicAPI.getMeetings(options);
    
    res.set({
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-API-Version': '2.0',
      'X-Query-Time': `${result.performance.queryTime}ms`
    });
    
    res.json(result);
  } catch (error) {
    console.error('Civic Meetings API Error:', error);
    res.status(500).json({ error: 'Failed to fetch civic meetings' });
  }
});

// Intelligent search endpoint
router.get('/db/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      category: req.query.category as string,
      includeServices: req.query.includeServices !== 'false',
      includeMeetings: req.query.includeMeetings !== 'false',
      includePages: req.query.includePages !== 'false',
    };

    const result = await civicAPI.search(query, options);
    
    res.set({
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'X-API-Version': '2.0',
      'X-Query-Time': `${result.performance.queryTime}ms`,
      'X-Search-Query': query
    });
    
    res.json(result);
  } catch (error) {
    console.error('Civic Search API Error:', error);
    res.status(500).json({ error: 'Failed to search civic data' });
  }
});

// Advanced dashboard endpoint
router.get('/db/dashboard', async (req: Request, res: Response) => {
  try {
    const result = await civicAPI.getDashboardData();
    
    res.set({
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
      'X-API-Version': '2.0',
      'X-Data-Timestamp': new Date().toISOString()
    });
    
    res.json(result);
  } catch (error) {
    console.error('Civic Dashboard API Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Database statistics endpoint
router.get('/db/statistics', async (req: Request, res: Response) => {
  try {
    const options = {
      category: req.query.category as string,
      subcategory: req.query.subcategory as string,
      metric: req.query.metric as string,
      period: req.query.period as string,
    };

    const result = await civicAPI.getStatistics(options);
    
    res.set({
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      'X-API-Version': '2.0',
      'X-Data-Count': result.length.toString()
    });
    
    res.json(result);
  } catch (error) {
    console.error('Civic Statistics API Error:', error);
    res.status(500).json({ error: 'Failed to fetch civic statistics' });
  }
});

// 📁 RAW DATA ENDPOINTS (for CivicDataExplorer)
router.get('/raw-data/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const allowedFiles = [
      'comprehensive-dataset',
      'financial-services', 
      'council-meetings',
      'high-quality-content',
      'planning-development',
      'business-licensing'
    ];
    
    if (!allowedFiles.includes(filename)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Data file not found' 
      });
    }
    
    // Try multiple data directories
    const dataPaths = [
      path.join(process.cwd(), 'stealth-bolton-data/raw-data', `${filename}.json`),
      path.join(process.cwd(), 'comprehensive-bolton-data/raw-data', `${filename}.json`),
      path.join(process.cwd(), 'master-crawler-data/datasets', `${filename}.json`)
    ];
    
    for (const dataPath of dataPaths) {
      try {
        const content = await fs.readFile(dataPath, 'utf-8');
        const data = JSON.parse(content);
        
        res.set({
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
          'X-Data-Source': dataPath,
          'X-Data-Count': Array.isArray(data) ? data.length.toString() : '1'
        });
        
        return res.json(data);
      } catch (error) {
        continue; // Try next path
      }
    }
    
    res.status(404).json({ 
      success: false, 
      error: 'Data file not found in any location' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load raw data' 
    });
  }
});

// 📊 DATA ANALYTICS ENDPOINT
router.get('/analytics/summary', async (req: Request, res: Response) => {
  try {
    const civicData = await loadCivicData();
    
    // Generate comprehensive analytics
    const analytics = {
      totalRecords: Object.values(civicData).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
      dataTypes: {
        councillors: civicData.councillors.length,
        meetings: civicData.meetings.length,
        services: civicData.services.length,
        planningApplications: civicData.planningApplications.length,
        statistics: civicData.statistics.length,
        rawPages: civicData.rawPages.length
      },
      qualityDistribution: {
        high: civicData.rawPages.filter(p => p.quality > 0.8).length,
        medium: civicData.rawPages.filter(p => p.quality > 0.6 && p.quality <= 0.8).length,
        low: civicData.rawPages.filter(p => p.quality <= 0.6).length
      },
      categoryBreakdown: civicData.rawPages.reduce((acc, page) => {
        acc[page.category] = (acc[page.category] || 0) + 1;
        return acc;
      }, {}),
      lastUpdate: lastCacheUpdate ? new Date(lastCacheUpdate) : new Date(),
      averageQuality: civicData.rawPages.reduce((sum, p) => sum + p.quality, 0) / civicData.rawPages.length,
      crawlCoverage: {
        totalUrls: civicData.rawPages.length,
        uniqueDomains: [...new Set(civicData.rawPages.map(p => new URL(p.url).hostname))].length,
        totalWords: civicData.rawPages.reduce((sum, p) => sum + (p.contentLength || 0), 0)
      }
    };
    
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate analytics' 
    });
  }
});

export default router;
