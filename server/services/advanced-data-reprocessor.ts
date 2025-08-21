#!/usr/bin/env tsx

import 'dotenv/config';

/**
 * ADVANCED DATA REPROCESSING SERVICE
 * 
 * This service analyzes and reprocesses all existing council data to provide:
 * - Ward-based categorization of all councillor and contact information
 * - Financial data freshness analysis (filtering data older than 3 years)
 * - Actionable insights extraction and quality scoring
 * - Comprehensive reporting on data coverage and recommendations
 * 
 * CORE FEATURES:
 * - Smart data categorization by ward and type
 * - Freshness scoring with automatic filtering of outdated content
 * - Contact information extraction and organization
 * - Financial data analysis with trend identification
 * - Quality assessment and improvement recommendations
 */

import * as cheerio from 'cheerio';
import { storage } from '../storage';
import { InsertCouncilData } from '@shared/schema';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// ==================================================================================
// CORE INTERFACES & TYPES
// ==================================================================================

interface ProcessedCouncillor {
  name: string;
  title: string;
  ward: string;
  party: string;
  email?: string;
  phone?: string;
  address?: string;
  surgeryTimes?: string;
  responsibilities: string[];
  committees: string[];
  lastUpdated: Date;
  source: string;
  qualityScore: number;
}

interface ProcessedFinancialData {
  id: string;
  title: string;
  amount: number;
  department: string;
  category: 'spending' | 'budget' | 'contract' | 'grant';
  subcategory: string;
  date: Date;
  description: string;
  supplier?: string;
  ward?: string;
  freshness: 'fresh' | 'current' | 'stale' | 'outdated';
  freshnessScore: number;
  actionability: 'high' | 'medium' | 'low';
  publicInterest: 'high' | 'medium' | 'low';
  source: string;
  lastVerified: Date;
}

interface WardProfile {
  wardName: string;
  councillors: ProcessedCouncillor[];
  contactInfo: {
    generalContact?: string;
    emergencyContact?: string;
    offices: string[];
  };
  demographics: {
    population?: number;
    households?: number;
    businesses?: number;
  };
  services: string[];
  recentActivity: {
    planningApplications: number;
    councilDecisions: number;
    publicConsultations: number;
    lastMeetingDate?: Date;
  };
  dataCompleteness: number;
  lastUpdated: Date;
}

interface DataQualityMetrics {
  totalRecords: number;
  freshRecords: number;
  staleRecords: number;
  outdatedRecords: number;
  completenessScore: number;
  actionabilityScore: number;
  publicValueScore: number;
  wardCoverage: { [ward: string]: number };
  dataTypeCoverage: { [type: string]: number };
  recommendations: string[];
  criticalGaps: string[];
}

interface ProcessingSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  recordsProcessed: number;
  recordsUpdated: number;
  recordsFiltered: number;
  wardsProcessed: number;
  financialDataProcessed: number;
  qualityImprovements: number;
  processingStats: {
    councillorDataExtracted: number;
    financialRecordsAnalyzed: number;
    wardProfilesCreated: number;
    contactsOrganized: number;
    outdatedRecordsFiltered: number;
  };
  status: 'running' | 'completed' | 'failed';
}

// ==================================================================================
// MAIN ADVANCED DATA REPROCESSOR CLASS
// ==================================================================================

export class AdvancedDataReprocessor {
  private session: ProcessingSession;
  private wardProfiles = new Map<string, WardProfile>();
  private processedCouncillors: ProcessedCouncillor[] = [];
  private processedFinancialData: ProcessedFinancialData[] = [];
  private qualityMetrics: DataQualityMetrics;

  // Configuration
  private readonly config = {
    // Data freshness thresholds (in days)
    dataFreshness: {
      fresh: 30,      // Less than 30 days old
      current: 180,   // Less than 6 months old  
      stale: 1095,    // Less than 3 years old
      outdated: 1095  // More than 3 years old (filter unless required)
    },

    // Ward mapping for Bolton (comprehensive list)
    boltonWards: [
      'Astley Bridge',
      'Breightmet',
      'Bromley Cross',
      'Burnden',
      'Chorley New Road',
      'Crompton',
      'Farnworth',
      'Great Lever',
      'Halliwell',
      'Harper Green',
      'Heaton and Lostock',
      'Horwich and Blackrod',
      'Horwich North East',
      'Hulton',
      'Kearsley',
      'Little Lever and Darcy Lever',
      'Rumworth',
      'Smithills',
      'Tonge with the Haulgh',
      'Westhoughton North and Chew Moor',
      'Westhoughton South'
    ],

    // Data quality weights
    qualityWeights: {
      freshness: 0.3,
      completeness: 0.25,
      actionability: 0.25,
      publicInterest: 0.2
    },

    // Processing limits
    maxRecordsPerBatch: 1000,
    minQualityScore: 0.4,
    maxDataAge: 3 * 365 * 24 * 60 * 60 * 1000 // 3 years in milliseconds
  };

  constructor() {
    this.session = {
      sessionId: crypto.randomUUID(),
      startTime: new Date(),
      recordsProcessed: 0,
      recordsUpdated: 0,
      recordsFiltered: 0,
      wardsProcessed: 0,
      financialDataProcessed: 0,
      qualityImprovements: 0,
      processingStats: {
        councillorDataExtracted: 0,
        financialRecordsAnalyzed: 0,
        wardProfilesCreated: 0,
        contactsOrganized: 0,
        outdatedRecordsFiltered: 0
      },
      status: 'running'
    };

    this.qualityMetrics = {
      totalRecords: 0,
      freshRecords: 0,
      staleRecords: 0,
      outdatedRecords: 0,
      completenessScore: 0,
      actionabilityScore: 0,
      publicValueScore: 0,
      wardCoverage: {},
      dataTypeCoverage: {},
      recommendations: [],
      criticalGaps: []
    };
  }

  // ==================================================================================
  // MAIN PROCESSING ORCHESTRATION
  // ==================================================================================

