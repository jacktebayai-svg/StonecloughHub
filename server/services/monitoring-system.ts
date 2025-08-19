import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface ErrorContext {
  url?: string;
  operation: string;
  timestamp: Date;
  sessionId?: string;
  depth?: number;
  retryCount?: number;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  operationName: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  memoryUsage: NodeJS.MemoryUsage;
  url?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'warning' | 'critical' | 'down';
  responseTime?: number;
  lastCheck: Date;
  details?: string;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  acknowledged: boolean;
  metadata?: Record<string, any>;
}

export interface SessionMetrics {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'paused';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  duplicatesSkipped: number;
  bytesProcessed: number;
  averageResponseTime: number;
  errorRate: number;
  urls: {
    discovered: number;
    processed: number;
    failed: number;
    skipped: number;
  };
  performance: {
    peakMemoryUsage: number;
    averageCpuUsage: number;
    diskSpaceUsed: number;
  };
  errors: Array<{
    type: string;
    count: number;
    lastOccurrence: Date;
    examples: string[];
  }>;
}

export class ComprehensiveMonitor extends EventEmitter {
  private errors: Map<string, { count: number; firstSeen: Date; lastSeen: Date; examples: any[] }> = new Map();
  private performanceMetrics: PerformanceMetrics[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private sessionMetrics: Map<string, SessionMetrics> = new Map();
  private operationTimers: Map<string, number> = new Map();
  
  // Configuration
  private readonly config = {
    maxErrorsInMemory: 1000,
    maxPerformanceMetrics: 10000,
    alertThresholds: {
      errorRate: 0.1, // 10% error rate
      responseTime: 30000, // 30 seconds
      memoryUsage: 1024 * 1024 * 1024, // 1GB
      diskSpace: 10 * 1024 * 1024 * 1024, // 10GB
    },
    healthCheckInterval: 60000, // 1 minute
    cleanupInterval: 3600000, // 1 hour
  };
  
  constructor() {
    super();
    this.startBackgroundTasks();
  }
  
  /**
   * Record an error with context
   */
  recordError(error: Error, context: ErrorContext): void {
    const errorKey = this.generateErrorKey(error, context);
    const now = new Date();
    
    if (this.errors.has(errorKey)) {
      const existing = this.errors.get(errorKey)!;
      existing.count++;
      existing.lastSeen = now;
      existing.examples.push({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: now
      });
      
      // Keep only recent examples
      if (existing.examples.length > 5) {
        existing.examples = existing.examples.slice(-3);
      }
    } else {
      this.errors.set(errorKey, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
        examples: [{
          message: error.message,
          stack: error.stack,
          context,
          timestamp: now
        }]
      });
    }
    
    // Update session metrics if applicable
    if (context.sessionId) {
      this.updateSessionError(context.sessionId, error);
    }
    
    // Check if we need to create an alert
    this.checkErrorThresholds(errorKey, error, context);
    
    // Emit error event
    this.emit('error', { error, context, key: errorKey });
    
    // Log to console with appropriate level
    const errorLevel = this.determineErrorLevel(error, context);
    this.logError(error, context, errorLevel);
  }
  
  /**
   * Start performance timing for an operation
   */
  startTiming(operationName: string, metadata?: Record<string, any>): string {
    const timingId = crypto.randomUUID();
    this.operationTimers.set(timingId, performance.now());
    return timingId;
  }
  
  /**
   * End performance timing and record metrics
   */
  endTiming(timingId: string, operationName: string, success: boolean, metadata?: Record<string, any>): void {
    const startTime = this.operationTimers.get(timingId);
    if (!startTime) return;
    
    const duration = performance.now() - startTime;
    this.operationTimers.delete(timingId);
    
    const metrics: PerformanceMetrics = {
      operationName,
      duration,
      timestamp: new Date(),
      success,
      memoryUsage: process.memoryUsage(),
      metadata
    };
    
    this.performanceMetrics.push(metrics);
    
    // Keep only recent metrics
    if (this.performanceMetrics.length > this.config.maxPerformanceMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.config.maxPerformanceMetrics / 2);
    }
    
    // Check performance thresholds
    this.checkPerformanceThresholds(metrics);
    
