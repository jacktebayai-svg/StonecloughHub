import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is not set!");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create Supabase-compatible connection pool
const connectionString = process.env.DATABASE_URL;

// Configure connection pool for Supabase
const poolConfig: pg.PoolConfig = {
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: process.env.NODE_ENV === 'production' ? 1 : 10, // Limit connections for serverless
  min: 0,
  idle: 20000,
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
};

export const pool = new pg.Pool(poolConfig);
export const db = drizzle(pool, { schema });

// Legacy export for backward compatibility
export { pool as default };

// Graceful shutdown for serverless
process.on('beforeExit', async () => {
  await pool.end();
});

// Health check function
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};
