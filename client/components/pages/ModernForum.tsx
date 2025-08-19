import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Pin, 
  Lock, 
  Eye, 
  MessageCircle, 
  ArrowUp, 
  ArrowDown,
  Bookmark,
  Share2,
  Flag,
  Calendar,
  User,
  Hash,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Edit3,
  Trash2,
  Users,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Award,
  Shield,
  Heart,
  FileText,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageLayout } from '../layout/PageLayout';
import { format, formatDistanceToNow } from 'date-fns';

interface DiscussionCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon: string;
  color: string;
  displayOrder: number;
  postCount: number;
  lastPostAt?: Date;
}

interface DiscussionTopic {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  content: string;
  tags?: string[];
  pinned?: boolean;
  locked?: boolean;
  solved?: boolean;
  viewCount: number;
  replyCount: number;
  upvotes: number;
  downvotes: number;
  lastReplyAt?: Date;
  lastReplyUser?: string;
  status: 'published' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// Sample categories for civic discussions
const SAMPLE_CATEGORIES: DiscussionCategory[] = [
  {
    id: '1',
    name: 'General Discussion',
    description: 'General community discussions and announcements',
    slug: 'general',
    icon: 'MessageCircle',
    color: '#3B82F6',
    displayOrder: 1,
    postCount: 45,
    lastPostAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '2',
    name: 'Council Meetings',
    description: 'Discussions about upcoming and past council meetings',
    slug: 'council-meetings',
    icon: 'Calendar',
    color: '#10B981',
    displayOrder: 2,
    postCount: 23,
    lastPostAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    id: '3',
    name: 'Local Budget',
    description: 'Budget discussions, proposals, and transparency',
    slug: 'local-budget',
    icon: 'DollarSign',
    color: '#F59E0B',
    displayOrder: 3,
    postCount: 18,
    lastPostAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },
  {
    id: '4',
    name: 'Planning Applications',
    description: 'Discuss local planning and development projects',
    slug: 'planning-applications',
    icon: 'MapPin',
    color: '#EF4444',
    displayOrder: 4,
    postCount: 31,
    lastPostAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
  },
  {
    id: '5',
    name: 'Environment & Sustainability',
    description: 'Green initiatives, waste management, climate action',
    slug: 'environment',
    icon: 'TreePine',
    color: '#059669',
    displayOrder: 6,
    postCount: 27,
    lastPostAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  }
];

// Sample topics for demonstration
const SAMPLE_TOPICS: DiscussionTopic[] = [
  {
    id: '1',
    title: 'New cycle lane proposal on High Street - What do you think?',
    slug: 'new-cycle-lane-proposal-high-street',
    categoryId: '4',
    userId: 'user1',
    userName: 'Sarah Johnson',
    userAvatar: '/api/placeholder/40/40',
    userRole: 'resident',
    content: 'The council has proposed a new cycle lane on High Street. This could improve cycling safety but might impact parking. I\'d love to hear everyone\'s thoughts on this important infrastructure change.',
    tags: ['cycling', 'transport', 'safety', 'parking'],
    pinned: true,
    viewCount: 234,
    replyCount: 15,
    upvotes: 23,
    downvotes: 4,
    lastReplyAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    lastReplyUser: 'Mike Chen',
    status: 'published',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: '2',
    title: 'Community Garden Initiative - Seeking Volunteers',
    slug: 'community-garden-initiative-volunteers',
    categoryId: '5',
    userId: 'user2',
    userName: 'Emma Wilson',
    userAvatar: '/api/placeholder/40/40',
    userRole: 'volunteer',
    content: 'We\'re starting a community garden project at the old park space. Looking for volunteers to help with planning, planting, and maintenance. Great way to bring the community together!',
    tags: ['community', 'gardening', 'volunteers', 'environment'],
    viewCount: 156,
    replyCount: 8,
    upvotes: 31,
    downvotes: 1,
    lastReplyAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    lastReplyUser: 'Alex Turner',
    status: 'published',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '3',
    title: 'Council Budget 2024 - Transparency Report Available',
    slug: 'council-budget-2024-transparency-report',
    categoryId: '3',
    userId: 'council-admin',
    userName: 'Bolton Council',
    userRole: 'official',
    content: 'The 2024 budget transparency report is now available for public review. This includes detailed breakdowns of spending, upcoming projects, and how your council tax is being used.',
    tags: ['budget', 'transparency', 'council-tax', '2024'],
    pinned: true,
    viewCount: 342,
    replyCount: 22,
    upvotes: 18,
    downvotes: 3,
    lastReplyAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    lastReplyUser: 'David Park',
    status: 'published',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    id: '4',
    title: 'Traffic concerns on Church Lane during school hours',
    slug: 'traffic-concerns-church-lane-school-hours',
    categoryId: '1',
    userId: 'user3',
    userName: 'James Mitchell',
    userRole: 'parent',
    content: 'Has anyone else noticed increased traffic congestion on Church Lane during school pickup times? It\'s becoming quite dangerous for children walking to school.',
    tags: ['traffic', 'safety', 'school', 'children'],
    solved: true,
    viewCount: 89,
    replyCount: 12,
    upvotes: 15,
    downvotes: 2,
    lastReplyAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    lastReplyUser: 'Lisa Roberts',
    status: 'published',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
  },
  {
    id: '5',
    title: 'Upcoming Council Meeting - March 15th',
    slug: 'upcoming-council-meeting-march-15',
    categoryId: '2',
    userId: 'council-admin',
    userName: 'Bolton Council',
    userRole: 'official',
    content: 'The next council meeting is scheduled for March 15th at 7 PM. Agenda items include the high street development proposal, parking policy changes, and community center funding.',
    tags: ['meeting', 'agenda', 'march', 'development'],
    viewCount: 201,
    replyCount: 6,
    upvotes: 12,
    downvotes: 0,
    lastReplyAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    lastReplyUser: 'Maria Santos',
    status: 'published',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
  }
];

export const ModernForum: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [showNewTopicDialog, setShowNewTopicDialog] = useState(false);
  const [newTopicData, setNewTopicData] = useState({
    title: '',
    content: '',
    categoryId: '',
    tags: ''
  });