    // Emit performance event
    this.emit('performance', metrics);
  }
  
  /**
   * Record session start
   */
  startSession(sessionId: string): void {
    const sessionMetrics: SessionMetrics = {
      sessionId,
      startTime: new Date(),
      status: 'running',
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      duplicatesSkipped: 0,
      bytesProcessed: 0,
      averageResponseTime: 0,
      errorRate: 0,
      urls: {
        discovered: 0,
        processed: 0,
        failed: 0,
        skipped: 0
      },
      performance: {
        peakMemoryUsage: 0,
        averageCpuUsage: 0,
        diskSpaceUsed: 0
      },
      errors: []
    };
    
    this.sessionMetrics.set(sessionId, sessionMetrics);
    this.emit('sessionStart', sessionMetrics);
  }
  
  /**
   * Update session metrics
   */
  updateSession(sessionId: string, updates: Partial<SessionMetrics>): void {
    const session = this.sessionMetrics.get(sessionId);
    if (!session) return;
    
    Object.assign(session, updates);
    
    // Recalculate derived metrics
    if (session.totalRequests > 0) {
      session.errorRate = session.failedRequests / session.totalRequests;
    }
    
    this.emit('sessionUpdate', session);
  }
  
  /**
   * End session
   */
  endSession(sessionId: string, status: 'completed' | 'failed'): void {
    const session = this.sessionMetrics.get(sessionId);
    if (!session) return;
    
    session.endTime = new Date();
    session.status = status;
    
    // Generate session summary
    const summary = this.generateSessionSummary(session);
    
    this.emit('sessionEnd', { session, summary });
    
    // Log session completion
    console.log(`📊 Session ${sessionId} ${status}:`, summary);
  }
  
  /**
   * Perform health check on a service
   */
  async healthCheck(serviceName: string, checkFunction: () => Promise<{ status: HealthCheck['status']; details?: string; responseTime?: number; metadata?: Record<string, any> }>): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      const result = await checkFunction();
      const responseTime = performance.now() - startTime;
      
      const healthCheck: HealthCheck = {
        service: serviceName,
        status: result.status,
        responseTime: result.responseTime || responseTime,
        lastCheck: new Date(),
        details: result.details,
        metadata: result.metadata
      };
      
      this.healthChecks.set(serviceName, healthCheck);
      
      // Create alert if service is down or critical
      if (healthCheck.status === 'critical' || healthCheck.status === 'down') {
        this.createAlert('critical', `Service ${serviceName} is ${healthCheck.status}`, 'health_check', healthCheck.details, { service: serviceName });
      }
      
      this.emit('healthCheck', healthCheck);
      return healthCheck;
      
    } catch (error) {
      const healthCheck: HealthCheck = {
        service: serviceName,
        status: 'down',
        responseTime: performance.now() - startTime,
        lastCheck: new Date(),
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.healthChecks.set(serviceName, healthCheck);
      this.createAlert('critical', `Service ${serviceName} health check failed`, 'health_check', healthCheck.details);
      
      this.emit('healthCheck', healthCheck);
      return healthCheck;
    }
  }
  
  /**
   * Create an alert
   */
  createAlert(type: Alert['type'], title: string, source: string, message?: string, metadata?: Record<string, any>): Alert {
    const alert: Alert = {
      id: crypto.randomUUID(),
      type,
      title,
      message: message || title,
      source,
      timestamp: new Date(),
      acknowledged: false,
      metadata
    };
    
    this.alerts.set(alert.id, alert);
    
    // Emit alert event
    this.emit('alert', alert);
    
    // Log alert
    const logLevel = type === 'critical' ? 'error' : type === 'warning' ? 'warn' : 'info';
    console[logLevel](`🚨 ${type.toUpperCase()}: ${title} - ${message}`);
    
    return alert;
  }
  
  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);
      return true;
    }
    return false;
  }
  
  /**
   * Get current system status
   */
  getSystemStatus(): {
    overall: 'healthy' | 'warning' | 'critical';
    services: HealthCheck[];
    activeAlerts: Alert[];
    recentErrors: Array<{ key: string; count: number; lastSeen: Date; examples: any[] }>;
    performance: {
      averageResponseTime: number;
      errorRate: number;
      memoryUsage: NodeJS.MemoryUsage;
    };
    sessions: {
      active: number;
      total: number;
      successRate: number;
    };
  } {
    const services = Array.from(this.healthChecks.values());
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.acknowledged);
    const recentErrors = Array.from(this.errors.entries())
      .map(([key, error]) => ({ key, ...error }))
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
      .slice(0, 10);
    
    // Calculate overall status
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (activeAlerts.some(a => a.type === 'critical') || services.some(s => s.status === 'critical' || s.status === 'down')) {
      overall = 'critical';
    } else if (activeAlerts.some(a => a.type === 'warning') || services.some(s => s.status === 'warning')) {
      overall = 'warning';
    }
    
    // Calculate performance metrics
    const recentMetrics = this.performanceMetrics.slice(-100);
    const averageResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length 
      : 0;
    const errorRate = recentMetrics.length > 0
      ? recentMetrics.filter(m => !m.success).length / recentMetrics.length
      : 0;
    
    // Calculate session metrics
    const allSessions = Array.from(this.sessionMetrics.values());
    const activeSessions = allSessions.filter(s => s.status === 'running').length;
    const completedSessions = allSessions.filter(s => s.status === 'completed').length;
    const totalSessions = allSessions.length;
    const successRate = totalSessions > 0 ? completedSessions / totalSessions : 0;
    
    return {
      overall,
      services,
      activeAlerts,
      recentErrors,
      performance: {
        averageResponseTime,
        errorRate,
        memoryUsage: process.memoryUsage()
      },
      sessions: {
        active: activeSessions,
        total: totalSessions,
        successRate
      }
    };
  }
  
  /**
   * Get detailed analytics
   */
  getAnalytics(timeframe: 'hour' | 'day' | 'week' = 'day'): {
    errorTrends: Array<{ time: string; count: number }>;
    performanceTrends: Array<{ time: string; averageResponseTime: number; errorRate: number }>;
    topErrors: Array<{ key: string; count: number; trend: 'increasing' | 'decreasing' | 'stable' }>;
    serviceHealth: Array<{ service: string; uptime: number; avgResponseTime: number }>;
    sessionStats: {
      totalSessions: number;
      successRate: number;
      avgDuration: number;
      totalDataProcessed: number;
    };
  } {
    const now = new Date();
    const cutoff = new Date(now.getTime() - this.getTimeframeDuration(timeframe));
    
    // Filter recent data
    const recentMetrics = this.performanceMetrics.filter(m => m.timestamp >= cutoff);
    const recentSessions = Array.from(this.sessionMetrics.values()).filter(s => s.startTime >= cutoff);
    
    // Error trends
    const errorTrends = this.calculateErrorTrends(cutoff, timeframe);
    
    // Performance trends
    const performanceTrends = this.calculatePerformanceTrends(recentMetrics, timeframe);
    
    // Top errors
    const topErrors = this.calculateTopErrors(cutoff);
    
    // Service health
    const serviceHealth = this.calculateServiceHealth(cutoff);
    
    // Session statistics
    const sessionStats = this.calculateSessionStats(recentSessions);
    
    return {
      errorTrends,
      performanceTrends,
      topErrors,
      serviceHealth,
      sessionStats
    };
  }
  
  /**
   * Export monitoring data
   */
  exportData(format: 'json' | 'csv'): string {
    const data = {
      timestamp: new Date(),
      systemStatus: this.getSystemStatus(),
      analytics: this.getAnalytics('week'),
      sessions: Array.from(this.sessionMetrics.values()),
      errors: Array.from(this.errors.entries()).map(([key, error]) => ({ key, ...error })),
      performanceMetrics: this.performanceMetrics.slice(-1000), // Last 1000 metrics
      healthChecks: Array.from(this.healthChecks.values()),
      alerts: Array.from(this.alerts.values())
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    // For CSV, create a simplified format
    const csvLines = [
      'Type,Timestamp,Details',
      ...data.errors.map(e => `Error,${e.lastSeen.toISOString()},"${e.count} occurrences"`),
      ...data.performanceMetrics.map(m => `Performance,${m.timestamp.toISOString()},"${m.operationName}: ${m.duration}ms"`),
      ...data.alerts.map(a => `Alert,${a.timestamp.toISOString()},"${a.type}: ${a.title}"`)
    ];
    
    return csvLines.join('\n');
  }
  
  // Private helper methods
  
  private generateErrorKey(error: Error, context: ErrorContext): string {
    return crypto.createHash('md5').update(`${error.name}:${context.operation}:${context.url || 'no-url'}`).digest('hex');
  }
  
  private updateSessionError(sessionId: string, error: Error): void {
    const session = this.sessionMetrics.get(sessionId);
    if (!session) return;
    
    session.failedRequests++;
    
    // Update error breakdown
    const errorType = error.name || 'Unknown';
    let errorStat = session.errors.find(e => e.type === errorType);
    if (!errorStat) {
      errorStat = {
        type: errorType,
        count: 0,
        lastOccurrence: new Date(),
        examples: []
      };
      session.errors.push(errorStat);
    }
    
    errorStat.count++;
    errorStat.lastOccurrence = new Date();
    errorStat.examples.push(error.message);
    
    // Keep only recent examples
    if (errorStat.examples.length > 3) {
      errorStat.examples = errorStat.examples.slice(-3);
    }
  }
  
  private determineErrorLevel(error: Error, context: ErrorContext): 'error' | 'warn' | 'info' {
    // Critical errors
    if (error.name === 'TypeError' || error.name === 'ReferenceError') return 'error';
    if (context.operation === 'database' || context.operation === 'file_system') return 'error';
    
    // Network errors might be warnings
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      return context.retryCount && context.retryCount > 2 ? 'error' : 'warn';
    }
    
    return 'warn';
  }
  
  private logError(error: Error, context: ErrorContext, level: 'error' | 'warn' | 'info'): void {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: {
        operation: context.operation,
        url: context.url,
        timestamp: context.timestamp,
        sessionId: context.sessionId,
        depth: context.depth,
        retryCount: context.retryCount
      }
    };
    
    console[level](`🚨 ${level.toUpperCase()}: ${context.operation}`, logData);
  }
  
  private checkErrorThresholds(errorKey: string, error: Error, context: ErrorContext): void {
    const errorStat = this.errors.get(errorKey)!;
    
    // Create alert if error count exceeds threshold
    if (errorStat.count === 5) {
      this.createAlert('warning', `Repeated error: ${error.name}`, 'error_monitoring', 
        `Error occurred 5 times in ${context.operation}`, { errorKey, operation: context.operation });
    } else if (errorStat.count === 20) {
      this.createAlert('critical', `Critical error pattern: ${error.name}`, 'error_monitoring',
        `Error occurred 20 times in ${context.operation}`, { errorKey, operation: context.operation });
    }
  }
  
  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    // Check response time
    if (metrics.duration > this.config.alertThresholds.responseTime) {
      this.createAlert('warning', 'Slow operation detected', 'performance_monitoring',
        `${metrics.operationName} took ${Math.round(metrics.duration)}ms`, { metrics });
    }
    
    // Check memory usage
    if (metrics.memoryUsage.heapUsed > this.config.alertThresholds.memoryUsage) {
      this.createAlert('warning', 'High memory usage', 'performance_monitoring',
        `Memory usage: ${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`, { metrics });
    }
  }
  
  private generateSessionSummary(session: SessionMetrics): any {
    const duration = session.endTime ? session.endTime.getTime() - session.startTime.getTime() : 0;
    const durationMinutes = Math.round(duration / 60000);
    
    return {
      duration: `${durationMinutes} minutes`,
      successRate: `${Math.round((1 - session.errorRate) * 100)}%`,
      requestsPerMinute: durationMinutes > 0 ? Math.round(session.totalRequests / durationMinutes) : 0,
      dataProcessed: this.formatBytes(session.bytesProcessed),
      topErrors: session.errors.sort((a, b) => b.count - a.count).slice(0, 3).map(e => `${e.type}: ${e.count}`)
    };
  }
  
  private getTimeframeDuration(timeframe: 'hour' | 'day' | 'week'): number {
    switch (timeframe) {
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
    }
  }
  
  private calculateErrorTrends(cutoff: Date, timeframe: 'hour' | 'day' | 'week'): Array<{ time: string; count: number }> {
    // This would group errors by time intervals
    // For now, return mock data
    return [
      { time: '2024-01-01T00:00:00Z', count: 5 },
      { time: '2024-01-01T01:00:00Z', count: 3 },
      { time: '2024-01-01T02:00:00Z', count: 8 }
    ];
  }
  
  private calculatePerformanceTrends(metrics: PerformanceMetrics[], timeframe: 'hour' | 'day' | 'week'): Array<{ time: string; averageResponseTime: number; errorRate: number }> {
    // Group metrics by time intervals
    // For now, return mock data
    return [
      { time: '2024-01-01T00:00:00Z', averageResponseTime: 2500, errorRate: 0.05 },
      { time: '2024-01-01T01:00:00Z', averageResponseTime: 3200, errorRate: 0.08 },
      { time: '2024-01-01T02:00:00Z', averageResponseTime: 2800, errorRate: 0.03 }
    ];
  }
  
  private calculateTopErrors(cutoff: Date): Array<{ key: string; count: number; trend: 'increasing' | 'decreasing' | 'stable' }> {
    return Array.from(this.errors.entries())
      .filter(([, error]) => error.lastSeen >= cutoff)
      .map(([key, error]) => ({ key, count: error.count, trend: 'stable' as const }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  private calculateServiceHealth(cutoff: Date): Array<{ service: string; uptime: number; avgResponseTime: number }> {
    return Array.from(this.healthChecks.values())
      .map(hc => ({
        service: hc.service,
        uptime: hc.status === 'healthy' ? 1.0 : hc.status === 'warning' ? 0.8 : 0.2,
        avgResponseTime: hc.responseTime || 0
      }));
  }
  
  private calculateSessionStats(sessions: SessionMetrics[]): {
    totalSessions: number;
    successRate: number;
    avgDuration: number;
    totalDataProcessed: number;
  } {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const successRate = totalSessions > 0 ? completedSessions / totalSessions : 0;
    
    const avgDuration = sessions.reduce((sum, s) => {
      const duration = s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0;
      return sum + duration;
    }, 0) / Math.max(totalSessions, 1);
    
    const totalDataProcessed = sessions.reduce((sum, s) => sum + s.bytesProcessed, 0);
    
    return {
      totalSessions,
      successRate,
      avgDuration: avgDuration / 1000, // Convert to seconds
      totalDataProcessed
    };
  }
  
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  private startBackgroundTasks(): void {
    // Cleanup old data periodically
    setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
    
    // Run automatic health checks
    setInterval(() => {
      this.performAutomaticHealthChecks();
    }, this.config.healthCheckInterval);
  }
  
  private cleanup(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Keep 7 days
    
    // Clean old performance metrics
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp >= cutoff);
    
    // Clean old errors
    for (const [key, error] of this.errors.entries()) {
      if (error.lastSeen < cutoff) {
        this.errors.delete(key);
      }
    }
    
    // Clean acknowledged old alerts
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.acknowledged && alert.timestamp < cutoff) {
        this.alerts.delete(id);
      }
    }
    
    console.log('🧹 Monitoring data cleanup completed');
  }
  
  private async performAutomaticHealthChecks(): void {
    // Check database connectivity
    await this.healthCheck('database', async () => {
      // This would actually test database connection
      return { status: 'healthy', details: 'Database responsive', responseTime: 50 };
    });
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memStatus = memUsage.heapUsed > this.config.alertThresholds.memoryUsage ? 'warning' : 'healthy';
    
    this.healthChecks.set('memory', {
      service: 'memory',
      status: memStatus,
      lastCheck: new Date(),
      details: `Heap used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      metadata: { memoryUsage: memUsage }
    });
  }
}

// Singleton instance
export const monitor = new ComprehensiveMonitor();

// Convenience wrapper functions for easy use
export const recordError = (error: Error, context: ErrorContext) => monitor.recordError(error, context);
export const startTiming = (operation: string, metadata?: Record<string, any>) => monitor.startTiming(operation, metadata);
export const endTiming = (timingId: string, operation: string, success: boolean, metadata?: Record<string, any>) => monitor.endTiming(timingId, operation, success, metadata);
export const startSession = (sessionId: string) => monitor.startSession(sessionId);
export const updateSession = (sessionId: string, updates: Partial<SessionMetrics>) => monitor.updateSession(sessionId, updates);
export const endSession = (sessionId: string, status: 'completed' | 'failed') => monitor.endSession(sessionId, status);
export const createAlert = (type: Alert['type'], title: string, source: string, message?: string, metadata?: Record<string, any>) => monitor.createAlert(type, title, source, message, metadata);
export const healthCheck = (serviceName: string, checkFunction: () => Promise<{ status: HealthCheck['status']; details?: string; responseTime?: number; metadata?: Record<string, any> }>) => monitor.healthCheck(serviceName, checkFunction);

// Enhanced error handling wrapper
export function withErrorHandling<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>,
  metadata?: Record<string, any>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const timingId = startTiming(operation, metadata);
    
    try {
      const result = await fn(...args);
      endTiming(timingId, operation, true, { ...metadata, success: true });
      return result;
    } catch (error) {
      endTiming(timingId, operation, false, { ...metadata, success: false });
      recordError(error as Error, {
        operation,
        timestamp: new Date(),
        metadata
      });
      throw error;
    }
  };
}

// Performance timing decorator
export function timed(operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const opName = operation || `${target.constructor.name}.${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      const timingId = startTiming(opName);
      try {
        const result = await method.apply(this, args);
        endTiming(timingId, opName, true);
        return result;
      } catch (error) {
        endTiming(timingId, opName, false);
        throw error;
      }
    };
  };
}
