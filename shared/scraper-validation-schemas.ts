import { z } from 'zod';

// Planning Applications Schema
export const PlanningApplicationSchema = z.object({
  reference: z.string().min(1),
  address: z.string().min(1),
  proposal: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected', 'withdrawn', 'under_review']),
  receivedDate: z.date(),
  decisionDate: z.date().nullable(),
  applicantName: z.string().nullable(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).nullable(),
  documentUrls: z.array(z.string().url()),
  sourceUrl: z.string().url(),
  caseOfficer: z.string().nullable(),
  consultationEndDate: z.date().nullable(),
  developmentType: z.string().nullable(),
  parish: z.string().nullable()
});

// Meeting Data Schema
export const MeetingSchema = z.object({
  title: z.string().min(1),
  committee: z.string().min(1),
  meetingDate: z.date(),
  venue: z.string().nullable(),
  agendaUrl: z.string().url().nullable(),
  minutesUrl: z.string().url().nullable(),
  status: z.enum(['scheduled', 'completed', 'cancelled']),
  meetingType: z.enum(['council', 'committee', 'cabinet', 'planning', 'licensing']),
  chairperson: z.string().nullable(),
  attendees: z.array(z.string()).nullable(),
  sourceUrl: z.string().url()
});

// Spending Record Schema  
export const SpendingRecordSchema = z.object({
  transactionDate: z.date(),
  supplier: z.string().min(1),
  department: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  procurementMethod: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  sourceUrl: z.string().url(),
  downloadUrl: z.string().url().nullable(),
  extractedAt: z.date()
});

// Budget Item Schema
export const BudgetItemSchema = z.object({
  department: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().nullable(),
  budgetedAmount: z.number(),
  actualAmount: z.number().nullable(),
  variance: z.number().nullable(),
  currency: z.string().default('GBP'),
  year: z.number().int().min(2020).max(2030),
  period: z.enum(['annual', 'quarterly', 'monthly']),
  description: z.string().nullable(),
  sourceUrl: z.string().url(),
  lastUpdated: z.date()
});

// Statistical Data Schema
export const StatisticalDataSchema = z.object({
  category: z.string().min(1),
  subcategory: z.string().nullable(),
  metric: z.string().min(1),
  value: z.number(),
  unit: z.string(),
  period: z.string(),
  date: z.date(),
  sourceDocument: z.string().url(),
  confidence: z.enum(['low', 'medium', 'high']),
  methodology: z.string().nullable(),
  comparativePeriod: z.object({
    value: z.number(),
    period: z.string()
  }).nullable(),
  lastUpdated: z.date()
});

// Councillor Schema
export const CouncillorSchema = z.object({
  name: z.string().min(1),
  party: z.string().nullable(),
  ward: z.string().min(1),
  position: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  biography: z.string().nullable(),
  committee: z.array(z.string()).nullable(),
  electedDate: z.date().nullable(),
  termEnd: z.date().nullable(),
  imageUrl: z.string().url().nullable(),
  sourceUrl: z.string().url()
});

// Document Schema
export const DocumentSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  type: z.enum(['policy', 'report', 'agenda', 'minutes', 'consultation', 'strategy', 'budget', 'data']),
  department: z.string().min(1),
  publishDate: z.date(),
  effectiveDate: z.date().nullable(),
  expiryDate: z.date().nullable(),
  fileUrl: z.string().url(),
  parentPageUrl: z.string().url(),
  fileType: z.string(),
  fileSize: z.number().positive(),
  category: z.string(),
  tags: z.array(z.string()),
  version: z.string().nullable(),
  status: z.enum(['draft', 'active', 'archived']).default('active'),
  language: z.string().default('en'),
  accessLevel: z.enum(['public', 'restricted']).default('public'),
  extractedData: z.object({
    totalItems: z.number(),
    processingDate: z.date(),
    dataTypes: z.array(z.string())
  }).nullable(),
  lastUpdated: z.date()
});

// Quality Score Schema
export const QualityScoreSchema = z.object({
  overallScore: z.number().min(0).max(100),
  components: z.object({
    contentQuality: z.number().min(0).max(100),
    structuredDataPresence: z.number().min(0).max(100), 
    recency: z.number().min(0).max(100),
    completeness: z.number().min(0).max(100),
    reliability: z.number().min(0).max(100)
  }),
  factors: z.object({
    hasStructuredData: z.boolean(),
    hasTables: z.boolean(),
    hasFinancialData: z.boolean(),
    hasContactInfo: z.boolean(),
    isNavigationPage: z.boolean(),
    contentLength: z.number(),
    lastModified: z.date().nullable()
  }),
  category: z.string(),
  recommendations: z.array(z.string())
});

// Coverage Metrics Schema
export const CoverageMetricsSchema = z.object({
  domain: z.string(),
  category: z.string(),
  dataType: z.string(),
  expectedCount: z.number(),
  actualCount: z.number(),
  coveragePercentage: z.number().min(0).max(100),
  lastCrawled: z.date(),
  issues: z.array(z.object({
    type: z.enum(['404', 'timeout', 'parsing_error', 'access_denied']),
    url: z.string().url(),
    message: z.string(),
    timestamp: z.date()
  })),
  recommendations: z.array(z.string())
});

// Export all schemas
export const ValidationSchemas = {
  PlanningApplication: PlanningApplicationSchema,
  Meeting: MeetingSchema,
  SpendingRecord: SpendingRecordSchema,
  BudgetItem: BudgetItemSchema,
  StatisticalData: StatisticalDataSchema,
  Councillor: CouncillorSchema,
  Document: DocumentSchema,
  QualityScore: QualityScoreSchema,
  CoverageMetrics: CoverageMetricsSchema
};

export type PlanningApplication = z.infer<typeof PlanningApplicationSchema>;
export type Meeting = z.infer<typeof MeetingSchema>;
export type SpendingRecord = z.infer<typeof SpendingRecordSchema>;
export type BudgetItem = z.infer<typeof BudgetItemSchema>;
export type StatisticalData = z.infer<typeof StatisticalDataSchema>;
export type Councillor = z.infer<typeof CouncillorSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type QualityScore = z.infer<typeof QualityScoreSchema>;
export type CoverageMetrics = z.infer<typeof CoverageMetricsSchema>;