  const filteredTopics = SAMPLE_TOPICS.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || topic.categoryId === selectedCategory;
    const isPublished = topic.status === 'published';
    
    return matchesSearch && matchesCategory && isPublished;
  });

  const sortedTopics = [...filteredTopics].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case 'oldest':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'latest':
      default:
        // Pinned topics first, then by last activity
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const aTime = a.lastReplyAt?.getTime() || a.createdAt.getTime();
        const bTime = b.lastReplyAt?.getTime() || b.createdAt.getTime();
        return bTime - aTime;
    }
  });

  const getUserRoleColor = (role?: string) => {
    switch (role) {
      case 'official':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'moderator':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'volunteer':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'parent':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getUserRoleIcon = (role?: string) => {
    switch (role) {
      case 'official':
        return <Shield className="h-3 w-3" />;
      case 'moderator':
        return <Star className="h-3 w-3" />;
      case 'volunteer':
        return <Heart className="h-3 w-3" />;
      case 'parent':
        return <Users className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const TopicCard = ({ topic }: { topic: DiscussionTopic }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: SAMPLE_CATEGORIES.find(c => c.id === topic.categoryId)?.color || '#3B82F6' }}>
        <CardContent className="p-4">
          {/* Topic Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {topic.pinned && <Pin className="h-4 w-4 text-yellow-500" />}
                {topic.locked && <Lock className="h-4 w-4 text-gray-500" />}
                {topic.solved && <CheckCircle className="h-4 w-4 text-green-500" />}
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: SAMPLE_CATEGORIES.find(c => c.id === topic.categoryId)?.color,
                    color: SAMPLE_CATEGORIES.find(c => c.id === topic.categoryId)?.color
                  }}
                >
                  {SAMPLE_CATEGORIES.find(c => c.id === topic.categoryId)?.name}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-2 mb-2">
                {topic.title}
              </h3>
              <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                {topic.content}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="ml-2">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Tags */}
          {topic.tags && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {topic.tags.slice(0, 4).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Hash className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
              {topic.tags.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{topic.tags.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Topic Stats */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {topic.viewCount}
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {topic.replyCount}
              </div>
              <div className="flex items-center gap-1">
                <ArrowUp className="h-3 w-3 text-green-600" />
                {topic.upvotes}
              </div>
              {topic.downvotes > 0 && (
                <div className="flex items-center gap-1">
                  <ArrowDown className="h-3 w-3 text-red-600" />
                  {topic.downvotes}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                <Bookmark className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                <Share2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Author and Last Activity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={topic.userAvatar} alt={topic.userName} />
                <AvatarFallback className="text-xs">
                  {topic.userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{topic.userName}</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs flex items-center gap-1 ${getUserRoleColor(topic.userRole)}`}
                >
                  {getUserRoleIcon(topic.userRole)}
                  {topic.userRole}
                </Badge>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              {topic.lastReplyAt ? (
                <div>
                  <span>Last reply {formatDistanceToNow(topic.lastReplyAt)} ago</span>
                  {topic.lastReplyUser && (
                    <div>by {topic.lastReplyUser}</div>
                  )}
                </div>
              ) : (
                <span>Created {formatDistanceToNow(topic.createdAt)} ago</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const NewTopicDialog = () => (
    <Dialog open={showNewTopicDialog} onOpenChange={setShowNewTopicDialog}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          New Discussion
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start New Discussion</DialogTitle>
          <DialogDescription>
            Share your thoughts, ask questions, or start a conversation with the community.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              placeholder="What would you like to discuss?"
              value={newTopicData.title}
              onChange={(e) => setNewTopicData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select 
              value={newTopicData.categoryId} 
              onValueChange={(value) => setNewTopicData(prev => ({ ...prev, categoryId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Content</label>
            <Textarea
              placeholder="Share your thoughts, provide details, ask questions..."
              rows={6}
              value={newTopicData.content}
              onChange={(e) => setNewTopicData(prev => ({ ...prev, content: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Tags (optional)</label>
            <Input
              placeholder="e.g. transport, environment, safety (comma separated)"
              value={newTopicData.tags}
              onChange={(e) => setNewTopicData(prev => ({ ...prev, tags: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowNewTopicDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Post Discussion
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
              Community Forum
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Connect with your community. Discuss local issues, share ideas, and work together 
              to make Stoneclough an even better place to live.
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
              <MessageSquare className="h-6 w-6 mx-auto mb-2" />
              <div className="text-2xl font-bold">{SAMPLE_TOPICS.length}</div>
              <div className="text-sm text-blue-100">Active Topics</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2" />
              <div className="text-2xl font-bold">248</div>
              <div className="text-sm text-blue-100">Community Members</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2" />
              <div className="text-2xl font-bold">1.2k</div>
              <div className="text-sm text-blue-100">Total Discussions</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2" />
              <div className="text-2xl font-bold">24h</div>
              <div className="text-sm text-blue-100">Avg Response</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Categories Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Discussion Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {SAMPLE_CATEGORIES.map((category) => (
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
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 mb-1">{category.name}</h3>
                        <p className="text-sm text-slate-600 mb-2">{category.description}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{category.postCount} discussions</span>
                          {category.lastPostAt && (
                            <span>Last post {formatDistanceToNow(category.lastPostAt)} ago</span>
                          )}
                        </div>
                      </div>
                    </div>
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
                placeholder="Search discussions..."
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

          <NewTopicDialog />
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-slate-600">
            Showing {sortedTopics.length} of {SAMPLE_TOPICS.length} discussions
          </p>
          {selectedCategory !== 'all' && (
            <p className="text-sm text-blue-600">
              Filtered by: {SAMPLE_CATEGORIES.find(c => c.id === selectedCategory)?.name}
            </p>
          )}
        </div>

        {/* Topics List */}
        {sortedTopics.length > 0 ? (
          <div className="space-y-4">
            {sortedTopics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No discussions found</h3>
            <p className="text-slate-600 mb-6">
              {searchTerm ? 'Try different search terms or browse all categories.' : 'Be the first to start a discussion in this category!'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowNewTopicDialog(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start First Discussion
              </Button>
            )}
          </div>
        )}

        {/* Community Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8"
        >
          <div className="text-center mb-6">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Community Guidelines
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Help us maintain a respectful and constructive community for everyone.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Heart className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Be Respectful</h3>
              <p className="text-sm text-slate-600">
                Treat all community members with courtesy and respect, even when you disagree.
              </p>
            </div>
            <div className="text-center">
              <FileText className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Stay On Topic</h3>
              <p className="text-sm text-slate-600">
                Keep discussions relevant to Stoneclough and local community issues.
              </p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Be Constructive</h3>
              <p className="text-sm text-slate-600">
                Focus on solutions and positive contributions to community discussions.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default ModernForum;