  /**
   * Start comprehensive data reprocessing
   */
  async startAdvancedReprocessing(): Promise<void> {
    console.log('🚀 ADVANCED DATA REPROCESSING - STARTING COMPREHENSIVE ANALYSIS');
    console.log('====================================================================');
    console.log(`📊 Session ID: ${this.session.sessionId}`);
    console.log(`🎯 Focus: Fresh data, ward-based organization, actionable insights`);
    console.log(`🗓️ Data Cutoff: ${new Date(Date.now() - this.config.maxDataAge).toLocaleDateString()}`);
    console.log(`🏛️ Ward Coverage: ${this.config.boltonWards.length} Bolton wards`);
    console.log('====================================================================\n');

    try {
      // 1. Load and analyze existing data
      console.log('📥 Loading existing data for analysis...');
      await this.loadAndAnalyzeExistingData();

      // 2. Process councillor and contact information by ward
      console.log('👥 Processing councillor and contact data by ward...');
      await this.processCouncillorDataByWard();

      // 3. Analyze and categorize financial data
      console.log('💰 Analyzing financial data for freshness and relevance...');
      await this.processFinancialDataWithFreshness();

      // 4. Build comprehensive ward profiles
      console.log('🗺️ Building comprehensive ward profiles...');
      await this.buildWardProfiles();

      // 5. Calculate quality metrics and recommendations
      console.log('📊 Calculating data quality and generating recommendations...');
      await this.calculateQualityMetrics();

      // 6. Filter and enhance data
      console.log('🔄 Filtering outdated data and enhancing records...');
      await this.filterAndEnhanceData();

      // 7. Generate comprehensive reports
      console.log('📋 Generating comprehensive analysis reports...');
      await this.generateAdvancedReports();

      this.session.status = 'completed';
      this.session.endTime = new Date();

      const duration = this.session.endTime.getTime() - this.session.startTime.getTime();
      console.log('\n✅ ADVANCED DATA REPROCESSING COMPLETED!');
      console.log('==========================================');
      console.log(`⏱️ Duration: ${Math.round(duration / 1000 / 60)} minutes`);
      console.log(`📊 Records Processed: ${this.session.recordsProcessed}`);
      console.log(`🔄 Records Updated: ${this.session.recordsUpdated}`);
      console.log(`🗑️ Outdated Records Filtered: ${this.session.processingStats.outdatedRecordsFiltered}`);
      console.log(`🏛️ Ward Profiles Created: ${this.session.processingStats.wardProfilesCreated}`);
      console.log(`👥 Councillor Records: ${this.session.processingStats.councillorDataExtracted}`);
      console.log(`💰 Financial Records: ${this.session.processingStats.financialRecordsAnalyzed}`);
      console.log(`📈 Quality Score: ${Math.round(this.qualityMetrics.completenessScore * 100)}%`);

    } catch (error) {
      console.error('❌ Advanced reprocessing failed:', error);
      this.session.status = 'failed';
      this.session.endTime = new Date();
      throw error;
    }
  }

  // ==================================================================================
  // DATA LOADING AND ANALYSIS
  // ==================================================================================

  /**
   * Load and analyze all existing data sources
   */
  private async loadAndAnalyzeExistingData(): Promise<void> {
    // Load from database
    const existingData = await storage.getCouncilData(undefined, 10000);
    console.log(`📊 Loaded ${existingData.length} records from database`);

    // Load from crawler data files
    const crawlerDataPath = './master-crawler-data/datasets/complete-dataset.json';
    let crawlerData: any[] = [];
    
    try {
      const crawlerContent = await fs.readFile(crawlerDataPath, 'utf8');
      crawlerData = JSON.parse(crawlerContent);
      console.log(`🕷️ Loaded ${crawlerData.length} records from crawler data`);
    } catch (error) {
      console.log('⚠️ No crawler data found, proceeding with database data only');
    }

    // Combine and deduplicate data
    const allData = [...existingData, ...crawlerData];
    this.session.recordsProcessed = allData.length;
    this.qualityMetrics.totalRecords = allData.length;

    // Initial quality analysis
    this.analyzeDataQuality(allData);

    console.log(`✅ Analyzed ${allData.length} total records`);
    console.log(`📊 Quality Distribution: Fresh: ${this.qualityMetrics.freshRecords}, Stale: ${this.qualityMetrics.staleRecords}, Outdated: ${this.qualityMetrics.outdatedRecords}`);
  }

  /**
   * Analyze data quality and freshness
   */
  private analyzeDataQuality(data: any[]): void {
    const now = new Date();
    const freshThreshold = new Date(now.getTime() - this.config.dataFreshness.fresh * 24 * 60 * 60 * 1000);
    const currentThreshold = new Date(now.getTime() - this.config.dataFreshness.current * 24 * 60 * 60 * 1000);
    const staleThreshold = new Date(now.getTime() - this.config.dataFreshness.stale * 24 * 60 * 60 * 1000);

    data.forEach(item => {
      const itemDate = new Date(item.date || item.createdAt || item.crawledAt);
      
      if (itemDate >= freshThreshold) {
        this.qualityMetrics.freshRecords++;
      } else if (itemDate >= currentThreshold) {
        this.qualityMetrics.staleRecords++;
      } else if (itemDate >= staleThreshold) {
        this.qualityMetrics.staleRecords++;
      } else {
        this.qualityMetrics.outdatedRecords++;
      }

      // Track data type coverage
      const dataType = item.dataType || 'unknown';
      this.qualityMetrics.dataTypeCoverage[dataType] = (this.qualityMetrics.dataTypeCoverage[dataType] || 0) + 1;
    });
  }

  // ==================================================================================
  // COUNCILLOR AND CONTACT DATA PROCESSING BY WARD
  // ==================================================================================

  /**
   * Process all councillor and contact information, organized by ward
   */
  private async processCouncillorDataByWard(): Promise<void> {
    console.log('👥 Processing councillor data by ward...');

    // Initialize ward profiles
    this.config.boltonWards.forEach(ward => {
      this.wardProfiles.set(ward, {
        wardName: ward,
        councillors: [],
        contactInfo: { offices: [] },
        demographics: {},
        services: [],
        recentActivity: {
          planningApplications: 0,
          councilDecisions: 0,
          publicConsultations: 0
        },
        dataCompleteness: 0,
        lastUpdated: new Date()
      });
    });

    // Get all councillor-related data from database
    const councillorData = await storage.getCouncilData('councillor');
    const meetingData = await storage.getCouncilData('council_meeting');
    
    console.log(`👤 Processing ${councillorData.length} councillor records`);

    // Process each councillor record
    for (const record of councillorData) {
      const councillor = this.extractCouncillorInfo(record);
      if (councillor && councillor.ward) {
        this.processedCouncillors.push(councillor);
        
        const wardProfile = this.wardProfiles.get(councillor.ward);
        if (wardProfile) {
          wardProfile.councillors.push(councillor);
          this.session.processingStats.councillorDataExtracted++;
        }
      }
    }

    // Extract councillor information from meeting data
    for (const record of meetingData) {
      this.extractCouncillorsFromMeetings(record);
    }

    // Load additional councillor data from external sources
    await this.loadCouncillorDataFromWeb();

    console.log(`✅ Processed ${this.processedCouncillors.length} councillor records across ${this.config.boltonWards.length} wards`);
  }

