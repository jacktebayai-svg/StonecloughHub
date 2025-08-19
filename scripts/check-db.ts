import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

async function checkDatabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    // Create postgres client
    const client = postgres(databaseUrl);
    
    // Create drizzle instance
    const db = drizzle(client);
    
    // Test the connection with a simple query
    await client`SELECT 1 as test`;
    
    console.log('✅ Database connection successful');
    
    // Close the connection
    await client.end();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

checkDatabaseConnection();
