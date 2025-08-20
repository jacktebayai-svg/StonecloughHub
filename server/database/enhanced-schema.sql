-- Enhanced Database Schema for Advanced Council Data Management
-- Optimized for full-text search, faceted filtering, and complex analytics

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For similarity matching
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch"; -- For fuzzy string matching
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query performance analysis
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- For exclusion constraints

-- Custom types for enhanced data modeling
CREATE TYPE council_data_type AS ENUM (
  'council_meeting',
  'planning_application', 
  'councillor',
  'budget_item',
  'policy_document',
  'service_info',
  'transparency_data',
  'consultation',
  'contact_info',
  'event',
  'location',
  'organization',
  'person',
  'financial_data'
);

CREATE TYPE extraction_method AS ENUM (
  'advanced_ai_extraction',
  'html_parser',
  'json_processor',
  'xml_processor',
  'pdf_processor',
  'csv_processor',
  'manual_entry',
  'api_import'
);

CREATE TYPE quality_status AS ENUM (
  'excellent',
  'good',
  'fair', 
  'poor',
  'needs_review'
);

CREATE TYPE validation_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Enhanced main council data table with optimizations
CREATE TABLE enhanced_council_data (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255), -- For external system references
  
  -- Core content
  title TEXT NOT NULL,
  description TEXT,
  content_summary TEXT, -- AI-generated summary
  full_text_content TEXT, -- Complete extracted text for search
  
  -- Classification and categorization
  data_type council_data_type NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  semantic_tags TEXT[], -- Array of AI-generated semantic tags
  topic_classification JSONB, -- AI topic modeling results
  
  -- Source and extraction metadata
  source_url TEXT,
  file_url TEXT, -- Direct link to source file (PDF, CSV, etc.)
  parent_page_url TEXT, -- Page where the file was found
  source_domain VARCHAR(255),
  source_title TEXT,
  extraction_method extraction_method DEFAULT 'html_parser',
  extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
  extraction_metadata JSONB, -- Detailed extraction information
  citation_metadata JSONB, -- Enhanced citation information
  
  -- Temporal data
  event_date TIMESTAMP WITH TIME ZONE, -- When the event/item occurred
  published_date TIMESTAMP WITH TIME ZONE, -- When originally published
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scraped_at TIMESTAMP WITH TIME ZONE, -- When data was scraped
  
  -- Geographic and administrative
  location TEXT,
  ward VARCHAR(100),
  constituency VARCHAR(100),
  postcode VARCHAR(10),
  coordinates POINT, -- PostGIS point for geographic queries
  administrative_area JSONB, -- Hierarchical admin boundaries
  
  -- Status and workflow
  status VARCHAR(50) DEFAULT 'active',
  workflow_state VARCHAR(50) DEFAULT 'processed',
  approval_status VARCHAR(50) DEFAULT 'auto_approved',
  review_required BOOLEAN DEFAULT FALSE,
  
  -- Data quality and validation
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  quality_status quality_status,
  completeness_score DECIMAL(3,2),
  accuracy_score DECIMAL(3,2),
  consistency_score DECIMAL(3,2),
  validation_issues JSONB, -- Detailed validation problems
  
  -- Financial data (when applicable)
  amount DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'GBP',
  financial_year VARCHAR(9), -- Format: 2024-2025
  budget_category VARCHAR(100),
  
  -- Relationships and references
  parent_id UUID REFERENCES enhanced_council_data(id),
  related_ids UUID[], -- Array of related item IDs
  document_references TEXT[], -- Referenced documents
  
  -- Search and indexing optimization
  search_vector tsvector, -- Full-text search vector
  search_keywords TEXT[], -- Explicit keywords for search
  facet_data JSONB, -- Pre-computed facet values for fast filtering
  
  -- Audit and versioning
  version INTEGER DEFAULT 1,
  previous_version_id UUID,
  change_summary TEXT,
  changed_by VARCHAR(255),
  change_reason VARCHAR(255),
  
  -- Performance and caching
  view_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  cache_data JSONB, -- Cached computed values
  
  -- Integration and external systems
  external_refs JSONB, -- References to external systems
  sync_status VARCHAR(50) DEFAULT 'synced',
  sync_last_attempted TIMESTAMP WITH TIME ZONE,
  sync_errors JSONB,
  
  -- Archive and retention
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP WITH TIME ZONE,
  retention_policy VARCHAR(100),
  delete_after TIMESTAMP WITH TIME ZONE
);

