import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Activity,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Calendar,
  FileText,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
} from 'recharts';

// Color palettes for charts
const CHART_COLORS = {
  primary: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a'],
  financial: ['#10b981', '#059669', '#047857', '#065f46'],
  engagement: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
  services: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
  status: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b']
};

interface ChartData {
  name: string;
  value: number;
  date?: string;
  category?: string;
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface DashboardMetrics {
  totalBudget: number;
  budgetSpent: number;
  budgetPercentage: number;
  activeMeetings: number;
  totalDecisions: number;
  pendingApplications: number;
  activeConsultations: number;
  totalServices: number;
  citizenEngagement: number;
  dataFreshness: number;
}

// ============================================
// OVERVIEW TAB
// ============================================

export const OverviewTab: React.FC<{ chartData: Record<string, ChartData[]> }> = ({ chartData }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Budget Overview Chart */}
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Budget Trends (12 Months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData.budgetTrends}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `£${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              formatter={(value: any) => [`£${(value / 1000000).toFixed(2)}M`, 'Budget']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              fill="#3b82f6"
              fillOpacity={0.1}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Department Spending Distribution */}
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-green-600" />
          Department Spending Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData.departmentSpending}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.departmentSpending?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS.financial[index % CHART_COLORS.financial.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [`£${(value / 1000000).toFixed(1)}M`, 'Spending']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Citizen Engagement Trends */}
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          Citizen Engagement (30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.citizenEngagement}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: any) => [value, 'Interactions']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Service Requests by Day */}
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-600" />
          Service Requests This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.serviceRequests}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: any) => [value, 'Requests']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

// ============================================
// FINANCIAL TAB
// ============================================

export const FinancialTab: React.FC<{ 
  chartData: Record<string, ChartData[]>;
  metrics: DashboardMetrics;
}> = ({ chartData, metrics }) => (
  <div className="space-y-6">
    {/* Budget Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="shadow-lg border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Budget</p>
              <p className="text-2xl font-bold text-slate-900">
                £{(metrics.totalBudget / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-l-4 border-l-green-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Budget Spent</p>
              <p className="text-2xl font-bold text-slate-900">
                £{(metrics.budgetSpent / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <Progress value={metrics.budgetPercentage} className="h-2" />
            <p className="text-xs text-slate-500 mt-2">{metrics.budgetPercentage}% utilized</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-l-4 border-l-orange-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Remaining Budget</p>
              <p className="text-2xl font-bold text-slate-900">
                £{((metrics.totalBudget - metrics.budgetSpent) / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Detailed Financial Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Monthly Budget Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData.budgetTrends}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `£${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                formatter={(value: any) => [`£${(value / 1000000).toFixed(2)}M`, 'Allocation']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Department Budget Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.departmentSpending?.map((dept, index) => (
              <motion.div
                key={dept.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: CHART_COLORS.financial[index % CHART_COLORS.financial.length] }}
                  />
                  <span className="font-medium">{dept.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">£{(dept.value / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-slate-500">{dept.percentage}%</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// ============================================
// ENGAGEMENT TAB
// ============================================

export const EngagementTab: React.FC<{ chartData: Record<string, ChartData[]> }> = ({ chartData }) => (
  <div className="space-y-6">
    {/* Engagement Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">2,847</p>
          <p className="text-sm text-slate-600">Active Citizens</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">156</p>
          <p className="text-sm text-slate-600">Public Meetings</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">89</p>
          <p className="text-sm text-slate-600">Consultations</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">94%</p>
          <p className="text-sm text-slate-600">Satisfaction Rate</p>
        </CardContent>
      </Card>
    </div>

    {/* Engagement Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Daily Engagement Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData.citizenEngagement}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: any) => [value, 'Interactions']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8b5cf6" 
                fill="#8b5cf6"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Community Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { title: 'Town Hall Meeting', date: '2 hours ago', participants: 145, status: 'ongoing' },
              { title: 'Planning Consultation', date: '1 day ago', participants: 89, status: 'completed' },
              { title: 'Budget Workshop', date: '3 days ago', participants: 67, status: 'completed' },
              { title: 'Community Forum', date: '5 days ago', participants: 203, status: 'completed' },
            ].map((activity, index) => (
              <motion.div
                key={activity.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.status === 'ongoing' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
                  }`} />
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-slate-500">{activity.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{activity.participants}</p>
                  <p className="text-sm text-slate-500">participants</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// ============================================
// SERVICES TAB
// ============================================

export const ServicesTab: React.FC<{ chartData: Record<string, ChartData[]> }> = ({ chartData }) => (
  <div className="space-y-6">
    {/* Service Status Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="shadow-lg border-l-4 border-l-green-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Services</p>
              <p className="text-2xl font-bold text-slate-900">127</p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Operational
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-l-4 border-l-orange-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Under Maintenance</p>
              <p className="text-2xl font-bold text-slate-900">8</p>
            </div>
            <Badge variant="outline" className="border-orange-500 text-orange-600">
              Maintenance
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-l-4 border-l-red-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Service Issues</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
            </div>
            <Badge variant="destructive">
              Issues
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Service Performance Chart */}
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Weekly Service Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData.serviceRequests}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: any) => [value, 'Requests']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Service Directory */}
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Popular Services</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Waste Collection', requests: 456, status: 'operational', contact: '0161-555-0123' },
            { name: 'Planning Applications', requests: 234, status: 'operational', contact: '0161-555-0124' },
            { name: 'Council Tax', requests: 189, status: 'maintenance', contact: '0161-555-0125' },
            { name: 'Housing Services', requests: 167, status: 'operational', contact: '0161-555-0126' },
            { name: 'Environmental Health', requests: 145, status: 'operational', contact: '0161-555-0127' },
            { name: 'Social Services', requests: 123, status: 'issues', contact: '0161-555-0128' },
          ].map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{service.name}</h4>
                <Badge 
                  variant={service.status === 'operational' ? 'default' : service.status === 'maintenance' ? 'secondary' : 'destructive'}
                  className={service.status === 'operational' ? 'bg-green-100 text-green-800' : ''}
                >
                  {service.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{service.requests} requests this month</span>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {service.contact}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// ============================================
// PERFORMANCE TAB
// ============================================

export const PerformanceTab: React.FC<{ metrics: DashboardMetrics }> = ({ metrics }) => (
  <div className="space-y-6">
    {/* Performance KPIs */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Data Freshness</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.dataFreshness}%</p>
            </div>
            <Zap className="h-8 w-8 text-blue-600" />
          </div>
          <Progress value={metrics.dataFreshness} className="h-2" />
          <p className="text-xs text-slate-500 mt-2">Updated within 24 hours</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600">API Response Time</p>
              <p className="text-2xl font-bold text-slate-900">127ms</p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
          <Progress value={85} className="h-2" />
          <p className="text-xs text-slate-500 mt-2">Average response time</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600">System Uptime</p>
              <p className="text-2xl font-bold text-slate-900">99.8%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <Progress value={99.8} className="h-2" />
          <p className="text-xs text-slate-500 mt-2">Last 30 days</p>
        </CardContent>
      </Card>
    </div>

    {/* System Status */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>System Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Database', status: 'healthy', uptime: '99.9%', latency: '45ms' },
              { name: 'API Gateway', status: 'healthy', uptime: '99.8%', latency: '12ms' },
              { name: 'Cache Layer', status: 'healthy', uptime: '99.9%', latency: '3ms' },
              { name: 'Search Engine', status: 'warning', uptime: '98.5%', latency: '89ms' },
              { name: 'File Storage', status: 'healthy', uptime: '99.7%', latency: '67ms' },
              { name: 'Monitoring', status: 'healthy', uptime: '99.9%', latency: '23ms' },
            ].map((component, index) => (
              <motion.div
                key={component.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    component.status === 'healthy' ? 'bg-green-500' : 
                    component.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium">{component.name}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-slate-600">Uptime: {component.uptime}</span>
                  <span className="text-slate-600">Latency: {component.latency}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Database backup completed', time: '2 minutes ago', status: 'success' },
              { action: 'Cache cleared for civic data', time: '15 minutes ago', status: 'info' },
              { action: 'New data imported from Bolton Council', time: '1 hour ago', status: 'success' },
              { action: 'Search index rebuilt', time: '2 hours ago', status: 'info' },
              { action: 'Performance alert resolved', time: '4 hours ago', status: 'warning' },
              { action: 'Weekly maintenance completed', time: '1 day ago', status: 'success' },
            ].map((activity, index) => (
              <motion.div
                key={activity.action}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' :
                  activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// ============================================
// REAL-TIME UPDATES AND SKELETON
// ============================================

export const RealTimeUpdates: React.FC = () => (
  <Card className="shadow-lg border-l-4 border-l-blue-500">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        Live Updates
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[
          { text: 'New planning application submitted for Station Road', time: 'Just now' },
          { text: 'Council meeting agenda published', time: '5 minutes ago' },
          { text: 'Budget report updated with Q3 figures', time: '12 minutes ago' },
        ].map((update, index) => (
          <motion.div
            key={update.text}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
          >
            <p className="text-sm">{update.text}</p>
            <span className="text-xs text-slate-500">{update.time}</span>
          </motion.div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-2" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
      </div>
      
      {/* Metrics Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-1/4" />
          </div>
        ))}
      </div>
      
      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
            <div className="h-64 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
