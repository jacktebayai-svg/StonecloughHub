import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  Eye, 
  Calendar, 
  MapPin, 
  Building2, 
  Users, 
  FileText, 
  DollarSign,
  TrendingUp,
  BarChart3,
  Globe,
  Clock,
  Star,
  ArrowRight,
  RefreshCcw,
  Layers,
  Database,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface CivicDataItem {
  url: string;
  title: string;
  description: string;
  content: string;
  cleanText: string;
  dataType: string;
  category: string;
  subcategory: string;
  priority: number;
  quality: number;
  metadata: {
    contentLength: number;
    wordCount: number;
    linkCount: number;
    imageCount: number;
    crawledAt: string;
    responseTime: number;
    author?: string;
    keywords?: string;
  };
  extractedData: {
    images?: Array<{ src: string; alt: string; title: string }>;
    links?: Array<{ url: string; text: string; external: boolean }>;
    entities?: Array<{ type: string; value: string; confidence: number }>;
    dates?: string[];
  };
  analysis?: {
    readabilityScore: number;
    informationDensity: number;
    structuralComplexity: number;
    dataRichness: number;
    publicValue: number;
    freshness: number;
  };
}

interface FilterOptions {
  category: string;
  dataType: string;
  qualityMin: number;
  searchTerm: string;
  sortBy: 'relevance' | 'quality' | 'date' | 'priority';
}

const CATEGORY_COLORS = {
  'Planning & Development': '#3B82F6',
  'Financial Services': '#10B981',
  'Business & Licensing': '#F59E0B',
  'Democracy': '#8B5CF6',
  'Environmental Health': '#06B6D4',
  'General Information': '#6B7280',
  'Health & Care': '#EF4444',
  'Default': '#6B7280'
};

const DATA_TYPE_ICONS = {
  'policy_document': FileText,
  'meeting_minutes': Users,
  'financial_data': DollarSign,
  'planning_application': MapPin,
  'service_info': Building2,
  'news_article': Globe
};

