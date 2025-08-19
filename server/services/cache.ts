import { createClient, RedisClientType } from 'redis';
import { z } from 'zod';

// Cache configuration
const cacheConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: 'stoneclough-hub:',
  defaultTTL: 3600, // 1 hour in seconds
};

// Cache key patterns
export const CACHE_KEYS = {
  COUNCIL_DATA: 'council:data',
  COUNCIL_STATS: 'council:stats',
  BUSINESSES: 'businesses',
  BUSINESS_BY_ID: 'business:id',
  BUSINESS_BY_CATEGORY: 'business:category',
  PROMOTED_BUSINESSES: 'business:promoted',
  FORUM_DISCUSSIONS: 'forum:discussions',
  FORUM_DISCUSSION_BY_ID: 'forum:discussion:id',
  BLOG_ARTICLES: 'blog:articles',
  BLOG_ARTICLE_BY_ID: 'blog:article:id',
  FEATURED_ARTICLE: 'blog:featured',
  USER_PROFILE: 'user:profile',
  SEARCH_RESULTS: 'search:results',
  API_RATE_LIMIT: 'api:rate_limit',
  SESSION_DATA: 'session',
} as const;

// TTL configurations for different data types
const TTL_CONFIG = {
  [CACHE_KEYS.COUNCIL_DATA]: 3600, // 1 hour
  [CACHE_KEYS.COUNCIL_STATS]: 1800, // 30 minutes
  [CACHE_KEYS.BUSINESSES]: 1800, // 30 minutes
  [CACHE_KEYS.BUSINESS_BY_ID]: 3600, // 1 hour
  [CACHE_KEYS.PROMOTED_BUSINESSES]: 900, // 15 minutes
  [CACHE_KEYS.FORUM_DISCUSSIONS]: 300, // 5 minutes
  [CACHE_KEYS.BLOG_ARTICLES]: 1800, // 30 minutes
  [CACHE_KEYS.FEATURED_ARTICLE]: 3600, // 1 hour
  [CACHE_KEYS.SEARCH_RESULTS]: 900, // 15 minutes
  [CACHE_KEYS.API_RATE_LIMIT]: 3600, // 1 hour
  [CACHE_KEYS.USER_PROFILE]: 1800, // 30 minutes
};

