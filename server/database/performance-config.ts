import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Redis } from 'ioredis';
import * as schema from '@shared/schema';

// Enhanced connection pool configuration
export const createOptimizedPool = () => {
  const connectionString = process.env.DATABASE_URL!;
  
  const poolConfig: pg.PoolConfig = {
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Optimized for high-performance
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '5'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
    // Advanced settings
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    // Query timeout
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
    // Statement timeout for long-running queries
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '60000'),
  };

  return new pg.Pool(poolConfig);
};

// Redis cache configuration
export const createRedisClient = () => {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not configured, caching will be disabled');
    return null;
  }
  
  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableOfflineQueue: false,
    lazyConnect: true,
    // Connection pool settings
    family: 4,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
  });
};

// Database performance monitoring
export class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private queryStats = new Map<string, { count: number; totalTime: number; avgTime: number }>();
  private slowQueries: Array<{ query: string; duration: number; timestamp: Date }> = [];
  
  public static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  recordQuery(query: string, duration: number) {
    // Update query statistics
    const stats = this.queryStats.get(query) || { count: 0, totalTime: 0, avgTime: 0 };
    stats.count++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;
    this.queryStats.set(query, stats);

    // Track slow queries (>1000ms)
    if (duration > 1000) {
      this.slowQueries.push({ query, duration, timestamp: new Date() });
      // Keep only last 100 slow queries
      if (this.slowQueries.length > 100) {
        this.slowQueries = this.slowQueries.slice(-100);
      }
      console.warn(`Slow query detected: ${duration}ms - ${query.substring(0, 100)}...`);
    }
  }

  getQueryStats() {
    return Object.fromEntries(this.queryStats);
  }

  getSlowQueries() {
    return this.slowQueries;
  }

  getPerformanceReport() {
    const totalQueries = Array.from(this.queryStats.values()).reduce((sum, stat) => sum + stat.count, 0);
    const avgQueryTime = Array.from(this.queryStats.values()).reduce((sum, stat) => sum + stat.avgTime, 0) / this.queryStats.size;
    
    return {
      totalQueries,
      uniqueQueries: this.queryStats.size,
      averageQueryTime: Math.round(avgQueryTime),
      slowQueriesCount: this.slowQueries.length,
      topSlowQueries: this.slowQueries.slice(-10).reverse(),
    };
  }
}

// Cache manager for database queries
export class CacheManager {
  private redis: Redis | null;
  private localCache = new Map<string, { data: any; expires: number }>();
  
  constructor(redis: Redis | null) {
    this.redis = redis;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (this.redis) {
        const cached = await this.redis.get(key);
        if (cached) {
          return JSON.parse(cached);
        }
      }
      
      // Fallback to local cache
      const local = this.localCache.get(key);
      if (local && local.expires > Date.now()) {
        return local.data;
      }
      
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttlSeconds = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      
      // Store in Redis
      if (this.redis) {
        await this.redis.setex(key, ttlSeconds, serialized);
      }
      
      // Store in local cache as backup
      this.localCache.set(key, {
        data,
        expires: Date.now() + (ttlSeconds * 1000)
      });
      
      // Clean up expired local cache entries
      this.cleanupLocalCache();
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      // Clear from Redis
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
      
      // Clear from local cache
      for (const key of this.localCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          this.localCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  private cleanupLocalCache(): void {
    const now = Date.now();
    for (const [key, value] of this.localCache.entries()) {
      if (value.expires <= now) {
        this.localCache.delete(key);
      }
    }
  }
}

// Enhanced database client with performance features
export class PerformantDatabase {
  private db: NodePgDatabase<typeof schema>;
  private pool: pg.Pool;
  private cache: CacheManager;
  private monitor: DatabaseMonitor;

  constructor(pool: pg.Pool, redis: Redis | null) {
    this.pool = pool;
    this.db = drizzle(pool, { schema });
    this.cache = new CacheManager(redis);
    this.monitor = DatabaseMonitor.getInstance();
  }

  // Execute query with monitoring and caching
  async query<T>(
    queryFn: (db: NodePgDatabase<typeof schema>) => Promise<T>,
    cacheKey?: string,
    ttl = 300
  ): Promise<T> {
    const start = Date.now();
    const queryStr = queryFn.toString();
    
    try {
      // Try cache first if key provided
      if (cacheKey) {
        const cached = await this.cache.get<T>(cacheKey);
        if (cached !== null) {
          return cached;
        }
      }
      
      // Execute query
      const result = await queryFn(this.db);
      const duration = Date.now() - start;
      
      // Record performance metrics
      this.monitor.recordQuery(queryStr, duration);
      
      // Cache result if key provided
      if (cacheKey && result) {
        await this.cache.set(cacheKey, result, ttl);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.monitor.recordQuery(`ERROR: ${queryStr}`, duration);
      throw error;
    }
  }

  // Batch operations for better performance
  async batchInsert<T extends Record<string, any>>(
    table: any,
    data: T[],
    batchSize = 1000
  ): Promise<void> {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await this.query(async (db) => {
        return db.insert(table).values(batch);
      });
    }
  }

  // Get performance statistics
  getPerformanceStats() {
    return this.monitor.getPerformanceReport();
  }

  // Invalidate cache patterns
  async invalidateCache(pattern: string) {
    await this.cache.invalidate(pattern);
  }

  // Get the underlying database instance
  get database() {
    return this.db;
  }

  // Graceful shutdown
  async close() {
    await this.pool.end();
  }
}
