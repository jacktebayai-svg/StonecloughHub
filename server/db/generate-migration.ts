import { sql } from "drizzle-orm";
import { db } from "../db";

// This script generates the initial database schema
// Run with: npm run db:generate

async function generateInitialMigration() {
  console.log('Generating initial database schema...');

  try {
    // Create enums first
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE data_type AS ENUM (
          'planning_application', 
          'council_spending', 
          'council_meeting', 
          'consultation',
          'council_page',
          'council_document',
          'transparency_data',
          'budget_item',
          'spending_record',
          'statistical_data',
          'councillor',
          'department',
          'service',
          'document',
          'chart_data'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE business_category AS ENUM (
          'restaurant_cafe', 
          'retail_shopping', 
          'health_beauty', 
          'professional_services', 
          'home_garden', 
          'other'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE forum_category AS ENUM (
          'general', 
          'local_events', 
          'business_recommendations', 
          'council_planning', 
          'buy_sell', 
          'green_space'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE survey_status AS ENUM ('draft', 'active', 'closed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('Database schema generated successfully!');
  } catch (error) {
    console.error('Error generating schema:', error);
    process.exit(1);
  }
}

generateInitialMigration();