-- Extracted entities table for structured data
CREATE TABLE extracted_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  council_data_id UUID NOT NULL REFERENCES enhanced_council_data(id) ON DELETE CASCADE,
  
  -- Entity identification
  entity_type council_data_type NOT NULL,
  entity_title TEXT NOT NULL,
  entity_description TEXT,
  
  -- Structured entity data
  structured_data JSONB NOT NULL,
  
  -- Entity relationships
  parent_entity_id UUID REFERENCES extracted_entities(id),
  relationships JSONB, -- Complex relationship data
  
  -- Extraction details
  source_selector TEXT, -- CSS selector or XPath used
  extraction_rule TEXT, -- Rule that extracted this entity
  confidence_score DECIMAL(3,2),
  
  -- Validation
  validation_status VARCHAR(50) DEFAULT 'pending',
  validation_results JSONB,
  
  -- Timestamps
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexing
  entity_search_vector tsvector
);

-- URL discovery and crawling management
CREATE TABLE crawl_urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- URL information
  url TEXT NOT NULL UNIQUE,
  normalized_url TEXT NOT NULL, -- Canonical form
  domain VARCHAR(255) NOT NULL,
  path_segments TEXT[], -- Split path for analysis
  
  -- Discovery and scheduling
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  discovered_from_url TEXT, -- Parent URL
  discovery_method VARCHAR(50),
  
  -- Crawl scheduling
  next_crawl_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  crawl_frequency INTERVAL DEFAULT '24 hours',
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  dynamic_priority INTEGER, -- AI-calculated priority
  
  -- Crawl status
  status VARCHAR(50) DEFAULT 'pending',
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  crawl_attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Content analysis
  content_type VARCHAR(100),
  content_length INTEGER,
  content_hash TEXT, -- For duplicate detection
  content_changed BOOLEAN DEFAULT FALSE,
  last_modified TIMESTAMP WITH TIME ZONE,
  etag TEXT, -- HTTP ETag for caching
  
  -- Quality and performance
  response_time INTEGER, -- in milliseconds
  success_rate DECIMAL(3,2),
  error_count INTEGER DEFAULT 0,
  last_error JSONB,
  
  -- AI analysis
  content_analysis JSONB, -- AI analysis results
  importance_score DECIMAL(3,2),
  change_frequency VARCHAR(20), -- 'hourly', 'daily', 'weekly', etc.
  
  -- Categorization
  url_category VARCHAR(100),
  expected_data_types TEXT[],
  tags TEXT[],
  
  -- Crawl rules and constraints
  respect_robots_txt BOOLEAN DEFAULT TRUE,
  custom_headers JSONB,
  crawl_depth INTEGER DEFAULT 0,
  max_depth INTEGER DEFAULT 5
);

-- Duplicate detection and deduplication
CREATE TABLE content_hashes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Hash information
  content_hash TEXT NOT NULL,
  hash_algorithm VARCHAR(20) DEFAULT 'md5',
  hash_type VARCHAR(50), -- 'full_content', 'title_hash', 'semantic_hash'
  
  -- Source information
  source_url TEXT NOT NULL,
  council_data_id UUID REFERENCES enhanced_council_data(id) ON DELETE CASCADE,
  
  -- Duplicate detection
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,
  
  -- Similarity analysis
  similarity_group UUID, -- Group of similar content
  similarity_scores JSONB, -- Scores with other content
  
  UNIQUE(content_hash, source_url)
);

-- Search facets for fast filtering
CREATE TABLE search_facets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Facet definition
  facet_name VARCHAR(100) NOT NULL,
  facet_value TEXT NOT NULL,
  display_name TEXT,
  
  -- Counts and statistics
  item_count INTEGER DEFAULT 0,
  percentage DECIMAL(5,2),
  
  -- Hierarchy support
  parent_facet_id UUID REFERENCES search_facets(id),
  hierarchy_level INTEGER DEFAULT 0,
  
  -- Metadata
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(facet_name, facet_value)
);

-- Data quality reports and validation
CREATE TABLE data_quality_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Subject of the report
  council_data_id UUID REFERENCES enhanced_council_data(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES extracted_entities(id) ON DELETE CASCADE,
  
  -- Quality scores
  overall_score DECIMAL(3,2) NOT NULL,
  completeness_score DECIMAL(3,2),
  accuracy_score DECIMAL(3,2),
  consistency_score DECIMAL(3,2),
  freshness_score DECIMAL(3,2),
  
  -- Detailed issues
  validation_issues JSONB NOT NULL,
  recommendations JSONB,
  
  -- Report metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  report_version VARCHAR(20) DEFAULT '1.0',
  validation_rules_applied TEXT[],
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  addressed_issues JSONB, -- Issues that have been fixed
  
  CHECK ((council_data_id IS NOT NULL) OR (entity_id IS NOT NULL))
);

