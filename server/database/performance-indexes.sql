-- High-Performance Database Indexes for StonecloughHub
-- Execute this file to create optimized indexes for civic data queries

-- ============================================
-- CORE TABLE INDEXES
-- ============================================

-- Civic Data main table indexes
CREATE INDEX IF NOT EXISTS idx_civic_data_type ON civic_data(data_type);
CREATE INDEX IF NOT EXISTS idx_civic_data_category ON civic_data(category);
CREATE INDEX IF NOT EXISTS idx_civic_data_date ON civic_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_civic_data_priority ON civic_data(priority);
CREATE INDEX IF NOT EXISTS idx_civic_data_department ON civic_data(department);
CREATE INDEX IF NOT EXISTS idx_civic_data_ward ON civic_data(ward);
CREATE INDEX IF NOT EXISTS idx_civic_data_amount ON civic_data(amount DESC) WHERE amount IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_civic_data_type_date ON civic_data(data_type, date DESC);
CREATE INDEX IF NOT EXISTS idx_civic_data_category_date ON civic_data(category, date DESC);
CREATE INDEX IF NOT EXISTS idx_civic_data_department_date ON civic_data(department, date DESC) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_civic_data_priority_date ON civic_data(priority, date DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_civic_data_search ON civic_data USING GIN(to_tsvector('english', title || ' ' || description));

-- ============================================
-- BUDGET AND FINANCIAL DATA INDEXES
-- ============================================

-- Budget items (assuming separate table exists)
CREATE INDEX IF NOT EXISTS idx_budget_department ON budget_items(department);
CREATE INDEX IF NOT EXISTS idx_budget_year ON budget_items(year DESC);
CREATE INDEX IF NOT EXISTS idx_budget_amount ON budget_items(amount DESC);
CREATE INDEX IF NOT EXISTS idx_budget_category ON budget_items(category);
CREATE INDEX IF NOT EXISTS idx_budget_dept_year ON budget_items(department, year DESC);

-- Spending records
CREATE INDEX IF NOT EXISTS idx_spending_date ON spending_records(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_spending_supplier ON spending_records(supplier);
CREATE INDEX IF NOT EXISTS idx_spending_department ON spending_records(department);
CREATE INDEX IF NOT EXISTS idx_spending_amount ON spending_records(amount DESC);
CREATE INDEX IF NOT EXISTS idx_spending_dept_date ON spending_records(department, transaction_date DESC);

-- ============================================
-- MEETINGS AND DECISIONS INDEXES
-- ============================================

-- Meetings
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_committee ON meetings(committee);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_public ON meetings(public_access) WHERE public_access = true;
CREATE INDEX IF NOT EXISTS idx_meetings_committee_date ON meetings(committee, date DESC);

-- Decisions
CREATE INDEX IF NOT EXISTS idx_decisions_date ON decisions(decision_date DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_decisions_impact ON decisions(impact);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_committee ON decisions(committee);
CREATE INDEX IF NOT EXISTS idx_decisions_financial ON decisions(financial_impact DESC) WHERE financial_impact IS NOT NULL;

-- ============================================
-- COUNCIL STRUCTURE INDEXES
-- ============================================

-- Councillors
CREATE INDEX IF NOT EXISTS idx_councillors_ward ON councillors(ward);
CREATE INDEX IF NOT EXISTS idx_councillors_party ON councillors(party);
CREATE INDEX IF NOT EXISTS idx_councillors_active ON councillors(term_end DESC) WHERE term_end > CURRENT_DATE;

-- Departments
CREATE INDEX IF NOT EXISTS idx_departments_budget ON departments(budget DESC) WHERE budget IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_departments_staff ON departments(staff_count DESC) WHERE staff_count IS NOT NULL;

-- ============================================
-- SERVICES AND PERFORMANCE INDEXES
-- ============================================

-- Services
CREATE INDEX IF NOT EXISTS idx_services_department ON services(department);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_online ON services(online_access) WHERE online_access = true;

-- Performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_service ON performance_metrics(service);
CREATE INDEX IF NOT EXISTS idx_performance_date ON performance_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metric ON performance_metrics(metric);
CREATE INDEX IF NOT EXISTS idx_performance_value ON performance_metrics(value DESC);
CREATE INDEX IF NOT EXISTS idx_performance_service_date ON performance_metrics(service, date DESC);

-- ============================================
-- PLANNING AND DEVELOPMENT INDEXES
-- ============================================

-- Planning applications
CREATE INDEX IF NOT EXISTS idx_planning_status ON planning_applications(status);
CREATE INDEX IF NOT EXISTS idx_planning_ward ON planning_applications(ward);
CREATE INDEX IF NOT EXISTS idx_planning_submission ON planning_applications(submission_date DESC);
CREATE INDEX IF NOT EXISTS idx_planning_decision ON planning_applications(decision_date DESC) WHERE decision_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_planning_consultation ON planning_applications(public_consultation) WHERE public_consultation = true;
CREATE INDEX IF NOT EXISTS idx_planning_ward_date ON planning_applications(ward, submission_date DESC);

-- ============================================
-- DOCUMENTS AND FILES INDEXES
-- ============================================

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department);
CREATE INDEX IF NOT EXISTS idx_documents_publish ON documents(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_access ON documents(access_level);
CREATE INDEX IF NOT EXISTS idx_documents_dept_date ON documents(department, publish_date DESC);

-- Document full-text search
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ============================================
-- ANALYTICS AND REPORTING INDEXES
-- ============================================

-- Statistical data
CREATE INDEX IF NOT EXISTS idx_stats_category ON statistical_data(category);
CREATE INDEX IF NOT EXISTS idx_stats_date ON statistical_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_stats_geography ON statistical_data(geography) WHERE geography IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stats_metric ON statistical_data(metric);
CREATE INDEX IF NOT EXISTS idx_stats_value ON statistical_data(value DESC);
CREATE INDEX IF NOT EXISTS idx_stats_cat_date ON statistical_data(category, date DESC);

-- Chart data
CREATE INDEX IF NOT EXISTS idx_chart_type ON chart_data(chart_type);
CREATE INDEX IF NOT EXISTS idx_chart_category ON chart_data(category);
CREATE INDEX IF NOT EXISTS idx_chart_updated ON chart_data(last_updated DESC);

-- ============================================
-- POLICY AND CONSULTATION INDEXES
-- ============================================

-- Policies
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_department ON policies(department);
CREATE INDEX IF NOT EXISTS idx_policies_adoption ON policies(adoption_date DESC) WHERE adoption_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_policies_review ON policies(review_date DESC) WHERE review_date IS NOT NULL;

-- Consultations
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_start ON consultations(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_end ON consultations(end_date DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_active ON consultations(status, end_date) WHERE status = 'active';

-- ============================================
-- PERFORMANCE MONITORING INDEXES
-- ============================================

-- Query performance tracking
CREATE TABLE IF NOT EXISTS query_performance (
  id SERIAL PRIMARY KEY,
  query_hash VARCHAR(64) NOT NULL,
  query_type VARCHAR(50) NOT NULL,
  execution_time INTEGER NOT NULL, -- milliseconds
  rows_returned INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER,
  endpoint VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_query_perf_hash ON query_performance(query_hash);
CREATE INDEX IF NOT EXISTS idx_query_perf_time ON query_performance(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_query_perf_type ON query_performance(query_type);
CREATE INDEX IF NOT EXISTS idx_query_perf_duration ON query_performance(execution_time DESC);

-- ============================================
-- SEARCH OPTIMIZATION
-- ============================================

-- Global search view for cross-table searching
CREATE OR REPLACE VIEW global_search AS
SELECT 
  'civic_data' as source_table,
  id::text as source_id,
  title,
  description,
  category,
  data_type as type,
  date,
  department,
  ward,
  to_tsvector('english', title || ' ' || description) as search_vector
FROM civic_data
UNION ALL
SELECT 
  'documents' as source_table,
  id::text as source_id,
  title,
  description,
  category,
  type::text,
  publish_date as date,
  department,
  NULL as ward,
  to_tsvector('english', title || ' ' || COALESCE(description, '')) as search_vector
FROM documents
UNION ALL
SELECT 
  'meetings' as source_table,
  id::text as source_id,
  title,
  committee as description,
  'meeting' as category,
  committee as type,
  date,
  NULL as department,
  NULL as ward,
  to_tsvector('english', title || ' ' || committee) as search_vector
FROM meetings;

-- Index for the global search view
CREATE INDEX IF NOT EXISTS idx_global_search_vector ON global_search USING GIN(search_vector);

-- ============================================
-- MAINTENANCE AND OPTIMIZATION
-- ============================================

-- Update table statistics (run periodically)
ANALYZE civic_data;
ANALYZE documents;
ANALYZE meetings;
ANALYZE budget_items;
ANALYZE spending_records;
ANALYZE councillors;
ANALYZE departments;
ANALYZE services;
ANALYZE performance_metrics;
ANALYZE planning_applications;
ANALYZE statistical_data;
ANALYZE policies;
ANALYZE consultations;

-- Create a function to refresh materialized views (if any)
CREATE OR REPLACE FUNCTION refresh_search_indexes() 
RETURNS void AS $$
BEGIN
  -- Refresh any materialized views here
  -- Example: REFRESH MATERIALIZED VIEW search_index_view;
  
  -- Update table statistics
  ANALYZE civic_data;
  ANALYZE documents;
  ANALYZE meetings;
  
  RAISE NOTICE 'Search indexes refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PERFORMANCE MONITORING FUNCTIONS
-- ============================================

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
  schemaname text,
  tablename text,
  indexname text,
  idx_tup_read bigint,
  idx_tup_fetch bigint,
  usage_ratio numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.schemaname::text,
    s.tablename::text,
    s.indexname::text,
    s.idx_tup_read,
    s.idx_tup_fetch,
    CASE WHEN s.idx_tup_read > 0 
      THEN round((s.idx_tup_fetch::numeric / s.idx_tup_read::numeric) * 100, 2)
      ELSE 0 
    END as usage_ratio
  FROM pg_stat_user_indexes s
  ORDER BY s.idx_tup_read DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify slow queries
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
  query text,
  calls bigint,
  total_time double precision,
  mean_time double precision,
  rows bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    substring(q.query, 1, 100) as query,
    q.calls,
    q.total_time,
    q.mean_time,
    q.rows
  FROM pg_stat_statements q
  WHERE q.mean_time > 100 -- queries taking more than 100ms on average
  ORDER BY q.mean_time DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;
