#!/usr/bin/env tsx

/**
 * AUTOMATED DATA PROCESSING PIPELINE
 * 
 * Orchestrates the entire data reprocessing workflow:
 * - Runs the Master Unified Crawler to collect fresh data
 * - Executes the Advanced Data Reprocessor to analyze and categorize data
 * - Generates comprehensive visualizations and reports
 * - Provides scheduling and monitoring capabilities
 * 
 * This pipeline ensures data stays fresh and actionable automatically.
 */

import 'dotenv/config';
import cron from 'node-cron';
import { AdvancedDataReprocessor } from './advanced-data-reprocessor.js';
import { DataVisualizationEngine } from './data-visualization-engine.js';
import { CompleteMasterUnifiedCrawler } from './master-unified-crawler.js';
import fs from 'fs/promises';
import path from 'path';

interface PipelineConfig {
  scheduling: {
    fullCrawl: string;        // Cron expression for full crawl
    dataReprocessing: string; // Cron expression for data reprocessing
    visualization: string;    // Cron expression for visualization updates
  };
  dataFreshness: {
    maxDataAge: number;       // Max age in days before data is considered stale
    refreshThreshold: number; // Percentage of stale data that triggers full refresh
  };
  notifications: {
    enabled: boolean;
    webhook?: string;
    email?: string;
  };
  monitoring: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    retainLogs: number; // Days to retain logs
  };
}

interface PipelineRun {
  id: string;
  type: 'full' | 'incremental' | 'visualization-only';
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: {
    crawler?: { status: string; duration: number; recordsCollected: number };
    reprocessor?: { status: string; duration: number; recordsProcessed: number };
    visualization?: { status: string; duration: number; filesGenerated: number };
  };
  metrics: {
    totalDuration: number;
    dataQualityImprovement: number;
    freshDataPercentage: number;
    wardsUpdated: number;
  };
  errors: string[];
  recommendations: string[];
}

export class AutomatedDataPipeline {
  private config: PipelineConfig = {
    scheduling: {
      fullCrawl: '0 2 * * 0',         // Sunday at 2 AM (weekly full crawl)
      dataReprocessing: '0 6 * * *',  // Daily at 6 AM (daily reprocessing)
      visualization: '0 8 * * *'       // Daily at 8 AM (daily visualizations)
    },
    dataFreshness: {
      maxDataAge: 7,           // 7 days
      refreshThreshold: 30     // 30% stale data triggers refresh
    },
    notifications: {
      enabled: true
    },
    monitoring: {
      logLevel: 'info',
      retainLogs: 30
    }
  };

  private runHistory: PipelineRun[] = [];
  private isRunning = false;
  private currentRun: PipelineRun | null = null;

  constructor(customConfig?: Partial<PipelineConfig>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
  }

  /**
   * Start the automated pipeline with scheduling
   */
  async startAutomatedPipeline(): Promise<void> {
    console.log('🚀 STARTING AUTOMATED DATA PROCESSING PIPELINE');
    console.log('================================================');
    console.log(`📅 Full Crawl Schedule: ${this.config.scheduling.fullCrawl}`);
    console.log(`🔄 Reprocessing Schedule: ${this.config.scheduling.dataReprocessing}`);
    console.log(`📊 Visualization Schedule: ${this.config.scheduling.visualization}`);
    console.log('================================================\n');

    // Load existing run history
    await this.loadRunHistory();

    // Check if immediate run is needed
    const shouldRunImmediately = await this.shouldRunImmediately();
    if (shouldRunImmediately) {
      console.log('📋 Immediate run required based on data freshness analysis');
      await this.runFullPipeline();
    }

    // Schedule automated runs
    this.scheduleAutomatedRuns();

    // Start monitoring
    this.startMonitoring();

    console.log('✅ Automated pipeline started successfully!');
    console.log('   The pipeline will run according to the configured schedule.');
    console.log('   Use Ctrl+C to stop the pipeline gracefully.\n');
  }

