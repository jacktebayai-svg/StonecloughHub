import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Clock, 
  TrendingUp, 
  FileText, 
  Users, 
  Calendar,
  MapPin,
  DollarSign,
  X,
  ChevronDown,
  Sparkles,
  Zap,
  Target,
  BookOpen,
  Star,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  SearchResultCard, 
  AnalyticsSidebar, 
  NoResults, 
  SearchResultsSkeleton, 
  SearchTips,
  generateMockResults,
  generateMockAnalytics
} from './SearchComponents';

// ============================================
// INTERFACES AND TYPES
// ============================================

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'budget' | 'meeting' | 'document' | 'service' | 'decision' | 'planning' | 'consultation';
  category: string;
  department?: string;
  ward?: string;
  date: Date;
  relevanceScore: number;
  highlights: string[];
  url: string;
  metadata?: Record<string, any>;
}

interface SearchFilters {
  type: string[];
  department: string[];
  ward: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  category: string[];
  sortBy: 'relevance' | 'date' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface SearchSuggestion {
  query: string;
  type: 'history' | 'trending' | 'autocomplete';
  count?: number;
  icon?: React.ReactNode;
}

interface SearchAnalytics {
  totalResults: number;
  searchTime: number;
  categories: Record<string, number>;
  departments: Record<string, number>;
  popularQueries: string[];
  relatedQueries: string[];
}

// ============================================
// MAIN SEARCH COMPONENT
// ============================================

export const IntelligentSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    department: [],
    ward: [],
    dateRange: {},
    category: [],
    sortBy: 'relevance',
    sortOrder: 'desc'
  });
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const debouncedQuery = useDebounce(query, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Simulate search functionality
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
      updateSearchHistory(debouncedQuery);
    } else {
      setResults([]);
      setAnalytics(null);
    }
  }, [debouncedQuery, filters]);

  // Load suggestions when input is focused
  useEffect(() => {
    if (showSuggestions) {
      loadSuggestions(query);
    }
  }, [query, showSuggestions]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual search endpoint
      const response = await fetch('/api/civic/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          filters,
          fuzzy: true,
          semantic: true
        })
      });

      // Mock search results for demonstration
      const mockResults = generateMockResults(searchQuery);
      setResults(mockResults);
      
      const mockAnalytics = generateMockAnalytics(mockResults);
      setAnalytics(mockAnalytics);
      
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuggestions = (currentQuery: string) => {
    const mockSuggestions: SearchSuggestion[] = [
      // Search history
      ...searchHistory.slice(0, 3).map(h => ({
        query: h,
        type: 'history' as const,
        icon: <Clock className="h-4 w-4" />
      })),
      // Trending searches
      { query: 'budget 2024', type: 'trending', count: 156, icon: <TrendingUp className="h-4 w-4" /> },
      { query: 'planning applications', type: 'trending', count: 89, icon: <FileText className="h-4 w-4" /> },
      { query: 'council meetings', type: 'trending', count: 67, icon: <Users className="h-4 w-4" /> },
      // Autocomplete
      ...(currentQuery ? [
        { query: `${currentQuery} 2024`, type: 'autocomplete' as const },
        { query: `${currentQuery} department`, type: 'autocomplete' as const },
        { query: `${currentQuery} council`, type: 'autocomplete' as const },
      ] : [])
    ];

    setSuggestions(mockSuggestions.slice(0, 8));
  };

  const updateSearchHistory = (searchQuery: string) => {
    setSearchHistory(prev => {
      const newHistory = [searchQuery, ...prev.filter(q => q !== searchQuery)];
      return newHistory.slice(0, 10); // Keep only last 10 searches
    });
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.query);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setAnalytics(null);
    searchInputRef.current?.focus();
  };

  const applyQuickFilter = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: Array.isArray(prev[filterType]) 
        ? [...(prev[filterType] as any[]), value]
        : value
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Search Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">
          Intelligent Civic Search
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Search across all council data with AI-powered suggestions, fuzzy matching, and intelligent filtering
        </p>
      </div>

      {/* Search Input */}
      <SearchInput
        query={query}
        setQuery={setQuery}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        setShowSuggestions={setShowSuggestions}
        onSuggestionClick={handleSuggestionClick}
        onClear={clearSearch}
        isLoading={isLoading}
        ref={searchInputRef}
      />

      {/* Quick Filters */}
      <QuickFilters onApplyFilter={applyQuickFilter} />

      {/* Search Controls */}
      <SearchControls
        filters={filters}
        setFilters={setFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        analytics={analytics}
      />

      {/* Search Results */}
      {query && (
        <SearchResults
          results={results}
          analytics={analytics}
          isLoading={isLoading}
          query={query}
          onApplyFilter={applyQuickFilter}
        />
      )}

      {/* Search Tips */}
      {!query && <SearchTips />}
    </div>
  );
};

// ============================================
// SEARCH INPUT COMPONENT
// ============================================

