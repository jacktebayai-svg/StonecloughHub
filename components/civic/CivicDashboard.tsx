"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Bell,
  ChevronRight,
  MapPin,
  Pound,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { 
  SummaryStats, 
  SpendingCard, 
  PlanningCard, 
  MeetingCard, 
  ActivityFeed 
} from './DashboardWidgets';
import { Skeleton } from '@/components/ui/skeleton';

interface CivicDashboardData {
  summary: {
    totalRecords: number;
    planningApplications: number;
    councilSpending: number;
    totalSpendingAmount: number;
    councilMeetings: number;
    lastUpdated: Date;
  };
  recentPlanningApplications: any[];
  recentSpending: any[];
  upcomingMeetings: any[];
  spendingByDepartment: any[];
  dataTypes: any[];
  recentActivity: any[];
}

const CivicDashboard: React.FC = () => {
  const [data, setData] = useState<CivicDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/civic');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const dashboardData = await response.json();
      
      // Convert date strings to Date objects
      dashboardData.summary.lastUpdated = new Date(dashboardData.summary.lastUpdated);
      dashboardData.recentActivity = dashboardData.recentActivity.map((activity: any) => ({
        ...activity,
        date: new Date(activity.date),
        createdAt: new Date(activity.createdAt)
      }));
      dashboardData.recentPlanningApplications = dashboardData.recentPlanningApplications.map((app: any) => ({
        ...app,
        date: new Date(app.date)
      }));
      dashboardData.recentSpending = dashboardData.recentSpending.map((spend: any) => ({
        ...spend,
        date: new Date(spend.date)
      }));
      dashboardData.upcomingMeetings = dashboardData.upcomingMeetings.map((meeting: any) => ({
        ...meeting,
        date: new Date(meeting.date)
      }));

      setData(dashboardData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch('/api/civic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery,
          filters: { limit: 20 }
        })
      });
      
      const results = await response.json();
      console.log('Search results:', results);
      // TODO: Handle search results display
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const getMetadataValue = (metadata: any, key: string, fallback = 'Unknown') => {
    if (!metadata) return fallback;
    try {
      const meta = typeof metadata === 'object' ? metadata : JSON.parse(metadata);
      return meta[key] || fallback;
    } catch {
      return fallback;
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center space-x-4 p-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error Loading Dashboard</h3>
              <p className="text-red-700">{error}</p>
              <Button onClick={handleRefresh} className="mt-4" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Civic Transparency Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights into Bolton Council operations and public data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex items-center space-x-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search planning applications, spending, meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="sm">
                Search
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="planning_application">Planning</option>
                <option value="council_spending">Spending</option>
                <option value="council_meeting">Meetings</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <SummaryStats
        totalRecords={data.summary.totalRecords}
        planningApplications={data.summary.planningApplications}
        councilSpending={data.summary.councilSpending}
        totalSpendingAmount={data.summary.totalSpendingAmount}
        councilMeetings={data.summary.councilMeetings}
        lastUpdated={data.summary.lastUpdated}
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Planning Applications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Recent Planning Applications
                </CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentPlanningApplications.slice(0, 3).map((app) => (
                    <PlanningCard
                      key={app.id}
                      title={app.title}
                      reference={getMetadataValue(app.metadata, 'reference', app.title)}
                      location={app.location || 'Location not specified'}
                      date={app.date}
                      description={app.description}
                      applicant={getMetadataValue(app.metadata, 'applicant')}
                      onClick={() => console.log('View planning application:', app.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Spending */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Pound className="h-5 w-5 mr-2 text-red-600" />
                  Recent Council Spending
                </CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentSpending.slice(0, 3).map((spend) => (
                    <SpendingCard
                      key={spend.id}
                      title={spend.title}
                      amount={spend.amount || 0}
                      department={getMetadataValue(spend.metadata, 'department', 'General')}
                      date={spend.date}
                      description={spend.description}
                      supplier={getMetadataValue(spend.metadata, 'supplier')}
                      onClick={() => console.log('View spending record:', spend.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Meetings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Council Meetings
                </CardTitle>
                <Button variant="ghost" size="sm">
                  View Calendar
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.upcomingMeetings.slice(0, 3).map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      title={meeting.title}
                      committee={getMetadataValue(meeting.metadata, 'committee', 'General')}
                      date={meeting.date}
                      description={meeting.description}
                      onClick={() => console.log('View meeting:', meeting.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <ActivityFeed activities={data.recentActivity.slice(0, 8)} />
          </div>
        </TabsContent>

        <TabsContent value="planning">
          <PlanningSection data={data.recentPlanningApplications} />
        </TabsContent>

        <TabsContent value="spending">
          <SpendingSection data={data.recentSpending} spendingByDepartment={data.spendingByDepartment} />
        </TabsContent>

        <TabsContent value="meetings">
          <MeetingsSection data={data.upcomingMeetings} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsSection dataTypes={data.dataTypes} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="container mx-auto p-6 space-y-6">
    <Skeleton className="h-20 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  </div>
);

const PlanningSection: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Planning Applications</h2>
      <div className="flex items-center space-x-2">
        <Badge variant="outline">
          {data.length} applications
        </Badge>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          Planning Portal
        </Button>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((app) => (
        <PlanningCard
          key={app.id}
          title={app.title}
          reference={app.metadata?.reference || app.title}
          location={app.location || 'Location not specified'}
          date={new Date(app.date)}
          description={app.description}
          applicant={app.metadata?.applicant}
          onClick={() => console.log('View planning application:', app.id)}
        />
      ))}
    </div>
  </div>
);

const SpendingSection: React.FC<{ data: any[]; spendingByDepartment: any[] }> = ({ 
  data, 
  spendingByDepartment 
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Council Spending</h2>
      <div className="flex items-center space-x-2">
        <Badge variant="outline">
          £{data.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()} total
        </Badge>
        <Button variant="outline" size="sm">
          <TrendingUp className="h-4 w-4 mr-2" />
          Analytics
        </Button>
      </div>
    </div>
    
    {/* Spending by Department */}
    <Card>
      <CardHeader>
        <CardTitle>Spending by Department</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {spendingByDepartment.map((dept, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{dept.department}</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{dept.count} transactions</Badge>
                <span className="font-bold text-lg">£{Number(dept.total).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Recent Spending Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((spend) => (
        <SpendingCard
          key={spend.id}
          title={spend.title}
          amount={spend.amount || 0}
          department={spend.metadata?.department || 'General'}
          date={new Date(spend.date)}
          description={spend.description}
          supplier={spend.metadata?.supplier}
          onClick={() => console.log('View spending record:', spend.id)}
        />
      ))}
    </div>
  </div>
);

const MeetingsSection: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Council Meetings</h2>
      <div className="flex items-center space-x-2">
        <Badge variant="outline">
          {data.length} meetings
        </Badge>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Full Calendar
        </Button>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          title={meeting.title}
          committee={meeting.metadata?.committee || 'General'}
          date={new Date(meeting.date)}
          description={meeting.description}
          onClick={() => console.log('View meeting:', meeting.id)}
        />
      ))}
    </div>
  </div>
);

const AnalyticsSection: React.FC<{ dataTypes: any[] }> = ({ dataTypes }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Data Analytics</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dataTypes.map((type, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="capitalize">
                  {type.type.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(Number(type.count) / dataTypes[0].count) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">
                    {Number(type.count).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default CivicDashboard;