  /**
   * Run the complete pipeline manually
   */
  async runFullPipeline(type: 'full' | 'incremental' = 'full'): Promise<PipelineRun> {
    if (this.isRunning) {
      throw new Error('Pipeline is already running. Wait for current run to complete.');
    }

    const run: PipelineRun = {
      id: this.generateRunId(),
      type,
      startTime: new Date(),
      status: 'running',
      steps: {},
      metrics: {
        totalDuration: 0,
        dataQualityImprovement: 0,
        freshDataPercentage: 0,
        wardsUpdated: 0
      },
      errors: [],
      recommendations: []
    };

    this.isRunning = true;
    this.currentRun = run;

    console.log(`🚀 Starting ${type} pipeline run: ${run.id}`);
    console.log(`⏰ Started at: ${run.startTime.toLocaleString()}\n`);

    try {
      // Step 1: Run crawler if full pipeline
      if (type === 'full') {
        await this.runCrawlerStep(run);
      }

      // Step 2: Run data reprocessor
      await this.runReprocessorStep(run);

      // Step 3: Generate visualizations
      await this.runVisualizationStep(run);

      // Step 4: Analyze results and generate recommendations
      await this.analyzeRunResults(run);

      run.status = 'completed';
      run.endTime = new Date();
      run.metrics.totalDuration = run.endTime.getTime() - run.startTime.getTime();

      console.log(`✅ Pipeline run completed successfully: ${run.id}`);
      console.log(`⏱️ Total duration: ${Math.round(run.metrics.totalDuration / 1000 / 60)} minutes`);
      console.log(`📈 Data quality improvement: ${run.metrics.dataQualityImprovement}%`);
      console.log(`🔄 Fresh data percentage: ${run.metrics.freshDataPercentage}%`);
      console.log(`🗺️ Wards updated: ${run.metrics.wardsUpdated}\n`);

    } catch (error) {
      run.status = 'failed';
      run.endTime = new Date();
      run.errors.push(`Pipeline failed: ${error.message}`);

      console.error(`❌ Pipeline run failed: ${run.id}`);
      console.error(`Error: ${error.message}\n`);

      await this.handlePipelineFailure(run, error);
    } finally {
      this.isRunning = false;
      this.currentRun = null;
      this.runHistory.push(run);
      await this.saveRunHistory();
      await this.notifyCompletion(run);
    }

    return run;
  }

  /**
   * Run only the visualization step
   */
  async runVisualizationOnly(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Pipeline is already running.');
    }

    const run: PipelineRun = {
      id: this.generateRunId(),
      type: 'visualization-only',
      startTime: new Date(),
      status: 'running',
      steps: {},
      metrics: {
        totalDuration: 0,
        dataQualityImprovement: 0,
        freshDataPercentage: 0,
        wardsUpdated: 0
      },
      errors: [],
      recommendations: []
    };

    this.isRunning = true;
    this.currentRun = run;

