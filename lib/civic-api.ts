import { createDatabaseConnection } from '../scripts/civic-database-setup';
import path from 'path';

interface CivicService {
  id: number;
  name: string;
  description: string;
  department: string;
  category: string;
  online_access: boolean;
  last_updated: string;
  created_at: string;
}

interface CivicMeeting {
  id: number;
  title: string;
  committee: string;
  meeting_date: string;
  status: string;
  public_access: boolean;
  attendee_count: number;
  decision_count: number;
  last_updated: string;
  created_at: string;
}

interface CivicStatistic {
  id: number;
  category: string;
  subcategory: string;
  metric: string;
  value: number;
  unit: string;
  period: string;
  date_recorded: string;
  source_document: string;
  last_updated: string;
}

interface CivicPage {
  id: number;
  url: string;
  title: string;
  description: string;
  category: string;
  content_length: number;
  quality_score: number;
  crawled_at: string;
  indexed_at: string;
}

interface SearchResult {
  pages: CivicPage[];
  services: CivicService[];
  meetings: CivicMeeting[];
  totalResults: number;
  searchTime: number;
}

interface ApiResponse<T> {
  data: T;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  performance: {
    queryTime: number;
    timestamp: string;
  };
}

export class CivicDataAPI {
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'civic.db');
  }

  private async withDatabase<T>(operation: (db: any) => Promise<T>): Promise<T> {
    const db = await createDatabaseConnection(this.dbPath);
    try {
      return await operation(db);
    } finally {
      await db.close();
    }
  }

  /**
   * Get all civic services with pagination and filtering
   */
  async getServices(options: {
    page?: number;
    limit?: number;
    category?: string;
    department?: string;
    onlineOnly?: boolean;
    search?: string;
  } = {}): Promise<ApiResponse<CivicService[]>> {
    const startTime = Date.now();
    
    return this.withDatabase(async (db) => {
      const { page = 1, limit = 20, category, department, onlineOnly, search } = options;
      const offset = (page - 1) * limit;

      // Build dynamic query
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (category) {
        whereClause += ' AND category = ?';
        params.push(category);
      }

      if (department) {
        whereClause += ' AND department = ?';
        params.push(department);
      }

      if (onlineOnly) {
        whereClause += ' AND online_access = 1';
      }

      if (search) {
        whereClause += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM civic_services ${whereClause}`;
      const { total } = await db.get(countQuery, params);

      // Get paginated results
      const dataQuery = `
        SELECT * FROM civic_services 
        ${whereClause} 
        ORDER BY last_updated DESC, name ASC 
        LIMIT ? OFFSET ?
      `;
      const services = await db.all(dataQuery, [...params, limit, offset]);

      const queryTime = Date.now() - startTime;

      return {
        data: services,
        meta: {
          total,
          page,
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        performance: {
          queryTime,
          timestamp: new Date().toISOString()
        }
      };
    });
  }

  /**
   * Get civic meetings with advanced filtering
   */
  async getMeetings(options: {
    page?: number;
    limit?: number;
    committee?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    publicOnly?: boolean;
  } = {}): Promise<ApiResponse<CivicMeeting[]>> {
    const startTime = Date.now();
    
    return this.withDatabase(async (db) => {
      const { page = 1, limit = 20, committee, status, dateFrom, dateTo, publicOnly } = options;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (committee) {
        whereClause += ' AND committee = ?';
        params.push(committee);
      }

      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      if (dateFrom) {
        whereClause += ' AND meeting_date >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ' AND meeting_date <= ?';
        params.push(dateTo);
      }

      if (publicOnly) {
        whereClause += ' AND public_access = 1';
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM civic_meetings ${whereClause}`;
      const { total } = await db.get(countQuery, params);

      // Get paginated results
      const dataQuery = `
        SELECT * FROM civic_meetings 
        ${whereClause} 
        ORDER BY meeting_date DESC, title ASC 
        LIMIT ? OFFSET ?
      `;
      const meetings = await db.all(dataQuery, [...params, limit, offset]);

      const queryTime = Date.now() - startTime;

      return {
        data: meetings,
        meta: {
          total,
          page,
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        performance: {
          queryTime,
          timestamp: new Date().toISOString()
        }
      };
    });
  }

  /**
   * Get civic statistics for dashboard analytics
   */
  async getStatistics(options: {
    category?: string;
    subcategory?: string;
    metric?: string;
    period?: string;
  } = {}): Promise<CivicStatistic[]> {
    return this.withDatabase(async (db) => {
      const { category, subcategory, metric, period } = options;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (category) {
        whereClause += ' AND category = ?';
        params.push(category);
      }

      if (subcategory) {
        whereClause += ' AND subcategory = ?';
        params.push(subcategory);
      }

      if (metric) {
        whereClause += ' AND metric = ?';
        params.push(metric);
      }

      if (period) {
        whereClause += ' AND period = ?';
        params.push(period);
      }

      const query = `
        SELECT * FROM civic_statistics 
        ${whereClause} 
        ORDER BY category, subcategory, metric
      `;

      return await db.all(query, params);
    });
  }

  /**
   * Full-text search across all civic content
   */
  async search(query: string, options: {
    page?: number;
    limit?: number;
    category?: string;
    includeServices?: boolean;
    includeMeetings?: boolean;
    includePages?: boolean;
  } = {}): Promise<ApiResponse<SearchResult>> {
    const startTime = Date.now();
    
    return this.withDatabase(async (db) => {
      const { 
        page = 1, 
        limit = 10, 
        category, 
        includeServices = true, 
        includeMeetings = true, 
        includePages = true 
      } = options;

      const results: SearchResult = {
        pages: [],
        services: [],
        meetings: [],
        totalResults: 0,
        searchTime: 0
      };

      // Search pages using FTS
      if (includePages) {
        let searchQuery = `
          SELECT p.* FROM civic_pages p
          JOIN civic_search s ON p.id = s.rowid
          WHERE s MATCH ?
        `;
        const searchParams: any[] = [query];

        if (category) {
          searchQuery += ' AND p.category = ?';
          searchParams.push(category);
        }

        searchQuery += ' ORDER BY p.quality_score DESC, p.indexed_at DESC';
        results.pages = await db.all(searchQuery, searchParams);
      }

      // Search services
      if (includeServices) {
        let serviceQuery = `
          SELECT * FROM civic_services 
          WHERE (name LIKE ? OR description LIKE ?)
        `;
        const serviceParams = [`%${query}%`, `%${query}%`];

        if (category) {
          serviceQuery += ' AND category = ?';
          serviceParams.push(category);
        }

        serviceQuery += ' ORDER BY online_access DESC, name ASC';
        results.services = await db.all(serviceQuery, serviceParams);
      }

      // Search meetings
      if (includeMeetings) {
        let meetingQuery = `
          SELECT * FROM civic_meetings 
          WHERE (title LIKE ? OR committee LIKE ?)
        `;
        const meetingParams = [`%${query}%`, `%${query}%`];

        meetingQuery += ' ORDER BY meeting_date DESC, title ASC';
        results.meetings = await db.all(meetingQuery, meetingParams);
      }

      // Calculate total results
      results.totalResults = results.pages.length + results.services.length + results.meetings.length;
      results.searchTime = Date.now() - startTime;

      // Apply pagination to combined results (simplified approach)
      const allResults = [
        ...results.pages.map(p => ({ ...p, type: 'page' })),
        ...results.services.map(s => ({ ...s, type: 'service' })),
        ...results.meetings.map(m => ({ ...m, type: 'meeting' }))
      ];

      const offset = (page - 1) * limit;
      const paginatedResults = allResults.slice(offset, offset + limit);

      return {
        data: {
          pages: paginatedResults.filter(r => r.type === 'page'),
          services: paginatedResults.filter(r => r.type === 'service'),
          meetings: paginatedResults.filter(r => r.type === 'meeting'),
          totalResults: results.totalResults,
          searchTime: results.searchTime
        },
        meta: {
          total: results.totalResults,
          page,
          pageSize: limit,
          totalPages: Math.ceil(results.totalResults / limit),
          hasNext: offset + limit < results.totalResults,
          hasPrev: page > 1
        },
        performance: {
          queryTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
    });
  }

  /**
   * Get comprehensive analytics dashboard data
   */
  async getDashboardData(): Promise<{
    overview: {
      totalServices: number;
      onlineServices: number;
      totalMeetings: number;
      totalPages: number;
      averageQuality: number;
    };
    serviceCategories: Array<{ category: string; count: number; onlineCount: number }>;
    meetingCommittees: Array<{ committee: string; count: number; publicCount: number }>;
    digitalTransformation: {
      onlineServices: number;
      offlineServices: number;
      digitalizationRate: number;
    };
    contentQuality: Array<{ category: string; averageQuality: number; pageCount: number }>;
    recentActivity: {
      recentServices: CivicService[];
      upcomingMeetings: CivicMeeting[];
      highQualityPages: CivicPage[];
    };
  }> {
    return this.withDatabase(async (db) => {
      // Overview stats
      const [services, onlineServices, meetings, pages, avgQuality] = await Promise.all([
        db.get('SELECT COUNT(*) as count FROM civic_services'),
        db.get('SELECT COUNT(*) as count FROM civic_services WHERE online_access = 1'),
        db.get('SELECT COUNT(*) as count FROM civic_meetings'),
        db.get('SELECT COUNT(*) as count FROM civic_pages'),
        db.get('SELECT AVG(quality_score) as avg FROM civic_pages')
      ]);

      // Service categories with online status
      const serviceCategories = await db.all(`
        SELECT 
          category,
          COUNT(*) as count,
          SUM(CASE WHEN online_access = 1 THEN 1 ELSE 0 END) as onlineCount
        FROM civic_services 
        GROUP BY category 
        ORDER BY count DESC
      `);

      // Meeting committees with public access
      const meetingCommittees = await db.all(`
        SELECT 
          committee,
          COUNT(*) as count,
          SUM(CASE WHEN public_access = 1 THEN 1 ELSE 0 END) as publicCount
        FROM civic_meetings 
        GROUP BY committee 
        ORDER BY count DESC
      `);

      // Content quality by category
      const contentQuality = await db.all(`
        SELECT 
          category,
          AVG(quality_score) as averageQuality,
          COUNT(*) as pageCount
        FROM civic_pages 
        GROUP BY category 
        ORDER BY averageQuality DESC
      `);

      // Recent activity
      const [recentServices, upcomingMeetings, highQualityPages] = await Promise.all([
        db.all('SELECT * FROM civic_services ORDER BY last_updated DESC LIMIT 5'),
        db.all('SELECT * FROM civic_meetings WHERE meeting_date >= date("now") ORDER BY meeting_date ASC LIMIT 5'),
        db.all('SELECT * FROM civic_pages WHERE quality_score > 0.7 ORDER BY quality_score DESC, indexed_at DESC LIMIT 5')
      ]);

      return {
        overview: {
          totalServices: services.count,
          onlineServices: onlineServices.count,
          totalMeetings: meetings.count,
          totalPages: pages.count,
          averageQuality: parseFloat((avgQuality.avg || 0).toFixed(2))
        },
        serviceCategories,
        meetingCommittees,
        digitalTransformation: {
          onlineServices: onlineServices.count,
          offlineServices: services.count - onlineServices.count,
          digitalizationRate: parseFloat(((onlineServices.count / services.count) * 100).toFixed(1))
        },
        contentQuality,
        recentActivity: {
          recentServices,
          upcomingMeetings,
          highQualityPages
        }
      };
    });
  }

  /**
   * Get data freshness information
   */
  async getDataFreshness(): Promise<Array<{
    dataType: string;
    recordCount: number;
    lastImport: string;
    dataAge: number;
    status: string;
  }>> {
    return this.withDatabase(async (db) => {
      return await db.all(`
        SELECT 
          data_type as dataType,
          record_count as recordCount,
          last_import as lastImport,
          data_age_days as dataAge,
          freshness_status as status
        FROM data_freshness 
        ORDER BY last_import DESC
      `);
    });
  }

  /**
   * Export data in various formats
   */
  async exportData(type: 'services' | 'meetings' | 'statistics' | 'pages', format: 'json' | 'csv' = 'json'): Promise<{
    data: any[];
    filename: string;
    contentType: string;
  }> {
    return this.withDatabase(async (db) => {
      let data: any[] = [];
      let tableName = '';

      switch (type) {
        case 'services':
          data = await db.all('SELECT * FROM civic_services ORDER BY category, name');
          tableName = 'civic_services';
          break;
        case 'meetings':
          data = await db.all('SELECT * FROM civic_meetings ORDER BY meeting_date DESC');
          tableName = 'civic_meetings';
          break;
        case 'statistics':
          data = await db.all('SELECT * FROM civic_statistics ORDER BY category, metric');
          tableName = 'civic_statistics';
          break;
        case 'pages':
          data = await db.all('SELECT * FROM civic_pages ORDER BY quality_score DESC');
          tableName = 'civic_pages';
          break;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${tableName}_export_${timestamp}.${format}`;
      const contentType = format === 'json' ? 'application/json' : 'text/csv';

      return { data, filename, contentType };
    });
  }
}

// Singleton instance
export const civicAPI = new CivicDataAPI();
