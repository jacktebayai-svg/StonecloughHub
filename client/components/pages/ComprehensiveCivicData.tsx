import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Database, 
  Download, 
  Search,
  Filter,
  RefreshCcw,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Building2,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  Clock,
  Shield,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Layers,
  PieChart,
  LineChart,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { PageLayout } from '../layout/PageLayout';
import { format, subDays, subMonths } from 'date-fns';

interface CivicDataset {
  id: string;
  name: string;
  description: string;
  category: string;
  lastUpdated: Date;
  recordCount: number;
  format: string;
  size: string;
  accessLevel: 'public' | 'restricted' | 'private';
  downloadUrl?: string;
  apiEndpoint?: string;
  tags: string[];
  quality: number;
  views: number;
}

interface DataCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  datasetCount: number;
}

interface ServiceMetric {
  name: string;
  value: number;
  change: number;
  unit: string;
  status: 'up' | 'down' | 'stable';
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'finance',
    name: 'Finance & Budget',
    description: 'Budget data, expenditure, and financial transparency',
    icon: DollarSign,
    color: '#10B981',
    datasetCount: 12
  },
  {
    id: 'governance',
    name: 'Governance',
    description: 'Council meetings, decisions, and democratic processes',
    icon: Shield,
    color: '#3B82F6',
    datasetCount: 8
  },
  {
    id: 'services',
    name: 'Public Services',
    description: 'Service delivery metrics and performance data',
    icon: Building2,
    color: '#F59E0B',
    datasetCount: 15
  },
  {
    id: 'demographics',
    name: 'Demographics',
    description: 'Population data, census information, and social statistics',
    icon: Users,
    color: '#8B5CF6',
    datasetCount: 6
  },
  {
    id: 'planning',
    name: 'Planning & Development',
    description: 'Planning applications, development projects, and land use',
    icon: MapPin,
    color: '#EF4444',
    datasetCount: 9
  },
  {
    id: 'environment',
    name: 'Environment',
    description: 'Environmental monitoring, sustainability, and green initiatives',
    icon: Globe,
    color: '#06B6D4',
    datasetCount: 7
  }
];

const SAMPLE_DATASETS: CivicDataset[] = [
  {
    id: '1',
    name: 'Annual Budget 2024',
    description: 'Complete annual budget breakdown including departmental allocations and capital expenditure',
    category: 'finance',
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    recordCount: 245,
    format: 'JSON, CSV',
    size: '2.4 MB',
    accessLevel: 'public',
    downloadUrl: '/api/data/budget-2024',
    apiEndpoint: '/api/v1/budget/2024',
    tags: ['budget', 'finance', 'expenditure', 'transparency'],
    quality: 95,
    views: 1247
  },
  {
    id: '2',
    name: 'Council Meeting Minutes',
    description: 'Complete record of council meeting minutes, decisions, and voting records from 2020-2024',
    category: 'governance',
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    recordCount: 186,
    format: 'PDF, JSON',
    size: '8.7 MB',
    accessLevel: 'public',
    downloadUrl: '/api/data/meeting-minutes',
    tags: ['meetings', 'decisions', 'governance', 'democracy'],
    quality: 92,
    views: 856
  },
  {
    id: '3',
    name: 'Planning Applications Database',
    description: 'All planning applications submitted to the council with status updates and decisions',
    category: 'planning',
    lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000),
    recordCount: 1523,
    format: 'JSON, XML',
    size: '12.3 MB',
    accessLevel: 'public',
    apiEndpoint: '/api/v1/planning/applications',
    tags: ['planning', 'development', 'applications', 'permits'],
    quality: 88,
    views: 2134
  },
  {
    id: '4',
    name: 'Service Performance Metrics',
    description: 'Key performance indicators for all public services including response times and satisfaction ratings',
    category: 'services',
    lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000),
    recordCount: 98,
    format: 'JSON',
    size: '1.8 MB',
    accessLevel: 'public',
    apiEndpoint: '/api/v1/services/metrics',
    tags: ['performance', 'services', 'kpi', 'satisfaction'],
    quality: 94,
    views: 645
  },
  {
    id: '5',
    name: 'Population Demographics 2021',
    description: 'Census data and demographic analysis for Stoneclough area',
    category: 'demographics',
    lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    recordCount: 56,
    format: 'CSV, JSON',
    size: '3.2 MB',
    accessLevel: 'public',
    downloadUrl: '/api/data/demographics-2021',
    tags: ['census', 'population', 'demographics', 'statistics'],
    quality: 97,
    views: 423
  },
  {
    id: '6',
    name: 'Environmental Monitoring Data',
    description: 'Air quality, noise levels, and environmental monitoring data from local sensors',
    category: 'environment',
    lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000),
    recordCount: 8934,
    format: 'JSON, CSV',
    size: '15.6 MB',
    accessLevel: 'public',
    apiEndpoint: '/api/v1/environment/monitoring',
    tags: ['environment', 'air-quality', 'monitoring', 'sensors'],
    quality: 89,
    views: 789
  }
];

