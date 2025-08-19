import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Filter, Building, FileText, Users, BarChart3, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface SearchResult {
  id: string;
  type: 'business' | 'article' | 'discussion' | 'survey' | 'council_data';
  title: string;
  description?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  author?: string;
  createdAt: string;
  imageUrl?: string;
  location?: string;
  matchScore?: number;
}

const searchTypes = {
  all: { label: "All", icon: Search },
  business: { label: "Businesses", icon: Building },
  article: { label: "Articles", icon: FileText },
  discussion: { label: "Discussions", icon: Users },
  survey: { label: "Surveys", icon: BarChart3 },
  council_data: { label: "Council Data", icon: Calendar },
};

interface GlobalSearchProps {
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
}

export function GlobalSearch({ 
  onResultClick, 
  placeholder = "Search everything...", 
  showFilters = true 
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [isOpen, setIsOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ["globalSearch", query, selectedType, selectedCategory, sortBy],
    queryFn: async () => {
      if (query.length < 2) return [];
      
      const searchParams = new URLSearchParams({
        q: query,
        ...(selectedType !== "all" && { type: selectedType }),
        ...(selectedCategory !== "all" && { category: selectedCategory }),
        sort: sortBy,
      });
      
      return apiRequest(`/api/search?${searchParams.toString()}`);
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(value.length >= 2);
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    onResultClick?.(result);
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    setSelectedType("all");
    setSelectedCategory("all");
    setSortBy("relevance");
  };

  const getResultIcon = (type: SearchResult['type']) => {
    const IconComponent = searchTypes[type]?.icon || Search;
    return <IconComponent className="h-4 w-4" />;
  };

  const getResultTypeLabel = (type: SearchResult['type']) => {
    return searchTypes[type]?.label || type;
  };

  const formatResultContent = (result: SearchResult) => {
    switch (result.type) {
      case 'business':
        return result.description || result.location || '';
      case 'article':
        return result.excerpt || result.content?.substring(0, 150) + '...' || '';
      case 'discussion':
        return result.content?.substring(0, 150) + '...' || '';
      case 'survey':
        return result.description || '';
      case 'council_data':
        return result.description || result.location || '';
      default:
        return '';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stoneclough-gray-blue h-4 w-4" />
        <Input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-20 h-12 text-base"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {showFilters && (
            <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-stoneclough-gray-blue hover:text-stoneclough-blue"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Search Filters</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Content Type</label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(searchTypes).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="date">Date (Newest)</SelectItem>
                        <SelectItem value="date_asc">Date (Oldest)</SelectItem>
                        <SelectItem value="title">Title (A-Z)</SelectItem>
                        <SelectItem value="popularity">Popularity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(selectedType === 'business' || selectedType === 'all') && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Business Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="restaurant_cafe">Restaurants & Cafes</SelectItem>
                          <SelectItem value="retail_shopping">Retail & Shopping</SelectItem>
                          <SelectItem value="health_beauty">Health & Beauty</SelectItem>
                          <SelectItem value="professional_services">Professional Services</SelectItem>
                          <SelectItem value="home_garden">Home & Garden</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={clearSearch}>
                      Clear All
                    </Button>
                    <Button onClick={() => setIsAdvancedOpen(false)}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-8 w-8 p-0 text-stoneclough-gray-blue hover:text-stoneclough-blue"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {(selectedType !== "all" || selectedCategory !== "all" || sortBy !== "relevance") && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedType !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Type: {searchTypes[selectedType as keyof typeof searchTypes]?.label}
              <button
                onClick={() => setSelectedType("all")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCategory !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Category: {selectedCategory.replace('_', ' ')}
              <button
                onClick={() => setSelectedCategory("all")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {sortBy !== "relevance" && (
            <Badge variant="secondary" className="text-xs">
              Sort: {sortBy.replace('_', ' ')}
              <button
                onClick={() => setSortBy("relevance")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center">
                <p className="text-stoneclough-gray-blue">Searching...</p>
              </div>
            ) : results && results.length > 0 ? (
              <div>
                <div className="px-4 py-2 border-b bg-stoneclough-light/50">
                  <p className="text-sm text-stoneclough-gray-blue">
                    {results.length} result{results.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {results.map((result: SearchResult, index: number) => (
                    <div
                      key={`${result.type}-${result.id}-${index}`}
                      className="p-4 hover:bg-stoneclough-light/50 cursor-pointer border-b last:border-b-0 transition-colors"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-start space-x-3">
                        {result.imageUrl && (
                          <img
                            src={result.imageUrl}
                            alt={result.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {getResultIcon(result.type)}
                            <Badge variant="outline" className="text-xs">
                              {getResultTypeLabel(result.type)}
                            </Badge>
                            {result.category && (
                              <Badge variant="secondary" className="text-xs">
                                {result.category}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-stoneclough-blue truncate">
                            {result.title}
                          </h4>
                          <p className="text-sm text-stoneclough-gray-blue line-clamp-2 mt-1">
                            {formatResultContent(result)}
                          </p>
                          <div className="flex items-center justify-between mt-2 text-xs text-stoneclough-gray-blue">
                            <span>
                              {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
                            </span>
                            {result.author && (
                              <span>by {result.author}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : query.length >= 2 ? (
              <div className="p-8 text-center">
                <Search className="h-12 w-12 text-stoneclough-gray-blue mx-auto mb-4" />
                <p className="text-stoneclough-gray-blue">No results found for "{query}"</p>
                <p className="text-sm text-stoneclough-gray-blue mt-2">
                  Try adjusting your search terms or filters
                </p>
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-stoneclough-gray-blue">Start typing to search...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
