import { z } from 'zod';

// Core Council Data Types for Resident Understanding

// Financial and Budget Data
export const budgetItemSchema = z.object({
  id: z.string().optional(),
  department: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  amount: z.number(),
  currency: z.string().default('GBP'),
  year: z.number(),
  quarter: z.number().optional(),
  description: z.string(),
  sourceDocument: z.string(),
  lastUpdated: z.date(),
  metadata: z.record(z.any()).optional()
});

export const spendingRecordSchema = z.object({
  id: z.string().optional(),
  transactionDate: z.date(),
  supplier: z.string(),
  department: z.string(),
  description: z.string(),
  amount: z.number(),
  paymentMethod: z.string().optional(),
  category: z.string(),
  invoiceNumber: z.string().optional(),
  sourceUrl: z.string(),
  extractedAt: z.date()
});

// Council Structure and Personnel
export const councillorSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  title: z.string().optional(),
  ward: z.string(),
  party: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  photoUrl: z.string().optional(),
  biography: z.string().optional(),
  committees: z.array(z.string()),
  responsibilities: z.array(z.string()),
  termStart: z.date().optional(),
  termEnd: z.date().optional(),
  surgeryTimes: z.string().optional(),
  lastUpdated: z.date()
});

export const departmentSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  headOfDepartment: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  services: z.array(z.string()),
  budget: z.number().optional(),
  staffCount: z.number().optional(),
  responsibilities: z.array(z.string()),
  lastUpdated: z.date()
});

// Meetings and Decisions
export const meetingSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  committee: z.string(),
  date: z.date(),
  time: z.string().optional(),
  venue: z.string().optional(),
  agendaUrl: z.string().optional(),
  minutesUrl: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']),
  attendees: z.array(z.string()),
  publicAccess: z.boolean().default(true),
  webcastUrl: z.string().optional(),
  decisions: z.array(z.string()),
  lastUpdated: z.date()
});

export const decisionSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  committee: z.string(),
  decisionDate: z.date(),
  decisionType: z.enum(['policy', 'budget', 'planning', 'service', 'other']),
  impact: z.enum(['high', 'medium', 'low']),
  affectedAreas: z.array(z.string()),
  financialImpact: z.number().optional(),
  implementationDate: z.date().optional(),
  status: z.enum(['proposed', 'approved', 'rejected', 'implemented']),
  votingRecord: z.record(z.string()).optional(),
  sourceUrl: z.string(),
  lastUpdated: z.date()
});

// Services and Performance
export const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  department: z.string(),
  category: z.string(),
  contactDetails: z.string().optional(),
  onlineAccess: z.boolean().default(false),
  cost: z.string().optional(),
  eligibilityCriteria: z.string().optional(),
  processingTime: z.string().optional(),
  lastUpdated: z.date()
});

export const performanceMetricSchema = z.object({
  id: z.string().optional(),
  service: z.string(),
  metric: z.string(),
  value: z.number(),
  unit: z.string(),
  target: z.number().optional(),
  period: z.string(),
  date: z.date(),
  trend: z.enum(['improving', 'stable', 'declining']).optional(),
  benchmark: z.number().optional(),
  sourceUrl: z.string(),
  lastUpdated: z.date()
});

// Planning and Development
export const planningApplicationSchema = z.object({
  id: z.string().optional(),
  applicationNumber: z.string(),
  address: z.string(),
  description: z.string(),
  applicant: z.string().optional(),
  agent: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'withdrawn']),
  submissionDate: z.date(),
  decisionDate: z.date().optional(),
  decisionType: z.string().optional(),
  officer: z.string().optional(),
  ward: z.string(),
  publicConsultation: z.boolean().default(false),
  consultationEndDate: z.date().optional(),
  documents: z.array(z.string()),
  objections: z.number().optional(),
  supportingComments: z.number().optional(),
  lastUpdated: z.date()
});

// Documents and Files
export const documentSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(['policy', 'report', 'budget', 'minutes', 'agenda', 'strategy', 'consultation', 'data']),
  department: z.string(),
  fileUrl: z.string(),
  fileType: z.string(),
  fileSize: z.number().optional(),
  publishDate: z.date(),
  lastModified: z.date().optional(),
  category: z.string(),
  tags: z.array(z.string()),
  accessLevel: z.enum(['public', 'restricted']).default('public'),
  extractedData: z.record(z.any()).optional(),
  lastUpdated: z.date()
});

// Statistical Data for Charts
export const statisticalDataSchema = z.object({
  id: z.string().optional(),
  category: z.string(),
  subcategory: z.string().optional(),
  metric: z.string(),
  value: z.number(),
  unit: z.string(),
  period: z.string(),
  date: z.date(),
  geography: z.string().optional(), // ward, borough, etc.
  demographic: z.string().optional(),
  sourceDocument: z.string(),
  methodology: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  lastUpdated: z.date()
});