    try {
      await this.runVisualizationStep(run);
      run.status = 'completed';
      console.log('✅ Visualization-only run completed successfully');
    } catch (error) {
      run.status = 'failed';
      run.errors.push(`Visualization failed: ${error.message}`);
      console.error('❌ Visualization-only run failed:', error.message);
    } finally {
      run.endTime = new Date();
      run.metrics.totalDuration = run.endTime.getTime() - run.startTime.getTime();
      this.isRunning = false;
      this.currentRun = null;
      this.runHistory.push(run);
      await this.saveRunHistory();
    }
  }

  /**
   * Get pipeline status and metrics
   */
  getStatus(): {
    isRunning: boolean;
    currentRun: PipelineRun | null;
    lastRun: PipelineRun | null;
    runHistory: PipelineRun[];
    healthScore: number;
  } {
    const lastRun = this.runHistory[this.runHistory.length - 1] || null;
    const recentRuns = this.runHistory.slice(-10);
    const successRate = recentRuns.length > 0 
      ? (recentRuns.filter(r => r.status === 'completed').length / recentRuns.length) * 100 
      : 0;

    return {
      isRunning: this.isRunning,
      currentRun: this.currentRun,
      lastRun,
      runHistory: this.runHistory,
      healthScore: successRate
    };
  }

  // ==================================================================================
  // PIPELINE STEPS
  // ==================================================================================

  /**
   * Run the crawler step
   */
  private async runCrawlerStep(run: PipelineRun): Promise<void> {
    console.log('🕷️ Step 1: Running Master Unified Crawler...');
    const startTime = Date.now();

    try {
      const crawler = new CompleteMasterUnifiedCrawler();
      await crawler.startMasterCrawl();

      const duration = Date.now() - startTime;
      run.steps.crawler = {
        status: 'completed',
        duration,
        recordsCollected: 0 // This would be extracted from crawler results
      };

      console.log(`✅ Crawler step completed in ${Math.round(duration / 1000)} seconds`);

    } catch (error) {
      const duration = Date.now() - startTime;
      run.steps.crawler = {
        status: 'failed',
        duration,
        recordsCollected: 0
      };
      run.errors.push(`Crawler failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run the data reprocessor step
   */
  private async runReprocessorStep(run: PipelineRun): Promise<void> {
    console.log('🔄 Step 2: Running Advanced Data Reprocessor...');
    const startTime = Date.now();

    try {
      const reprocessor = new AdvancedDataReprocessor();
      await reprocessor.startAdvancedReprocessing();

      const duration = Date.now() - startTime;
      run.steps.reprocessor = {
        status: 'completed',
        duration,
        recordsProcessed: 0 // This would be extracted from reprocessor results
      };

      console.log(`✅ Reprocessor step completed in ${Math.round(duration / 1000)} seconds`);

    } catch (error) {
      const duration = Date.now() - startTime;
      run.steps.reprocessor = {
        status: 'failed',
        duration,
        recordsProcessed: 0
      };
      run.errors.push(`Reprocessor failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run the visualization step
   */
  private async runVisualizationStep(run: PipelineRun): Promise<void> {
    console.log('📊 Step 3: Generating Data Visualizations...');
    const startTime = Date.now();

    try {
      const visualizer = new DataVisualizationEngine();
      await visualizer.generateComprehensiveVisualizations();

      const duration = Date.now() - startTime;
      run.steps.visualization = {
        status: 'completed',
        duration,
        filesGenerated: await this.countGeneratedFiles()
      };

      console.log(`✅ Visualization step completed in ${Math.round(duration / 1000)} seconds`);

    } catch (error) {
      const duration = Date.now() - startTime;
      run.steps.visualization = {
        status: 'failed',
        duration,
        filesGenerated: 0
      };
      run.errors.push(`Visualization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze run results and generate recommendations
   */
  private async analyzeRunResults(run: PipelineRun): Promise<void> {
    console.log('📋 Step 4: Analyzing results and generating recommendations...');

    try {
      // Load and analyze generated reports
      const executiveSummary = await this.loadReportSafely('./advanced-data-analysis/executive-summary.json');
      const qualityReport = await this.loadReportSafely('./advanced-data-analysis/quality-reports/data-quality-analysis.json');

      if (executiveSummary) {
        run.metrics.dataQualityImprovement = Math.round(
          executiveSummary.qualityMetrics?.completenessScore * 100 || 0
        );
        run.metrics.freshDataPercentage = Math.round(
          (executiveSummary.qualityMetrics?.freshRecords / 
           executiveSummary.qualityMetrics?.totalRecords) * 100 || 0
        );
        run.metrics.wardsUpdated = executiveSummary.wardSummary?.totalWards || 0;

        // Generate recommendations based on analysis
        run.recommendations = [
          ...executiveSummary.qualityMetrics?.criticalGaps || [],
          ...executiveSummary.qualityMetrics?.recommendations?.slice(0, 3) || []
        ];
      }

      // Schedule next run based on results
      if (run.metrics.freshDataPercentage < 50) {
        run.recommendations.push('Schedule additional data collection within 48 hours');
      }

    } catch (error) {
      console.warn('⚠️ Could not analyze all results, continuing...');
      run.errors.push(`Analysis warning: ${error.message}`);
    }
  }

  // ==================================================================================
  // SCHEDULING AND MONITORING
  // ==================================================================================

  /**
   * Schedule automated runs
   */
  private scheduleAutomatedRuns(): void {
    // Schedule full crawl and processing
    cron.schedule(this.config.scheduling.fullCrawl, () => {
      if (!this.isRunning) {
        console.log('📅 Scheduled full pipeline run starting...');
        this.runFullPipeline('full').catch(console.error);
      } else {
        console.log('⚠️ Scheduled run skipped - pipeline already running');
      }
    });

    // Schedule daily reprocessing
    cron.schedule(this.config.scheduling.dataReprocessing, () => {
      if (!this.isRunning) {
        console.log('📅 Scheduled reprocessing run starting...');
        this.runFullPipeline('incremental').catch(console.error);
      } else {
        console.log('⚠️ Scheduled reprocessing skipped - pipeline already running');
      }
    });

    // Schedule visualization updates
    cron.schedule(this.config.scheduling.visualization, () => {
      if (!this.isRunning) {
        console.log('📅 Scheduled visualization update starting...');
        this.runVisualizationOnly().catch(console.error);
      } else {
        console.log('⚠️ Scheduled visualization skipped - pipeline already running');
      }
    });

    console.log('⏰ Automated scheduling configured successfully');
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    // Health check every hour
    cron.schedule('0 * * * *', () => {
      this.performHealthCheck();
    });

    // Cleanup old logs daily
    cron.schedule('0 1 * * *', () => {
      this.cleanupOldLogs();
    });

    console.log('🔍 Monitoring started successfully');
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    const status = this.getStatus();
    
    if (status.healthScore < 70) {
      console.warn(`⚠️ Health check warning: Success rate is ${status.healthScore}%`);
      
      if (this.config.notifications.enabled) {
        this.sendNotification(
          'Pipeline Health Warning',
          `Success rate has dropped to ${status.healthScore}%. Recent failures may need attention.`
        );
      }
    }

    // Check for stuck runs
    if (status.isRunning && status.currentRun) {
      const runDuration = Date.now() - status.currentRun.startTime.getTime();
      if (runDuration > 4 * 60 * 60 * 1000) { // 4 hours
        console.error('🚨 Health check critical: Pipeline run has been running for over 4 hours');
        
        if (this.config.notifications.enabled) {
          this.sendNotification(
            'Pipeline Stuck Alert',
            'Current pipeline run has been running for over 4 hours and may be stuck.'
          );
        }
      }
    }
  }

  /**
   * Clean up old logs and run history
   */
  private cleanupOldLogs(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.monitoring.retainLogs);

    const initialCount = this.runHistory.length;
    this.runHistory = this.runHistory.filter(run => 
      new Date(run.startTime) > cutoffDate
    );

    const cleanedCount = initialCount - this.runHistory.length;
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old run records`);
      this.saveRunHistory();
    }
  }

  // ==================================================================================
  // HELPER METHODS
  // ==================================================================================

  /**
   * Check if immediate run is needed
   */
  private async shouldRunImmediately(): Promise<boolean> {
    // Check if we have recent successful runs
    const recentRuns = this.runHistory.filter(run => {
      const runAge = Date.now() - new Date(run.startTime).getTime();
      return runAge < (24 * 60 * 60 * 1000); // Last 24 hours
    });

    const hasRecentSuccessfulRun = recentRuns.some(run => run.status === 'completed');

    if (!hasRecentSuccessfulRun) {
      return true; // No recent successful run
    }

    // Check data freshness
    try {
      const executiveSummary = await this.loadReportSafely('./advanced-data-analysis/executive-summary.json');
      if (executiveSummary) {
        const freshDataPercentage = (executiveSummary.qualityMetrics?.freshRecords / 
                                   executiveSummary.qualityMetrics?.totalRecords) * 100;
        
        if (freshDataPercentage < this.config.dataFreshness.refreshThreshold) {
          return true; // Data is too stale
        }
      }
    } catch (error) {
      return true; // No existing reports
    }

    return false;
  }

  /**
   * Handle pipeline failures
   */
  private async handlePipelineFailure(run: PipelineRun, error: Error): Promise<void> {
    // Generate failure report
    const failureReport = {
      runId: run.id,
      startTime: run.startTime,
      failureTime: new Date(),
      error: error.message,
      steps: run.steps,
      recommendations: [
        'Check system resources and network connectivity',
        'Verify database accessibility',
        'Review logs for specific error details',
        'Consider running individual pipeline components separately'
      ]
    };

    // Save failure report
    const reportsDir = './pipeline-reports';
    await fs.mkdir(reportsDir, { recursive: true });
    await fs.writeFile(
      path.join(reportsDir, `failure-report-${run.id}.json`),
      JSON.stringify(failureReport, null, 2)
    );

    // Send failure notification
    if (this.config.notifications.enabled) {
      this.sendNotification(
        'Pipeline Failure Alert',
        `Pipeline run ${run.id} failed: ${error.message}`
      );
    }
  }

  /**
   * Send notifications
   */
  private sendNotification(subject: string, message: string): void {
    console.log(`📧 NOTIFICATION: ${subject}`);
    console.log(`   Message: ${message}\n`);
    
    // Here you would integrate with actual notification services
    // e.g., email, Slack, Discord, etc.
  }

  /**
   * Generate unique run ID
   */
  private generateRunId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `pipeline-${timestamp}-${random}`;
  }

  /**
   * Count generated visualization files
   */
  private async countGeneratedFiles(): Promise<number> {
    try {
      const visualizationDir = './data-visualizations';
      const files = await fs.readdir(visualizationDir, { recursive: true });
      return files.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Load report safely
   */
  private async loadReportSafely(filePath: string): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Load run history
   */
  private async loadRunHistory(): Promise<void> {
    try {
      const historyFile = './pipeline-reports/run-history.json';
      const content = await fs.readFile(historyFile, 'utf8');
      this.runHistory = JSON.parse(content);
      console.log(`📚 Loaded ${this.runHistory.length} previous pipeline runs`);
    } catch (error) {
      console.log('📚 No previous run history found, starting fresh');
      this.runHistory = [];
    }
  }

  /**
   * Save run history
   */
  private async saveRunHistory(): Promise<void> {
    try {
      const reportsDir = './pipeline-reports';
      await fs.mkdir(reportsDir, { recursive: true });
      
      const historyFile = path.join(reportsDir, 'run-history.json');
      await fs.writeFile(historyFile, JSON.stringify(this.runHistory, null, 2));
    } catch (error) {
      console.warn('⚠️ Could not save run history:', error.message);
    }
  }

  /**
   * Notify completion
   */
  private async notifyCompletion(run: PipelineRun): Promise<void> {
    if (!this.config.notifications.enabled) return;

    const message = run.status === 'completed' 
      ? `Pipeline run ${run.id} completed successfully in ${Math.round(run.metrics.totalDuration / 1000 / 60)} minutes`
      : `Pipeline run ${run.id} failed with ${run.errors.length} errors`;

    this.sendNotification('Pipeline Run Complete', message);
  }
}

// ==================================================================================
// EXECUTION AND CLI
// ==================================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const pipeline = new AutomatedDataPipeline();

  // Handle command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  // Graceful shutdown handling
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down automated pipeline gracefully...');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    process.exit(0);
  });

  async function main() {
    switch (command) {
      case 'start':
        await pipeline.startAutomatedPipeline();
        break;
      
      case 'run':
        const type = args[1] === 'incremental' ? 'incremental' : 'full';
        await pipeline.runFullPipeline(type);
        process.exit(0);
        break;
      
      case 'visualize':
        await pipeline.runVisualizationOnly();
        process.exit(0);
        break;
      
      case 'status':
        const status = pipeline.getStatus();
        console.log('📊 PIPELINE STATUS');
        console.log('==================');
        console.log(`Running: ${status.isRunning ? '✅ Yes' : '❌ No'}`);
        console.log(`Health Score: ${Math.round(status.healthScore)}%`);
        console.log(`Total Runs: ${status.runHistory.length}`);
        if (status.lastRun) {
          console.log(`Last Run: ${status.lastRun.id} (${status.lastRun.status})`);
          console.log(`Last Run Time: ${status.lastRun.startTime.toLocaleString()}`);
        }
        process.exit(0);
        break;
      
      default:
        console.log('🚀 AUTOMATED DATA PIPELINE');
        console.log('==========================');
        console.log('Usage:');
        console.log('  npm run pipeline start      # Start automated pipeline with scheduling');
        console.log('  npm run pipeline run        # Run full pipeline once');
        console.log('  npm run pipeline run incremental # Run incremental update');
        console.log('  npm run pipeline visualize  # Generate visualizations only');
        console.log('  npm run pipeline status     # Show pipeline status');
        console.log('');
        console.log('The automated pipeline will:');
        console.log('• 🕷️ Crawl fresh data weekly');
        console.log('• 🔄 Reprocess data daily');
        console.log('• 📊 Update visualizations daily');
        console.log('• 📋 Filter data older than 3 years');
        console.log('• 🗺️ Categorize councillors by ward');
        console.log('• 💰 Prioritize fresh financial data');
        console.log('• 📈 Generate actionable insights');
        process.exit(0);
    }
  }

  main().catch((error) => {
    console.error('❌ Pipeline execution failed:', error);
    process.exit(1);
  });
}

export { AutomatedDataPipeline };