-- System monitoring and performance
CREATE TABLE crawl_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Session identification
  session_id TEXT NOT NULL UNIQUE,
  
  -- Session details
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'running',
  
  -- Performance metrics
  urls_discovered INTEGER DEFAULT 0,
  urls_processed INTEGER DEFAULT 0,
  urls_failed INTEGER DEFAULT 0,
  urls_skipped INTEGER DEFAULT 0,
  
  -- Data metrics
  entities_extracted INTEGER DEFAULT 0,
  data_points_collected INTEGER DEFAULT 0,
  bytes_processed BIGINT DEFAULT 0,
  
  -- Quality metrics
  average_quality_score DECIMAL(3,2),
  average_confidence DECIMAL(3,2),
  validation_errors INTEGER DEFAULT 0,
  
  -- Configuration
  crawl_configuration JSONB,
  user_agent TEXT,
  
  -- Results
  session_summary JSONB,
  error_summary JSONB
);

-- Analytics and insights
CREATE TABLE content_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Time series data
  date_recorded DATE NOT NULL,
  hour_recorded INTEGER CHECK (hour_recorded >= 0 AND hour_recorded <= 23),
  
  -- Content metrics
  total_items INTEGER DEFAULT 0,
  new_items INTEGER DEFAULT 0,
  updated_items INTEGER DEFAULT 0,
  deleted_items INTEGER DEFAULT 0,
  
  -- Quality metrics
  average_quality_score DECIMAL(3,2),
  items_needing_review INTEGER DEFAULT 0,
  validation_failures INTEGER DEFAULT 0,
  
  -- Category breakdown
  category_stats JSONB, -- Statistics by category
  
  -- Search and usage
  search_queries INTEGER DEFAULT 0,
  popular_searches JSONB,
  click_through_rates JSONB,
  
  -- Data freshness
  stale_content_count INTEGER DEFAULT 0,
  fresh_content_percentage DECIMAL(5,2),
  
  UNIQUE(date_recorded, hour_recorded)
);

-- Scheduled tasks and automation
CREATE TABLE scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Task definition
  task_name VARCHAR(255) NOT NULL UNIQUE,
  task_type VARCHAR(100) NOT NULL, -- 'crawl', 'validation', 'cleanup', etc.
  task_description TEXT,
  
  -- Scheduling
  cron_expression VARCHAR(100),
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  
  -- Configuration
  task_configuration JSONB,
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Performance
  average_duration INTERVAL,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_error JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced indexes for optimal performance

-- Full-text search indexes
CREATE INDEX idx_council_data_search_vector ON enhanced_council_data USING GIN(search_vector);
CREATE INDEX idx_council_data_title_gin ON enhanced_council_data USING GIN(title gin_trgm_ops);
CREATE INDEX idx_council_data_description_gin ON enhanced_council_data USING GIN(description gin_trgm_ops);

-- Category and type filtering
CREATE INDEX idx_council_data_type_category ON enhanced_council_data (data_type, category);
CREATE INDEX idx_council_data_tags ON enhanced_council_data USING GIN(semantic_tags);

-- Temporal indexes
CREATE INDEX idx_council_data_event_date ON enhanced_council_data (event_date) WHERE event_date IS NOT NULL;
CREATE INDEX idx_council_data_created_at ON enhanced_council_data (created_at);
CREATE INDEX idx_council_data_updated_at ON enhanced_council_data (updated_at);

-- Geographic indexes
CREATE INDEX idx_council_data_location ON enhanced_council_data (location) WHERE location IS NOT NULL;
CREATE INDEX idx_council_data_ward ON enhanced_council_data (ward) WHERE ward IS NOT NULL;
CREATE INDEX idx_council_data_postcode ON enhanced_council_data (postcode) WHERE postcode IS NOT NULL;

-- Quality and status indexes
CREATE INDEX idx_council_data_quality ON enhanced_council_data (quality_status, quality_score);
CREATE INDEX idx_council_data_status ON enhanced_council_data (status) WHERE status != 'active';

-- Financial data indexes
CREATE INDEX idx_council_data_amount ON enhanced_council_data (amount) WHERE amount IS NOT NULL;
CREATE INDEX idx_council_data_financial_year ON enhanced_council_data (financial_year) WHERE financial_year IS NOT NULL;

-- JSONB indexes for flexible querying
CREATE INDEX idx_council_data_facet_data ON enhanced_council_data USING GIN(facet_data);
CREATE INDEX idx_council_data_metadata ON enhanced_council_data USING GIN(extraction_metadata);
CREATE INDEX idx_council_data_topic_classification ON enhanced_council_data USING GIN(topic_classification);

