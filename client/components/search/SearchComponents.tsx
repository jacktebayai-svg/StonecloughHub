import React from 'react';
import { motion } from 'framer-motion';
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
  ExternalLink,
  Star,
  ArrowRight,
  Target,
  BookOpen,
  Lightbulb,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

// ============================================
// INTERFACES (from main component)
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

interface SearchAnalytics {
  totalResults: number;
  searchTime: number;
  categories: Record<string, number>;
  departments: Record<string, number>;
  popularQueries: string[];
  relatedQueries: string[];
}

// ============================================
// SEARCH RESULT CARD
// ============================================

export const SearchResultCard: React.FC<{
  result: SearchResult;
  index: number;
  query: string;
  onApplyFilter: (type: string, value: any) => void;
}> = ({ result, index, query, onApplyFilter }) => {
  const typeConfig = {
    budget: { icon: DollarSign, color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200' },
    meeting: { icon: Calendar, color: 'green', bg: 'bg-green-50', border: 'border-green-200' },
    document: { icon: FileText, color: 'purple', bg: 'bg-purple-50', border: 'border-purple-200' },
    service: { icon: Target, color: 'orange', bg: 'bg-orange-50', border: 'border-orange-200' },
    decision: { icon: Users, color: 'red', bg: 'bg-red-50', border: 'border-red-200' },
    planning: { icon: MapPin, color: 'indigo', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    consultation: { icon: BookOpen, color: 'pink', bg: 'bg-pink-50', border: 'border-pink-200' }
  };

  const config = typeConfig[result.type];
  const Icon = config.icon;

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 font-semibold">$1</mark>');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 ${config.border} hover:scale-[1.01]`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.bg}`}>
                <Icon className={`h-5 w-5 text-${config.color}-600`} />
              </div>
              <div>
                <Badge variant="secondary" className="text-xs">
                  {result.type}
                </Badge>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3 w-3 ${
                          i < Math.floor(result.relevanceScore * 5) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">
                    {Math.round(result.relevanceScore * 100)}% match
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              {format(result.date, 'dd/MM/yyyy')}
            </div>
          </div>

          <h3 
            className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: highlightText(result.title, query) }}
          />
          
          <p 
            className="text-slate-600 mb-4 line-clamp-3"
            dangerouslySetInnerHTML={{ __html: highlightText(result.description, query) }}
          />

          {/* Highlights */}
          {result.highlights.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">Key highlights:</p>
              <div className="space-y-1">
                {result.highlights.slice(0, 2).map((highlight, i) => (
                  <p 
                    key={i}
                    className="text-sm text-slate-700 bg-yellow-50 p-2 rounded border-l-2 border-yellow-300"
                    dangerouslySetInnerHTML={{ __html: highlightText(highlight, query) }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Metadata Tags */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {result.department && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs hover:bg-blue-50"
                  onClick={() => onApplyFilter('department', result.department)}
                >
                  {result.department}
                </Button>
              )}
              {result.ward && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs hover:bg-green-50"
                  onClick={() => onApplyFilter('ward', result.ward)}
                >
                  📍 {result.ward}
                </Button>
              )}
              <Badge variant="outline" className="text-xs">
                {result.category}
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-transform"
              onClick={() => window.open(result.url, '_blank')}
            >
              View
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ============================================
// ANALYTICS SIDEBAR
// ============================================

export const AnalyticsSidebar: React.FC<{
  analytics: SearchAnalytics;
  onApplyFilter: (type: string, value: any) => void;
}> = ({ analytics, onApplyFilter }) => (
  <div className="space-y-4">
    {/* Categories Breakdown */}
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Results by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(analytics.categories)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([category, count]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded"
              onClick={() => onApplyFilter('category', category)}
            >
              <span className="text-sm font-medium capitalize">{category}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(count / analytics.totalResults) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{count}</span>
              </div>
            </motion.div>
        ))}
      </CardContent>
    </Card>

    {/* Departments */}
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          By Department
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(analytics.departments)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 4)
          .map(([dept, count]) => (
            <Button
              key={dept}
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs h-8"
              onClick={() => onApplyFilter('department', dept)}
            >
              <span className="truncate">{dept}</span>
              <Badge variant="secondary" className="text-xs">
                {count}
              </Badge>
            </Button>
        ))}
      </CardContent>
    </Card>

    {/* Related Queries */}
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Related Searches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {analytics.relatedQueries.slice(0, 4).map((query, index) => (
          <motion.button
            key={query}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-full text-left p-2 text-xs hover:bg-blue-50 rounded flex items-center justify-between group"
          >
            <span className="text-slate-700">{query}</span>
            <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </motion.button>
        ))}
      </CardContent>
    </Card>

    {/* Popular Queries */}
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Star className="h-4 w-4" />
          Popular Searches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {analytics.popularQueries.slice(0, 3).map((query, index) => (
          <div key={query} className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 w-4">#{index + 1}</span>
            <span className="text-slate-700 flex-1">{query}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// ============================================
// NO RESULTS COMPONENT
// ============================================

export const NoResults: React.FC<{ query: string }> = ({ query }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-12"
  >
    <div className="max-w-md mx-auto">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        No results found for "{query}"
      </h3>
      <p className="text-slate-600 mb-6">
        Try adjusting your search terms or filters, or explore these suggestions:
      </p>
      <div className="space-y-2">
        <div className="text-sm text-slate-500">Suggestions:</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {['budget 2024', 'council meetings', 'planning applications', 'services'].map(suggestion => (
            <Badge key={suggestion} variant="outline" className="cursor-pointer hover:bg-slate-50">
              {suggestion}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

// ============================================
// SEARCH RESULTS SKELETON
// ============================================

export const SearchResultsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    <div className="lg:col-span-3 space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="shadow-lg">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                <div className="space-y-2">
                  <div className="w-16 h-4 bg-slate-200 rounded" />
                  <div className="w-24 h-3 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="w-3/4 h-5 bg-slate-200 rounded" />
                <div className="w-full h-4 bg-slate-200 rounded" />
                <div className="w-2/3 h-4 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <div className="w-16 h-6 bg-slate-200 rounded" />
                  <div className="w-20 h-6 bg-slate-200 rounded" />
                </div>
                <div className="w-12 h-6 bg-slate-200 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="shadow-lg">
          <CardContent className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="w-1/2 h-4 bg-slate-200 rounded" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="w-1/3 h-3 bg-slate-200 rounded" />
                  <div className="w-8 h-3 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// ============================================
// SEARCH TIPS COMPONENT
// ============================================

export const SearchTips: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-4xl mx-auto"
  >
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Search Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            Smart Search
          </h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Use natural language: "council meetings this month"</li>
            <li>• Fuzzy matching handles typos automatically</li>
            <li>• AI understands context and synonyms</li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-green-500" />
            Advanced Filters
          </h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Filter by department, ward, or date</li>
            <li>• Combine multiple filters for precision</li>
            <li>• Sort by relevance, date, or title</li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-500" />
            Quick Actions
          </h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Click suggested filters in results</li>
            <li>• Use trending searches for inspiration</li>
            <li>• Search history for quick access</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const generateMockResults = (query: string): SearchResult[] => {
  const types = ['budget', 'meeting', 'document', 'service', 'decision', 'planning', 'consultation'] as const;
  const departments = ['Housing & Planning', 'Environment', 'Transportation', 'Social Services', 'Finance'];
  const wards = ['Central', 'North', 'South', 'East', 'West'];
  
  return Array.from({ length: 12 }, (_, i) => ({
    id: `result-${i}`,
    title: `${query} - Council ${types[i % types.length]} Item ${i + 1}`,
    description: `This is a detailed description of the council ${types[i % types.length]} item related to ${query}. It contains relevant information for residents and stakeholders about local government activities and services.`,
    type: types[i % types.length],
    category: ['Policy', 'Budget', 'Planning', 'Service', 'Community'][i % 5],
    department: departments[i % departments.length],
    ward: Math.random() > 0.5 ? wards[i % wards.length] : undefined,
    date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    relevanceScore: Math.max(0.3, 1 - (i * 0.08)),
    highlights: [
      `Key finding related to ${query} in this document`,
      `Important details about ${query} implementation`,
      `Budget implications for ${query} project`
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    url: `/civic/item/${i + 1}`,
    metadata: {
      views: Math.floor(Math.random() * 1000),
      lastUpdated: new Date()
    }
  }));
};

export const generateMockAnalytics = (results: SearchResult[]): SearchAnalytics => {
  const categories = results.reduce((acc, result) => {
    acc[result.category] = (acc[result.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departments = results.reduce((acc, result) => {
    if (result.department) {
      acc[result.department] = (acc[result.department] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return {
    totalResults: results.length,
    searchTime: Math.floor(Math.random() * 300) + 50,
    categories,
    departments,
    popularQueries: ['budget 2024', 'planning applications', 'council meetings', 'waste collection', 'housing services'],
    relatedQueries: ['council budget', 'municipal services', 'local government', 'public consultations']
  };
};
