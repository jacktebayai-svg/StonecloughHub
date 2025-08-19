import React, { useState, useEffect } from 'react';
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
import { Bar, Doughnut } from 'react-chartjs-2';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

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

export default function Civic() {
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
      <div className="min-h-screen bg-stoneclough-light">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-stoneclough-blue mx-auto"></div>
            <p className="mt-4 text-stoneclough-gray-blue">Loading civic analytics...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-stoneclough-light">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Data</h2>
            <p className="text-stoneclough-gray-blue mb-4">Failed to load civic dashboard data. Please try again later.</p>
            <button 
              onClick={fetchDashboardData}
              className="bg-stoneclough-blue text-white px-4 py-2 rounded hover:bg-stoneclough-blue/90"
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { overview, serviceCategories, digitalTransformation, contentQuality, recentActivity } = dashboardData;

  // Chart configurations with Stoneclough theme colors
  const serviceDistributionData = {
    labels: serviceCategories.map(cat => cat.category),
    datasets: [
      {
        label: 'Total Services',
        data: serviceCategories.map(cat => cat.count),
        backgroundColor: [
          'rgba(88, 116, 146, 0.8)', // stoneclough-blue
          'rgba(37, 73, 116, 0.8)',  // darker variation
          'rgba(150, 163, 183, 0.8)', // lighter variation
          'rgba(107, 114, 128, 0.8)', // gray variation
        ],
        borderColor: [
          'rgba(88, 116, 146, 1)',
          'rgba(37, 73, 116, 1)',
          'rgba(150, 163, 183, 1)',
          'rgba(107, 114, 128, 1)',
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
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(156, 163, 175, 0.8)'],
        borderColor: ['rgba(34, 197, 94, 1)', 'rgba(156, 163, 175, 1)'],
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
        backgroundColor: 'rgba(88, 116, 146, 0.8)',
        borderColor: 'rgba(88, 116, 146, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-stoneclough-light">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-stoneclough-blue mb-4 flex items-center justify-center gap-3">
            🏛️ Civic Intelligence Platform
          </h1>
          <p className="text-lg text-stoneclough-gray-blue max-w-3xl mx-auto">
            Real-time analysis of Bolton Council civic data • {overview.totalServices} Services • {overview.totalMeetings} Meetings • {overview.totalPages} Pages
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✅ Live Data
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-stoneclough-blue/10 text-stoneclough-blue">
              📊 Quality: {(overview.averageQuality * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 bg-gradient-to-r from-stoneclough-blue to-stoneclough-gray-blue text-white rounded-lg shadow-lg">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
              🔍 Intelligent Civic Search
            </h2>
            <p className="text-stoneclough-light/80 mb-4">
              Search across all council services, meetings, and documents with AI-powered relevance scoring
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search for services, meetings, or civic information..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-white text-gray-900 px-4 py-2 rounded-lg"
              />
              <button 
                onClick={handleSearch} 
                disabled={searchLoading}
                className="bg-white text-stoneclough-blue hover:bg-stoneclough-light px-6 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            {searchResults && (
              <div className="mt-4 bg-white rounded-lg p-4 text-gray-900">
                <h4 className="font-semibold mb-2">
                  Search Results ({searchResults.data?.totalResults || 0} found in {searchResults.data?.searchTime || 0}ms)
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.data?.services?.slice(0, 3).map((service: any, idx: number) => (
                    <div key={idx} className="p-2 bg-blue-50 rounded border-l-4 border-stoneclough-blue">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{service.name}</span>
                        <span className={`px-2 py-1 text-xs rounded ${service.online_access ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {service.online_access ? "Online" : "Offline"}
                        </span>
                      </div>
                      <p className="text-sm text-stoneclough-gray-blue truncate">{service.description}</p>
                    </div>
                  ))}
                  {searchResults.data?.meetings?.slice(0, 2).map((meeting: any, idx: number) => (
                    <div key={idx} className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{meeting.title}</span>
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">{meeting.committee}</span>
                      </div>
                      <p className="text-sm text-stoneclough-gray-blue">
                        {new Date(meeting.meeting_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-stoneclough-blue to-stoneclough-gray-blue text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stoneclough-light/80 text-sm">Total Services</p>
                <p className="text-3xl font-bold">{overview.totalServices}</p>
                <p className="text-xs text-stoneclough-light/80">{overview.onlineServices} available online</p>
              </div>
              <div className="text-3xl">🌐</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Online Services</p>
                <p className="text-3xl font-bold">{overview.onlineServices}</p>
                <p className="text-xs text-green-100">{digitalTransformation.digitalizationRate}% digitalization rate</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Council Meetings</p>
                <p className="text-3xl font-bold">{overview.totalMeetings}</p>
                <p className="text-xs text-purple-100">{recentActivity.upcomingMeetings.length} upcoming</p>
              </div>
              <div className="text-3xl">📅</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-700 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Content Quality</p>
                <p className="text-3xl font-bold">{(overview.averageQuality * 100).toFixed(0)}%</p>
                <p className="text-xs text-orange-100">Across {overview.totalPages} pages</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-stoneclough-blue/20">
            <h3 className="text-lg font-bold text-stoneclough-blue mb-4 flex items-center gap-2">
              📊 Service Categories Distribution
            </h3>
            <p className="text-stoneclough-gray-blue mb-4">Breakdown of council services by category</p>
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
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border border-stoneclough-blue/20">
            <h3 className="text-lg font-bold text-stoneclough-blue mb-4 flex items-center gap-2">
              📈 Digital Transformation Progress
            </h3>
            <p className="text-stoneclough-gray-blue mb-4">Online vs offline service availability</p>
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
              <p className="text-sm text-stoneclough-gray-blue">Services Available Online</p>
            </div>
          </div>
        </div>

        {/* Content Quality Analysis */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-stoneclough-blue/20">
          <h3 className="text-lg font-bold text-stoneclough-blue mb-4 flex items-center gap-2">
            ⚠️ Content Quality Analysis
          </h3>
          <p className="text-stoneclough-gray-blue mb-4">Quality scoring across different content categories</p>
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
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-stoneclough-blue/20">
          <h3 className="text-lg font-bold text-stoneclough-blue mb-4 flex items-center gap-2">
            💾 Data Export & Transparency
          </h3>
          <p className="text-stoneclough-gray-blue mb-4">Download civic data for analysis, reporting, or transparency initiatives</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => exportData('services')}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-stoneclough-blue/30 rounded-lg hover:bg-stoneclough-blue/5 text-stoneclough-blue"
            >
              📥 Services Data
            </button>
            <button 
              onClick={() => exportData('meetings')}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-stoneclough-blue/30 rounded-lg hover:bg-stoneclough-blue/5 text-stoneclough-blue"
            >
              📥 Meetings Data
            </button>
            <button 
              onClick={() => exportData('statistics')}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-stoneclough-blue/30 rounded-lg hover:bg-stoneclough-blue/5 text-stoneclough-blue"
            >
              📥 Statistics
            </button>
            <button 
              onClick={() => window.open('/api/civic/db/dashboard', '_blank')}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-stoneclough-blue/30 rounded-lg hover:bg-stoneclough-blue/5 text-stoneclough-blue"
            >
              🔗 API Access
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
