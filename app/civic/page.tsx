'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Building2, 
  Calendar, 
  Globe, 
  TrendingUp, 
  Search,
  Download,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Filter
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface DashboardData {
  overview: {
    totalServices: number;
    onlineServices: number;
    totalMeetings: number;
    totalPages: number;
    averageQuality: number;
  };
  serviceCategories: Array<{ category: string; count: number; onlineCount: number }>;
  meetingCommittees: Array<{ committee: string; count: number; publicCount: number }>;
  digitalTransformation: {
    onlineServices: number;
    offlineServices: number;
    digitalizationRate: number;
  };
  contentQuality: Array<{ category: string; averageQuality: number; pageCount: number }>;
  recentActivity: {
    recentServices: any[];
    upcomingMeetings: any[];
    highQualityPages: any[];
  };
}

export default function CivicDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/civic/db/dashboard');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/civic/db/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const exportData = async (type: string) => {
    try {
      const response = await fetch(`/api/civic/db/${type}?limit=1000`);
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bolton_${type}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading civic analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load civic dashboard data. Please try again later.</p>
            <Button onClick={fetchDashboardData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, serviceCategories, digitalTransformation, contentQuality, recentActivity } = dashboardData;

  // Chart configurations
  const serviceDistributionData = {
    labels: serviceCategories.map(cat => cat.category),
    datasets: [
      {
        label: 'Total Services',
        data: serviceCategories.map(cat => cat.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const digitalTransformationData = {
    labels: ['Online Services', 'Offline Services'],
    datasets: [
      {
        data: [digitalTransformation.onlineServices, digitalTransformation.offlineServices],
        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(156, 163, 175, 0.8)'],
        borderColor: ['rgba(16, 185, 129, 1)', 'rgba(156, 163, 175, 1)'],
        borderWidth: 2,
      },
    ],
  };

  const qualityData = {
    labels: contentQuality.map(q => q.category),
    datasets: [
      {
        label: 'Content Quality Score',
        data: contentQuality.map(q => q.averageQuality),
        backgroundColor: 'rgba(147, 51, 234, 0.8)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                Stoneclough Civic Intelligence Platform
              </h1>
              <p className="mt-2 text-gray-600">
                Real-time analysis of Bolton Council civic data • {overview.totalServices} Services • {overview.totalMeetings} Meetings • {overview.totalPages} Pages
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2">
              <Badge variant="outline" className="text-green-700 border-green-300">
                Live Data
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                Quality: {(overview.averageQuality * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="h-5 w-5" />
              Intelligent Civic Search
            </CardTitle>
            <CardDescription className="text-blue-100">
              Search across all council services, meetings, and documents with AI-powered relevance scoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search for services, meetings, or civic information..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-white text-gray-900"
              />
              <Button 
                onClick={handleSearch} 
                disabled={searchLoading}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {searchResults && (
              <div className="mt-4 bg-white rounded-lg p-4 text-gray-900">
                <h4 className="font-semibold mb-2">
                  Search Results ({searchResults.data.totalResults} found in {searchResults.data.searchTime}ms)
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.data.services?.slice(0, 3).map((service: any, idx: number) => (
                    <div key={idx} className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{service.name}</span>
                        <Badge variant={service.online_access ? "default" : "secondary"}>
                          {service.online_access ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{service.description}</p>
                    </div>
                  ))}
                  {searchResults.data.meetings?.slice(0, 2).map((meeting: any, idx: number) => (
                    <div key={idx} className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{meeting.title}</span>
                        <Badge variant="outline">{meeting.committee}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(meeting.meeting_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <Globe className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalServices}</div>
              <p className="text-xs text-blue-100">
                {overview.onlineServices} available online
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Services</CardTitle>
              <CheckCircle className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.onlineServices}</div>
              <p className="text-xs text-green-100">
                {digitalTransformation.digitalizationRate}% digitalization rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Council Meetings</CardTitle>
              <Calendar className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalMeetings}</div>
              <p className="text-xs text-purple-100">
                {recentActivity.upcomingMeetings.length} upcoming
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Quality</CardTitle>
              <BarChart3 className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(overview.averageQuality * 100).toFixed(0)}%</div>
              <p className="text-xs text-orange-100">
                Across {overview.totalPages} pages
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Service Categories Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of council services by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Bar data={serviceDistributionData} options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      afterLabel: (context) => {
                        const categoryData = serviceCategories[context.dataIndex];
                        return `Online: ${categoryData.onlineCount}/${categoryData.count}`;
                      }
                    }
                  }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Digital Transformation Progress
              </CardTitle>
              <CardDescription>
                Online vs offline service availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <Doughnut data={digitalTransformationData} options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }} />
              </div>
              <div className="mt-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {digitalTransformation.digitalizationRate}%
                </div>
                <p className="text-sm text-gray-600">Services Available Online</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Quality Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              Content Quality Analysis
            </CardTitle>
            <CardDescription>
              Quality scoring across different content categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Bar data={qualityData} options={{
              responsive: true,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { 
                  beginAtZero: true,
                  max: 1,
                  ticks: {
                    callback: (value) => `${(Number(value) * 100).toFixed(0)}%`
                  }
                }
              }
            }} />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Recent Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.recentServices.slice(0, 5).map((service: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm truncate">{service.name}</p>
                      <p className="text-xs text-gray-500">{service.category}</p>
                    </div>
                    <Badge variant={service.online_access ? "default" : "secondary"} className="ml-2">
                      {service.online_access ? "Online" : "Offline"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Upcoming Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.upcomingMeetings.length > 0 ? (
                  recentActivity.upcomingMeetings.slice(0, 5).map((meeting: any, idx: number) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded">
                      <p className="font-medium text-sm">{meeting.title}</p>
                      <p className="text-xs text-gray-500">{meeting.committee}</p>
                      <p className="text-xs text-green-600">
                        {new Date(meeting.meeting_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No upcoming meetings scheduled</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-purple-600" />
                High Quality Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.highQualityPages.slice(0, 5).map((page: any, idx: number) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded">
                    <p className="font-medium text-sm truncate">{page.title}</p>
                    <p className="text-xs text-gray-500">{page.category}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Progress 
                        value={page.quality_score * 100} 
                        className="flex-1 mr-2" 
                      />
                      <span className="text-xs text-purple-600 font-medium">
                        {(page.quality_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-indigo-600" />
              Data Export & Transparency
            </CardTitle>
            <CardDescription>
              Download civic data for analysis, reporting, or transparency initiatives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                onClick={() => exportData('services')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Services Data
              </Button>
              <Button 
                variant="outline" 
                onClick={() => exportData('meetings')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Meetings Data
              </Button>
              <Button 
                variant="outline" 
                onClick={() => exportData('statistics')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Statistics
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('/api/civic/db/dashboard', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                API Access
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
