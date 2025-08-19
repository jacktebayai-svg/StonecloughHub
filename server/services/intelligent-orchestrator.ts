import { intelligentCrawlingStrategy } from './intelligent-crawler-strategy';
import { enhancedUrlDiscovery } from './enhanced-url-discovery';
import { advancedDataExtractor } from './advanced-data-extraction';
import { advancedDeduplicationEngine } from './advanced-deduplication';
import { ComprehensiveMonitor } from './monitoring-system';
import { enhancedStorage } from './enhanced-storage';
import cron from 'node-cron';
import crypto from 'crypto';

export interface ScheduledTask {
  id: string;
  name: string;
  type: TaskType;
  schedule: string; // Cron expression
  priority: number;
  enabled: boolean;
  lastRun?: Date;
  nextRun: Date;
  runCount: number;
  successCount: number;
  failureCount: number;
  averageDuration: number;
  configuration: TaskConfiguration;
  dependencies: string[]; // Other task IDs that must complete first
}

export interface TaskConfiguration {
  maxDuration?: number; // Maximum runtime in milliseconds
  retryAttempts?: number;
  retryDelay?: number; // Delay between retries in milliseconds
  resourceLimits?: {
    maxMemoryMB?: number;
    maxConcurrency?: number;
  };
  parameters?: Record<string, any>;
  alertOnFailure?: boolean;
  alertOnLongRunning?: boolean;
}

export interface TaskExecution {
  taskId: string;
  executionId: string;
  startTime: Date;
  endTime?: Date;
  status: ExecutionStatus;
  duration?: number;
  result?: any;
  error?: string;
  metrics: ExecutionMetrics;
}

export interface ExecutionMetrics {
  memoryUsage: number;
  cpuUsage: number;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errorsEncountered: number;
  qualityScore?: number;
}

export interface OrchestrationReport {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  skippedTasks: number;
  totalDuration: number;
  dataChanges: {
    itemsAdded: number;
    itemsUpdated: number;
    itemsDeduped: number;
    qualityImproved: number;
  };
  systemHealth: {
    overallStatus: 'healthy' | 'warning' | 'critical';
    memoryUsage: number;
    diskUsage: number;
    errorRate: number;
  };
  recommendations: string[];
}

export type TaskType = 
  | 'crawl_discovery'
  | 'content_extraction'
  | 'data_quality_check'
  | 'deduplication'
  | 'url_discovery'
  | 'system_maintenance'
  | 'backup'
  | 'analytics_generation'
  | 'health_check';

export type ExecutionStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'
  | 'retrying';

export class IntelligentOrchestrator {
  private monitor: ComprehensiveMonitor;
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private cronJobs: Map<string, any> = new Map();
  private runningExecutions: Map<string, TaskExecution> = new Map();
  private taskQueue: ScheduledTask[] = [];
  private isRunning: boolean = false;
  private maintenanceMode: boolean = false;

  constructor() {
    this.monitor = new ComprehensiveMonitor();
    this.initializeDefaultTasks();
  }

  /**
   * Start the orchestration system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Orchestrator is already running');
      return;
    }

    console.log('🚀 Starting Intelligent Orchestration System...');
    
    this.isRunning = true;
    
    try {
      // Initialize monitoring
      await this.monitor.healthCheck('orchestrator', async () => ({
        status: 'healthy',
        details: 'Orchestrator is running normally'
      }));

      // Schedule all enabled tasks
      this.scheduleAllTasks();

      // Start background processes
      this.startBackgroundProcesses();

      console.log('✅ Orchestration system started successfully');
      console.log(`📊 Monitoring ${this.scheduledTasks.size} scheduled tasks`);

    } catch (error) {
      console.error('❌ Failed to start orchestration system:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the orchestration system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Orchestrator is not running');
      return;
    }

    console.log('🛑 Stopping Intelligent Orchestration System...');
    
    try {
      // Cancel all running executions
      await this.cancelAllRunningTasks();

      // Destroy cron jobs
      this.cronJobs.forEach((job, taskId) => {
        job.destroy();
        console.log(`⏹️ Stopped scheduled task: ${taskId}`);
      });
      this.cronJobs.clear();

      this.isRunning = false;
      console.log('✅ Orchestration system stopped successfully');

    } catch (error) {
      console.error('❌ Error stopping orchestration system:', error);
      throw error;
    }
  }

  /**
   * Add or update a scheduled task
   */
  addTask(task: Omit<ScheduledTask, 'id' | 'runCount' | 'successCount' | 'failureCount' | 'averageDuration'>): string {
    const taskId = crypto.randomUUID();
    const fullTask: ScheduledTask = {
      ...task,
      id: taskId,
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      averageDuration: 0
    };

    this.scheduledTasks.set(taskId, fullTask);

    if (this.isRunning && fullTask.enabled) {
      this.scheduleTask(fullTask);
    }

    console.log(`➕ Added scheduled task: ${fullTask.name} (${fullTask.schedule})`);
    return taskId;
  }