  /**
   * Extract councillor information from data record
   */
  private extractCouncillorInfo(record: any): ProcessedCouncillor | null {
    try {
      const metadata = record.metadata || {};
      const content = record.description || record.title || '';
      
      // Extract basic info
      const name = this.extractName(content, metadata);
      const ward = this.extractWard(content, metadata);
      const party = this.extractParty(content, metadata);
      
      if (!name || !ward) return null;

      return {
        name,
        title: metadata.title || 'Councillor',
        ward,
        party: party || 'Independent',
        email: this.extractEmail(content, metadata),
        phone: this.extractPhone(content, metadata),
        address: this.extractAddress(content, metadata),
        surgeryTimes: this.extractSurgeryTimes(content, metadata),
        responsibilities: this.extractResponsibilities(content, metadata),
        committees: this.extractCommittees(content, metadata),
        lastUpdated: new Date(record.updatedAt || record.createdAt),
        source: record.sourceUrl || 'database',
        qualityScore: this.calculateCouncillorQualityScore({
          hasEmail: !!this.extractEmail(content, metadata),
          hasPhone: !!this.extractPhone(content, metadata),
          hasAddress: !!this.extractAddress(content, metadata),
          hasResponsibilities: this.extractResponsibilities(content, metadata).length > 0,
          dataFreshness: this.calculateFreshness(new Date(record.updatedAt || record.createdAt))
        })
      };
    } catch (error) {
      console.warn('⚠️ Error extracting councillor info:', error);
      return null;
    }
  }

  /**
   * Extract councillor information from meeting records
   */
  private extractCouncillorsFromMeetings(record: any): void {
    try {
      const content = record.description || record.title || '';
      const metadata = record.metadata || {};
      
      // Look for attendee lists, meeting minutes with councillor mentions
      const councillorMentions = this.findCouncillorMentions(content);
      
      councillorMentions.forEach(mention => {
        const existingCouncillor = this.processedCouncillors.find(c => 
          c.name.toLowerCase().includes(mention.name.toLowerCase())
        );
        
        if (existingCouncillor) {
          // Update existing councillor with meeting participation
          if (!existingCouncillor.committees.includes(mention.committee)) {
            existingCouncillor.committees.push(mention.committee);
          }
        } else if (mention.ward) {
          // Create new councillor record
          const newCouncillor: ProcessedCouncillor = {
            name: mention.name,
            title: 'Councillor',
            ward: mention.ward,
            party: mention.party || 'Unknown',
            responsibilities: [],
            committees: mention.committee ? [mention.committee] : [],
            lastUpdated: new Date(record.updatedAt || record.createdAt),
            source: record.sourceUrl || 'meeting_data',
            qualityScore: 0.5 // Lower score as extracted from meetings
          };
          
          this.processedCouncillors.push(newCouncillor);
          
          const wardProfile = this.wardProfiles.get(mention.ward);
          if (wardProfile) {
            wardProfile.councillors.push(newCouncillor);
          }
        }
      });
    } catch (error) {
      console.warn('⚠️ Error extracting councillors from meetings:', error);
    }
  }

  /**
   * Load additional councillor data from web sources
   */
  private async loadCouncillorDataFromWeb(): Promise<void> {
    console.log('🌐 Loading additional councillor data from web sources...');
    
    // This would integrate with the crawler to get fresh councillor data
    // For now, we'll simulate with known data structure improvements
    
    // Fill gaps in ward coverage
    this.config.boltonWards.forEach(ward => {
      const wardProfile = this.wardProfiles.get(ward);
      if (wardProfile && wardProfile.councillors.length === 0) {
        // Add placeholder for missing councillor data
        wardProfile.councillors.push({
          name: `${ward} Representative`,
          title: 'Councillor',
          ward,
          party: 'To Be Determined',
          responsibilities: [],
          committees: [],
          lastUpdated: new Date(),
          source: 'placeholder',
          qualityScore: 0.1
        });
      }
    });
  }

  // ==================================================================================
  // FINANCIAL DATA PROCESSING WITH FRESHNESS ANALYSIS
  // ==================================================================================

  /**
   * Process financial data with freshness analysis and categorization
   */
  private async processFinancialDataWithFreshness(): Promise<void> {
    console.log('💰 Processing financial data with freshness analysis...');

    // Get financial data from database
    const financialData = [
      ...(await storage.getCouncilData('council_spending')),
      ...(await storage.getCouncilData('budget_item')),
      ...(await storage.getCouncilData('transparency_data'))
    ];

    console.log(`💰 Analyzing ${financialData.length} financial records`);

    const now = new Date();
    const threeYearsAgo = new Date(now.getTime() - this.config.maxDataAge);

    for (const record of financialData) {
      const processedRecord = this.processFinancialRecord(record, now, threeYearsAgo);
      if (processedRecord) {
        this.processedFinancialData.push(processedRecord);
        this.session.processingStats.financialRecordsAnalyzed++;
      }
    }

    // Sort by freshness and relevance
    this.processedFinancialData.sort((a, b) => {
      // First by freshness score (higher is better)
      if (a.freshnessScore !== b.freshnessScore) {
        return b.freshnessScore - a.freshnessScore;
      }
      // Then by amount (higher is better for public interest)
      return b.amount - a.amount;
    });

    // Filter out outdated records unless they're high value
    const filteredFinancialData = this.processedFinancialData.filter(record => {
      if (record.freshness === 'outdated') {
        // Keep if high value (>£100k) or high public interest
        return record.amount > 100000 || record.publicInterest === 'high';
      }
      return true;
    });

    const filteredCount = this.processedFinancialData.length - filteredFinancialData.length;
    this.session.processingStats.outdatedRecordsFiltered += filteredCount;
    this.processedFinancialData = filteredFinancialData;

    console.log(`✅ Processed ${this.processedFinancialData.length} financial records`);
    console.log(`🗑️ Filtered out ${filteredCount} outdated records`);
    console.log(`📊 Fresh: ${this.processedFinancialData.filter(r => r.freshness === 'fresh').length}, Current: ${this.processedFinancialData.filter(r => r.freshness === 'current').length}`);
  }

