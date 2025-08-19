import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  User, 
  Clock, 
  Tag, 
  ArrowRight,
  Search,
  Filter,
  Heart,
  Share2,
  Bookmark,
  MessageCircle,
  Eye,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  Play,
  Image as ImageIcon,
  Video,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageLayout } from '../layout/PageLayout';
import { format, parseISO } from 'date-fns';

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;
  publishedAt: Date;
  updatedAt?: Date;
  category: string;
  tags: string[];
  readTime: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  featured?: boolean;
  status: 'published' | 'draft';
  type: 'article' | 'announcement' | 'news' | 'event';
}

interface BlogCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  count: number;
}

const SAMPLE_CATEGORIES: BlogCategory[] = [
  { id: 'news', name: 'Local News', description: 'Latest news and updates from Stoneclough', color: '#3B82F6', count: 12 },
  { id: 'events', name: 'Events', description: 'Community events and activities', color: '#10B981', count: 8 },
  { id: 'announcements', name: 'Announcements', description: 'Official announcements and notices', color: '#F59E0B', count: 5 },
  { id: 'community', name: 'Community', description: 'Community stories and features', color: '#8B5CF6', count: 15 },
  { id: 'council', name: 'Council Updates', description: 'Council news and decisions', color: '#EF4444', count: 6 }
];

const SAMPLE_ARTICLES: BlogArticle[] = [
  {
    id: '1',
    title: 'New Community Center Opens This Weekend',
    slug: 'new-community-center-opens-weekend',
    excerpt: 'After two years of construction, our new state-of-the-art community center is finally ready to welcome residents. The grand opening celebration features activities for all ages.',
    content: 'Full article content here...',
    featuredImage: '/api/placeholder/800/400',
    authorName: 'Sarah Mitchell',
    authorAvatar: '/api/placeholder/40/40',
    authorRole: 'Community Reporter',
    publishedAt: new Date('2024-03-15T10:00:00Z'),
    category: 'news',
    tags: ['community', 'opening', 'facilities'],
    readTime: 4,
    viewCount: 342,
    likeCount: 28,
    commentCount: 12,
    featured: true,
    status: 'published',
    type: 'news'
  },
  {
    id: '2',
    title: 'Spring Festival 2024: A Celebration to Remember',
    slug: 'spring-festival-2024-celebration',
    excerpt: 'The annual Stoneclough Spring Festival brought together hundreds of residents for a day of music, food, and community spirit. Here are the highlights from this year\'s event.',
    content: 'Full article content here...',
    featuredImage: '/api/placeholder/800/400',
    authorName: 'Mike Chen',
    authorAvatar: '/api/placeholder/40/40',
    authorRole: 'Event Coordinator',
    publishedAt: new Date('2024-03-12T14:30:00Z'),
    category: 'events',
    tags: ['festival', 'community', 'celebration'],
    readTime: 6,
    viewCount: 256,
    likeCount: 45,
    commentCount: 8,
    status: 'published',
    type: 'article'
  },
  {
    id: '3',
    title: 'Council Approves New Cycling Infrastructure Plan',
    slug: 'council-approves-cycling-infrastructure-plan',
    excerpt: 'The Stoneclough Council has unanimously approved a comprehensive plan to improve cycling infrastructure throughout the community, including new bike lanes and secure parking.',
    content: 'Full article content here...',
    featuredImage: '/api/placeholder/800/400',
    authorName: 'Bolton Council',
    authorRole: 'Official',
    publishedAt: new Date('2024-03-10T09:00:00Z'),
    category: 'announcements',
    tags: ['council', 'cycling', 'infrastructure', 'transport'],
    readTime: 3,
    viewCount: 189,
    likeCount: 22,
    commentCount: 15,
    featured: true,
    status: 'published',
    type: 'announcement'
  },
  {
    id: '4',
    title: 'Meet the Volunteers: The Heart of Our Community',
    slug: 'meet-volunteers-heart-community',
    excerpt: 'We spotlight some of the amazing volunteers who dedicate their time and energy to making Stoneclough a better place for everyone.',
    content: 'Full article content here...',
    featuredImage: '/api/placeholder/800/400',
    authorName: 'Emma Wilson',
    authorAvatar: '/api/placeholder/40/40',
    authorRole: 'Volunteer Coordinator',
    publishedAt: new Date('2024-03-08T16:00:00Z'),
    category: 'community',
    tags: ['volunteers', 'community', 'profiles'],
    readTime: 5,
    viewCount: 167,
    likeCount: 33,
    commentCount: 6,
    status: 'published',
    type: 'article'
  },
  {
    id: '5',
    title: 'Upcoming Road Maintenance Schedule',
    slug: 'upcoming-road-maintenance-schedule',
    excerpt: 'Please be aware of temporary road closures and traffic diversions planned for the upcoming road maintenance work throughout Stoneclough.',
    content: 'Full article content here...',
    authorName: 'Bolton Council',
    authorRole: 'Official',
    publishedAt: new Date('2024-03-05T11:00:00Z'),
    category: 'announcements',
    tags: ['maintenance', 'roads', 'traffic'],
    readTime: 2,
    viewCount: 145,
    likeCount: 8,
    commentCount: 3,
    status: 'published',
    type: 'announcement'
  },
  {
    id: '6',
    title: 'Local Business Spotlight: Green Garden Nursery',
    slug: 'business-spotlight-green-garden-nursery',
    excerpt: 'Discover how Green Garden Nursery has been serving our community for over 30 years, providing plants, advice, and fostering a love of gardening.',
    content: 'Full article content here...',
    featuredImage: '/api/placeholder/800/400',
    authorName: 'Lisa Parker',
    authorAvatar: '/api/placeholder/40/40',
    authorRole: 'Business Reporter',
    publishedAt: new Date('2024-03-03T13:00:00Z'),
    category: 'community',
    tags: ['business', 'gardening', 'spotlight'],
    readTime: 4,
    viewCount: 201,
    likeCount: 19,
    commentCount: 4,
    status: 'published',
    type: 'article'
  }
];