-- URL management indexes
CREATE INDEX idx_crawl_urls_next_crawl ON crawl_urls (next_crawl_at, status) WHERE status = 'pending';
CREATE INDEX idx_crawl_urls_domain ON crawl_urls (domain, status);
CREATE INDEX idx_crawl_urls_priority ON crawl_urls (priority DESC, next_crawl_at);
CREATE INDEX idx_crawl_urls_hash ON crawl_urls (content_hash) WHERE content_hash IS NOT NULL;

-- Entity extraction indexes
CREATE INDEX idx_entities_council_data ON extracted_entities (council_data_id);
CREATE INDEX idx_entities_type ON extracted_entities (entity_type);
CREATE INDEX idx_entities_search ON extracted_entities USING GIN(entity_search_vector);

-- Duplicate detection indexes
CREATE INDEX idx_content_hashes_hash ON content_hashes (content_hash);
CREATE INDEX idx_content_hashes_similarity ON content_hashes (similarity_group) WHERE similarity_group IS NOT NULL;

-- Analytics indexes
CREATE INDEX idx_analytics_date ON content_analytics (date_recorded DESC);
CREATE INDEX idx_quality_reports_score ON data_quality_reports (overall_score);

-- Composite indexes for common query patterns
CREATE INDEX idx_council_data_type_date ON enhanced_council_data (data_type, event_date DESC) WHERE event_date IS NOT NULL;
CREATE INDEX idx_council_data_quality_type ON enhanced_council_data (quality_status, data_type);
CREATE INDEX idx_council_data_ward_type ON enhanced_council_data (ward, data_type) WHERE ward IS NOT NULL;

-- Partial indexes for better performance
CREATE INDEX idx_council_data_needs_review ON enhanced_council_data (id) WHERE review_required = TRUE;
CREATE INDEX idx_crawl_urls_failed ON crawl_urls (url, last_crawled_at) WHERE error_count > 0;
CREATE INDEX idx_entities_pending_validation ON extracted_entities (id) WHERE validation_status = 'pending';

-- Functions for maintaining search vectors and facets

-- Function to update search vector automatically
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.full_text_content, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(NEW.semantic_tags, ' ')), 'D');
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update entity search vectors
CREATE OR REPLACE FUNCTION update_entity_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.entity_search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.entity_title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.entity_description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.structured_data::text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically calculate facet data
CREATE OR REPLACE FUNCTION calculate_facet_data(data_type council_data_type, category TEXT, ward TEXT, financial_year TEXT) 
RETURNS JSONB AS $$
DECLARE
  facets JSONB := '{}';
BEGIN
  -- Build facet data structure
  facets := jsonb_build_object(
    'data_type', data_type::text,
    'category', COALESCE(category, 'uncategorized'),
    'ward', COALESCE(ward, 'unknown'),
    'has_amount', CASE WHEN financial_year IS NOT NULL THEN true ELSE false END,
    'financial_year', COALESCE(financial_year, 'unknown'),
    'decade', CASE 
      WHEN financial_year LIKE '202%' THEN '2020s'
      WHEN financial_year LIKE '201%' THEN '2010s'
      ELSE 'other'
    END
  );
  
  RETURN facets;
END;
$$ LANGUAGE plpgsql;

-- Triggers to maintain data integrity and performance

-- Trigger to update search vectors on data changes
CREATE TRIGGER trig_update_search_vector
  BEFORE INSERT OR UPDATE OF title, description, full_text_content, semantic_tags
  ON enhanced_council_data
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();

-- Trigger to update entity search vectors
CREATE TRIGGER trig_update_entity_search_vector
  BEFORE INSERT OR UPDATE OF entity_title, entity_description, structured_data
  ON extracted_entities
  FOR EACH ROW
  EXECUTE FUNCTION update_entity_search_vector();

-- Trigger to automatically calculate facet data
CREATE OR REPLACE FUNCTION update_facet_data() RETURNS TRIGGER AS $$
BEGIN
  NEW.facet_data := calculate_facet_data(NEW.data_type, NEW.category, NEW.ward, NEW.financial_year);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_update_facet_data
  BEFORE INSERT OR UPDATE OF data_type, category, ward, financial_year
  ON enhanced_council_data
  FOR EACH ROW
  EXECUTE FUNCTION update_facet_data();

-- Views for common queries and analytics

