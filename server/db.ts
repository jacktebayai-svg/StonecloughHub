import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is not set!");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool for Supabase
const connectionString = process.env.DATABASE_URL;

// Pool configuration optimized for serverless
const poolConfig = {
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: process.env.NODE_ENV === 'production' ? 2 : 10, // Smaller pool for serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new pg.Pool(poolConfig);
export const db = drizzle(pool, { schema });

// Graceful shutdown for serverless
process.on('beforeExit', async () => {
  await pool.end();
});
