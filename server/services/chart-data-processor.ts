import type { 
  ChartData, BudgetItem, SpendingRecord, StatisticalData, PerformanceMetric, 
  Councillor, Department, Service, Meeting 
} from '@shared/enhanced-schema';

/**
 * Chart-Ready Data Processor
 * Transforms extracted council data into optimized formats for charts,
 * graphs, and resident-friendly visualizations
 */

export class ChartDataProcessor {

  /**
   * Process budget data for financial charts
   */
  static processBudgetData(budgetItems: BudgetItem[]): ChartData[] {
    const charts: ChartData[] = [];

    if (budgetItems.length === 0) return charts;

    // Department spending breakdown (pie chart)
    const departmentTotals = this.aggregateByField(budgetItems, 'department', 'amount');
    if (Object.keys(departmentTotals).length > 1) {
      charts.push({
        chartType: 'pie',
        title: 'Council Budget by Department',
        description: 'How the council budget is allocated across different departments',
        category: 'Financial',
        subcategory: 'Budget Allocation',
        dataPoints: Object.entries(departmentTotals).map(([dept, total]) => ({
          label: dept,
          value: total,
          metadata: { 
            percentage: Math.round((total / Object.values(departmentTotals).reduce((a, b) => a + b, 0)) * 100),
            currency: 'GBP'
          }
        })),
        unit: 'GBP',
        timeframe: 'Annual',
        updateFrequency: 'Quarterly',
        sourceUrls: Array.from(new Set(budgetItems.map(item => item.sourceDocument))),
        lastUpdated: new Date()
      });
    }

    // Budget trends over time (line chart)
    const yearlyBudgets = this.aggregateByField(budgetItems, 'year', 'amount');
    if (Object.keys(yearlyBudgets).length > 1) {
      charts.push({
        chartType: 'line',
        title: 'Council Budget Trends',
        description: 'How the total council budget has changed over time',
        category: 'Financial',
        subcategory: 'Budget Trends',
        dataPoints: Object.entries(yearlyBudgets)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([year, total]) => ({
            label: year,
            value: total,
            date: new Date(`${year}-01-01`),
            metadata: { currency: 'GBP', year: parseInt(year) }
          })),
        unit: 'GBP',
        timeframe: 'Multi-year',
        updateFrequency: 'Annual',
        sourceUrls: Array.from(new Set(budgetItems.map(item => item.sourceDocument))),
        lastUpdated: new Date()
      });
    }

    // Category breakdown (bar chart)
    const categoryTotals = this.aggregateByField(budgetItems, 'category', 'amount');
    if (Object.keys(categoryTotals).length > 1) {
      charts.push({
        chartType: 'bar',
        title: 'Budget by Category',
        description: 'Council spending breakdown by budget categories',
        category: 'Financial',
        subcategory: 'Budget Categories',
        dataPoints: Object.entries(categoryTotals)
          .sort(([, a], [, b]) => b - a)
          .map(([category, total]) => ({
            label: category,
            value: total,
            metadata: { currency: 'GBP' }
          })),
        unit: 'GBP',
        timeframe: 'Annual',
        updateFrequency: 'Quarterly',
        sourceUrls: Array.from(new Set(budgetItems.map(item => item.sourceDocument))),
        lastUpdated: new Date()
      });
    }