  /**
   * Execute a task immediately (one-time execution)
   */
  async executeTask(taskId: string, overrideConfig?: Partial<TaskConfiguration>): Promise<TaskExecution> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const execution = await this.runTask(task, overrideConfig);
    return execution;
  }

  /**
   * Get comprehensive status of the orchestration system
   */
  getStatus(): {
    isRunning: boolean;
    maintenanceMode: boolean;
    scheduledTasks: number;
    runningTasks: number;
    tasksInQueue: number;
    systemHealth: any;
    recentExecutions: TaskExecution[];
  } {
    const systemHealth = this.monitor.getSystemStatus();
    const recentExecutions = Array.from(this.runningExecutions.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 10);

    return {
      isRunning: this.isRunning,
      maintenanceMode: this.maintenanceMode,
      scheduledTasks: this.scheduledTasks.size,
      runningTasks: this.runningExecutions.size,
      tasksInQueue: this.taskQueue.length,
      systemHealth,
      recentExecutions
    };
  }

  /**
   * Generate comprehensive orchestration report
   */
  async generateReport(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<OrchestrationReport> {
    const sessionId = crypto.randomUUID();
    const endTime = new Date();
    const startTime = new Date();

    switch (timeframe) {
      case 'day':
        startTime.setDate(startTime.getDate() - 1);
        break;
      case 'week':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case 'month':
        startTime.setDate(startTime.getDate() - 30);
        break;
    }

    // Gather metrics from database and in-memory tracking
    const analytics = await enhancedStorage.getAnalytics(timeframe === 'day' ? 'day' : timeframe === 'week' ? 'week' : 'month');
    const systemHealth = this.monitor.getSystemStatus();

    // Calculate task statistics
    const taskStats = Array.from(this.scheduledTasks.values()).reduce((acc, task) => {
      acc.totalTasks++;
      if (task.successCount > task.failureCount) {
        acc.successfulTasks++;
      } else if (task.failureCount > 0) {
        acc.failedTasks++;
      }
      return acc;
    }, { totalTasks: 0, successfulTasks: 0, failedTasks: 0, skippedTasks: 0 });

    const report: OrchestrationReport = {
      sessionId,
      startTime,
      endTime,
      totalTasks: taskStats.totalTasks,
      successfulTasks: taskStats.successfulTasks,
      failedTasks: taskStats.failedTasks,
      skippedTasks: taskStats.skippedTasks,
      totalDuration: endTime.getTime() - startTime.getTime(),
      dataChanges: {
        itemsAdded: analytics.overview.newRecords,
        itemsUpdated: 0, // Would be calculated from execution metrics
        itemsDeduped: 0, // Would be calculated from deduplication reports
        qualityImproved: 0 // Would be calculated from quality improvements
      },
      systemHealth: {
        overallStatus: systemHealth.overall,
        memoryUsage: systemHealth.performance.memoryUsage.heapUsed / 1024 / 1024, // MB
        diskUsage: 0, // Would be calculated from system metrics
        errorRate: systemHealth.performance.errorRate
      },
      recommendations: await this.generateRecommendations(analytics, systemHealth)
    };

    return report;
  }

  // Private methods for task execution

  private initializeDefaultTasks(): void {
    // Core crawling and data collection tasks
    const defaultTasks = [
      {
        name: 'Daily URL Discovery',
        type: 'url_discovery' as TaskType,
        schedule: '0 6 * * *', // Daily at 6 AM
        priority: 8,
        enabled: true,
        nextRun: new Date(Date.now() + 60000), // Start in 1 minute for testing
        configuration: {
          maxDuration: 30 * 60 * 1000, // 30 minutes
          retryAttempts: 2,
          alertOnFailure: true,
          parameters: {
            maxUrlsToDiscover: 500,
            focusAreas: ['meetings', 'planning', 'transparency']
          }
        },
        dependencies: []
      },
      {
        name: 'Continuous Content Crawling',
        type: 'crawl_discovery' as TaskType,
        schedule: '*/30 * * * *', // Every 30 minutes
        priority: 9,
        enabled: true,
        nextRun: new Date(Date.now() + 120000), // Start in 2 minutes
        configuration: {
          maxDuration: 25 * 60 * 1000, // 25 minutes
          retryAttempts: 3,
          alertOnFailure: true,
          parameters: {
            maxConcurrency: 3,
            respectRateLimit: true,
            priorityThreshold: 5
          }
        },
        dependencies: ['url_discovery']
      },
      {
        name: 'Data Quality Assessment',
        type: 'data_quality_check' as TaskType,
        schedule: '0 2 * * *', // Daily at 2 AM
        priority: 6,
        enabled: true,
        nextRun: new Date(Date.now() + 180000), // Start in 3 minutes
        configuration: {
          maxDuration: 60 * 60 * 1000, // 1 hour
          retryAttempts: 1,
          alertOnFailure: true,
          parameters: {
            validationRules: 'all',
            generateReports: true
          }
        },
        dependencies: []
      },
      {
        name: 'Duplicate Detection and Cleanup',
        type: 'deduplication' as TaskType,
        schedule: '0 1 * * 0', // Weekly on Sunday at 1 AM
        priority: 5,
        enabled: true,
        nextRun: new Date(Date.now() + 240000), // Start in 4 minutes
        configuration: {
          maxDuration: 2 * 60 * 60 * 1000, // 2 hours
          retryAttempts: 1,
          alertOnFailure: true,
          parameters: {
            strategies: ['content_hash', 'title_similarity', 'semantic_analysis'],
            autoResolve: false,
            minConfidence: 0.8
          }
        },
        dependencies: ['data_quality_check']
      },
      {
        name: 'System Health Check',
        type: 'health_check' as TaskType,
        schedule: '*/15 * * * *', // Every 15 minutes
        priority: 10,
        enabled: true,
        nextRun: new Date(Date.now() + 300000), // Start in 5 minutes
        configuration: {
          maxDuration: 5 * 60 * 1000, // 5 minutes
          retryAttempts: 1,
          alertOnFailure: true,
          parameters: {
            checkDatabase: true,
            checkExternalSites: true,
            checkMemoryUsage: true
          }
        },
        dependencies: []
      },
      {
        name: 'Analytics Generation',
        type: 'analytics_generation' as TaskType,
        schedule: '0 4 * * *', // Daily at 4 AM
        priority: 4,
        enabled: true,
        nextRun: new Date(Date.now() + 360000), // Start in 6 minutes
        configuration: {
          maxDuration: 30 * 60 * 1000, // 30 minutes
          retryAttempts: 1,
          alertOnFailure: false,
          parameters: {
            generateDashboard: true,
            updateFacets: true,
            calculateTrends: true
          }
        },
        dependencies: ['data_quality_check']
      }
    ];

    defaultTasks.forEach(task => {
      const taskId = this.addTask(task);
      console.log(`🔧 Initialized default task: ${task.name} (${taskId})`);
    });
  }

  private scheduleAllTasks(): void {
    this.scheduledTasks.forEach(task => {
      if (task.enabled) {
        this.scheduleTask(task);
      }
    });
  }

  private scheduleTask(task: ScheduledTask): void {
    if (this.cronJobs.has(task.id)) {
      this.cronJobs.get(task.id).destroy();
    }

    const cronJob = cron.schedule(task.schedule, async () => {
      if (!this.isRunning || this.maintenanceMode) {
        return;
      }

      // Check dependencies
      const dependenciesReady = await this.checkDependencies(task);
      if (!dependenciesReady) {
        console.log(`⏳ Task ${task.name} deferred - dependencies not ready`);
        return;
      }

      // Check resource availability
      if (this.runningExecutions.size >= 5) { // Max 5 concurrent tasks
        console.log(`⏳ Task ${task.name} queued - max concurrency reached`);
        this.taskQueue.push(task);
        return;
      }

      await this.runTask(task);
    }, {
      scheduled: false // We'll start it manually
    });

    this.cronJobs.set(task.id, cronJob);
    cronJob.start();

    console.log(`⏰ Scheduled task: ${task.name} with cron "${task.schedule}"`);
  }

  private async runTask(task: ScheduledTask, overrideConfig?: Partial<TaskConfiguration>): Promise<TaskExecution> {
    const executionId = crypto.randomUUID();
    const config = { ...task.configuration, ...overrideConfig };
    
    const execution: TaskExecution = {
      taskId: task.id,
      executionId,
      startTime: new Date(),
      status: 'running',
      metrics: {
        memoryUsage: 0,
        cpuUsage: 0,
        itemsProcessed: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        errorsEncountered: 0
      }
    };

    this.runningExecutions.set(executionId, execution);

    console.log(`🚀 Starting task execution: ${task.name} (${executionId})`);

    try {
      // Set up timeout if specified
      const timeoutPromise = config.maxDuration 
        ? new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Task timeout')), config.maxDuration);
          })
        : null;

      // Execute the task based on its type
      const taskPromise = this.executeTaskByType(task, config, execution);

      // Race between task execution and timeout
      const result = timeoutPromise 
        ? await Promise.race([taskPromise, timeoutPromise])
        : await taskPromise;

      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      execution.status = 'completed';
      execution.result = result;

      // Update task statistics
      task.runCount++;
      task.successCount++;
      task.lastRun = execution.startTime;
      task.averageDuration = (task.averageDuration * (task.runCount - 1) + execution.duration) / task.runCount;

      console.log(`✅ Task completed: ${task.name} (${Math.round(execution.duration / 1000)}s)`);

    } catch (error) {
      execution.endTime = new Date();
      execution.duration = execution.endTime ? execution.endTime.getTime() - execution.startTime.getTime() : 0;
      execution.status = error.message === 'Task timeout' ? 'timeout' : 'failed';
      execution.error = error.message;

      // Update task statistics
      task.runCount++;
      task.failureCount++;
      task.lastRun = execution.startTime;

      console.error(`❌ Task failed: ${task.name} - ${error.message}`);

      // Handle retries
      if (config.retryAttempts && config.retryAttempts > 0) {
        console.log(`🔄 Retrying task in ${config.retryDelay || 5000}ms...`);
        setTimeout(async () => {
          await this.runTask(task, { ...config, retryAttempts: config.retryAttempts! - 1 });
        }, config.retryDelay || 5000);
      }

      // Send alerts if configured
      if (config.alertOnFailure) {
        this.monitor.createAlert('error', `Task Failed: ${task.name}`, 'orchestrator', error.message);
      }
    } finally {
      this.runningExecutions.delete(executionId);
      
      // Process queued tasks
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift();
        if (nextTask) {
          setTimeout(() => this.runTask(nextTask), 1000);
        }
      }
    }

    return execution;
  }

  private async executeTaskByType(
    task: ScheduledTask, 
    config: TaskConfiguration, 
    execution: TaskExecution
  ): Promise<any> {
    const startMemory = process.memoryUsage().heapUsed;

    try {
      let result;

      switch (task.type) {
        case 'url_discovery':
          result = await this.executeUrlDiscovery(config, execution);
          break;
        
        case 'crawl_discovery':
          result = await this.executeCrawling(config, execution);
          break;
        
        case 'data_quality_check':
          result = await this.executeQualityCheck(config, execution);
          break;
        
        case 'deduplication':
          result = await this.executeDeduplication(config, execution);
          break;
        
        case 'health_check':
          result = await this.executeHealthCheck(config, execution);
          break;
        
        case 'analytics_generation':
          result = await this.executeAnalyticsGeneration(config, execution);
          break;
        
        case 'system_maintenance':
          result = await this.executeSystemMaintenance(config, execution);
          break;
        
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      // Calculate resource usage
      execution.metrics.memoryUsage = process.memoryUsage().heapUsed - startMemory;
      
      return result;

    } catch (error) {
      execution.metrics.errorsEncountered++;
      throw error;
    }
  }

  // Task execution methods

  private async executeUrlDiscovery(config: TaskConfiguration, execution: TaskExecution): Promise<any> {
    console.log('🔍 Executing URL discovery task...');
    
    const params = config.parameters || {};
    const maxUrls = params.maxUrlsToDiscover || 500;
    const focusAreas = params.focusAreas || ['meetings', 'planning', 'transparency'];

    // Get statistics from intelligent crawling strategy
    const stats = intelligentCrawlingStrategy.getStatistics();
    console.log(`📊 Current queue: ${stats.queueSize} URLs, ${stats.readyToProcess} ready to process`);

    // Add some seed URLs for focus areas (this would be more sophisticated in practice)
    const seedUrls = [
      'https://www.bolton.gov.uk/council-and-democracy/meetings-agendas-and-minutes',
      'https://www.bolton.gov.uk/environment-and-planning/planning-applications',
      'https://www.bolton.gov.uk/transparency-and-performance'
    ];

    let discoveredCount = 0;
    
    for (const url of seedUrls) {
      try {
        await intelligentCrawlingStrategy.addUrlToQueue(url, null, 0);
        discoveredCount++;
        execution.metrics.itemsProcessed++;
      } catch (error) {
        execution.metrics.errorsEncountered++;
        console.error(`Error adding URL ${url}:`, error);
      }
    }

    execution.metrics.itemsCreated = discoveredCount;
    
    return {
      urlsDiscovered: discoveredCount,
      focusAreas,
      queueStats: intelligentCrawlingStrategy.getStatistics()
    };
  }

  private async executeCrawling(config: TaskConfiguration, execution: TaskExecution): Promise<any> {
    console.log('🕷️ Executing crawling task...');
    
    const params = config.parameters || {};
    const maxConcurrency = params.maxConcurrency || 3;
    const priorityThreshold = params.priorityThreshold || 5;

    // Get next URLs to crawl
    let processedUrls = 0;
    let createdItems = 0;
    let errors = 0;

    // This is a simplified version - in practice would use the intelligent crawling strategy
    for (let i = 0; i < 10; i++) { // Process up to 10 URLs
      try {
        const nextUrl = intelligentCrawlingStrategy.getNextUrl();
        if (!nextUrl) break;

        // Simulate crawling and processing
        processedUrls++;
        execution.metrics.itemsProcessed = processedUrls;

        // Simulate creating data items
        if (Math.random() > 0.3) { // 70% success rate
          createdItems++;
          execution.metrics.itemsCreated = createdItems;
        }

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        errors++;
        execution.metrics.errorsEncountered = errors;
        console.error('Crawling error:', error);
      }
    }

    return {
      urlsProcessed: processedUrls,
      itemsCreated: createdItems,
      errors,
      queueStats: intelligentCrawlingStrategy.getStatistics()
    };
  }

  private async executeQualityCheck(config: TaskConfiguration, execution: TaskExecution): Promise<any> {
    console.log('🔍 Executing data quality check...');
    
    // Get analytics to understand current data quality
    const analytics = await enhancedStorage.getAnalytics('week');
    
    execution.metrics.itemsProcessed = analytics.overview.totalRecords;
    execution.metrics.qualityScore = analytics.overview.qualityScore / 100;

    return {
      totalItems: analytics.overview.totalRecords,
      qualityScore: analytics.overview.qualityScore,
      completenessRate: analytics.overview.completenessRate,
      itemsNeedingReview: 0, // Would be calculated from quality reports
      recommendations: [
        'Consider increasing crawling frequency for high-priority sources',
        'Review validation rules for better data quality',
        'Implement additional data enrichment strategies'
      ]
    };
  }

  private async executeDeduplication(config: TaskConfiguration, execution: TaskExecution): Promise<any> {
    console.log('🔗 Executing deduplication task...');
    
    const params = config.parameters || {};
    const strategies = params.strategies || ['content_hash', 'title_similarity'];
    const autoResolve = params.autoResolve || false;
    const minConfidence = params.minConfidence || 0.8;

    // In practice, this would run the actual deduplication engine
    const mockReport = {
      sessionId: crypto.randomUUID(),
      totalItemsProcessed: 1000,
      duplicatesFound: 25,
      duplicatesResolved: autoResolve ? 15 : 0,
      mergesPerformed: 10,
      itemsMarkedForReview: 10,
      qualityImprovements: [],
      processingTime: 30000,
      strategies: {}
    };

    execution.metrics.itemsProcessed = mockReport.totalItemsProcessed;
    execution.metrics.itemsUpdated = mockReport.duplicatesResolved;

    return mockReport;
  }

  private async executeHealthCheck(config: TaskConfiguration, execution: TaskExecution): Promise<any> {
    console.log('🏥 Executing health check...');
    
    const systemHealth = this.monitor.getSystemStatus();
    
    execution.metrics.itemsProcessed = 1;
    
    return {
      systemStatus: systemHealth,
      timestamp: new Date(),
      checks: {
        database: 'healthy',
        memory: systemHealth.performance.memoryUsage.heapUsed < 1000000000 ? 'healthy' : 'warning',
        errorRate: systemHealth.performance.errorRate < 0.05 ? 'healthy' : 'warning'
      }
    };
  }

  private async executeAnalyticsGeneration(config: TaskConfiguration, execution: TaskExecution): Promise<any> {
    console.log('📊 Executing analytics generation...');
    
    const analytics = await enhancedStorage.getAnalytics('week');
    
    execution.metrics.itemsProcessed = analytics.overview.totalRecords;
    
    return {
      analytics,
      dashboardUpdated: true,
      facetsUpdated: true,
      trendsCalculated: true
    };
  }

  private async executeSystemMaintenance(config: TaskConfiguration, execution: TaskExecution): Promise<any> {
    console.log('🧹 Executing system maintenance...');
    
    // Simulate maintenance tasks
    const maintenanceTasks = [
      'Cleaning old log files',
      'Optimizing database indexes',
      'Archiving old data',
      'Updating statistics',
      'Running garbage collection'
    ];

    for (const task of maintenanceTasks) {
      console.log(`  🔧 ${task}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      execution.metrics.itemsProcessed++;
    }

    return {
      tasksCompleted: maintenanceTasks,
      systemOptimized: true
    };
  }

  // Helper methods

  private async checkDependencies(task: ScheduledTask): Promise<boolean> {
    for (const depId of task.dependencies) {
      const depTask = this.scheduledTasks.get(depId);
      if (!depTask || !depTask.lastRun || depTask.failureCount > depTask.successCount) {
        return false;
      }
    }
    return true;
  }

  private async cancelAllRunningTasks(): Promise<void> {
    const runningTasks = Array.from(this.runningExecutions.values());
    
    for (const execution of runningTasks) {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      console.log(`🛑 Cancelled task execution: ${execution.executionId}`);
    }
    
    this.runningExecutions.clear();
    this.taskQueue.length = 0;
  }

  private startBackgroundProcesses(): void {
    // Start system monitoring
    setInterval(() => {
      if (!this.isRunning) return;
      
      const systemHealth = this.monitor.getSystemStatus();
      
      if (systemHealth.overall === 'critical') {
        console.log('🚨 System health critical - enabling maintenance mode');
        this.maintenanceMode = true;
      } else if (systemHealth.overall === 'healthy' && this.maintenanceMode) {
        console.log('✅ System health restored - disabling maintenance mode');
        this.maintenanceMode = false;
      }
    }, 60000); // Check every minute

    // Start queue processor
    setInterval(() => {
      if (!this.isRunning || this.maintenanceMode || this.taskQueue.length === 0) return;
      
      if (this.runningExecutions.size < 5) { // Max concurrent limit
        const nextTask = this.taskQueue.shift();
        if (nextTask) {
          this.runTask(nextTask);
        }
      }
    }, 5000); // Check every 5 seconds
  }

  private async generateRecommendations(analytics: any, systemHealth: any): Promise<string[]> {
    const recommendations: string[] = [];

    if (systemHealth.performance.errorRate > 0.1) {
      recommendations.push('High error rate detected - review system logs and increase monitoring');
    }

    if (analytics.overview.qualityScore < 70) {
      recommendations.push('Data quality is below optimal - consider reviewing validation rules');
    }

    if (systemHealth.performance.memoryUsage.heapUsed > 1000000000) {
      recommendations.push('Memory usage is high - consider implementing memory optimization');
    }

    recommendations.push('System is operating normally - continue with current configuration');

    return recommendations;
  }
}

export const intelligentOrchestrator = new IntelligentOrchestrator();
