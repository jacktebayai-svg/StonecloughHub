import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Heart, 
  AlertTriangle, 
  TrendingUp, 
  Eye,
  Bell,
  PlusCircle,
  Send,
  ThumbsUp,
  ThumbsDown,
  Share2,
  BookmarkPlus,
  Flag,
  Users,
  Clock,
  MapPin,
  DollarSign,
  FileText,
  Calendar,
  CheckCircle,
  Star,
  Zap,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

interface CivicIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'acknowledged' | 'investigating' | 'resolved';
  location?: string;
  reportedBy: string;
  reportedAt: string;
  supporters: number;
  councilResponse?: string;
  updates: Array<{
    date: string;
    message: string;
    author: string;
  }>;
}

interface Feedback {
  id: string;
  subject: string;
  message: string;
  category: string;
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'responded';
  councilResponse?: string;
}

export default function CivicEngagementTools() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'issues' | 'feedback' | 'watchlist' | 'reports'>('issues');
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [watchedItems, setWatchedItems] = useState<string[]>([]);
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  
  // Form states
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as const,
    location: ''
  });
  
  const [newFeedback, setNewFeedback] = useState({
    subject: '',
    message: '',
    category: ''
  });

  // Mock data - in real app would come from API
  const mockIssues: CivicIssue[] = [
    {
      id: '1',
      title: 'Pothole on Manchester Road',
      description: 'Large pothole causing damage to vehicles near the junction with Church Lane',
      category: 'Infrastructure',
      priority: 'high',
      status: 'acknowledged',
      location: 'Manchester Road, Stoneclough',
      reportedBy: 'Sarah Johnson',
      reportedAt: '2025-01-18',
      supporters: 23,
      councilResponse: 'We have scheduled an inspection for next week and will prioritize repairs based on safety assessment.',
      updates: [
        {
          date: '2025-01-19',
          message: 'Issue acknowledged by Highway Maintenance team',
          author: 'Bolton Council'
        }
      ]
    },
    {
      id: '2',
      title: 'Broken Street Light',
      description: 'Street light has been out for 2 weeks creating safety concerns for pedestrians',
      category: 'Safety',
      priority: 'medium',
      status: 'investigating',
      location: 'High Street, Stoneclough',
      reportedBy: 'Michael Chen',
      reportedAt: '2025-01-15',
      supporters: 8,
      updates: [
        {
          date: '2025-01-16',
          message: 'Electrical contractor has been notified',
          author: 'Bolton Council'
        }
      ]
    },
    {
      id: '3',
      title: 'Dog Waste Bins Needed',
      description: 'Request for additional dog waste bins in the park area',
      category: 'Environment',
      priority: 'low',
      status: 'reported',
      location: 'Stoneclough Park',
      reportedBy: 'Emma Williams',
      reportedAt: '2025-01-20',
      supporters: 15,
      updates: []
    }
  ];

  useEffect(() => {
    setIssues(mockIssues);
  }, []);

  const categories = [
    'Infrastructure',
    'Safety', 
    'Environment',
    'Transport',
    'Housing',
    'Finance',
    'Planning',
    'Community Services'
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-100 text-emerald-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'acknowledged': return 'bg-purple-100 text-purple-800';
      case 'reported': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const handleSupportIssue = (issueId: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, supporters: issue.supporters + 1 }
        : issue
    ));
  };

  const handleSubmitIssue = () => {
    if (!newIssue.title || !newIssue.description) return;

    const issue: CivicIssue = {
      id: Date.now().toString(),
      title: newIssue.title,
      description: newIssue.description,
      category: newIssue.category || 'General',
      priority: newIssue.priority,
      status: 'reported',
      location: newIssue.location,
      reportedBy: user?.user_metadata?.full_name || user?.email || 'Anonymous',
      reportedAt: new Date().toISOString().split('T')[0],
      supporters: 1,
      updates: []
    };

    setIssues(prev => [issue, ...prev]);
    setNewIssue({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      location: ''
    });
    setShowNewIssueForm(false);
  };

  const handleSubmitFeedback = () => {
    if (!newFeedback.subject || !newFeedback.message) return;

    const feedbackItem: Feedback = {
      id: Date.now().toString(),
      subject: newFeedback.subject,
      message: newFeedback.message,
      category: newFeedback.category || 'General',
      submittedAt: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    setFeedback(prev => [feedbackItem, ...prev]);
    setNewFeedback({
      subject: '',
      message: '',
      category: ''
    });
    setShowFeedbackForm(false);
  };

  const tabs = [
    { id: 'issues', label: 'Community Issues', icon: AlertTriangle, count: issues.length },
    { id: 'feedback', label: 'Submit Feedback', icon: MessageSquare, count: 0 },
    { id: 'watchlist', label: 'My Watchlist', icon: Eye, count: watchedItems.length },
    { id: 'reports', label: 'Spending Reports', icon: DollarSign, count: 0 }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl mb-6">
          <Users className="h-6 w-6" />
          <span className="text-lg font-semibold">Civic Engagement Hub</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-4">
          Your Voice in Local Government
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Report issues, submit feedback, track council decisions, and participate in shaping your community
        </p>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex flex-wrap gap-2 bg-slate-100 p-2 rounded-2xl">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-lg scale-105'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white/50'
                }`}
              >
                <IconComponent className="h-5 w-5" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <Badge className="bg-blue-100 text-blue-800 ml-1">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Community Issues Tab */}
        {activeTab === 'issues' && (
          <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Community Issues</h2>
              <Button
                onClick={() => setShowNewIssueForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Report Issue
              </Button>
            </div>

            {/* New Issue Form Modal */}
            {showNewIssueForm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <Card className="w-full max-w-2xl">
                  <CardHeader>
                    <CardTitle>Report a Community Issue</CardTitle>
                    <CardDescription>
                      Help improve Stoneclough by reporting issues that need attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Issue title"
                      value={newIssue.title}
                      onChange={(e) => setNewIssue(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Describe the issue in detail"
                      value={newIssue.description}
                      onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                        value={newIssue.category}
                        onChange={(e) => setNewIssue(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <select
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                        value={newIssue.priority}
                        onChange={(e) => setNewIssue(prev => ({ ...prev, priority: e.target.value as any }))}
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <Input
                      placeholder="Location (optional)"
                      value={newIssue.location}
                      onChange={(e) => setNewIssue(prev => ({ ...prev, location: e.target.value }))}
                    />
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowNewIssueForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitIssue}
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Issue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Issues List */}
            <div className="space-y-4">
              {issues.map((issue, index) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            {issue.title}
                          </h3>
                          <p className="text-slate-600 mb-4">{issue.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge className="bg-slate-100 text-slate-700">
                              {issue.category}
                            </Badge>
                            <Badge className={getPriorityColor(issue.priority)}>
                              {issue.priority.toUpperCase()}
                            </Badge>
                            <Badge className={getStatusColor(issue.status)}>
                              {issue.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {issue.location && (
                              <Badge className="bg-purple-100 text-purple-800">
                                <MapPin className="h-3 w-3 mr-1" />
                                {issue.location}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                            <span>Reported by {issue.reportedBy}</span>
                            <span>•</span>
                            <span>{new Date(issue.reportedAt).toLocaleDateString()}</span>
                          </div>

                          {issue.councilResponse && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                              <h4 className="font-semibold text-blue-900 mb-2">Council Response:</h4>
                              <p className="text-blue-800">{issue.councilResponse}</p>
                            </div>
                          )}

                          {issue.updates.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-slate-900">Updates:</h4>
                              {issue.updates.map((update, idx) => (
                                <div key={idx} className="bg-slate-50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{new Date(update.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{update.author}</span>
                                  </div>
                                  <p className="text-slate-700">{update.message}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSupportIssue(issue.id)}
                            className="flex items-center gap-2"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Support ({issue.supporters})
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                          <Button variant="ghost" size="sm">
                            <BookmarkPlus className="h-4 w-4 mr-2" />
                            Watch
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="max-w-3xl mx-auto">
            <Card className="border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">Submit Feedback to Council</CardTitle>
                <CardDescription>
                  Share your thoughts, suggestions, or concerns directly with Bolton Council
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Input
                  placeholder="Feedback subject"
                  value={newFeedback.subject}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, subject: e.target.value }))}
                />
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={newFeedback.category}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Textarea
                  placeholder="Your detailed feedback or suggestion"
                  value={newFeedback.message}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, message: e.target.value }))}
                  rows={6}
                />
                <Button
                  onClick={handleSubmitFeedback}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3"
                  size="lg"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Submit Feedback
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other tabs content would go here */}
        {activeTab === 'watchlist' && (
          <div className="text-center py-12">
            <Eye className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Your Watchlist</h3>
            <p className="text-slate-600">
              Track council meetings, planning applications, and issues you're interested in
            </p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Spending Reports</h3>
            <p className="text-slate-600">
              Monitor council spending and budget allocation across different departments
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
