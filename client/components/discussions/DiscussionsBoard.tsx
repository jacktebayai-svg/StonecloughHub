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
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { DiscussionCategory, DiscussionTopic, DiscussionReply } from '@/shared/business-discussions-schema';
import { format, formatDistanceToNow } from 'date-fns';

interface DiscussionsBoardProps {
  categories?: DiscussionCategory[];
  topics?: DiscussionTopic[];
  onCreateTopic?: (topic: Partial<DiscussionTopic>) => void;
  onCreateReply?: (reply: Partial<DiscussionReply>) => void;
  onVote?: (itemId: string, itemType: 'topic' | 'reply', voteType: 'up' | 'down') => void;
}

interface TopicFormData {
  title: string;
  content: string;
  categoryId: string;
  tags: string[];
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
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
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
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
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
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
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
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
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
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
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
    content: 'The council has proposed a new cycle lane on High Street. This could improve cycling safety but might impact parking. I\'d love to hear everyone\'s thoughts on this important infrastructure change.',
    tags: ['cycling', 'transport', 'safety', 'parking'],
    pinned: true,
    viewCount: 234,
    replyCount: 15,
    upvotes: 23,
    downvotes: 4,
    lastReplyAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
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
    content: 'We\'re starting a community garden project at the old park space. Looking for volunteers to help with planning, planting, and maintenance. Great way to bring the community together!',
    tags: ['community', 'gardening', 'volunteers', 'environment'],
    viewCount: 156,
    replyCount: 8,
    upvotes: 31,
    downvotes: 1,
    lastReplyAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
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
    content: 'The 2024 budget transparency report is now available for public review. This includes detailed breakdowns of spending, upcoming projects, and how your council tax is being used.',
    tags: ['budget', 'transparency', 'council-tax', '2024'],
    viewCount: 342,
    replyCount: 22,
    upvotes: 18,
    downvotes: 3,
    lastReplyAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    status: 'published',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  }
];