  /**
   * Process individual financial record
   */
  private processFinancialRecord(record: any, now: Date, threeYearsAgo: Date): ProcessedFinancialData | null {
    try {
      const recordDate = new Date(record.date || record.createdAt);
      const amount = record.amount || 0;

      if (amount === 0) return null; // Skip records without financial values

      // Calculate freshness
      const ageInDays = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
      let freshness: 'fresh' | 'current' | 'stale' | 'outdated';
      let freshnessScore: number;

      if (ageInDays <= this.config.dataFreshness.fresh) {
        freshness = 'fresh';
        freshnessScore = 1.0;
      } else if (ageInDays <= this.config.dataFreshness.current) {
        freshness = 'current';
        freshnessScore = 0.8;
      } else if (ageInDays <= this.config.dataFreshness.stale) {
        freshness = 'stale';
        freshnessScore = 0.4;
      } else {
        freshness = 'outdated';
        freshnessScore = 0.1;
      }

      // Determine category and subcategory
      const { category, subcategory } = this.categorizeFinancialData(record);

      // Calculate actionability and public interest
      const actionability = this.calculateActionability(record, amount, freshness);
      const publicInterest = this.calculatePublicInterest(record, amount, category);

      // Extract ward if possible
      const ward = this.extractWardFromLocation(record.location || record.description || '');

      return {
        id: record.id,
        title: record.title,
        amount,
        department: this.extractDepartment(record),
        category,
        subcategory,
        date: recordDate,
        description: record.description || '',
        supplier: this.extractSupplier(record),
        ward,
        freshness,
        freshnessScore,
        actionability,
        publicInterest,
        source: record.sourceUrl || 'database',
        lastVerified: new Date()
      };
    } catch (error) {
      console.warn('⚠️ Error processing financial record:', error);
      return null;
    }
  }

  // ==================================================================================
  // WARD PROFILE BUILDING
  // ==================================================================================

  /**
   * Build comprehensive ward profiles with all available data
   */
  private async buildWardProfiles(): Promise<void> {
    console.log('🗺️ Building comprehensive ward profiles...');

    for (const [wardName, profile] of this.wardProfiles.entries()) {
      // Add financial data for this ward
      const wardFinancialData = this.processedFinancialData.filter(f => f.ward === wardName);
      
      // Add planning application data
      const planningData = await storage.getCouncilData('planning_application');
      const wardPlanningApps = planningData.filter(p => 
        p.location && p.location.toLowerCase().includes(wardName.toLowerCase())
      );

      // Calculate activity metrics
      profile.recentActivity = {
        planningApplications: wardPlanningApps.filter(p => 
          new Date(p.date) >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        ).length,
        councilDecisions: wardFinancialData.filter(f => f.freshness === 'fresh' || f.freshness === 'current').length,
        publicConsultations: 0, // TODO: Extract from consultation data
        lastMeetingDate: this.getLastMeetingDate(wardName)
      };

      // Add services information
      profile.services = this.extractWardServices(wardName, wardFinancialData, wardPlanningApps);

      // Calculate data completeness
      profile.dataCompleteness = this.calculateWardDataCompleteness(profile);

      this.session.processingStats.wardProfilesCreated++;
    }

    console.log(`✅ Built profiles for ${this.wardProfiles.size} wards`);
  }

  /**
   * Calculate ward data completeness score
   */
  private calculateWardDataCompleteness(profile: WardProfile): number {
    let score = 0;
    let maxScore = 0;

    // Councillor data (40% of total)
    maxScore += 40;
    if (profile.councillors.length > 0) {
      const avgCouncillorQuality = profile.councillors.reduce((sum, c) => sum + c.qualityScore, 0) / profile.councillors.length;
      score += avgCouncillorQuality * 40;
    }

    // Contact information (20% of total)
    maxScore += 20;
    if (profile.contactInfo.generalContact) score += 10;
    if (profile.contactInfo.offices.length > 0) score += 10;

    // Recent activity data (25% of total)  
    maxScore += 25;
    if (profile.recentActivity.planningApplications > 0) score += 10;
    if (profile.recentActivity.councilDecisions > 0) score += 10;
    if (profile.recentActivity.lastMeetingDate) score += 5;

    // Services information (15% of total)
    maxScore += 15;
    if (profile.services.length > 0) score += 15;

    return Math.round((score / maxScore) * 100);
  }

  // ==================================================================================
  // QUALITY METRICS AND RECOMMENDATIONS
  // ==================================================================================

  /**
   * Calculate comprehensive quality metrics and generate recommendations
   */
  private async calculateQualityMetrics(): Promise<void> {
    console.log('📊 Calculating quality metrics and generating recommendations...');

    // Calculate overall scores
    this.qualityMetrics.completenessScore = this.calculateCompletenessScore();
    this.qualityMetrics.actionabilityScore = this.calculateActionabilityScore();
    this.qualityMetrics.publicValueScore = this.calculatePublicValueScore();

    // Ward coverage analysis
    this.qualityMetrics.wardCoverage = this.analyzeWardCoverage();

    // Generate recommendations
    this.qualityMetrics.recommendations = this.generateRecommendations();
    this.qualityMetrics.criticalGaps = this.identifyCriticalGaps();

    console.log(`✅ Quality Analysis Complete:`);
    console.log(`   📊 Completeness: ${Math.round(this.qualityMetrics.completenessScore * 100)}%`);
    console.log(`   🎯 Actionability: ${Math.round(this.qualityMetrics.actionabilityScore * 100)}%`);
    console.log(`   🏛️ Public Value: ${Math.round(this.qualityMetrics.publicValueScore * 100)}%`);
    console.log(`   🗺️ Ward Coverage: ${Object.keys(this.qualityMetrics.wardCoverage).length}/${this.config.boltonWards.length} wards`);
  }

  /**
   * Calculate overall data completeness score
   */
  private calculateCompletenessScore(): number {
    let totalScore = 0;
    let maxScore = 0;

    // Councillor data completeness
    this.processedCouncillors.forEach(councillor => {
      totalScore += councillor.qualityScore;
      maxScore += 1;
    });

    // Financial data completeness
    this.processedFinancialData.forEach(financial => {
      let itemScore = 0;
      if (financial.title) itemScore += 0.2;
      if (financial.description) itemScore += 0.2;
      if (financial.department) itemScore += 0.2;
      if (financial.supplier) itemScore += 0.2;
      if (financial.ward) itemScore += 0.2;
      
      totalScore += itemScore;
      maxScore += 1;
    });

    return maxScore > 0 ? totalScore / maxScore : 0;
  }