    return charts;
  }

  /**
   * Process spending data for expenditure analysis
   */
  static processSpendingData(spendingRecords: SpendingRecord[]): ChartData[] {
    const charts: ChartData[] = [];

    if (spendingRecords.length === 0) return charts;

    // Monthly spending trends
    const monthlySpending = this.aggregateByMonth(spendingRecords, 'transactionDate', 'amount');
    if (Object.keys(monthlySpending).length > 1) {
      charts.push({
        chartType: 'line',
        title: 'Monthly Council Spending',
        description: 'Council expenditure trends by month',
        category: 'Financial',
        subcategory: 'Spending Trends',
        dataPoints: Object.entries(monthlySpending)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, total]) => ({
            label: this.formatMonth(month),
            value: total,
            date: new Date(month + '-01'),
            metadata: { currency: 'GBP' }
          })),
        unit: 'GBP',
        timeframe: 'Monthly',
        updateFrequency: 'Monthly',
        sourceUrls: Array.from(new Set(spendingRecords.map(record => record.sourceUrl))),
        lastUpdated: new Date()
      });
    }

    // Top suppliers (bar chart)
    const supplierTotals = this.aggregateByField(spendingRecords, 'supplier', 'amount');
    const topSuppliers = Object.entries(supplierTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    if (topSuppliers.length > 0) {
      charts.push({
        chartType: 'bar',
        title: 'Top 10 Council Suppliers',
        description: 'Largest suppliers to the council by total spending',
        category: 'Financial',
        subcategory: 'Supplier Analysis',
        dataPoints: topSuppliers.map(([supplier, total]) => ({
          label: this.truncateLabel(supplier, 30),
          value: total,
          metadata: { currency: 'GBP', fullName: supplier }
        })),
        unit: 'GBP',
        timeframe: 'Annual',
        updateFrequency: 'Monthly',
        sourceUrls: Array.from(new Set(spendingRecords.map(record => record.sourceUrl))),
        lastUpdated: new Date()
      });
    }

    // Department spending (pie chart)
    const deptSpending = this.aggregateByField(spendingRecords, 'department', 'amount');
    if (Object.keys(deptSpending).length > 1) {
      charts.push({
        chartType: 'pie',
        title: 'Spending by Department',
        description: 'How much each department has spent',
        category: 'Financial',
        subcategory: 'Department Spending',
        dataPoints: Object.entries(deptSpending).map(([dept, total]) => ({
          label: dept,
          value: total,
          metadata: { 
            currency: 'GBP',
            percentage: Math.round((total / Object.values(deptSpending).reduce((a, b) => a + b, 0)) * 100)
          }
        })),
        unit: 'GBP',
        timeframe: 'Annual',
        updateFrequency: 'Monthly',
        sourceUrls: Array.from(new Set(spendingRecords.map(record => record.sourceUrl))),
        lastUpdated: new Date()
      });
    }

    return charts;
  }

  /**
   * Process performance metrics for KPI dashboards
   */
  static processPerformanceData(metrics: PerformanceMetric[]): ChartData[] {
    const charts: ChartData[] = [];

    if (metrics.length === 0) return charts;

    // Group metrics by service
    const metricsByService = this.groupBy(metrics, 'service');

    Object.entries(metricsByService).forEach(([service, serviceMetrics]) => {
      if (serviceMetrics.length > 1) {
        // Service performance overview (bar chart)
        charts.push({
          chartType: 'bar',
          title: `${service} Performance Metrics`,
          description: `Key performance indicators for ${service}`,
          category: 'Performance',
          subcategory: service,
          dataPoints: serviceMetrics.map(metric => ({
            label: this.truncateLabel(metric.metric, 25),
            value: metric.value,
            metadata: { 
              unit: metric.unit,
              target: metric.target,
              trend: metric.trend,
              fullName: metric.metric
            }
          })),
          unit: 'Mixed',
          timeframe: 'Current',
          updateFrequency: 'Monthly',
          sourceUrls: Array.from(new Set(serviceMetrics.map(m => m.sourceUrl))),
          lastUpdated: new Date()
        });
      }
    });

    // Trends for metrics with target values
    const metricsWithTargets = metrics.filter(m => m.target !== undefined);
    if (metricsWithTargets.length > 0) {
      charts.push({
        chartType: 'scatter',
        title: 'Performance vs Targets',
        description: 'How current performance compares to set targets',
        category: 'Performance',
        subcategory: 'Target Analysis',
        dataPoints: metricsWithTargets.map(metric => ({
          label: this.truncateLabel(metric.metric, 20),
          value: metric.value,
          metadata: { 
            target: metric.target,
            achievement: Math.round((metric.value / (metric.target || 1)) * 100),
            unit: metric.unit,
            service: metric.service
          }
        })),
        unit: 'Various',
        timeframe: 'Current',
        updateFrequency: 'Monthly',
        sourceUrls: Array.from(new Set(metricsWithTargets.map(m => m.sourceUrl))),
        lastUpdated: new Date()
      });
    }

    return charts;
  }

  /**
   * Process political and organizational data
   */
  static processPoliticalData(councillors: Councillor[]): ChartData[] {
    const charts: ChartData[] = [];

    if (councillors.length === 0) return charts;

    // Party composition (pie chart)
    const partyComposition = this.countByField(councillors, 'party');
    if (Object.keys(partyComposition).length > 1) {
      charts.push({
        chartType: 'pie',
        title: 'Council Political Composition',
        description: 'Number of councillors by political party',
        category: 'Political',
        subcategory: 'Party Composition',
        dataPoints: Object.entries(partyComposition).map(([party, count]) => ({
          label: party || 'Independent',
          value: count,
          metadata: { 
            percentage: Math.round((count / councillors.length) * 100),
            councillors: count
          }
        })),
        unit: 'Councillors',
        timeframe: 'Current Term',
        updateFrequency: 'Per Election',
        sourceUrls: ['Council Website'],
        lastUpdated: new Date()
      });
    }

    // Committee participation (bar chart)
    const committeeParticipation = {};
    councillors.forEach(councillor => {
      councillor.committees.forEach(committee => {
        committeeParticipation[committee] = (committeeParticipation[committee] || 0) + 1;
      });
    });

    if (Object.keys(committeeParticipation).length > 0) {
      charts.push({
        chartType: 'bar',
        title: 'Committee Membership',
        description: 'Number of councillors on each committee',
        category: 'Political',
        subcategory: 'Committee Structure',
        dataPoints: Object.entries(committeeParticipation)
          .sort(([, a], [, b]) => b - a)
          .map(([committee, count]) => ({
            label: this.truncateLabel(committee, 25),
            value: count,
            metadata: { fullName: committee }
          })),
        unit: 'Councillors',
        timeframe: 'Current Term',
        updateFrequency: 'Annual',
        sourceUrls: ['Council Website'],
        lastUpdated: new Date()
      });
    }

    return charts;
  }

  /**
   * Process service data for resident information
   */
  static processServiceData(services: Service[]): ChartData[] {
    const charts: ChartData[] = [];

    if (services.length === 0) return charts;

    // Services by category (bar chart)
    const servicesByCategory = this.countByField(services, 'category');
    if (Object.keys(servicesByCategory).length > 1) {
      charts.push({
        chartType: 'bar',
        title: 'Council Services by Category',
        description: 'Number of services available in each category',
        category: 'Services',
        subcategory: 'Service Categories',
        dataPoints: Object.entries(servicesByCategory)
          .sort(([, a], [, b]) => b - a)
          .map(([category, count]) => ({
            label: category,
            value: count,
            metadata: { services: count }
          })),
        unit: 'Services',
        timeframe: 'Current',
        updateFrequency: 'Quarterly',
        sourceUrls: ['Council Website'],
        lastUpdated: new Date()
      });
    }

    // Digital vs traditional services (pie chart)
    const digitalServices = services.filter(s => s.onlineAccess).length;
    const traditionalServices = services.length - digitalServices;

    if (digitalServices > 0 && traditionalServices > 0) {
      charts.push({
        chartType: 'pie',
        title: 'Digital Service Availability',
        description: 'Proportion of services available online vs traditional access only',
        category: 'Services',
        subcategory: 'Digital Transformation',
        dataPoints: [
          {
            label: 'Available Online',
            value: digitalServices,
            metadata: { 
              percentage: Math.round((digitalServices / services.length) * 100),
              type: 'digital'
            }
          },
          {
            label: 'Traditional Access Only',
            value: traditionalServices,
            metadata: { 
              percentage: Math.round((traditionalServices / services.length) * 100),
              type: 'traditional'
            }
          }
        ],
        unit: 'Services',
        timeframe: 'Current',
        updateFrequency: 'Quarterly',
        sourceUrls: ['Council Website'],
        lastUpdated: new Date()
      });
    }

    return charts;
  }

  /**
   * Process statistical data for general insights
   */
  static processStatisticalData(statistics: StatisticalData[]): ChartData[] {
    const charts: ChartData[] = [];

    if (statistics.length === 0) return charts;

    // Group by category
    const statsByCategory = this.groupBy(statistics, 'category');

    Object.entries(statsByCategory).forEach(([category, categoryStats]) => {
      if (categoryStats.length > 1) {
        charts.push({
          chartType: 'bar',
          title: `${category} Statistics`,
          description: `Key statistics for ${category}`,
          category: 'Statistics',
          subcategory: category,
          dataPoints: categoryStats.map(stat => ({
            label: this.truncateLabel(stat.metric, 25),
            value: stat.value,
            date: stat.date,
            metadata: { 
              unit: stat.unit,
              confidence: stat.confidence,
              fullName: stat.metric
            }
          })),
          unit: 'Various',
          timeframe: 'Current',
          updateFrequency: 'Monthly',
          sourceUrls: Array.from(new Set(categoryStats.map(s => s.sourceDocument))),
          lastUpdated: new Date()
        });
      }
    });

    return charts;
  }

  /**
   * Create summary dashboard data
   */
  static createSummaryDashboard(data: {
    budgetItems: BudgetItem[];
    spendingRecords: SpendingRecord[];
    councillors: Councillor[];
    services: Service[];
    meetings: Meeting[];
  }): ChartData[] {
    const summaryCharts: ChartData[] = [];

    // Council overview stats
    const totalBudget = data.budgetItems.reduce((sum, item) => sum + item.amount, 0);
    const totalSpending = data.spendingRecords.reduce((sum, record) => sum + record.amount, 0);
    
    summaryCharts.push({
      chartType: 'bar',
      title: 'Council Overview',
      description: 'Key numbers about Bolton Council',
      category: 'Overview',
      subcategory: 'Key Metrics',
      dataPoints: [
        {
          label: 'Total Councillors',
          value: data.councillors.length,
          metadata: { type: 'count', description: 'Elected representatives' }
        },
        {
          label: 'Services Available',
          value: data.services.length,
          metadata: { type: 'count', description: 'Council services offered' }
        },
        {
          label: 'Meetings This Year',
          value: data.meetings.filter(m => m.date.getFullYear() === new Date().getFullYear()).length,
          metadata: { type: 'count', description: 'Council meetings scheduled' }
        },
        ...(totalBudget > 0 ? [{
          label: 'Annual Budget (£M)',
          value: Math.round(totalBudget / 1000000),
          metadata: { type: 'currency', description: 'Total annual budget in millions' }
        }] : [])
      ],
      unit: 'Various',
      timeframe: 'Current',
      updateFrequency: 'Monthly',
      sourceUrls: ['Council Data'],
      lastUpdated: new Date()
    });

    return summaryCharts;
  }

  // Utility methods

  private static aggregateByField<T>(items: T[], field: keyof T, valueField: keyof T): Record<string, number> {
    const result = {};
    items.forEach(item => {
      const key = String(item[field]);
      const value = Number(item[valueField]) || 0;
      result[key] = (result[key] || 0) + value;
    });
    return result;
  }

  private static countByField<T>(items: T[], field: keyof T): Record<string, number> {
    const result = {};
    items.forEach(item => {
      const key = String(item[field]) || 'Unknown';
      result[key] = (result[key] || 0) + 1;
    });
    return result;
  }

  private static groupBy<T>(items: T[], field: keyof T): Record<string, T[]> {
    const result = {};
    items.forEach(item => {
      const key = String(item[field]);
      if (!result[key]) result[key] = [];
      result[key].push(item);
    });
    return result;
  }

  private static aggregateByMonth<T>(items: T[], dateField: keyof T, valueField: keyof T): Record<string, number> {
    const result = {};
    items.forEach(item => {
      const date = item[dateField] as Date;
      if (date instanceof Date) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const value = Number(item[valueField]) || 0;
        result[monthKey] = (result[monthKey] || 0) + value;
      }
    });
    return result;
  }

  private static formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short' });
  }

  private static truncateLabel(label: string, maxLength: number): string {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + '...';
  }
}