export const DiscussionsBoard: React.FC<DiscussionsBoardProps> = ({
  categories = SAMPLE_CATEGORIES,
  topics = SAMPLE_TOPICS,
  onCreateTopic,
  onCreateReply,
  onVote
}) => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'categories' | 'topics' | 'topic-detail' | 'create-topic'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<DiscussionTopic | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form state for creating topics
  const [topicForm, setTopicForm] = useState<TopicFormData>({
    title: '',
    content: '',
    categoryId: '',
    tags: []
  });

  const [replyContent, setReplyContent] = useState('');

  const resetTopicForm = () => {
    setTopicForm({
      title: '',
      content: '',
      categoryId: '',
      tags: []
    });
  };

  const handleCreateTopic = () => {
    if (!user) return;

    const newTopic: Partial<DiscussionTopic> = {
      ...topicForm,
      userId: user.id,
      slug: topicForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'published'
    };

    onCreateTopic?.(newTopic);
    resetTopicForm();
    setActiveView('topics');
  };

  const handleCreateReply = () => {
    if (!user || !selectedTopic) return;

    const newReply: Partial<DiscussionReply> = {
      topicId: selectedTopic.id!,
      userId: user.id,
      content: replyContent,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'published'
    };

    onCreateReply?.(newReply);
    setReplyContent('');
  };

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || topic.categoryId === filterCategory;
    const matchesSelectedCategory = !selectedCategory || topic.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && matchesSelectedCategory;
  });

  const sortedTopics = [...filteredTopics].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.upvotes + b.replyCount) - (a.upvotes + a.replyCount);
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'latest':
      default:
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    }
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Community Discussions</h1>
          <p className="text-slate-600 mt-2">Engage with your community on civic matters and local issues</p>
        </div>
        {user && activeView !== 'create-topic' && (
          <Button 
            onClick={() => {
              resetTopicForm();
              setActiveView('create-topic');
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Start Discussion
          </Button>
        )}
      </div>

      {/* Navigation Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <button 
          onClick={() => setActiveView('categories')}
          className={`hover:text-slate-900 ${activeView === 'categories' ? 'text-blue-600 font-medium' : ''}`}
        >
          Categories
        </button>
        {(activeView === 'topics' || activeView === 'topic-detail') && selectedCategory && (
          <>
            <span>/</span>
            <button 
              onClick={() => setActiveView('topics')}
              className={`hover:text-slate-900 ${activeView === 'topics' ? 'text-blue-600 font-medium' : ''}`}
            >
              {categories.find(c => c.id === selectedCategory)?.name}
            </button>
          </>
        )}
        {activeView === 'topic-detail' && selectedTopic && (
          <>
            <span>/</span>
            <span className="text-blue-600 font-medium truncate max-w-xs">
              {selectedTopic.title}
            </span>
          </>
        )}
        {activeView === 'create-topic' && (
          <>
            <span>/</span>
            <span className="text-blue-600 font-medium">Create Topic</span>
          </>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Categories Overview */}
        {activeView === 'categories' && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(category.id!);
                    setActiveView('topics');
                  }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4" 
                        style={{ borderLeftColor: category.color }}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
                          <MessageSquare className="h-6 w-6" style={{ color: category.color }} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                            <span>{category.postCount} posts</span>
                            {category.lastPostAt && (
                              <span>Last: {formatDistanceToNow(category.lastPostAt)} ago</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 text-sm leading-relaxed">{category.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Topics List */}
        {activeView === 'topics' && (
          <motion.div
            key="topics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters and Search */}
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest Activity</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id!}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-4">
              {sortedTopics.map((topic, index) => {
                const category = categories.find(c => c.id === topic.categoryId);
                return (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
                      topic.pinned ? 'border-yellow-200 bg-yellow-50/30' : ''
                    }`}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setActiveView('topic-detail');
                    }}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {topic.userId.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                {topic.pinned && (
                                  <Pin className="h-4 w-4 text-yellow-600" />
                                )}
                                {topic.locked && (
                                  <Lock className="h-4 w-4 text-red-600" />
                                )}
                                <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600">
                                  {topic.title}
                                </h3>
                              </div>
                              {category && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs"
                                  style={{ backgroundColor: `${category.color}20`, color: category.color }}
                                >
                                  {category.name}
                                </Badge>
                              )}
                            </div>

                            <p className="text-slate-600 line-clamp-2">{topic.content}</p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1">
                              {topic.tags?.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-between text-sm text-slate-500">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{topic.viewCount}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{topic.replyCount}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ArrowUp className="h-4 w-4" />
                                  <span>{topic.upvotes}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div>By {topic.userId}</div>
                                {topic.lastReplyAt ? (
                                  <div>Last reply: {formatDistanceToNow(topic.lastReplyAt)} ago</div>
                                ) : (
                                  <div>Created: {formatDistanceToNow(topic.createdAt)} ago</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {sortedTopics.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No discussions found</h3>
                <p className="text-slate-600 mb-4">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Be the first to start a discussion!'}
                </p>
                {user && (
                  <Button onClick={() => setActiveView('create-topic')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start Discussion
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Create Topic Form */}
        {activeView === 'create-topic' && (
          <motion.div
            key="create-topic"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Start New Discussion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Discussion Title *
                    </label>
                    <Input
                      value={topicForm.title}
                      onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                      placeholder="What would you like to discuss?"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Category *
                    </label>
                    <Select value={topicForm.categoryId} onValueChange={(value) => setTopicForm({ ...topicForm, categoryId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id!}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Content *
                  </label>
                  <Textarea
                    value={topicForm.content}
                    onChange={(e) => setTopicForm({ ...topicForm, content: e.target.value })}
                    placeholder="Share your thoughts, questions, or information..."
                    rows={8}
                  />
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={handleCreateTopic}
                    disabled={!topicForm.title || !topicForm.content || !topicForm.categoryId}
                  >
                    Create Discussion
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setActiveView(selectedCategory ? 'topics' : 'categories');
                      resetTopicForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiscussionsBoard;