  /**
   * Calculate actionability score based on how useful the data is
   */
  private calculateActionabilityScore(): number {
    const highActionability = [
      ...this.processedFinancialData.filter(f => f.actionability === 'high'),
      ...this.processedCouncillors.filter(c => c.email || c.phone)
    ];

    const totalData = this.processedFinancialData.length + this.processedCouncillors.length;
    return totalData > 0 ? highActionability.length / totalData : 0;
  }

  /**
   * Calculate public value score
   */
  private calculatePublicValueScore(): number {
    const highValueFinancialData = this.processedFinancialData.filter(f => 
      f.publicInterest === 'high' || f.amount > 50000
    );

    const completeCouncillorProfiles = this.processedCouncillors.filter(c => 
      c.email && (c.phone || c.surgeryTimes)
    );

    const totalRecords = this.processedFinancialData.length + this.processedCouncillors.length;
    const highValueRecords = highValueFinancialData.length + completeCouncillorProfiles.length;

    return totalRecords > 0 ? highValueRecords / totalRecords : 0;
  }

  /**
   * Analyze ward coverage
   */
  private analyzeWardCoverage(): { [ward: string]: number } {
    const coverage: { [ward: string]: number } = {};

    this.wardProfiles.forEach((profile, wardName) => {
      coverage[wardName] = profile.dataCompleteness;
    });

    return coverage;
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Data freshness recommendations
    const outdatedPercentage = (this.qualityMetrics.outdatedRecords / this.qualityMetrics.totalRecords) * 100;
    if (outdatedPercentage > 20) {
      recommendations.push(`${Math.round(outdatedPercentage)}% of data is outdated - prioritize fresh data collection`);
    }

    // Ward coverage recommendations
    const incompleteCoverage = Object.entries(this.qualityMetrics.wardCoverage)
      .filter(([_, score]) => score < 60)
      .length;
    
    if (incompleteCoverage > 5) {
      recommendations.push(`${incompleteCoverage} wards have incomplete data coverage - focus collection efforts`);
    }

    // Contact information recommendations
    const councillorsWithoutContact = this.processedCouncillors.filter(c => !c.email && !c.phone).length;
    if (councillorsWithoutContact > 0) {
      recommendations.push(`${councillorsWithoutContact} councillors missing contact information`);
    }

    // Financial data recommendations
    const recentFinancialData = this.processedFinancialData.filter(f => 
      f.freshness === 'fresh' || f.freshness === 'current'
    ).length;
    
    if (recentFinancialData < 50) {
      recommendations.push(`Only ${recentFinancialData} recent financial records - increase financial transparency data collection`);
    }

    return recommendations;
  }

  /**
   * Identify critical data gaps
   */
  private identifyCriticalGaps(): string[] {
    const gaps: string[] = [];

    // Check for wards with no councillor data
    this.config.boltonWards.forEach(ward => {
      const profile = this.wardProfiles.get(ward);
      if (!profile || profile.councillors.length === 0 || profile.councillors.every(c => c.qualityScore < 0.3)) {
        gaps.push(`Critical: ${ward} ward has no quality councillor data`);
      }
    });

    // Check for missing financial data in key areas
    const budgetData = this.processedFinancialData.filter(f => f.category === 'budget');
    if (budgetData.length === 0) {
      gaps.push('Critical: No budget data available');
    }

    // Check for missing recent data
    const recentData = this.processedFinancialData.filter(f => f.freshness === 'fresh');
    if (recentData.length < 10) {
      gaps.push('Critical: Very limited fresh financial data available');
    }

    return gaps;
  }

  // ==================================================================================
  // DATA FILTERING AND ENHANCEMENT
  // ==================================================================================

  /**
   * Filter outdated data and enhance existing records
   */
  private async filterAndEnhanceData(): Promise<void> {
    console.log('🔄 Filtering outdated data and enhancing records...');

    let recordsUpdated = 0;

    // Update existing council data in database
    for (const councillor of this.processedCouncillors) {
      if (councillor.qualityScore >= this.config.minQualityScore) {
        try {
          const councilData: InsertCouncilData = {
            title: `${councillor.title} ${councillor.name} - ${councillor.ward}`,
            description: this.generateCouncillorDescription(councillor),
            dataType: 'councillor',
            sourceUrl: councillor.source,
            date: councillor.lastUpdated,
            location: councillor.ward,
            metadata: {
              councillor: councillor,
              ward: councillor.ward,
              party: councillor.party,
              qualityScore: councillor.qualityScore,
              lastVerified: new Date(),
              dataType: 'processed_councillor'
            }
          };

          await storage.createCouncilData(councilData);
          recordsUpdated++;
        } catch (error) {
          console.warn('⚠️ Error updating councillor data:', error);
        }
      }
    }

    // Update financial data
    for (const financial of this.processedFinancialData.slice(0, 100)) { // Limit to prevent overwhelming
      if (financial.freshnessScore >= 0.4) {
        try {
          const councilData: InsertCouncilData = {
            title: financial.title,
            description: financial.description,
            dataType: 'financial_data',
            sourceUrl: financial.source,
            date: financial.date,
            location: financial.ward,
            amount: financial.amount,
            metadata: {
              financial: financial,
              department: financial.department,
              category: financial.category,
              supplier: financial.supplier,
              freshness: financial.freshness,
              freshnessScore: financial.freshnessScore,
              actionability: financial.actionability,
              publicInterest: financial.publicInterest,
              lastVerified: new Date(),
              dataType: 'processed_financial'
            }
          };

          await storage.createCouncilData(councilData);
          recordsUpdated++;
        } catch (error) {
          console.warn('⚠️ Error updating financial data:', error);
        }
      }
    }

    this.session.recordsUpdated = recordsUpdated;
    console.log(`✅ Updated ${recordsUpdated} records in database`);
  }

  // ==================================================================================
  // COMPREHENSIVE REPORTING
  // ==================================================================================

