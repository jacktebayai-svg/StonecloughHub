import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { 
  createOptimizedPool, 
  createRedisClient, 
  PerformantDatabase 
} from './database/performance-config';

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is not set!");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create optimized connection pool
export const pool = createOptimizedPool();
export const db = drizzle(pool, { schema });

// Create Redis client for caching
export const redis = createRedisClient();

// Create high-performance database instance
export const performantDb = new PerformantDatabase(pool, redis);

// Legacy export for backward compatibility
export { pool as default };

// Performance monitoring endpoint
export const getDbPerformanceStats = () => {
  return performantDb.getPerformanceStats();
};

// Cache invalidation helper
export const invalidateCache = (pattern: string) => {
  return performantDb.invalidateCache(pattern);
};

// Graceful shutdown for serverless
process.on('beforeExit', async () => {
  await performantDb.close();
  if (redis) {
    await redis.quit();
  }
});
