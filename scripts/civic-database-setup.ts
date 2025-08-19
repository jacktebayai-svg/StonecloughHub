#!/usr/bin/env tsx

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

interface DatabaseConnection {
  db: sqlite3.Database;
  run: (sql: string, params?: any[]) => Promise<any>;
  get: (sql: string, params?: any[]) => Promise<any>;
  all: (sql: string, params?: any[]) => Promise<any[]>;
  close: () => Promise<void>;
}

// High-performance database connection with promise support
function createDatabaseConnection(dbPath: string): Promise<DatabaseConnection> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }

      const connection = {
        db,
        run: promisify(db.run.bind(db)),
        get: promisify(db.get.bind(db)),
        all: promisify(db.all.bind(db)),
        close: promisify(db.close.bind(db))
      };

      resolve(connection);
    });
  });
}

// Optimized database schema for civic data
const createTablesSQL = `
-- Civic Services with full indexing
CREATE TABLE IF NOT EXISTS civic_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  department TEXT NOT NULL,
  category TEXT NOT NULL,
  online_access BOOLEAN DEFAULT FALSE,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_category ON civic_services(category);
CREATE INDEX IF NOT EXISTS idx_services_department ON civic_services(department);
CREATE INDEX IF NOT EXISTS idx_services_online ON civic_services(online_access);
CREATE INDEX IF NOT EXISTS idx_services_updated ON civic_services(last_updated);

-- Council Meetings with attendance tracking
CREATE TABLE IF NOT EXISTS civic_meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  committee TEXT NOT NULL,
  meeting_date DATETIME NOT NULL,
  status TEXT DEFAULT 'scheduled',
  public_access BOOLEAN DEFAULT TRUE,
  attendee_count INTEGER DEFAULT 0,
  decision_count INTEGER DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meetings_date ON civic_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_committee ON civic_meetings(committee);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON civic_meetings(status);

-- Civic Statistics for dashboard analytics
CREATE TABLE IF NOT EXISTS civic_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  subcategory TEXT,
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  period TEXT DEFAULT 'current',
  date_recorded DATETIME NOT NULL,
  source_document TEXT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stats_category ON civic_statistics(category);
CREATE INDEX IF NOT EXISTS idx_stats_metric ON civic_statistics(metric);
CREATE INDEX IF NOT EXISTS idx_stats_date ON civic_statistics(date_recorded);

-- Raw Pages for full-text search
CREATE TABLE IF NOT EXISTS civic_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  content_length INTEGER,
  quality_score REAL,
  crawled_at DATETIME NOT NULL,
  indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pages_category ON civic_pages(category);
CREATE INDEX IF NOT EXISTS idx_pages_quality ON civic_pages(quality_score);
CREATE INDEX IF NOT EXISTS idx_pages_crawled ON civic_pages(crawled_at);

-- Full-text search virtual table for content
CREATE VIRTUAL TABLE IF NOT EXISTS civic_search USING fts5(
  title, 
  description, 
  category, 
  content='civic_pages'
);

-- Data freshness tracking
CREATE TABLE IF NOT EXISTS data_freshness (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_type TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  last_import DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_age_days INTEGER,
  freshness_status TEXT DEFAULT 'current'
);

CREATE INDEX IF NOT EXISTS idx_freshness_type ON data_freshness(data_type);
CREATE INDEX IF NOT EXISTS idx_freshness_status ON data_freshness(freshness_status);
`;

// High-speed bulk import functions
async function importCivicServices(db: DatabaseConnection, servicesPath: string) {
  console.log('📊 Importing civic services data...');
  
  const servicesData = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
  
  const stmt = `INSERT INTO civic_services 
    (name, description, department, category, online_access, last_updated)
    VALUES (?, ?, ?, ?, ?, ?)`;
  
  let imported = 0;
  for (const service of servicesData) {
    await db.run(stmt, [
      service.name,
      service.description,
      service.department,
      service.category,
      service.onlineAccess || false,
      service.lastUpdated
    ]);
    imported++;
  }
  
  console.log(`✅ Imported ${imported} civic services`);
  
  // Update freshness tracking
  await updateDataFreshness(db, 'civic_services', imported);
}