  /**
   * Generate comprehensive analysis reports
   */
  private async generateAdvancedReports(): Promise<void> {
    console.log('📋 Generating comprehensive reports...');

    const reportsDir = './advanced-data-analysis';
    await fs.mkdir(reportsDir, { recursive: true });
    await fs.mkdir(path.join(reportsDir, 'ward-profiles'), { recursive: true });
    await fs.mkdir(path.join(reportsDir, 'financial-analysis'), { recursive: true });
    await fs.mkdir(path.join(reportsDir, 'quality-reports'), { recursive: true });

    // 1. Executive Summary Report
    const executiveReport = {
      processingSession: this.session,
      qualityMetrics: this.qualityMetrics,
      keyFindings: this.generateKeyFindings(),
      actionableInsights: this.generateActionableInsights(),
      wardSummary: this.generateWardSummary(),
      financialSummary: this.generateFinancialSummary(),
      recommendationsPrioritized: this.prioritizeRecommendations()
    };

    await fs.writeFile(
      path.join(reportsDir, 'executive-summary.json'),
      JSON.stringify(executiveReport, null, 2)
    );

    // 2. Ward-by-Ward Analysis
    for (const [wardName, profile] of this.wardProfiles.entries()) {
      const wardReport = {
        ward: wardName,
        profile: profile,
        councillorDetails: profile.councillors,
        financialData: this.processedFinancialData.filter(f => f.ward === wardName),
        dataQuality: {
          completeness: profile.dataCompleteness,
          recommendations: this.generateWardRecommendations(profile),
          criticalGaps: this.identifyWardGaps(profile)
        },
        publicValue: this.calculateWardPublicValue(profile)
      };

      await fs.writeFile(
        path.join(reportsDir, 'ward-profiles', `${wardName.replace(/\s+/g, '-').toLowerCase()}-profile.json`),
        JSON.stringify(wardReport, null, 2)
      );
    }

    // 3. Financial Analysis Report
    const financialReport = {
      summary: {
        totalRecords: this.processedFinancialData.length,
        totalValue: this.processedFinancialData.reduce((sum, f) => sum + f.amount, 0),
        byDepartment: this.groupFinancialDataByDepartment(),
        byWard: this.groupFinancialDataByWard(),
        byFreshness: this.groupFinancialDataByFreshness()
      },
      highValueTransactions: this.processedFinancialData
        .filter(f => f.amount > 100000)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 50),
      recentActivity: this.processedFinancialData
        .filter(f => f.freshness === 'fresh')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 100),
      recommendations: this.generateFinancialRecommendations()
    };

    await fs.writeFile(
      path.join(reportsDir, 'financial-analysis', 'comprehensive-financial-report.json'),
      JSON.stringify(financialReport, null, 2)
    );

    // 4. Data Quality Report
    const qualityReport = {
      overall: this.qualityMetrics,
      detailedAnalysis: {
        councillorData: {
          total: this.processedCouncillors.length,
          highQuality: this.processedCouncillors.filter(c => c.qualityScore >= 0.8).length,
          withContact: this.processedCouncillors.filter(c => c.email || c.phone).length,
          completeness: this.analyzeCouncillorCompleteness()
        },
        financialData: {
          total: this.processedFinancialData.length,
          fresh: this.processedFinancialData.filter(f => f.freshness === 'fresh').length,
          actionable: this.processedFinancialData.filter(f => f.actionability === 'high').length,
          completeness: this.analyzeFinancialCompleteness()
        }
      },
      improvementPlan: this.generateImprovementPlan()
    };

    await fs.writeFile(
      path.join(reportsDir, 'quality-reports', 'data-quality-analysis.json'),
      JSON.stringify(qualityReport, null, 2)
    );

    console.log('✅ Generated comprehensive reports');
    console.log(`📁 Reports saved to: ${reportsDir}`);
  }

  // ==================================================================================
  // UTILITY METHODS AND DATA EXTRACTION
  // ==================================================================================

  // Helper methods for data extraction and processing
  private extractName(content: string, metadata: any): string | null {
    // Extract name from content or metadata
    const patterns = [
      /(?:Councillor|Cllr)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)/g
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[0].replace(/^(Councillor|Cllr)\s+/i, '').trim();
    }

    return metadata.name || null;
  }

  private extractWard(content: string, metadata: any): string | null {
    // Try metadata first
    if (metadata.ward) return metadata.ward;

    // Look for ward mentions in content
    for (const ward of this.config.boltonWards) {
      if (content.toLowerCase().includes(ward.toLowerCase())) {
        return ward;
      }
    }

    return null;
  }

  private extractParty(content: string, metadata: any): string | null {
    const parties = ['Conservative', 'Labour', 'Liberal Democrat', 'Green', 'Independent', 'UKIP'];
    
    for (const party of parties) {
      if (content.toLowerCase().includes(party.toLowerCase())) {
        return party;
      }
    }

    return metadata.party || null;
  }

  private extractEmail(content: string, metadata: any): string | null {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const match = content.match(emailPattern);
    return match ? match[0] : metadata.email || null;
  }

  private extractPhone(content: string, metadata: any): string | null {
    const phonePattern = /(?:\+44|0)(?:\d\s?){10,11}/g;
    const match = content.match(phonePattern);
    return match ? match[0] : metadata.phone || null;
  }

  private extractAddress(content: string, metadata: any): string | null {
    // Look for address patterns
    const addressPatterns = [
      /\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Road|Street|Lane|Avenue|Drive|Close)/gi,
      /[A-Z][a-z]+\s+(?:House|Building|Centre|Center)/gi
    ];

    for (const pattern of addressPatterns) {
      const match = content.match(pattern);
      if (match) return match[0];
    }

    return metadata.address || null;
  }

  private extractSurgeryTimes(content: string, metadata: any): string | null {
    const surgeryPattern = /surgery:?\s*([^.]+)/gi;
    const match = content.match(surgeryPattern);
    return match ? match[0] : metadata.surgeryTimes || null;
  }

  private extractResponsibilities(content: string, metadata: any): string[] {
    const responsibilities: string[] = [];
    
    const patterns = [
      /(?:responsible for|oversees|chairs?|leads?)\s+([^.]+)/gi,
      /portfolio:?\s*([^.]+)/gi
    ];

    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        responsibilities.push(...matches.map(m => m.replace(/^[^:]+:\s*/, '').trim()));
      }
    });

    return [...new Set(responsibilities)]; // Remove duplicates
  }

  private extractCommittees(content: string, metadata: any): string[] {
    const committees: string[] = [];
    
    const committeeKeywords = [
      'Planning Committee', 'Finance Committee', 'Education Committee',
      'Housing Committee', 'Environment Committee', 'Licensing Committee',
      'Audit Committee', 'Standards Committee'
    ];

    committeeKeywords.forEach(committee => {
      if (content.toLowerCase().includes(committee.toLowerCase())) {
        committees.push(committee);
      }
    });

    return [...new Set(committees)];
  }

  private calculateCouncillorQualityScore(factors: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasAddress: boolean;
    hasResponsibilities: boolean;
    dataFreshness: number;
  }): number {
    let score = 0;

    if (factors.hasEmail) score += 0.25;
    if (factors.hasPhone) score += 0.25;
    if (factors.hasAddress) score += 0.15;
    if (factors.hasResponsibilities) score += 0.15;
    score += factors.dataFreshness * 0.2;

    return Math.min(1, score);
  }

  private calculateFreshness(date: Date): number {
    const now = new Date();
    const ageInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays <= 30) return 1.0;
    if (ageInDays <= 90) return 0.8;
    if (ageInDays <= 180) return 0.6;
    if (ageInDays <= 365) return 0.4;
    return 0.2;
  }

  private findCouncillorMentions(content: string): Array<{
    name: string;
    ward?: string;
    party?: string;
    committee?: string;
  }> {
    const mentions: Array<{
      name: string;
      ward?: string;
      party?: string;
      committee?: string;
    }> = [];

    // Simple pattern for now - would be enhanced with NLP
    const patterns = [
      /(?:Councillor|Cllr)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        mentions.push({
          name: match[1],
          ward: this.extractWardFromContext(content, match.index),
          committee: this.extractCommitteeFromContext(content, match.index)
        });
      }
    });

    return mentions;
  }

  private extractWardFromContext(content: string, position: number): string | null {
    // Look for ward names near the mention
    const contextWindow = 200;
    const start = Math.max(0, position - contextWindow);
    const end = Math.min(content.length, position + contextWindow);
    const context = content.substring(start, end);

    for (const ward of this.config.boltonWards) {
      if (context.toLowerCase().includes(ward.toLowerCase())) {
        return ward;
      }
    }

    return null;
  }

  private extractCommitteeFromContext(content: string, position: number): string | null {
    const contextWindow = 100;
    const start = Math.max(0, position - contextWindow);
    const end = Math.min(content.length, position + contextWindow);
    const context = content.substring(start, end);

    const committees = ['Planning', 'Finance', 'Education', 'Housing', 'Environment'];
    
    for (const committee of committees) {
      if (context.toLowerCase().includes(committee.toLowerCase())) {
        return `${committee} Committee`;
      }
    }

    return null;
  }

  private categorizeFinancialData(record: any): { category: 'spending' | 'budget' | 'contract' | 'grant'; subcategory: string } {
    const title = (record.title || '').toLowerCase();
    const description = (record.description || '').toLowerCase();
    const content = `${title} ${description}`;

    if (content.includes('contract') || content.includes('procurement')) {
      return { category: 'contract', subcategory: 'procurement' };
    }
    if (content.includes('grant') || content.includes('funding')) {
      return { category: 'grant', subcategory: 'funding' };
    }
    if (content.includes('budget') || content.includes('allocation')) {
      return { category: 'budget', subcategory: 'allocation' };
    }
    
    return { category: 'spending', subcategory: 'operational' };
  }

  private calculateActionability(record: any, amount: number, freshness: string): 'high' | 'medium' | 'low' {
    if (freshness === 'fresh' && amount > 50000) return 'high';
    if (freshness === 'current' && amount > 10000) return 'high';
    if (freshness === 'fresh' || amount > 25000) return 'medium';
    return 'low';
  }

  private calculatePublicInterest(record: any, amount: number, category: string): 'high' | 'medium' | 'low' {
    if (amount > 100000) return 'high';
    if (category === 'contract' && amount > 25000) return 'high';
    if (amount > 10000) return 'medium';
    return 'low';
  }

  private extractDepartment(record: any): string {
    const metadata = record.metadata || {};
    return metadata.department || 'Unknown Department';
  }

  private extractSupplier(record: any): string | undefined {
    const metadata = record.metadata || {};
    return metadata.supplier || metadata.contractor;
  }

  private extractWardFromLocation(location: string): string | null {
    for (const ward of this.config.boltonWards) {
      if (location.toLowerCase().includes(ward.toLowerCase())) {
        return ward;
      }
    }
    return null;
  }

  private extractWardServices(wardName: string, financialData: ProcessedFinancialData[], planningData: any[]): string[] {
    const services = new Set<string>();
    
    // Extract from financial data
    financialData.forEach(f => {
      if (f.department !== 'Unknown Department') {
        services.add(f.department);
      }
    });

    // Add standard ward services
    services.add('Planning Applications');
    services.add('Council Tax');
    services.add('Housing Services');
    services.add('Environmental Services');

    return Array.from(services);
  }

  private getLastMeetingDate(wardName: string): Date | undefined {
    // This would query meeting data - placeholder for now
    return new Date();
  }

  private generateCouncillorDescription(councillor: ProcessedCouncillor): string {
    let description = `${councillor.title} ${councillor.name} represents ${councillor.ward} ward`;
    
    if (councillor.party !== 'Unknown') {
      description += ` as a ${councillor.party} councillor`;
    }
    
    if (councillor.responsibilities.length > 0) {
      description += `. Responsibilities include: ${councillor.responsibilities.join(', ')}`;
    }
    
    if (councillor.committees.length > 0) {
      description += `. Serves on: ${councillor.committees.join(', ')}`;
    }

    if (councillor.email) {
      description += `. Contact: ${councillor.email}`;
    }

    return description;
  }

  // Report generation helpers
  private generateKeyFindings(): string[] {
    return [
      `Processed ${this.session.recordsProcessed} total records`,
      `${this.processedCouncillors.length} councillor profiles created`,
      `${this.processedFinancialData.length} financial records analyzed`,
      `${this.wardProfiles.size} ward profiles built`,
      `${this.session.processingStats.outdatedRecordsFiltered} outdated records filtered`,
      `Data completeness: ${Math.round(this.qualityMetrics.completenessScore * 100)}%`
    ];
  }

  private generateActionableInsights(): string[] {
    const insights: string[] = [];

    // High-value financial insights
    const highValueRecords = this.processedFinancialData.filter(f => f.amount > 100000);
    if (highValueRecords.length > 0) {
      insights.push(`${highValueRecords.length} high-value financial transactions identified (>£100k)`);
    }

    // Contact completeness insights
    const contactableCouncillors = this.processedCouncillors.filter(c => c.email || c.phone);
    insights.push(`${contactableCouncillors.length}/${this.processedCouncillors.length} councillors have contact information`);

    // Fresh data insights
    const freshFinancialData = this.processedFinancialData.filter(f => f.freshness === 'fresh');
    insights.push(`${freshFinancialData.length} financial records are fresh (last 30 days)`);

    return insights;
  }

  private generateWardSummary(): any {
    const summary: any = {
      totalWards: this.wardProfiles.size,
      averageCompleteness: 0,
      fullyProfiledWards: 0,
      wardsNeedingAttention: []
    };

    let totalCompleteness = 0;
    this.wardProfiles.forEach((profile, wardName) => {
      totalCompleteness += profile.dataCompleteness;
      
      if (profile.dataCompleteness >= 80) {
        summary.fullyProfiledWards++;
      } else if (profile.dataCompleteness < 50) {
        summary.wardsNeedingAttention.push({
          ward: wardName,
          completeness: profile.dataCompleteness,
          issues: profile.councillors.length === 0 ? ['No councillor data'] : []
        });
      }
    });

    summary.averageCompleteness = Math.round(totalCompleteness / this.wardProfiles.size);

    return summary;
  }

  private generateFinancialSummary(): any {
    const totalValue = this.processedFinancialData.reduce((sum, f) => sum + f.amount, 0);
    
    return {
      totalRecords: this.processedFinancialData.length,
      totalValue,
      averageTransaction: Math.round(totalValue / this.processedFinancialData.length),
      freshRecords: this.processedFinancialData.filter(f => f.freshness === 'fresh').length,
      highValueRecords: this.processedFinancialData.filter(f => f.amount > 100000).length,
      byDepartment: this.groupFinancialDataByDepartment()
    };
  }

  private prioritizeRecommendations(): string[] {
    const recommendations = [...this.qualityMetrics.recommendations];
    const criticalGaps = [...this.qualityMetrics.criticalGaps];

    // Prioritize critical gaps first
    return [...criticalGaps, ...recommendations];
  }

  private groupFinancialDataByDepartment(): any {
    const groups: any = {};
    
    this.processedFinancialData.forEach(f => {
      if (!groups[f.department]) {
        groups[f.department] = { count: 0, total: 0 };
      }
      groups[f.department].count++;
      groups[f.department].total += f.amount;
    });

    return groups;
  }

  private groupFinancialDataByWard(): any {
    const groups: any = {};
    
    this.processedFinancialData.forEach(f => {
      const ward = f.ward || 'Unspecified';
      if (!groups[ward]) {
        groups[ward] = { count: 0, total: 0 };
      }
      groups[ward].count++;
      groups[ward].total += f.amount;
    });

    return groups;
  }

  private groupFinancialDataByFreshness(): any {
    const groups = { fresh: 0, current: 0, stale: 0, outdated: 0 };
    
    this.processedFinancialData.forEach(f => {
      groups[f.freshness]++;
    });

    return groups;
  }

  private generateWardRecommendations(profile: WardProfile): string[] {
    const recommendations: string[] = [];

    if (profile.councillors.length === 0) {
      recommendations.push('Critical: No councillor data available - urgent data collection needed');
    } else if (profile.councillors.every(c => c.qualityScore < 0.5)) {
      recommendations.push('Low quality councillor data - improve contact information');
    }

    if (profile.recentActivity.planningApplications === 0) {
      recommendations.push('No recent planning application data - verify ward activity');
    }

    if (profile.services.length < 3) {
      recommendations.push('Limited service information - expand service mapping');
    }

    return recommendations;
  }

  private identifyWardGaps(profile: WardProfile): string[] {
    const gaps: string[] = [];

    if (profile.councillors.length === 0) {
      gaps.push('No councillor representation data');
    }

    if (!profile.contactInfo.generalContact) {
      gaps.push('No general contact information');
    }

    if (profile.dataCompleteness < 30) {
      gaps.push('Very low data completeness');
    }

    return gaps;
  }

  private calculateWardPublicValue(profile: WardProfile): number {
    let score = 0;

    // Councillor accessibility
    const contactableCouncillors = profile.councillors.filter(c => c.email || c.phone).length;
    if (contactableCouncillors > 0) score += 30;

    // Recent activity
    if (profile.recentActivity.planningApplications > 0) score += 20;
    if (profile.recentActivity.councilDecisions > 0) score += 20;

    // Service coverage
    if (profile.services.length >= 5) score += 20;

    // Data quality
    if (profile.dataCompleteness >= 80) score += 10;

    return score;
  }

  private generateFinancialRecommendations(): string[] {
    const recommendations: string[] = [];

    const freshData = this.processedFinancialData.filter(f => f.freshness === 'fresh');
    if (freshData.length < 50) {
      recommendations.push(`Only ${freshData.length} fresh financial records - increase collection frequency`);
    }

    const highValueData = this.processedFinancialData.filter(f => f.publicInterest === 'high');
    recommendations.push(`${highValueData.length} high public interest transactions identified - ensure transparency`);

    const wardMapping = this.processedFinancialData.filter(f => f.ward);
    if (wardMapping.length < this.processedFinancialData.length * 0.5) {
      recommendations.push('Less than 50% of financial data mapped to wards - improve location tagging');
    }

    return recommendations;
  }

  private analyzeCouncillorCompleteness(): any {
    return {
      withEmail: this.processedCouncillors.filter(c => c.email).length,
      withPhone: this.processedCouncillors.filter(c => c.phone).length,
      withAddress: this.processedCouncillors.filter(c => c.address).length,
      withResponsibilities: this.processedCouncillors.filter(c => c.responsibilities.length > 0).length,
      averageQuality: this.processedCouncillors.reduce((sum, c) => sum + c.qualityScore, 0) / this.processedCouncillors.length
    };
  }

  private analyzeFinancialCompleteness(): any {
    return {
      withDepartment: this.processedFinancialData.filter(f => f.department !== 'Unknown Department').length,
      withSupplier: this.processedFinancialData.filter(f => f.supplier).length,
      withWard: this.processedFinancialData.filter(f => f.ward).length,
      averageFreshness: this.processedFinancialData.reduce((sum, f) => sum + f.freshnessScore, 0) / this.processedFinancialData.length
    };
  }

  private generateImprovementPlan(): any {
    return {
      immediate: [
        'Collect missing councillor contact information',
        'Update outdated financial data',
        'Map financial transactions to wards'
      ],
      shortTerm: [
        'Implement automated data freshness monitoring',
        'Enhance ward profile completeness',
        'Improve data categorization accuracy'
      ],
      longTerm: [
        'Build real-time data integration',
        'Implement predictive data quality scoring',
        'Create automated councillor profile updates'
      ]
    };
  }
}

// ==================================================================================
// EXECUTION
// ==================================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const reprocessor = new AdvancedDataReprocessor();
  
  reprocessor.startAdvancedReprocessing()
    .then(() => {
      console.log('🎉 Advanced data reprocessing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Advanced data reprocessing failed:', error);
      process.exit(1);
    });
}
