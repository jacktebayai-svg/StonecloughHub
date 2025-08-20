import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  Users, 
  Building2, 
  X, 
  ChevronDown,
  Clock,
  MapPin,
  Star,
  Activity,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Globe,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SearchFilters {
  category: string;
  dateRange: string;
  status: string;
  location: string;
  quality: string;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'service' | 'meeting' | 'document' | 'planning';
  status?: string;
  date?: string;
  location?: string;
  quality?: number;
  onlineAccess?: boolean;
  url?: string;
}

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export default function AdvancedSearch({ isOpen, onClose, initialQuery = '' }: AdvancedSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    dateRange: '',
    status: '',
    location: '',
    quality: ''
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);

  // Mock data for demonstration - in real app would come from API
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'Planning Application - Residential Development',
      description: 'New residential development proposal for 50 homes on Manchester Road',
      category: 'Planning',
      type: 'planning',
      status: 'Under Review',
      date: '2025-01-15',
      location: 'Manchester Road, Stoneclough',
      quality: 0.9
    },
    {
      id: '2', 
      title: 'Council Tax Services',
      description: 'Online council tax payment and account management system',
      category: 'Finance',
      type: 'service',
      onlineAccess: true,
      quality: 0.95
    },
    {
      id: '3',
      title: 'Planning Committee Meeting',
      description: 'Monthly planning committee meeting to review applications',
      category: 'Governance',
      type: 'meeting',
      date: '2025-02-12',
      status: 'Scheduled',
      quality: 0.85
    },
    {
      id: '4',
      title: 'Local Transport Strategy',
      description: 'Strategic document outlining future transport improvements',
      category: 'Transport',
      type: 'document',
      date: '2025-01-10',
      quality: 0.88
    },
    {
      id: '5',
      title: 'Waste Collection Services',
      description: 'Household waste and recycling collection schedules and information',
      category: 'Environment',
      type: 'service',
      onlineAccess: true,
      quality: 0.92
    },
    {
      id: '6',
      title: 'Budget Review Meeting',
      description: 'Annual budget review and planning session for council operations',
      category: 'Finance',
      type: 'meeting',
      date: '2025-03-05',
      status: 'Scheduled',
      quality: 0.87
    }
  ];

  const categories = [
    'All Categories',
    'Planning',
    'Finance', 
    'Transport',
    'Environment',
    'Governance',
    'Housing',
    'Education',
    'Health'
  ];

  const statusOptions = [
    'All Status',
    'Active',
    'Scheduled', 
    'Under Review',
    'Completed',
    'Pending'
  ];

  const qualityOptions = [
    'Any Quality',
    'High (90%+)',
    'Good (80%+)', 
    'Fair (70%+)',
    'All'
  ];

  // Perform search with filters
  const performSearch = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Filter results based on query and filters
    let filteredResults = mockResults.filter(result => {
      const matchesQuery = !query || 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase());
        
      const matchesCategory = !filters.category || filters.category === 'All Categories' ||
        result.category === filters.category;
        
      const matchesStatus = !filters.status || filters.status === 'All Status' ||
        result.status === filters.status;
        
      const matchesQuality = !filters.quality || filters.quality === 'Any Quality' ||
        (filters.quality === 'High (90%+)' && (result.quality || 0) >= 0.9) ||
        (filters.quality === 'Good (80%+)' && (result.quality || 0) >= 0.8) ||
        (filters.quality === 'Fair (70%+)' && (result.quality || 0) >= 0.7);
        
      return matchesQuery && matchesCategory && matchesStatus && matchesQuality;
    });
    
    setResults(filteredResults);
    setTotalResults(filteredResults.length);
    setSearchTime(Date.now() - startTime);
    setLoading(false);
  };

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query || Object.values(filters).some(f => f)) {
        performSearch();
      } else {
        setResults([]);
        setTotalResults(0);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, filters]);

  const clearFilters = () => {
    setFilters({
      category: '',
      dateRange: '',
      status: '',
      location: '',
      quality: ''
    });
    setQuery('');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'service': return Globe;
      case 'meeting': return Calendar;
      case 'document': return FileText;
      case 'planning': return Building2;
      default: return FileText;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Under Review': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Advanced Civic Search</h2>
                <p className="text-white/80">Search across all council services, meetings, and documents</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-xl"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Search & Filters Sidebar */}
          <div className="w-80 border-r bg-slate-50 p-6 overflow-y-auto">
            {/* Search Input */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search civic data..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-base border-2 border-slate-200 focus:border-blue-400 rounded-xl"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="rounded-xl border-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="rounded-xl border-2">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Data Quality</label>
                <Select value={filters.quality} onValueChange={(value) => setFilters(prev => ({ ...prev, quality: value }))}>
                  <SelectTrigger className="rounded-xl border-2">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityOptions.map(quality => (
                      <SelectItem key={quality} value={quality}>{quality}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              <Button
                onClick={clearFilters}
                variant="outline"
                className="w-full rounded-xl border-2"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Results Header */}
            {(query || Object.values(filters).some(f => f)) && (
              <div className="mb-6 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Activity className="h-5 w-5 text-blue-600" />
                      </motion.div>
                    ) : (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {loading ? 'Searching...' : `${totalResults} results found`}
                      </h3>
                      {!loading && searchTime > 0 && (
                        <p className="text-sm text-slate-500">Search completed in {searchTime}ms</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results List */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-slate-200 rounded w-full mb-4"></div>
                              <div className="flex gap-2">
                                <div className="h-6 bg-slate-200 rounded w-16"></div>
                                <div className="h-6 bg-slate-200 rounded w-20"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : results.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {results.map((result, index) => {
                    const IconComponent = getResultIcon(result.type);
                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -2 }}
                      >
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                                <IconComponent className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {result.title}
                                  </h4>
                                  {result.quality && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 text-orange-500" />
                                      <span className="text-sm font-medium text-orange-600">
                                        {Math.round(result.quality * 100)}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-slate-600 mb-4 line-clamp-2">
                                  {result.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <Badge className="bg-slate-100 text-slate-700">
                                    {result.category}
                                  </Badge>
                                  {result.status && (
                                    <Badge className={getStatusColor(result.status)}>
                                      {result.status}
                                    </Badge>
                                  )}
                                  {result.onlineAccess && (
                                    <Badge className="bg-emerald-100 text-emerald-800">
                                      <Globe className="h-3 w-3 mr-1" />
                                      Online
                                    </Badge>
                                  )}
                                  {result.date && (
                                    <Badge className="bg-blue-100 text-blue-800">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {new Date(result.date).toLocaleDateString()}
                                    </Badge>
                                  )}
                                  {result.location && (
                                    <Badge className="bg-purple-100 text-purple-800">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {result.location}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : query || Object.values(filters).some(f => f) ? (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No results found</h3>
                  <p className="text-slate-600 mb-6">
                    Try adjusting your search terms or filters to find what you're looking for.
                  </p>
                  <Button onClick={clearFilters} variant="outline" className="rounded-xl">
                    Clear all filters
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <Search className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Search Civic Data</h3>
                  <p className="text-slate-600">
                    Enter a search term or apply filters to find council services, meetings, and documents.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