-- Comprehensive search view with all relevant fields
CREATE VIEW search_ready_data AS
SELECT 
  id,
  title,
  description,
  data_type,
  category,
  subcategory,
  semantic_tags,
  source_url,
  event_date,
  created_at,
  location,
  ward,
  amount,
  quality_score,
  quality_status,
  search_vector,
  facet_data,
  CASE 
    WHEN quality_score >= 0.8 THEN 'high'
    WHEN quality_score >= 0.6 THEN 'medium'
    ELSE 'low'
  END as quality_band,
  EXTRACT(YEAR FROM COALESCE(event_date, created_at)) as year,
  EXTRACT(MONTH FROM COALESCE(event_date, created_at)) as month
FROM enhanced_council_data
WHERE status = 'active' AND archived = FALSE;

-- Facet counts view for fast filtering
CREATE VIEW facet_counts AS
SELECT 
  'data_type' as facet_name,
  data_type::text as facet_value,
  COUNT(*) as item_count,
  ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
FROM enhanced_council_data 
WHERE status = 'active' AND archived = FALSE
GROUP BY data_type

UNION ALL

SELECT 
  'ward' as facet_name,
  COALESCE(ward, 'Unknown') as facet_value,
  COUNT(*) as item_count,
  ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
FROM enhanced_council_data 
WHERE status = 'active' AND archived = FALSE
GROUP BY ward

UNION ALL

SELECT 
  'quality' as facet_name,
  quality_status::text as facet_value,
  COUNT(*) as item_count,
  ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
FROM enhanced_council_data 
WHERE status = 'active' AND archived = FALSE
GROUP BY quality_status

UNION ALL

SELECT 
  'year' as facet_name,
  EXTRACT(YEAR FROM COALESCE(event_date, created_at))::text as facet_value,
  COUNT(*) as item_count,
  ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
FROM enhanced_council_data 
WHERE status = 'active' AND archived = FALSE
GROUP BY EXTRACT(YEAR FROM COALESCE(event_date, created_at))

UNION ALL

SELECT 
  'has_amount' as facet_name,
  CASE WHEN amount IS NOT NULL THEN 'true' ELSE 'false' END as facet_value,
  COUNT(*) as item_count,
  ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
FROM enhanced_council_data 
WHERE status = 'active' AND archived = FALSE
GROUP BY CASE WHEN amount IS NOT NULL THEN 'true' ELSE 'false' END;

-- Quality dashboard view
CREATE VIEW quality_dashboard AS
SELECT 
  COUNT(*) as total_items,
  AVG(quality_score) as avg_quality_score,
  COUNT(*) FILTER (WHERE quality_status = 'excellent') as excellent_count,
  COUNT(*) FILTER (WHERE quality_status = 'good') as good_count,
  COUNT(*) FILTER (WHERE quality_status = 'fair') as fair_count,
  COUNT(*) FILTER (WHERE quality_status = 'poor') as poor_count,
  COUNT(*) FILTER (WHERE review_required = TRUE) as needs_review_count,
  COUNT(*) FILTER (WHERE validation_issues IS NOT NULL) as has_issues_count,
  AVG(completeness_score) as avg_completeness,
  AVG(accuracy_score) as avg_accuracy,
  AVG(consistency_score) as avg_consistency
FROM enhanced_council_data 
WHERE status = 'active' AND archived = FALSE;

-- Recent activity view
CREATE VIEW recent_activity AS
SELECT 
  id,
  title,
  data_type,
  created_at,
  updated_at,
  scraped_at,
  quality_score,
  source_url,
  'created' as activity_type,
  created_at as activity_time
FROM enhanced_council_data 
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  id,
  title,
  data_type,
  created_at,
  updated_at,
  scraped_at,
  quality_score,
  source_url,
  'updated' as activity_type,
  updated_at as activity_time
FROM enhanced_council_data 
WHERE updated_at >= NOW() - INTERVAL '7 days' 
  AND updated_at != created_at

ORDER BY activity_time DESC;

-- Performance optimization: Refresh materialized views periodically
-- (These would be materialized views in practice for better performance)

-- Comments for documentation
COMMENT ON TABLE enhanced_council_data IS 'Main table for storing enhanced council data with full-text search and advanced analytics capabilities';
COMMENT ON TABLE extracted_entities IS 'Structured entities extracted from council data using AI-powered analysis';
COMMENT ON TABLE crawl_urls IS 'URL queue management for intelligent crawling with priority and scheduling';
COMMENT ON TABLE content_hashes IS 'Content deduplication and similarity detection using various hashing strategies';
COMMENT ON TABLE search_facets IS 'Pre-computed facet values for fast search filtering';
COMMENT ON TABLE data_quality_reports IS 'Automated data quality assessment and validation reports';
COMMENT ON TABLE crawl_sessions IS 'Monitoring and performance tracking for crawling sessions';

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO scraper_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO scraper_role;