export const ModernBlog: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 6;

  const filteredArticles = SAMPLE_ARTICLES.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const isPublished = article.status === 'published';
    
    return matchesSearch && matchesCategory && isPublished;
  });

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.viewCount + b.likeCount) - (a.viewCount + a.likeCount);
      case 'oldest':
        return a.publishedAt.getTime() - b.publishedAt.getTime();
      case 'latest':
      default:
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.publishedAt.getTime() - a.publishedAt.getTime();
    }
  });

  const totalPages = Math.ceil(sortedArticles.length / articlesPerPage);
  const paginatedArticles = sortedArticles.slice(
    (currentPage - 1) * articlesPerPage,
    currentPage * articlesPerPage
  );

  const featuredArticles = SAMPLE_ARTICLES.filter(article => article.featured).slice(0, 3);

  const getArticleTypeIcon = (type: string) => {
    switch (type) {
      case 'news': return <FileText className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'announcement': return <Award className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getArticleTypeColor = (type: string) => {
    switch (type) {
      case 'news': return 'bg-blue-100 text-blue-700';
      case 'event': return 'bg-green-100 text-green-700';
      case 'announcement': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const ArticleCard = ({ article, featured = false }: { article: BlogArticle; featured?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={featured ? 'md:col-span-2' : ''}
    >
      <Card className="h-full hover:shadow-xl transition-all duration-300 overflow-hidden group">
        {/* Featured Image */}
        {article.featuredImage && (
          <div className={`relative overflow-hidden ${featured ? 'h-64' : 'h-48'}`}>
            <img 
              src={article.featuredImage} 
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              {article.featured && (
                <Badge className="bg-yellow-500/90 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              <Badge className={`${getArticleTypeColor(article.type)} border-0`}>
                {getArticleTypeIcon(article.type)}
                <span className="ml-1 capitalize">{article.type}</span>
              </Badge>
            </div>
            <div className="absolute top-4 right-4">
              <Button size="sm" variant="ghost" className="bg-white/90 hover:bg-white h-8 w-8 p-0">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute bottom-4 left-4">
              <Badge 
                variant="outline" 
                className="bg-black/70 text-white border-white/30"
                style={{ 
                  borderColor: SAMPLE_CATEGORIES.find(c => c.id === article.category)?.color,
                  backgroundColor: `${SAMPLE_CATEGORIES.find(c => c.id === article.category)?.color}90`
                }}
              >
                {SAMPLE_CATEGORIES.find(c => c.id === article.category)?.name}
              </Badge>
            </div>
          </div>
        )}

        <CardContent className="p-6">
          {/* Article Header */}
          <div className="mb-4">
            <h3 className={`font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-2 mb-3 ${
              featured ? 'text-2xl' : 'text-lg'
            }`}>
              {article.title}
            </h3>
            <p className={`text-slate-600 line-clamp-3 ${featured ? 'text-base' : 'text-sm'}`}>
              {article.excerpt}
            </p>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {article.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Tag className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
              {article.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{article.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Article Stats */}
          <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.viewCount}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {article.likeCount}
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {article.commentCount}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readTime} min read
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                <Share2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Author and Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={article.authorAvatar} alt={article.authorName} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700">
                  {article.authorName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-slate-900">{article.authorName}</p>
                {article.authorRole && (
                  <p className="text-xs text-slate-500">{article.authorRole}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">
                {format(article.publishedAt, 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-slate-500">
                {format(article.publishedAt, 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Read More Button */}
          <div className="mt-4">
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size={featured ? 'default' : 'sm'}
            >
              Read Full Article
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
              Stoneclough News & Updates
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Stay informed about the latest news, events, and announcements from your local community. 
              Discover what's happening in Stoneclough and get involved.
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <FileText className="h-6 w-6 mx-auto mb-2" />
              <div className="text-2xl font-bold">{SAMPLE_ARTICLES.length}</div>
              <div className="text-sm text-blue-100">Articles</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2" />
              <div className="text-2xl font-bold">2.4k</div>
              <div className="text-sm text-blue-100">Total Views</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Heart className="h-6 w-6 mx-auto mb-2" />
              <div className="text-2xl font-bold">156</div>
              <div className="text-sm text-blue-100">Likes</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <MessageCircle className="h-6 w-6 mx-auto mb-2" />
              <div className="text-2xl font-bold">48</div>
              <div className="text-sm text-blue-100">Comments</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Featured Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredArticles.map((article, index) => (
                <ArticleCard 
                  key={article.id} 
                  article={article} 
                  featured={index === 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {SAMPLE_CATEGORIES.map((category) => (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedCategory === category.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div 
                      className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium text-sm mb-1">{category.name}</h3>
                    <p className="text-xs text-slate-500">{category.count} articles</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search articles..."
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
                  {SAMPLE_CATEGORIES.map((category) => (
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
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-slate-600">
            Showing {paginatedArticles.length} of {sortedArticles.length} articles
          </p>
          {selectedCategory !== 'all' && (
            <p className="text-sm text-blue-600">
              Filtered by: {SAMPLE_CATEGORIES.find(c => c.id === selectedCategory)?.name}
            </p>
          )}
        </div>

        {/* Articles Grid */}
        {paginatedArticles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No articles found</h3>
            <p className="text-slate-600 mb-6">
              Try different search terms or browse all categories.
            </p>
            <Button onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setCurrentPage(1);
            }}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8"
        >
          <div className="text-center">
            <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Get the latest news and updates from Stoneclough delivered directly to your inbox. 
              Never miss important community announcements or events.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="flex-1"
              />
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
              >
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default ModernBlog;