async function importCivicMeetings(db: DatabaseConnection, meetingsPath: string) {
  console.log('📅 Importing council meetings data...');
  
  const meetingsData = JSON.parse(fs.readFileSync(meetingsPath, 'utf8'));
  
  const stmt = `INSERT INTO civic_meetings 
    (title, committee, meeting_date, status, public_access, attendee_count, decision_count, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  let imported = 0;
  for (const meeting of meetingsData) {
    await db.run(stmt, [
      meeting.title,
      meeting.committee,
      meeting.date,
      meeting.status,
      meeting.publicAccess || true,
      meeting.attendees?.length || 0,
      meeting.decisions?.length || 0,
      meeting.lastUpdated
    ]);
    imported++;
  }
  
  console.log(`✅ Imported ${imported} council meetings`);
  
  await updateDataFreshness(db, 'civic_meetings', imported);
}

async function importCivicStatistics(db: DatabaseConnection, statsPath: string) {
  console.log('📈 Importing civic statistics...');
  
  const statsData = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  
  const stmt = `INSERT INTO civic_statistics 
    (category, subcategory, metric, value, unit, period, date_recorded, source_document, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  let imported = 0;
  for (const stat of statsData) {
    await db.run(stmt, [
      stat.category,
      stat.subcategory,
      stat.metric,
      stat.value,
      stat.unit,
      stat.period,
      stat.date,
      stat.sourceDocument,
      stat.lastUpdated
    ]);
    imported++;
  }
  
  console.log(`✅ Imported ${imported} civic statistics`);
  
  await updateDataFreshness(db, 'civic_statistics', imported);
}

async function importCivicPages(db: DatabaseConnection, pagesPath: string) {
  console.log('🌐 Importing civic pages for search...');
  
  const pagesData = JSON.parse(fs.readFileSync(pagesPath, 'utf8'));
  
  const stmt = `INSERT OR REPLACE INTO civic_pages 
    (url, title, description, category, content_length, quality_score, crawled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  const searchStmt = `INSERT INTO civic_search (title, description, category) VALUES (?, ?, ?)`;
  
  let imported = 0;
  let skipped = 0;
  
  for (const page of pagesData) {
    try {
      await db.run(stmt, [
        page.url,
        page.title,
        page.description,
        page.category,
        page.contentLength,
        page.quality,
        page.crawledAt
      ]);
      
      // Add to search index
      await db.run(searchStmt, [
        page.title,
        page.description,
        page.category
      ]);
      
      imported++;
    } catch (error) {
      // Skip duplicates
      skipped++;
    }
  }
  
  console.log(`✅ Imported ${imported} civic pages with search index (${skipped} duplicates skipped)`);
  
  await updateDataFreshness(db, 'civic_pages', imported);
}

async function updateDataFreshness(db: DatabaseConnection, dataType: string, recordCount: number) {
  const stmt = `INSERT OR REPLACE INTO data_freshness 
    (data_type, record_count, last_import, data_age_days, freshness_status)
    VALUES (?, ?, CURRENT_TIMESTAMP, 0, 'current')`;
  
  await db.run(stmt, [dataType, recordCount]);
}

async function generateDatabaseStats(db: DatabaseConnection) {
  console.log('\n📊 Generating database statistics...');
  
  const stats = {
    services: await db.get('SELECT COUNT(*) as count FROM civic_services'),
    meetings: await db.get('SELECT COUNT(*) as count FROM civic_meetings'),
    statistics: await db.get('SELECT COUNT(*) as count FROM civic_statistics'),
    pages: await db.get('SELECT COUNT(*) as count FROM civic_pages'),
    serviceCategories: await db.all('SELECT category, COUNT(*) as count FROM civic_services GROUP BY category ORDER BY count DESC'),
    onlineServices: await db.get('SELECT COUNT(*) as count FROM civic_services WHERE online_access = 1'),
    meetingCommittees: await db.all('SELECT committee, COUNT(*) as count FROM civic_meetings GROUP BY committee ORDER BY count DESC'),
    dataQuality: await db.get('SELECT AVG(quality_score) as avg_quality, MIN(quality_score) as min_quality, MAX(quality_score) as max_quality FROM civic_pages')
  };
  
  console.log('\n🏛️ StonecloughHub Civic Database Statistics:');
  console.log(`   📊 Services: ${stats.services.count}`);
  console.log(`   📅 Meetings: ${stats.meetings.count}`);
  console.log(`   📈 Statistics: ${stats.statistics.count}`);
  console.log(`   🌐 Pages: ${stats.pages.count}`);
  console.log(`   💻 Online Services: ${stats.onlineServices.count}`);
  console.log(`   ⭐ Average Quality: ${stats.dataQuality.avg_quality?.toFixed(2)}`);
  
  console.log('\n📊 Service Categories:');
  stats.serviceCategories.forEach((cat: any) => {
    console.log(`   • ${cat.category}: ${cat.count}`);
  });
  
  console.log('\n📅 Meeting Committees:');
  stats.meetingCommittees.forEach((comm: any) => {
    console.log(`   • ${comm.committee}: ${comm.count}`);
  });
  
  return stats;
}

// Main database setup and import function
async function main() {
  console.log('🏛️ Setting up StonecloughHub Civic Database...\n');
  
  const dbPath = path.join(process.cwd(), 'data', 'civic.db');
  const processedDataDir = path.join(process.cwd(), 'processed-civic-data');
  
  // Ensure data directory exists
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  
  const db = await createDatabaseConnection(dbPath);
  
  try {
    // Create optimized schema
    console.log('🔧 Creating database schema...');
    
    // Split table creation to avoid issues
    const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await db.run(statement);
      }
    }
    
    console.log('✅ Database schema created');
    
    // Import all processed civic data
    const servicePath = path.join(processedDataDir, 'services.json');
    const meetingPath = path.join(processedDataDir, 'meetings.json');
    const statsPath = path.join(processedDataDir, 'statistics.json');
    const pagesPath = path.join(processedDataDir, 'rawPages.json');
    
    // Check files exist
    if (fs.existsSync(servicePath)) await importCivicServices(db, servicePath);
    if (fs.existsSync(meetingPath)) await importCivicMeetings(db, meetingPath);
    if (fs.existsSync(statsPath)) await importCivicStatistics(db, statsPath);
    if (fs.existsSync(pagesPath)) await importCivicPages(db, pagesPath);
    
    // Generate comprehensive statistics
    await generateDatabaseStats(db);
    
    console.log('\n🎉 StonecloughHub civic database setup complete!');
    console.log(`   📁 Database location: ${dbPath}`);
    console.log('   🚀 Ready for high-performance civic data serving!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { createDatabaseConnection, main as setupCivicDatabase };
