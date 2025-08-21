#!/usr/bin/env tsx

/**
 * DATA VISUALIZATION AND REPORTING ENGINE
 * 
 * Creates comprehensive visualizations and reports for the reprocessed data:
 * - Ward-based councillor information with contact details
 * - Financial data analysis with freshness indicators
 * - Quality metrics and improvement recommendations
 * - Interactive data dashboards and exports
 */

import fs from 'fs/promises';
import path from 'path';

interface VisualizationConfig {
  outputFormats: ('json' | 'csv' | 'html' | 'markdown')[];
  chartTypes: ('bar' | 'line' | 'pie' | 'map' | 'table')[];
  includeRawData: boolean;
  generateInteractive: boolean;
}

export class DataVisualizationEngine {
  private config: VisualizationConfig = {
    outputFormats: ['json', 'csv', 'html', 'markdown'],
    chartTypes: ['bar', 'pie', 'table'],
    includeRawData: true,
    generateInteractive: true
  };

  /**
   * Generate comprehensive visualizations from processed data
   */
  async generateComprehensiveVisualizations(): Promise<void> {
    console.log('📊 GENERATING COMPREHENSIVE DATA VISUALIZATIONS');
    console.log('=================================================');

    try {
      const reportsDir = './advanced-data-analysis';
      const outputDir = './data-visualizations';
      await fs.mkdir(outputDir, { recursive: true });

      // Load processed data
      const executiveSummary = await this.loadReport(reportsDir, 'executive-summary.json');
      const wardProfiles = await this.loadWardProfiles(reportsDir);
      const financialReport = await this.loadReport(reportsDir, 'financial-analysis/comprehensive-financial-report.json');
      const qualityReport = await this.loadReport(reportsDir, 'quality-reports/data-quality-analysis.json');

      // Generate different visualization formats
      await this.generateExecutiveDashboard(executiveSummary, outputDir);
      await this.generateWardProfiles(wardProfiles, outputDir);
      await this.generateFinancialDashboard(financialReport, outputDir);
      await this.generateQualityMetrics(qualityReport, outputDir);
      await this.generateActionableInsights(executiveSummary, outputDir);

      console.log('✅ Comprehensive visualizations generated successfully!');
      console.log(`📁 Saved to: ${outputDir}`);

    } catch (error) {
      console.error('❌ Visualization generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate executive dashboard with key metrics
   */
  private async generateExecutiveDashboard(executiveSummary: any, outputDir: string): Promise<void> {
    console.log('📊 Generating executive dashboard...');

    const dashboard = {
      title: 'StonecloughHub Data Analysis - Executive Dashboard',
      generated: new Date().toISOString(),
      keyMetrics: {
        totalRecords: executiveSummary.processingSession.recordsProcessed,
        wardsCovered: executiveSummary.wardSummary.totalWards,
        dataQuality: Math.round(executiveSummary.qualityMetrics.completenessScore * 100),
        freshDataPercentage: Math.round(
          (executiveSummary.qualityMetrics.freshRecords / 
           executiveSummary.qualityMetrics.totalRecords) * 100
        ),
        councillorsWithContact: executiveSummary.actionableInsights
          .find((insight: string) => insight.includes('councillors have contact'))
          ?.match(/(\d+)\/(\d+)/)?.[1] || 0,
        highValueTransactions: executiveSummary.financialSummary.highValueRecords
      },
      summaryCharts: {
        dataQuality: {
          type: 'pie',
          data: [
            { label: 'Fresh Data', value: executiveSummary.qualityMetrics.freshRecords },
            { label: 'Current Data', value: executiveSummary.qualityMetrics.staleRecords },
            { label: 'Outdated Data', value: executiveSummary.qualityMetrics.outdatedRecords }
          ]
        },
        wardCompleteness: {
          type: 'bar',
          data: Object.entries(executiveSummary.qualityMetrics.wardCoverage).map(([ward, score]: [string, any]) => ({
            label: ward,
            value: score
          }))
        }
      },
      criticalFindings: executiveSummary.keyFindings,
      priorityActions: executiveSummary.recommendationsPrioritized.slice(0, 5)
    };

    // Generate multiple formats
    await this.saveVisualization(dashboard, outputDir, 'executive-dashboard', ['json', 'html']);

    // Generate HTML dashboard
    const htmlDashboard = this.generateHtmlDashboard(dashboard);
    await fs.writeFile(path.join(outputDir, 'executive-dashboard.html'), htmlDashboard);
  }

  /**
   * Generate ward-specific profiles and visualizations
   */
  private async generateWardProfiles(wardProfiles: any[], outputDir: string): Promise<void> {
    console.log('🗺️ Generating ward profiles...');

    const wardDir = path.join(outputDir, 'ward-profiles');
    await fs.mkdir(wardDir, { recursive: true });

    // Generate overview of all wards
    const wardOverview = {
      title: 'Bolton Ward Profiles Overview',
      totalWards: wardProfiles.length,
      summaryTable: wardProfiles.map(profile => ({
        ward: profile.ward,
        councillors: profile.councillorDetails?.length || 0,
        dataCompleteness: profile.profile?.dataCompleteness || 0,
        recentActivity: profile.profile?.recentActivity?.planningApplications || 0,
        financialRecords: profile.financialData?.length || 0,
        publicValue: profile.publicValue || 0
      })),
      completenessDistribution: {
        high: wardProfiles.filter(w => (w.profile?.dataCompleteness || 0) >= 80).length,
        medium: wardProfiles.filter(w => {
          const completeness = w.profile?.dataCompleteness || 0;
          return completeness >= 50 && completeness < 80;
        }).length,
        low: wardProfiles.filter(w => (w.profile?.dataCompleteness || 0) < 50).length
      }
    };

    await this.saveVisualization(wardOverview, outputDir, 'ward-profiles-overview', ['json', 'csv', 'html']);

    // Generate individual ward profiles
    for (const wardProfile of wardProfiles) {
      const wardData = {
        wardName: wardProfile.ward,
        summary: {
          councillors: wardProfile.councillorDetails?.length || 0,
          completeness: wardProfile.profile?.dataCompleteness || 0,
          services: wardProfile.profile?.services?.length || 0,
          recentPlanning: wardProfile.profile?.recentActivity?.planningApplications || 0
        },
        councillors: (wardProfile.councillorDetails || []).map((councillor: any) => ({
          name: councillor.name,
          party: councillor.party,
          contact: {
            email: councillor.email || 'Not available',
            phone: councillor.phone || 'Not available',
            surgeryTimes: councillor.surgeryTimes || 'Not available'
          },
          responsibilities: councillor.responsibilities || [],
          committees: councillor.committees || [],
          qualityScore: Math.round((councillor.qualityScore || 0) * 100)
        })),
        financialActivity: (wardProfile.financialData || []).map((financial: any) => ({
          title: financial.title,
          amount: financial.amount,
          department: financial.department,
          freshness: financial.freshness,
          publicInterest: financial.publicInterest
        })).slice(0, 20), // Top 20 financial records
        recommendations: wardProfile.dataQuality?.recommendations || [],
        criticalGaps: wardProfile.dataQuality?.criticalGaps || []
      };

      const fileName = wardProfile.ward.replace(/\s+/g, '-').toLowerCase();
      await this.saveVisualization(wardData, wardDir, fileName, ['json', 'html']);
    }

    console.log(`✅ Generated profiles for ${wardProfiles.length} wards`);
  }

  /**
   * Generate financial data dashboard
   */
  private async generateFinancialDashboard(financialReport: any, outputDir: string): Promise<void> {
    console.log('💰 Generating financial dashboard...');

    const financialDashboard = {
      title: 'Financial Data Analysis Dashboard',
      summary: {
        totalValue: financialReport.summary.totalValue,
        totalRecords: financialReport.summary.totalRecords,
        avgTransaction: financialReport.summary.averageTransaction,
        freshRecords: financialReport.summary.totalRecords // This needs to be calculated from raw data
      },
      departmentBreakdown: Object.entries(financialReport.summary.byDepartment).map(([dept, data]: [string, any]) => ({
        department: dept,
        count: data.count,
        total: data.total,
        average: Math.round(data.total / data.count)
      })),
      wardFinancialActivity: Object.entries(financialReport.summary.byWard).map(([ward, data]: [string, any]) => ({
        ward: ward,
        count: data.count,
        total: data.total,
        average: Math.round(data.total / data.count)
      })),
      highValueTransactions: financialReport.highValueTransactions.map((transaction: any) => ({
        title: transaction.title,
        amount: transaction.amount,
        department: transaction.department,
        supplier: transaction.supplier,
        freshness: transaction.freshness,
        publicInterest: transaction.publicInterest
      })),
      freshnessAnalysis: {
        type: 'pie',
        data: Object.entries(financialReport.summary.byFreshness).map(([freshness, count]: [string, any]) => ({
          label: freshness,
          value: count
        }))
      },
      recommendations: financialReport.recommendations
    };

    await this.saveVisualization(financialDashboard, outputDir, 'financial-dashboard', ['json', 'html', 'csv']);
  }

  /**
   * Generate quality metrics dashboard
   */
  private async generateQualityMetrics(qualityReport: any, outputDir: string): Promise<void> {
    console.log('📈 Generating quality metrics dashboard...');

    const qualityDashboard = {
      title: 'Data Quality Analysis Dashboard',
      overallMetrics: {
        completeness: Math.round(qualityReport.overall.completenessScore * 100),
        actionability: Math.round(qualityReport.overall.actionabilityScore * 100),
        publicValue: Math.round(qualityReport.overall.publicValueScore * 100)
      },
      dataAnalysis: {
        councillorData: {
          total: qualityReport.detailedAnalysis.councillorData.total,
          highQuality: qualityReport.detailedAnalysis.councillorData.highQuality,
          withContact: qualityReport.detailedAnalysis.councillorData.withContact,
          contactPercentage: Math.round((qualityReport.detailedAnalysis.councillorData.withContact / qualityReport.detailedAnalysis.councillorData.total) * 100)
        },
        financialData: {
          total: qualityReport.detailedAnalysis.financialData.total,
          fresh: qualityReport.detailedAnalysis.financialData.fresh,
          actionable: qualityReport.detailedAnalysis.financialData.actionable,
          freshnessPercentage: Math.round((qualityReport.detailedAnalysis.financialData.fresh / qualityReport.detailedAnalysis.financialData.total) * 100)
        }
      },
      improvementPlan: qualityReport.improvementPlan,
      qualityTrends: {
        type: 'bar',
        data: [
          { label: 'Completeness', value: qualityReport.overall.completenessScore * 100 },
          { label: 'Actionability', value: qualityReport.overall.actionabilityScore * 100 },
          { label: 'Public Value', value: qualityReport.overall.publicValueScore * 100 }
        ]
      }
    };

    await this.saveVisualization(qualityDashboard, outputDir, 'quality-dashboard', ['json', 'html']);
  }

  /**
   * Generate actionable insights summary
   */
  private async generateActionableInsights(executiveSummary: any, outputDir: string): Promise<void> {
    console.log('💡 Generating actionable insights...');

    const insights = {
      title: 'Actionable Insights & Recommendations',
      criticalActions: executiveSummary.qualityMetrics.criticalGaps.map((gap: string) => ({
        issue: gap,
        priority: 'Critical',
        category: gap.includes('councillor') ? 'Councillor Data' : 
                 gap.includes('financial') ? 'Financial Data' : 
                 gap.includes('budget') ? 'Budget Data' : 'General'
      })),
      recommendations: executiveSummary.qualityMetrics.recommendations.map((rec: string) => ({
        recommendation: rec,
        priority: rec.includes('Critical') ? 'High' : 'Medium',
        category: rec.includes('councillor') ? 'Councillor Data' : 
                 rec.includes('financial') ? 'Financial Data' : 
                 rec.includes('ward') ? 'Ward Coverage' : 'General'
      })),
      quickWins: [
        {
          action: 'Update missing councillor contact information',
          impact: 'High',
          effort: 'Medium',
          timeline: '2-4 weeks'
        },
        {
          action: 'Map financial transactions to wards',
          impact: 'High',
          effort: 'Low',
          timeline: '1-2 weeks'
        },
        {
          action: 'Filter outdated financial records',
          impact: 'Medium',
          effort: 'Low',
          timeline: '1 week'
        }
      ],
      dataGaps: executiveSummary.wardSummary.wardsNeedingAttention,
      nextSteps: {
        immediate: [
          'Focus data collection on wards with <50% completeness',
          'Prioritize fresh financial data gathering',
          'Update councillor contact directories'
        ],
        shortTerm: [
          'Implement automated data freshness monitoring',
          'Enhance ward-specific data collection',
          'Build real-time data quality dashboards'
        ],
        longTerm: [
          'Create automated data update pipelines',
          'Implement AI-powered data quality scoring',
          'Build predictive analytics for data trends'
        ]
      }
    };

    await this.saveVisualization(insights, outputDir, 'actionable-insights', ['json', 'html', 'markdown']);

    // Generate a prioritized action plan
    const actionPlan = {
      title: 'StonecloughHub Data Improvement Action Plan',
      summary: `Based on analysis of ${executiveSummary.processingSession.recordsProcessed} records across ${executiveSummary.wardSummary.totalWards} wards`,
      prioritizedActions: [
        ...insights.criticalActions.slice(0, 3),
        ...insights.recommendations.filter((r: any) => r.priority === 'High').slice(0, 5)
      ],
      timeline: {
        week1: insights.quickWins.filter((w: any) => w.timeline.includes('1 week')),
        weeks2to4: insights.quickWins.filter((w: any) => w.timeline.includes('2-4 weeks')),
        ongoing: insights.nextSteps.shortTerm
      }
    };

    await this.saveVisualization(actionPlan, outputDir, 'action-plan', ['json', 'markdown']);
  }

  /**
   * Generate HTML dashboard
   */
  private generateHtmlDashboard(dashboard: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${dashboard.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1f2937;
            margin: 0;
            font-size: 2.5rem;
        }
        .header p {
            color: #6b7280;
            margin: 10px 0 0 0;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .metric-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .metric-label {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .findings {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .findings ul {
            margin: 0;
            padding-left: 20px;
        }
        .findings li {
            margin-bottom: 8px;
            color: #4b5563;
        }
        .actions {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 20px;
            border-radius: 8px;
        }
        .actions h3 {
            color: #92400e;
            margin-top: 0;
        }
        .actions ul {
            margin: 0;
            padding-left: 20px;
        }
        .actions li {
            margin-bottom: 8px;
            color: #78350f;
        }
        .chart-placeholder {
            background: #f9fafb;
            border: 2px dashed #d1d5db;
            padding: 40px;
            text-align: center;
            border-radius: 8px;
            color: #6b7280;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 0.9rem;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${dashboard.title}</h1>
            <p>Generated: ${new Date(dashboard.generated).toLocaleString()}</p>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${dashboard.keyMetrics.totalRecords.toLocaleString()}</div>
                <div class="metric-label">Total Records</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${dashboard.keyMetrics.wardsCovered}</div>
                <div class="metric-label">Wards Covered</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${dashboard.keyMetrics.dataQuality}%</div>
                <div class="metric-label">Data Quality</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${dashboard.keyMetrics.freshDataPercentage}%</div>
                <div class="metric-label">Fresh Data</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${dashboard.keyMetrics.councillorsWithContact}</div>
                <div class="metric-label">Contactable Councillors</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${dashboard.keyMetrics.highValueTransactions}</div>
                <div class="metric-label">High-Value Transactions</div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Key Findings</h2>
            <div class="findings">
                <ul>
                    ${dashboard.criticalFindings.map((finding: string) => `<li>${finding}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="section">
            <h2>🎯 Priority Actions</h2>
            <div class="actions">
                <h3>Immediate Actions Required:</h3>
                <ul>
                    ${dashboard.priorityActions.map((action: string) => `<li>${action}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="section">
            <h2>📈 Data Quality Distribution</h2>
            <div class="chart-placeholder">
                Data Quality Chart - ${dashboard.summaryCharts.dataQuality.data.length} categories
                <br><small>Fresh: ${dashboard.summaryCharts.dataQuality.data.find((d: any) => d.label === 'Fresh Data')?.value || 0} | 
                Current: ${dashboard.summaryCharts.dataQuality.data.find((d: any) => d.label === 'Current Data')?.value || 0} | 
                Outdated: ${dashboard.summaryCharts.dataQuality.data.find((d: any) => d.label === 'Outdated Data')?.value || 0}</small>
            </div>
        </div>

        <div class="section">
            <h2>🗺️ Ward Completeness</h2>
            <div class="chart-placeholder">
                Ward Completeness Chart - ${dashboard.summaryCharts.wardCompleteness.data.length} wards
                <br><small>Average Completeness: ${Math.round(dashboard.summaryCharts.wardCompleteness.data.reduce((sum: number, item: any) => sum + item.value, 0) / dashboard.summaryCharts.wardCompleteness.data.length)}%</small>
            </div>
        </div>

        <div class="footer">
            <p>StonecloughHub Advanced Data Analysis System</p>
            <p>This dashboard provides insights from comprehensive data reprocessing focused on fresh, actionable information.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Helper methods
   */
  private async loadReport(baseDir: string, fileName: string): Promise<any> {
    try {
      const content = await fs.readFile(path.join(baseDir, fileName), 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️ Could not load report: ${fileName}`);
      return {};
    }
  }

  private async loadWardProfiles(baseDir: string): Promise<any[]> {
    try {
      const wardProfilesDir = path.join(baseDir, 'ward-profiles');
      const files = await fs.readdir(wardProfilesDir);
      const profiles = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(wardProfilesDir, file), 'utf8');
          profiles.push(JSON.parse(content));
        }
      }

      return profiles;
    } catch (error) {
      console.warn('⚠️ Could not load ward profiles');
      return [];
    }
  }

  private async saveVisualization(data: any, outputDir: string, fileName: string, formats: string[]): Promise<void> {
    for (const format of formats) {
      switch (format) {
        case 'json':
          await fs.writeFile(
            path.join(outputDir, `${fileName}.json`),
            JSON.stringify(data, null, 2)
          );
          break;

        case 'csv':
          if (data.summaryTable || Array.isArray(data)) {
            const csvData = this.convertToCSV(data.summaryTable || data);
            await fs.writeFile(path.join(outputDir, `${fileName}.csv`), csvData);
          }
          break;

        case 'markdown':
          const markdown = this.convertToMarkdown(data);
          await fs.writeFile(path.join(outputDir, `${fileName}.md`), markdown);
          break;

        case 'html':
          if (data.councillors) {
            // Special handling for ward profiles
            const html = this.generateWardProfileHtml(data);
            await fs.writeFile(path.join(outputDir, `${fileName}.html`), html);
          }
          break;
      }
    }
  }

  private convertToCSV(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  private convertToMarkdown(data: any): string {
    let markdown = `# ${data.title}\n\n`;
    
    if (data.summary) {
      markdown += '## Summary\n\n';
      Object.entries(data.summary).forEach(([key, value]) => {
        markdown += `- **${key}**: ${value}\n`;
      });
      markdown += '\n';
    }

    if (data.criticalActions) {
      markdown += '## Critical Actions\n\n';
      data.criticalActions.forEach((action: any, index: number) => {
        markdown += `${index + 1}. **${action.priority}**: ${action.issue}\n`;
      });
      markdown += '\n';
    }

    if (data.recommendations) {
      markdown += '## Recommendations\n\n';
      data.recommendations.forEach((rec: any, index: number) => {
        markdown += `${index + 1}. ${rec.recommendation || rec}\n`;
      });
      markdown += '\n';
    }

    if (data.nextSteps) {
      markdown += '## Next Steps\n\n';
      if (data.nextSteps.immediate) {
        markdown += '### Immediate\n';
        data.nextSteps.immediate.forEach((step: string) => {
          markdown += `- ${step}\n`;
        });
        markdown += '\n';
      }
      if (data.nextSteps.shortTerm) {
        markdown += '### Short Term\n';
        data.nextSteps.shortTerm.forEach((step: string) => {
          markdown += `- ${step}\n`;
        });
        markdown += '\n';
      }
      if (data.nextSteps.longTerm) {
        markdown += '### Long Term\n';
        data.nextSteps.longTerm.forEach((step: string) => {
          markdown += `- ${step}\n`;
        });
      }
    }

    return markdown;
  }

  private generateWardProfileHtml(wardData: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${wardData.wardName} Ward Profile</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8fafc;
            color: #1f2937;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1f2937;
            margin: 0;
            font-size: 2.5rem;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .summary-card {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #3b82f6;
        }
        .summary-number {
            font-size: 2rem;
            font-weight: bold;
            color: #3b82f6;
        }
        .summary-label {
            color: #6b7280;
            font-size: 0.9rem;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .councillor-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .councillor-name {
            font-size: 1.3rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .councillor-party {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            margin-bottom: 15px;
        }
        .contact-info {
            background: white;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #10b981;
        }
        .contact-info h4 {
            margin: 0 0 10px 0;
            color: #059669;
        }
        .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }
        .contact-label {
            font-weight: 500;
            width: 80px;
            color: #6b7280;
        }
        .quality-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 500;
            color: white;
        }
        .quality-high { background-color: #10b981; }
        .quality-medium { background-color: #f59e0b; }
        .quality-low { background-color: #ef4444; }
        .financial-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .financial-table th,
        .financial-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        .financial-table th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
        }
        .recommendations {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 20px;
            border-radius: 8px;
        }
        .recommendations h3 {
            color: #92400e;
            margin-top: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${wardData.wardName} Ward Profile</h1>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-number">${wardData.summary.councillors}</div>
                <div class="summary-label">Councillors</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${wardData.summary.completeness}%</div>
                <div class="summary-label">Data Completeness</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${wardData.summary.services}</div>
                <div class="summary-label">Services</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${wardData.summary.recentPlanning}</div>
                <div class="summary-label">Recent Planning Apps</div>
            </div>
        </div>

        <div class="section">
            <h2>👥 Councillors</h2>
            ${(wardData.councillors || []).map((councillor: any) => `
                <div class="councillor-card">
                    <div class="councillor-name">${councillor.name}</div>
                    <div class="councillor-party">${councillor.party}</div>
                    <div class="quality-badge quality-${councillor.qualityScore >= 80 ? 'high' : councillor.qualityScore >= 50 ? 'medium' : 'low'}">
                        Quality: ${councillor.qualityScore}%
                    </div>
                    
                    <div class="contact-info">
                        <h4>📞 Contact Information</h4>
                        <div class="contact-item">
                            <span class="contact-label">Email:</span>
                            <span>${councillor.contact.email}</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-label">Phone:</span>
                            <span>${councillor.contact.phone}</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-label">Surgery:</span>
                            <span>${councillor.contact.surgeryTimes}</span>
                        </div>
                    </div>

                    ${councillor.responsibilities.length > 0 ? `
                        <div>
                            <strong>Responsibilities:</strong> ${councillor.responsibilities.join(', ')}
                        </div>
                    ` : ''}

                    ${councillor.committees.length > 0 ? `
                        <div style="margin-top: 10px;">
                            <strong>Committees:</strong> ${councillor.committees.join(', ')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        ${wardData.financialActivity.length > 0 ? `
            <div class="section">
                <h2>💰 Recent Financial Activity</h2>
                <table class="financial-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Amount</th>
                            <th>Department</th>
                            <th>Freshness</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${wardData.financialActivity.map((financial: any) => `
                            <tr>
                                <td>${financial.title}</td>
                                <td>£${financial.amount.toLocaleString()}</td>
                                <td>${financial.department}</td>
                                <td>
                                    <span class="quality-badge quality-${financial.freshness === 'fresh' ? 'high' : financial.freshness === 'current' ? 'medium' : 'low'}">
                                        ${financial.freshness}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        ${wardData.recommendations.length > 0 ? `
            <div class="section">
                <h2>📋 Recommendations</h2>
                <div class="recommendations">
                    <h3>Improvement Recommendations:</h3>
                    <ul>
                        ${wardData.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
        ` : ''}

        ${wardData.criticalGaps.length > 0 ? `
            <div class="section">
                <div class="recommendations">
                    <h3>⚠️ Critical Data Gaps:</h3>
                    <ul>
                        ${wardData.criticalGaps.map((gap: string) => `<li>${gap}</li>`).join('')}
                    </ul>
                </div>
            </div>
        ` : ''}
    </div>
</body>
</html>`;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const engine = new DataVisualizationEngine();
  
  engine.generateComprehensiveVisualizations()
    .then(() => {
      console.log('🎉 Data visualization generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Data visualization generation failed:', error);
      process.exit(1);
    });
}