const SearchInput = React.forwardRef<HTMLInputElement, {
  query: string;
  setQuery: (query: string) => void;
  suggestions: SearchSuggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
  onClear: () => void;
  isLoading: boolean;
}>(({
  query,
  setQuery,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  onSuggestionClick,
  onClear,
  isLoading
}, ref) => (
  <div className="relative">
    <Card className="shadow-lg border-2 border-blue-100 focus-within:border-blue-300 transition-colors">
      <div className="flex items-center p-4">
        <Search className="h-6 w-6 text-slate-400 mr-3 flex-shrink-0" />
        <Input
          ref={ref}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search council data, services, meetings, budgets..."
          className="border-none shadow-none text-lg focus-visible:ring-0 flex-1"
        />
        {isLoading && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2" />
        )}
        {query && (
          <Button
            onClick={onClear}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-600 p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center gap-2 ml-3 text-xs text-slate-500">
          <Sparkles className="h-4 w-4" />
          AI Powered
        </div>
      </div>
    </Card>

    {/* Suggestions Dropdown */}
    <AnimatePresence>
      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-50 w-full mt-2"
        >
          <Card className="shadow-xl border border-slate-200">
            <CardContent className="p-0">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={`${suggestion.query}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  <div className="flex items-center gap-3">
                    {suggestion.icon}
                    <span className="text-sm">{suggestion.query}</span>
                    {suggestion.type === 'trending' && (
                      <Badge variant="secondary" className="text-xs">
                        Trending
                      </Badge>
                    )}
                    {suggestion.type === 'history' && (
                      <Badge variant="outline" className="text-xs">
                        Recent
                      </Badge>
                    )}
                  </div>
                  {suggestion.count && (
                    <span className="text-xs text-slate-500">{suggestion.count} results</span>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
));

// ============================================
// QUICK FILTERS COMPONENT
// ============================================

const QuickFilters: React.FC<{
  onApplyFilter: (type: string, value: any) => void;
}> = ({ onApplyFilter }) => (
  <div className="flex flex-wrap gap-3 justify-center">
    {[
      { label: 'Budget Data', type: 'budget', icon: <DollarSign className="h-4 w-4" />, color: 'blue' },
      { label: 'Meetings', type: 'meeting', icon: <Calendar className="h-4 w-4" />, color: 'green' },
      { label: 'Documents', type: 'document', icon: <FileText className="h-4 w-4" />, color: 'purple' },
      { label: 'Services', type: 'service', icon: <Target className="h-4 w-4" />, color: 'orange' },
      { label: 'Planning', type: 'planning', icon: <MapPin className="h-4 w-4" />, color: 'red' },
    ].map(filter => (
      <motion.div key={filter.type} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onApplyFilter('type', filter.type)}
          className={`flex items-center gap-2 border-${filter.color}-200 hover:border-${filter.color}-300 hover:bg-${filter.color}-50`}
        >
          {filter.icon}
          {filter.label}
        </Button>
      </motion.div>
    ))}
  </div>
);

// ============================================
// SEARCH CONTROLS COMPONENT
// ============================================

const SearchControls: React.FC<{
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  analytics: SearchAnalytics | null;
}> = ({ filters, setFilters, showFilters, setShowFilters, analytics }) => (
  <div className="flex items-center justify-between flex-wrap gap-4">
    <div className="flex items-center gap-4">
      <Button
        onClick={() => setShowFilters(!showFilters)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Filter className="h-4 w-4" />
        Filters
        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
      </Button>

      {/* Active Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.type.map(type => (
          <Badge key={type} variant="secondary" className="flex items-center gap-1">
            {type}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => setFilters({
                ...filters,
                type: filters.type.filter(t => t !== type)
              })}
            />
          </Badge>
        ))}
      </div>
    </div>

    {analytics && (
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <span>{analytics.totalResults.toLocaleString()} results</span>
        <span>in {analytics.searchTime}ms</span>
        <Zap className="h-4 w-4 text-yellow-500" />
      </div>
    )}
  </div>
);

// ============================================
// SEARCH RESULTS COMPONENT
// ============================================

const SearchResults: React.FC<{
  results: SearchResult[];
  analytics: SearchAnalytics | null;
  isLoading: boolean;
  query: string;
  onApplyFilter: (type: string, value: any) => void;
}> = ({ results, analytics, isLoading, query, onApplyFilter }) => {
  if (isLoading) {
    return <SearchResultsSkeleton />;
  }

  if (results.length === 0) {
    return <NoResults query={query} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Results */}
      <div className="lg:col-span-3 space-y-4">
        {results.map((result, index) => (
          <SearchResultCard
            key={result.id}
            result={result}
            index={index}
            query={query}
            onApplyFilter={onApplyFilter}
          />
        ))}
      </div>

      {/* Analytics Sidebar */}
      {analytics && (
        <div className="space-y-4">
          <AnalyticsSidebar analytics={analytics} onApplyFilter={onApplyFilter} />
        </div>
      )}
    </div>
  );
};

// Continue in next part due to length limitations...

export default IntelligentSearch;