export const CivicDataExplorer: React.FC = () => {
  const [civicData, setCivicData] = useState<CivicDataItem[]>([]);
  const [filteredData, setFilteredData] = useState<CivicDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CivicDataItem | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    dataType: 'all',
    qualityMin: 0,
    searchTerm: '',
    sortBy: 'quality'
  });

  useEffect(() => {
    loadCivicData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [civicData, filters]);

  const loadCivicData = async () => {
    setLoading(true);
    try {
      // Load data from multiple sources
      const [comprehensiveData, financialData, meetingsData] = await Promise.all([
        fetch('/api/civic/raw-data/comprehensive-dataset').then(r => r.json()),
        fetch('/api/civic/raw-data/financial-services').then(r => r.json()),
        fetch('/api/civic/raw-data/council-meetings').then(r => r.json())
      ]);

      // Combine all data sources
      const allData = [
        ...(Array.isArray(comprehensiveData) ? comprehensiveData : []),
        ...(Array.isArray(financialData) ? financialData : []),
        ...(Array.isArray(meetingsData) ? meetingsData : [])
      ];

      setCivicData(allData);
    } catch (error) {
      console.error('Failed to load civic data:', error);
      // Load sample data as fallback
      setCivicData(generateSampleData());
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...civicData];

    // Apply search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.cleanText.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
      );
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    // Apply data type filter
    if (filters.dataType !== 'all') {
      filtered = filtered.filter(item => item.dataType === filters.dataType);
    }

    // Apply quality filter
    filtered = filtered.filter(item => (item.quality * 100) >= filters.qualityMin);

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'quality':
          return b.quality - a.quality;
        case 'date':
          return new Date(b.metadata.crawledAt).getTime() - new Date(a.metadata.crawledAt).getTime();
        case 'priority':
          return b.priority - a.priority;
        default:
          return b.quality - a.quality;
      }
    });

    setFilteredData(filtered);
  };

  const generateSampleData = (): CivicDataItem[] => {
    return [
      {
        url: "https://www.bolton.gov.uk",
        title: "Home – Bolton Council",
        description: "Bolton council homepage with latest news and services",
        content: "Sample content",
        cleanText: "Latest news in Bolton, council services, planning applications",
        dataType: "policy_document",
        category: "General Information",
        subcategory: "Homepage",
        priority: 10,
        quality: 0.75,
        metadata: {
          contentLength: 45000,
          wordCount: 458,
          linkCount: 64,
          imageCount: 31,
          crawledAt: new Date().toISOString(),
          responseTime: 653,
          author: "Bolton Council"
        },
        extractedData: {
          links: [
            { url: "/planning", text: "Planning Applications", external: false },
            { url: "/council-tax", text: "Council Tax", external: false }
          ],
          dates: ["2025-08-20"]
        }
      }
    ];
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 0.8) return 'text-green-600 bg-green-100';
    if (quality >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.Default;
  };

  const getDataTypeIcon = (dataType: string) => {
    return DATA_TYPE_ICONS[dataType] || FileText;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading civic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              🏛️ Civic Data Explorer
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Explore {civicData.length.toLocaleString()} pages of real government data collected by our 
              <span className="font-semibold text-yellow-300"> Master Unified Crawler</span>. 
              View the original sources and discover insights into local democracy.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4 text-center">
                  <Database className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{civicData.length}</p>
                  <p className="text-sm text-blue-100">Total Pages</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4 text-center">
                  <Star className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {Math.round(civicData.reduce((sum, item) => sum + item.quality, 0) / civicData.length * 100)}%
                  </p>
                  <p className="text-sm text-blue-100">Avg Quality</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4 text-center">
                  <Layers className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {new Set(civicData.map(item => item.category)).size}
                  </p>
                  <p className="text-sm text-blue-100">Categories</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">Live</p>
                  <p className="text-sm text-blue-100">Real-time Data</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Explore Government Data
            </CardTitle>
            <CardDescription>
              Filter and search through real council data. Click any item to view the original source.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search civic data..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="pl-10"
                />
              </div>

              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(new Set(civicData.map(item => item.category))).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.dataType} onValueChange={(value) => setFilters({ ...filters, dataType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Data Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Array.from(new Set(civicData.map(item => item.dataType))).map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.sortBy} onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quality">Quality Score</SelectItem>
                  <SelectItem value="date">Date Collected</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="relevance">Relevance</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={loadCivicData} className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <span className="text-sm text-slate-600">Quality Filter:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.qualityMin}
                onChange={(e) => setFilters({ ...filters, qualityMin: parseInt(e.target.value) })}
                className="flex-1 max-w-xs"
              />
              <span className="text-sm font-medium">{filters.qualityMin}%+</span>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-slate-600">
            Showing <span className="font-semibold">{filteredData.length}</span> of{' '}
            <span className="font-semibold">{civicData.length}</span> civic data records
          </p>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredData.map((item, index) => {
              const Icon = getDataTypeIcon(item.dataType);
              
              return (
                <motion.div
                  key={item.url}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4" style={{ color: getCategoryColor(item.category) }} />
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: getCategoryColor(item.category),
                                color: getCategoryColor(item.category) 
                              }}
                            >
                              {item.category}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg line-clamp-2 mb-2">
                            {item.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-3">
                            {item.description}
                          </CardDescription>
                        </div>
                        <Badge className={`ml-2 ${getQualityColor(item.quality)}`}>
                          {Math.round(item.quality * 100)}%
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-slate-500">Words:</span>
                          <div className="font-medium">{item.metadata.wordCount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Links:</span>
                          <div className="font-medium">{item.metadata.linkCount}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Images:</span>
                          <div className="font-medium">{item.metadata.imageCount}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Priority:</span>
                          <div className="font-medium">{item.priority}/10</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                        <Clock className="h-3 w-3" />
                        <span>Crawled {format(new Date(item.metadata.crawledAt), 'MMM d, yyyy HH:mm')}</span>
                      </div>

                      {item.extractedData?.links && item.extractedData.links.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-slate-600 mb-2">Contains {item.extractedData.links.length} service links</p>
                          <div className="flex flex-wrap gap-1">
                            {item.extractedData.links.slice(0, 3).map((link, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {link.text.substring(0, 20)}...
                              </Badge>
                            ))}
                            {item.extractedData.links.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{item.extractedData.links.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="flex-1" onClick={() => setSelectedItem(item)}>
                              <Eye className="h-3 w-3 mr-1" />
                              View Data
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Icon className="h-5 w-5" />
                                {item.title}
                              </DialogTitle>
                              <DialogDescription>
                                Collected from: {item.url}
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh]">
                              <CivicDataDetailView item={item} />
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>

                        <Button size="sm" variant="outline" asChild>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Source
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredData.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Database className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No data found</h3>
              <p className="text-slate-600">Try adjusting your filters or search terms.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const CivicDataDetailView: React.FC<{ item: CivicDataItem }> = ({ item }) => (
  <div className="space-y-6">
    {/* Summary Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{Math.round(item.quality * 100)}%</p>
          <p className="text-sm text-slate-600">Quality Score</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{item.metadata.wordCount}</p>
          <p className="text-sm text-slate-600">Words</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{item.metadata.linkCount}</p>
          <p className="text-sm text-slate-600">Links</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{item.metadata.responseTime}ms</p>
          <p className="text-sm text-slate-600">Load Time</p>
        </CardContent>
      </Card>
    </div>

    {/* Content Preview */}
    <Card>
      <CardHeader>
        <CardTitle>Content Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-700 leading-relaxed">
          {item.cleanText.substring(0, 500)}...
        </p>
      </CardContent>
    </Card>

    {/* Extracted Links */}
    {item.extractedData?.links && item.extractedData.links.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>Service Links Found ({item.extractedData.links.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {item.extractedData.links.slice(0, 10).map((link, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-sm">{link.text}</span>
                <Button size="sm" variant="ghost" asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Analysis Metrics */}
    {item.analysis && (
      <Card>
        <CardHeader>
          <CardTitle>AI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Readability</p>
              <p className="text-lg font-semibold">{Math.round(item.analysis.readabilityScore * 100)}%</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Information Density</p>
              <p className="text-lg font-semibold">{Math.round(item.analysis.informationDensity * 100)}%</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Public Value</p>
              <p className="text-lg font-semibold">{Math.round(item.analysis.publicValue * 100)}%</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Data Freshness</p>
              <p className="text-lg font-semibold">{Math.round(item.analysis.freshness * 100)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Original Source */}
    <Card>
      <CardHeader>
        <CardTitle>Original Source</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">URL:</span> {item.url}
          </p>
          <p className="text-sm">
            <span className="font-medium">Author:</span> {item.metadata.author || 'Bolton Council'}
          </p>
          <p className="text-sm">
            <span className="font-medium">Collected:</span> {format(new Date(item.metadata.crawledAt), 'PPpp')}
          </p>
          <Button className="w-full mt-4" asChild>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Original Page
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default CivicDataExplorer;
