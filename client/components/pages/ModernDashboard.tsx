import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users,
  Building2,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Shield,
  RefreshCcw,
  Download,
  Eye,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { PageLayout } from '../layout/PageLayout';

// Sample data for dashboard
const mockMetrics = {
  totalServices: 127,
  onlineServices: 89,
  serviceAvailability: 89 / 127,
  activeMeetings: 8,
  upcomingMeetings: 12,
  pendingApplications: 34,
  activeConsultations: 6,
  citizenEngagement: 78.5,
  budgetTransparency: 92.3,
  dataFreshness: 95.2,
  responseTime: 24, // hours
};

const serviceData = [
  { name: 'Housing & Planning', total: 34, online: 28, offline: 6 },
  { name: 'Environment', total: 23, online: 18, offline: 5 },
  { name: 'Transportation', total: 18, online: 15, offline: 3 },
  { name: 'Social Services', total: 28, online: 16, offline: 12 },
  { name: 'Council Tax', total: 24, online: 22, offline: 2 },
];

const engagementData = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  pageViews: Math.floor(Math.random() * 500) + 200,
  uniqueVisitors: Math.floor(Math.random() * 300) + 100,
  forumPosts: Math.floor(Math.random() * 50) + 10,
}));

const budgetData = [
  { category: 'Housing & Planning', amount: 8500000, percentage: 35.4 },
  { category: 'Environment', amount: 6200000, percentage: 25.8 },
  { category: 'Transportation', amount: 4800000, percentage: 20.0 },
  { category: 'Social Services', amount: 3200000, percentage: 13.3 },
  { category: 'Administration', amount: 1300000, percentage: 5.4 },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  description: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  description,
  color
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600', 
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
  };

  const getChangeIcon = () => {
    if (changeType === 'up') return ArrowUpRight;
    if (changeType === 'down') return ArrowDownRight;
    return Activity;
  };

  const getChangeColor = () => {
    if (changeType === 'up') return 'text-green-600';
    if (changeType === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const ChangeIcon = getChangeIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {value}
              </div>
              <p className="text-xs text-slate-500 mb-2">
                {description}
              </p>
              {change !== undefined && (
                <div className={`flex items-center text-xs ${getChangeColor()}`}>
                  <ChangeIcon className="h-3 w-3 mr-1" />
                  {Math.abs(change)}% from last month
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const ModernDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
      setLastUpdated(new Date());
    }, 1500);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
            />
            <h2 className="text-xl font-semibold text-slate-700">Loading Dashboard</h2>
            <p className="text-slate-500">Fetching the latest civic data...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Civic Dashboard
              </h1>
              <p className="text-slate-600">
                Real-time insights into Stoneclough's civic services and community engagement
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="flex items-center text-sm text-slate-500">
                <Clock className="h-4 w-4 mr-1" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Services"
            value={mockMetrics.totalServices}
            change={5.2}
            changeType="up"
            icon={Building2}
            description={`${mockMetrics.onlineServices} available online`}
            color="blue"
          />
          <MetricCard
            title="Service Availability"
            value={`${Math.round(mockMetrics.serviceAvailability * 100)}%`}
            change={2.1}
            changeType="up"
            icon={CheckCircle}
            description="Services currently operational"
            color="green"
          />
          <MetricCard
            title="Active Meetings"
            value={mockMetrics.activeMeetings}
            change={-12.5}
            changeType="down"
            icon={Calendar}
            description={`${mockMetrics.upcomingMeetings} scheduled this month`}
            color="orange"
          />
          <MetricCard
            title="Citizen Engagement"
            value={`${mockMetrics.citizenEngagement}%`}
            change={8.3}
            changeType="up"
            icon={Users}
            description="Monthly participation rate"
            color="purple"
          />
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="engagement" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Engagement
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Service Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Service Distribution
                  </CardTitle>
                  <CardDescription>
                    Online vs offline service availability by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={serviceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="online" stackId="a" fill="#10B981" name="Online" />
                      <Bar dataKey="offline" stackId="a" fill="#EF4444" name="Offline" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Indicators */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    Performance Indicators
                  </CardTitle>
                  <CardDescription>
                    Key performance metrics for civic services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Budget Transparency</span>
                      <span className="font-medium">{mockMetrics.budgetTransparency}%</span>
                    </div>
                    <Progress value={mockMetrics.budgetTransparency} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Data Freshness</span>
                      <span className="font-medium">{mockMetrics.dataFreshness}%</span>
                    </div>
                    <Progress value={mockMetrics.dataFreshness} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Response Time</span>
                      <span className="font-medium">{mockMetrics.responseTime}h avg</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Citizen Satisfaction</span>
                      <span className="font-medium">4.2/5.0</span>
                    </div>
                    <Progress value={84} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Recent Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">New planning application published</p>
                        <p className="text-xs text-slate-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Council meeting minutes uploaded</p>
                        <p className="text-xs text-slate-500">5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Budget report updated</p>
                        <p className="text-xs text-slate-500">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Service Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">Maintenance Window</p>
                      <p className="text-xs text-yellow-600">Planning portal offline 2-4 AM Sunday</p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800">All Systems Operational</p>
                      <p className="text-xs text-green-600">No current service disruptions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    Community Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">New Forum Posts</span>
                      <Badge variant="secondary">23</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Discussions</span>
                      <Badge variant="secondary">8</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending Applications</span>
                      <Badge variant="outline">{mockMetrics.pendingApplications}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Public Consultations</span>
                      <Badge variant="outline">{mockMetrics.activeConsultations}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Availability Trends</CardTitle>
                  <CardDescription>
                    Monthly service availability and usage patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={engagementData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="pageViews"
                        stackId="1"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Services</CardTitle>
                  <CardDescription>
                    Most accessed civic services this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {serviceData.map((service, index) => (
                      <div key={service.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                            ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-orange-500 to-orange-600', 'from-purple-500 to-purple-600', 'from-red-500 to-red-600'][index]
                          } flex items-center justify-center text-white font-bold text-sm`}>
                            {index + 1}
                          </div>
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{service.total}</div>
                          <div className="text-xs text-slate-500">
                            {service.online} online
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Engagement Trends</CardTitle>
                <CardDescription>
                  Daily engagement metrics across platform features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={engagementData.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="pageViews"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Page Views"
                    />
                    <Line
                      type="monotone"
                      dataKey="uniqueVisitors"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Unique Visitors"
                    />
                    <Line
                      type="monotone"
                      dataKey="forumPosts"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Forum Posts"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Allocation</CardTitle>
                  <CardDescription>
                    Current fiscal year budget distribution by department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={budgetData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {budgetData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`£${(value as number / 1000000).toFixed(1)}M`, 'Budget']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Details</CardTitle>
                  <CardDescription>
                    Detailed breakdown of departmental spending
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {budgetData.map((item, index) => (
                      <div key={item.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.category}</span>
                          <span className="text-sm text-slate-600">
                            £{(item.amount / 1000000).toFixed(1)}M ({item.percentage}%)
                          </span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default ModernDashboard;
