import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  FileText, 
  Users, 
  DollarSign,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Filter,
  Download,
  RefreshCcw,
  Eye,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  PieChart as RechartsPieChart,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
} from 'recharts';
import { format, parseISO, subDays, subMonths } from 'date-fns';

// ============================================
// INTERFACES AND TYPES
// ============================================

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

interface ChartData {
  name: string;
  value: number;
  date?: string;
  category?: string;
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface FilterOptions {
  timeRange: '7d' | '30d' | '90d' | '1y';
  department: string;
  dataType: string;
  ward: string;
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export const CivicDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<Record<string, ChartData[]>>({});
  const [filters, setFilters] = useState<FilterOptions>({
    timeRange: '30d',
    department: 'all',
    dataType: 'all',
    ward: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulate API calls - replace with actual API endpoints
      const [metricsResponse, chartsResponse] = await Promise.all([
        fetch('/api/civic/analytics/metrics'),
        fetch('/api/civic/analytics/charts')
      ]);

      // Mock data for demonstration
      const mockMetrics: DashboardMetrics = {
        totalBudget: 45000000,
        budgetSpent: 28500000,
        budgetPercentage: 63.3,
        activeMeetings: 12,
        totalDecisions: 156,
        pendingApplications: 34,
        activeConsultations: 8,
        totalServices: 127,
        citizenEngagement: 78.5,
        dataFreshness: 95.2
      };

      const mockChartData = generateMockChartData();

      setMetrics(mockMetrics);
      setChartData(mockChartData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockChartData = (): Record<string, ChartData[]> => {
    return {
      budgetTrends: Array.from({ length: 12 }, (_, i) => ({
        name: format(subMonths(new Date(), 11 - i), 'MMM yyyy'),
        value: Math.random() * 1000000 + 2000000,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      })),
      departmentSpending: [
        { name: 'Housing & Planning', value: 8500000, percentage: 35.4 },
        { name: 'Environment', value: 6200000, percentage: 25.8 },
        { name: 'Transportation', value: 4800000, percentage: 20.0 },
        { name: 'Social Services', value: 3200000, percentage: 13.3 },
        { name: 'Administration', value: 1300000, percentage: 5.4 }
      ],
      citizenEngagement: Array.from({ length: 30 }, (_, i) => ({
        name: format(subDays(new Date(), 29 - i), 'dd/MM'),
        value: Math.floor(Math.random() * 500) + 200
      })),
      serviceRequests: Array.from({ length: 7 }, (_, i) => ({
        name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        value: Math.floor(Math.random() * 100) + 50,
        category: 'requests'
      }))
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <DashboardHeader 
          onRefresh={handleRefresh}
          refreshing={refreshing}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Key Metrics Cards */}
        <MetricsGrid metrics={metrics!} />

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="engagement" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Engagement
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab chartData={chartData} />
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <FinancialTab chartData={chartData} metrics={metrics!} />
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <EngagementTab chartData={chartData} />
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <ServicesTab chartData={chartData} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceTab metrics={metrics!} />
          </TabsContent>
        </Tabs>

        {/* Real-time Updates Section */}
        <RealTimeUpdates />
      </div>
    </div>
  );
};

// ============================================
// DASHBOARD COMPONENTS
// ============================================

const DashboardHeader: React.FC<{
  onRefresh: () => void;
  refreshing: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}> = ({ onRefresh, refreshing, searchQuery, onSearchChange, filters, onFiltersChange }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl shadow-lg border border-slate-200"
  >
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Stoneclough Civic Dashboard
      </h1>
      <p className="text-slate-600">
        Real-time insights into local council operations and services
      </p>
    </div>

    <div className="flex items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input
          placeholder="Search data..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-64"
        />
      </div>

      <Select value={filters.timeRange} onValueChange={(value: any) => 
        onFiltersChange({ ...filters, timeRange: value })
      }>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="1y">Last year</SelectItem>
        </SelectContent>
      </Select>

      <Button
        onClick={onRefresh}
        disabled={refreshing}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>

      <Button size="sm" className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        Export
      </Button>
    </div>
  </motion.div>
);

const MetricsGrid: React.FC<{ metrics: DashboardMetrics }> = ({ metrics }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
    <MetricCard
      title="Total Budget"
      value={`£${(metrics.totalBudget / 1000000).toFixed(1)}M`}
      subtitle={`${metrics.budgetPercentage}% utilized`}
      icon={DollarSign}
      trend="up"
      trendValue="+2.3%"
      color="blue"
    />
    <MetricCard
      title="Active Meetings"
      value={metrics.activeMeetings.toString()}
      subtitle="This month"
      icon={Calendar}
      trend="stable"
      color="green"
    />
    <MetricCard
      title="Pending Applications"
      value={metrics.pendingApplications.toString()}
      subtitle="Awaiting review"
      icon={FileText}
      trend="down"
      trendValue="-8.1%"
      color="orange"
    />
    <MetricCard
      title="Citizen Engagement"
      value={`${metrics.citizenEngagement}%`}
      subtitle="Participation rate"
      icon={Users}
      trend="up"
      trendValue="+12.5%"
      color="purple"
    />
  </div>
);

const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}> = ({ title, value, subtitle, icon: Icon, trend, trendValue, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600',
    green: 'from-green-500 to-green-600 text-green-600',
    orange: 'from-orange-500 to-orange-600 text-orange-600',
    purple: 'from-purple-500 to-purple-600 text-purple-600',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]} opacity-5`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {value}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {subtitle}
            </p>
            {trend && trendValue && (
              <div className={`flex items-center gap-1 text-xs ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600'
              }`}>
                <TrendIcon className="h-3 w-3" />
                {trendValue}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Continue in next part due to length...

export default CivicDashboard;