// Sample chart data
const budgetData = [
  { category: 'Housing & Planning', amount: 8500000, percentage: 35.4 },
  { category: 'Environment', amount: 6200000, percentage: 25.8 },
  { category: 'Transportation', amount: 4800000, percentage: 20.0 },
  { category: 'Social Services', amount: 3200000, percentage: 13.3 },
  { category: 'Administration', amount: 1300000, percentage: 5.4 }
];

const serviceMetrics: ServiceMetric[] = [
  { name: 'Average Response Time', value: 24, change: -12.5, unit: 'hours', status: 'up' },
  { name: 'Citizen Satisfaction', value: 4.2, change: 8.3, unit: '/5', status: 'up' },
  { name: 'Services Online', value: 89, change: 5.2, unit: '%', status: 'up' },
  { name: 'Application Processing', value: 15, change: -8.1, unit: 'days', status: 'up' }
];

const monthlyTrends = Array.from({ length: 12 }, (_, i) => ({
  month: format(subMonths(new Date(), 11 - i), 'MMM'),
  services: Math.floor(Math.random() * 50) + 80,
  applications: Math.floor(Math.random() * 100) + 200,
  satisfaction: Math.random() * 0.5 + 4.0
}));

export const ComprehensiveCivicData: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'popular'>('updated');
  const [dataQuality, setDataQuality] = useState({ loading: true, score: 92.4 });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    // Simulate data quality calculation
    const timer = setTimeout(() => {
      setDataQuality({ loading: false, score: 92.4 });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredDatasets = SAMPLE_DATASETS.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dataset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dataset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || dataset.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const sortedDatasets = [...filteredDatasets].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'popular':
        return b.views - a.views;
      case 'updated':
      default:
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
    }
  });

  const handleRefresh = () => {
    setLastRefresh(new Date());
    setDataQuality({ loading: true, score: 92.4 });
    setTimeout(() => {
      setDataQuality({ loading: false, score: 92.4 });
    }, 1500);
  };

  const DatasetCard = ({ dataset }: { dataset: CivicDataset }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2 line-clamp-2">{dataset.name}</CardTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="outline"
                  style={{ 
                    borderColor: DATA_CATEGORIES.find(c => c.id === dataset.category)?.color,
                    color: DATA_CATEGORIES.find(c => c.id === dataset.category)?.color
                  }}
                >
                  {DATA_CATEGORIES.find(c => c.id === dataset.category)?.name}
                </Badge>
                <Badge 
                  variant={dataset.accessLevel === 'public' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {dataset.accessLevel}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-slate-500 mb-1">
                <Eye className="h-3 w-3" />
                {dataset.views}
              </div>
              <div className="text-xs text-slate-500">
                Quality: {dataset.quality}%
              </div>
            </div>
          </div>
          <CardDescription className="line-clamp-3">
            {dataset.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Records:</span>
                <div className="font-medium">{dataset.recordCount.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-slate-500">Size:</span>
                <div className="font-medium">{dataset.size}</div>
              </div>
              <div>
                <span className="text-slate-500">Format:</span>
                <div className="font-medium">{dataset.format}</div>
              </div>
              <div>
                <span className="text-slate-500">Updated:</span>
                <div className="font-medium">
                  {format(dataset.lastUpdated, 'MMM d, yyyy')}
                </div>
              </div>
            </div>

            {dataset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {dataset.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {dataset.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{dataset.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <Progress value={dataset.quality} className="h-2" />

            <div className="flex gap-2">
              {dataset.downloadUrl && (
                <Button size="sm" variant="outline" className="flex-1">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              )}
              {dataset.apiEndpoint && (
                <Button size="sm" variant="outline" className="flex-1">
                  <Database className="h-3 w-3 mr-1" />
                  API
                </Button>
              )}
              <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const MetricCard = ({ metric }: { metric: ServiceMetric }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{metric.name}</p>
            <p className="text-2xl font-bold text-slate-900">
              {metric.value}{metric.unit}
            </p>
          </div>
          <div className="text-right">
            <div className={`flex items-center text-sm ${
              metric.status === 'up' ? 'text-green-600' : 
              metric.status === 'down' ? 'text-red-600' : 'text-slate-600'
            }`}>
              {metric.status === 'up' ? 
                <TrendingUp className="h-3 w-3 mr-1" /> : 
                <TrendingDown className="h-3 w-3 mr-1" />
              }
              {Math.abs(metric.change)}%
            </div>
            <p className="text-xs text-slate-500">vs last month</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PageLayout className="bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Civic Data Portal
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Access comprehensive data about your local government services, budgets, and community statistics. 
              Promoting transparency and informed citizenship through open data.
            </p>
          </motion.div>

          {/* Data Quality Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Data Quality Score</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="text-white hover:bg-white/20 h-auto p-1"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
                {dataQuality.loading ? (
                  <div className="animate-pulse">
                    <div className="h-2 bg-white/30 rounded mb-2"></div>
                    <div className="text-sm text-blue-100">Calculating...</div>
                  </div>
                ) : (
                  <>
                    <Progress value={dataQuality.score} className="mb-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-100">
                        {dataQuality.score}% - Excellent data quality
                      </span>
                      <span className="text-blue-200">
                        Last updated: {format(lastRefresh, 'HH:mm')}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Datasets</p>
                  <p className="text-3xl font-bold text-slate-900">{SAMPLE_DATASETS.length}</p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Data Categories</p>
                  <p className="text-3xl font-bold text-slate-900">{DATA_CATEGORIES.length}</p>
                </div>
                <Layers className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">API Endpoints</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {SAMPLE_DATASETS.filter(d => d.apiEndpoint).length}
                  </p>
                </div>
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Views</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {SAMPLE_DATASETS.reduce((sum, d) => sum + d.views, 0).toLocaleString()}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="datasets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="datasets" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Datasets
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              API Reference
            </TabsTrigger>
          </TabsList>

          <TabsContent value="datasets" className="space-y-6">
            {/* Categories */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Data Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {DATA_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <motion.div
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedCategory === category.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: category.color }}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 mb-1">{category.name}</h3>
                              <p className="text-sm text-slate-600 mb-2">{category.description}</p>
                              <p className="text-xs text-slate-500">{category.datasetCount} datasets</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search datasets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {DATA_CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated">Recent</SelectItem>
                      <SelectItem value="popular">Popular</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="mb-4">
              <p className="text-slate-600">
                Showing {sortedDatasets.length} of {SAMPLE_DATASETS.length} datasets
              </p>
            </div>

            {/* Datasets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sortedDatasets.map((dataset) => (
                <DatasetCard key={dataset.id} dataset={dataset} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Budget Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Breakdown 2024</CardTitle>
                  <CardDescription>
                    Departmental budget allocation in millions (£)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
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
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Service Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Performance Trends</CardTitle>
                  <CardDescription>
                    Monthly trends for key service metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="services" 
                        stroke="#3B82F6" 
                        name="Services Online (%)" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="satisfaction" 
                        stroke="#10B981" 
                        name="Satisfaction (1-5)" 
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Service Performance Metrics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {serviceMetrics.map((metric, index) => (
                <MetricCard key={index} metric={metric} />
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Application Processing Volume</CardTitle>
                <CardDescription>
                  Monthly application volume and processing times
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                      name="Applications Processed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">API Reference</h2>
              <p className="text-slate-600 mb-6">
                Access our civic data programmatically through our RESTful API. All endpoints return JSON data 
                and support pagination, filtering, and sorting.
              </p>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Base URL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="bg-slate-100 px-3 py-2 rounded text-sm font-mono">
                    https://api.stoneclough.gov.uk/v1/
                  </code>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Endpoints</CardTitle>
                  <CardDescription>
                    All endpoints that provide programmatic access to civic data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {SAMPLE_DATASETS.filter(d => d.apiEndpoint).map((dataset) => (
                      <div key={dataset.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{dataset.name}</h4>
                          <Badge variant="outline">GET</Badge>
                        </div>
                        <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                          {dataset.apiEndpoint}
                        </code>
                        <p className="text-sm text-slate-600 mt-2">{dataset.description}</p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">
                            <FileText className="h-3 w-3 mr-1" />
                            Documentation
                          </Button>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Try API
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Data Usage Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8"
        >
          <div className="text-center mb-6">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Open Data License
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              All data is published under the Open Government License, promoting transparency and reuse 
              for research, journalism, and civic engagement.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Free to Use</h3>
              <p className="text-sm text-slate-600">
                All datasets are free to access, download, and use for any purpose.
              </p>
            </div>
            <div className="text-center">
              <Database className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Machine Readable</h3>
              <p className="text-sm text-slate-600">
                Data is available in structured formats like JSON and CSV for easy processing.
              </p>
            </div>
            <div className="text-center">
              <RefreshCcw className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Regularly Updated</h3>
              <p className="text-sm text-slate-600">
                Datasets are updated on regular schedules to ensure data freshness and accuracy.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default ComprehensiveCivicData;