export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxRetries = 3;

  constructor() {
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: cacheConfig.url,
        password: cacheConfig.password,
        database: cacheConfig.database,
      });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
        this.isConnected = true;
        this.connectionAttempts = 0;
      });

      this.client.on('disconnect', () => {
        console.log('Disconnected from Redis');
        this.isConnected = false;
      });

      await this.client.connect();

    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      this.connectionAttempts++;

      // Retry connection with exponential backoff
      if (this.connectionAttempts < this.maxRetries) {
        const delay = Math.pow(2, this.connectionAttempts) * 1000;
        console.log(`Retrying Redis connection in ${delay}ms...`);
        setTimeout(() => this.connect(), delay);
      } else {
        console.warn('Max Redis connection retries reached. Running without cache.');
      }
    }
  }

  private getKey(pattern: string, ...params: string[]): string {
    let key = cacheConfig.keyPrefix + pattern;
    params.forEach((param, index) => {
      key += `:${param}`;
    });
    return key;
  }

  private getTTL(pattern: string): number {
    return TTL_CONFIG[pattern as keyof typeof TTL_CONFIG] || cacheConfig.defaultTTL;
  }

  async set(pattern: string, value: any, ttl?: number, ...params: string[]): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      console.warn('Cache not available, skipping set operation');
      return false;
    }

    try {
      const key = this.getKey(pattern, ...params);
      const serializedValue = JSON.stringify(value);
      const cacheTTL = ttl || this.getTTL(pattern);

      await this.client.setEx(key, cacheTTL, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async get<T>(pattern: string, ...params: string[]): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const key = this.getKey(pattern, ...params);
      const value = await this.client.get(key);
      
      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async delete(pattern: string, ...params: string[]): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const key = this.getKey(pattern, ...params);
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const searchPattern = this.getKey(pattern) + '*';
      const keys = await this.client.keys(searchPattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  async exists(pattern: string, ...params: string[]): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const key = this.getKey(pattern, ...params);
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async increment(pattern: string, amount: number = 1, ttl?: number, ...params: string[]): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const key = this.getKey(pattern, ...params);
      const newValue = await this.client.incrBy(key, amount);
      
      if (ttl && newValue === amount) {
        // Set TTL only for new keys
        await this.client.expire(key, ttl);
      }
      
      return newValue;
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  // Rate limiting functionality
  async checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remainingRequests: number;
    resetTime: number;
  }> {
    if (!this.isConnected || !this.client) {
      // Allow all requests if cache is not available
      return {
        allowed: true,
        remainingRequests: limit,
        resetTime: Date.now() + (windowSeconds * 1000),
      };
    }

    try {
      const key = this.getKey(CACHE_KEYS.API_RATE_LIMIT, identifier);
      const current = await this.increment(key, 1, windowSeconds);
      const remaining = Math.max(0, limit - current);
      
      return {
        allowed: current <= limit,
        remainingRequests: remaining,
        resetTime: Date.now() + (windowSeconds * 1000),
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return {
        allowed: true,
        remainingRequests: limit,
        resetTime: Date.now() + (windowSeconds * 1000),
      };
    }
  }

  // Cache-aside pattern helper
  async getOrSet<T>(
    pattern: string,
    fetchFunction: () => Promise<T>,
    ttl?: number,
    ...params: string[]
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(pattern, ...params);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const data = await fetchFunction();
    
    // Cache the result
    await this.set(pattern, data, ttl, ...params);
    
    return data;
  }

  // Batch operations
  async mget<T>(keys: Array<{ pattern: string; params: string[] }>): Promise<(T | null)[]> {
    if (!this.isConnected || !this.client) {
      return keys.map(() => null);
    }

    try {
      const redisKeys = keys.map(({ pattern, params }) => this.getKey(pattern, ...params));
      const values = await this.client.mGet(redisKeys);
      
      return values.map(value => value ? JSON.parse(value) as T : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(items: Array<{ pattern: string; value: any; ttl?: number; params: string[] }>): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const multi = this.client.multi();
      
      items.forEach(({ pattern, value, ttl, params }) => {
        const key = this.getKey(pattern, ...params);
        const serializedValue = JSON.stringify(value);
        const cacheTTL = ttl || this.getTTL(pattern);
        
        multi.setEx(key, cacheTTL, serializedValue);
      });
      
      await multi.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  // Cache warming functionality
  async warmCache(warmingFunctions: Array<{
    key: string;
    fn: () => Promise<any>;
    ttl?: number;
  }>): Promise<void> {
    console.log('Starting cache warming...');
    
    const promises = warmingFunctions.map(async ({ key, fn, ttl }) => {
      try {
        const data = await fn();
        await this.set(key, data, ttl);
        console.log(`Cache warmed for key: ${key}`);
      } catch (error) {
        console.error(`Failed to warm cache for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('Cache warming completed');
  }

  // Cache statistics
  async getStats(): Promise<{
    connected: boolean;
    keyCount?: number;
    memory?: string;
    hits?: number;
    misses?: number;
  }> {
    if (!this.isConnected || !this.client) {
      return { connected: false };
    }

    try {
      const info = await this.client.info('memory');
      const stats = await this.client.info('stats');
      
      // Parse Redis INFO output
      const parseInfo = (infoString: string) => {
        const lines = infoString.split('\r\n');
        const result: Record<string, string> = {};
        lines.forEach(line => {
          const [key, value] = line.split(':');
          if (key && value) {
            result[key] = value;
          }
        });
        return result;
      };

      const memoryInfo = parseInfo(info);
      const statsInfo = parseInfo(stats);

      const keyCount = await this.client.dbSize();

      return {
        connected: true,
        keyCount,
        memory: memoryInfo.used_memory_human,
        hits: parseInt(statsInfo.keyspace_hits || '0'),
        misses: parseInt(statsInfo.keyspace_misses || '0'),
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { connected: this.isConnected };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const testKey = 'health_check_' + Date.now();
      await this.client.set(testKey, 'ok');
      const value = await this.client.get(testKey);
      await this.client.del(testKey);
      return value === 'ok';
    } catch (error) {
      console.error('Cache health check error:', error);
      return false;
    }
  }

  // Cleanup expired keys (manual cleanup if needed)
  async cleanup(): Promise<void> {
    console.log('Starting cache cleanup...');
    // Redis automatically handles TTL expiration, but we can add custom cleanup logic here
    console.log('Cache cleanup completed');
  }

  // Close connection
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log('Redis connection closed');
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Performance monitoring middleware
export function createCacheMiddleware(
  pattern: string, 
  ttl?: number,
  keyGenerator?: (req: any) => string[]
) {
  return async (req: any, res: any, next: any) => {
    const params = keyGenerator ? keyGenerator(req) : [];
    const cacheKey = pattern + ':' + params.join(':');
    
    // Try to get from cache
    const cached = await cacheService.get(pattern, ...params);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(body: any) {
      res.set('X-Cache', 'MISS');
      cacheService.set(pattern, body, ttl, ...params);
      return originalJson.call(this, body);
    };

    next();
  };
}

// Rate limiting middleware
export function createRateLimitMiddleware(
  limit: number,
  windowSeconds: number,
  keyGenerator?: (req: any) => string
) {
  return async (req: any, res: any, next: any) => {
    const identifier = keyGenerator ? keyGenerator(req) : req.ip;
    
    const { allowed, remainingRequests, resetTime } = await cacheService.checkRateLimit(
      identifier,
      limit,
      windowSeconds
    );

    res.set('X-RateLimit-Limit', limit.toString());
    res.set('X-RateLimit-Remaining', remainingRequests.toString());
    res.set('X-RateLimit-Reset', resetTime.toString());

    if (!allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        resetTime,
      });
    }

    next();
  };
}

export default cacheService;