// Policy and Consultation
export const policySchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  department: z.string(),
  status: z.enum(['draft', 'consultation', 'approved', 'implemented', 'archived']),
  adoptionDate: z.date().optional(),
  reviewDate: z.date().optional(),
  relatedPolicies: z.array(z.string()),
  objectives: z.array(z.string()),
  targetAudience: z.array(z.string()),
  successMetrics: z.array(z.string()),
  documentUrl: z.string(),
  lastUpdated: z.date()
});

export const consultationSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(['upcoming', 'active', 'closed', 'analysis', 'responded']),
  method: z.array(z.string()), // online, meetings, surveys, etc.
  targetAudience: z.string(),
  responses: z.number().optional(),
  summaryUrl: z.string().optional(),
  outcomeUrl: z.string().optional(),
  relatedPolicy: z.string().optional(),
  lastUpdated: z.date()
});

// Chart-ready aggregated data
export const chartDataSchema = z.object({
  id: z.string().optional(),
  chartType: z.enum(['line', 'bar', 'pie', 'area', 'scatter', 'map']),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  dataPoints: z.array(z.object({
    label: z.string(),
    value: z.number(),
    date: z.date().optional(),
    metadata: z.record(z.any()).optional()
  })),
  unit: z.string(),
  timeframe: z.string(),
  updateFrequency: z.string(),
  sourceUrls: z.array(z.string()),
  lastUpdated: z.date()
});

// Citation and Fact-checking Schemas
export const citationMetadataSchema = z.object({
  sourceUrl: z.string(),
  fileUrl: z.string().optional(),
  parentPageUrl: z.string().optional(),
  title: z.string().optional(),
  type: z.string().optional(),
  fileType: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  dateAdded: z.date().optional(),
  lastVerified: z.date().optional(),
  accessible: z.boolean().optional(),
  verificationStatus: z.string().optional(),
  extractionMethod: z.string().optional(),
  pageReference: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const multipleSourcesSchema = z.object({
  sources: z.array(citationMetadataSchema),
  primarySource: citationMetadataSchema,
  overallConfidence: z.enum(['high', 'medium', 'low']),
  lastVerified: z.date().optional(),
  crossReferenced: z.boolean().default(false),
  conflictingInfo: z.boolean().default(false),
  verificationNotes: z.string().optional()
});

// Comprehensive council data insert schema
export const insertCouncilDataEnhanced = z.object({
  title: z.string(),
  description: z.string(),
  dataType: z.enum([
    'budget_item', 'spending_record', 'councillor', 'department',
    'meeting', 'decision', 'service', 'performance_metric',
    'planning_application', 'document', 'statistical_data',
    'policy', 'consultation', 'chart_data'
  ]),
  category: z.string(),
  subcategory: z.string().optional(),
  sourceUrl: z.string(),
  fileUrl: z.string().optional(), // Direct file link for citations
  parentPageUrl: z.string().optional(), // Parent page URL for context
  department: z.string().optional(),
  ward: z.string().optional(),
  amount: z.number().optional(),
  value: z.number().optional(),
  unit: z.string().optional(),
  date: z.date(),
  status: z.string().optional(),
  location: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  residentImpact: z.enum(['high', 'medium', 'low', 'none']).default('medium'),
  publicInterest: z.boolean().default(true),
  extractedData: z.record(z.any()).optional(),
  structuredData: z.record(z.any()).optional(),
  relatedItems: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  confidence: z.enum(['high', 'medium', 'low']).default('medium'),
  lastValidated: z.date().optional(),
  metadata: z.record(z.any()).optional(),
  citationMetadata: citationMetadataSchema.optional(), // Enhanced citation info
  allSources: multipleSourcesSchema.optional() // All sources for fact-checking
});

// Type exports for TypeScript
export type BudgetItem = z.infer<typeof budgetItemSchema>;
export type SpendingRecord = z.infer<typeof spendingRecordSchema>;
export type Councillor = z.infer<typeof councillorSchema>;
export type Department = z.infer<typeof departmentSchema>;
export type Meeting = z.infer<typeof meetingSchema>;
export type Decision = z.infer<typeof decisionSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type PerformanceMetric = z.infer<typeof performanceMetricSchema>;
export type PlanningApplication = z.infer<typeof planningApplicationSchema>;
export type Document = z.infer<typeof documentSchema>;
export type StatisticalData = z.infer<typeof statisticalDataSchema>;
export type Policy = z.infer<typeof policySchema>;
export type Consultation = z.infer<typeof consultationSchema>;
export type ChartData = z.infer<typeof chartDataSchema>;
export type CitationMetadata = z.infer<typeof citationMetadataSchema>;
export type MultipleSources = z.infer<typeof multipleSourcesSchema>;
export type InsertCouncilDataEnhanced = z.infer<typeof insertCouncilDataEnhanced>;
