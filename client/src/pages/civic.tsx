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
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Search,
  Download,
  Activity,
  Clock,
  MapPin,
  DollarSign,
  Eye,
  ChevronRight,
  Zap,
  Star,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AdvancedSearch from "@/components/civic/advanced-search";

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
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="relative mx-auto mb-6"
            >
              <div className="w-16 h-16 border-4 border-gradient-to-r from-blue-600 to-purple-600 rounded-full">
                <div className="w-full h-full border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <Zap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-600 font-medium"
            >
              Loading civic intelligence...
            </motion.p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-slate-500 mt-2"
            >
              Analyzing Bolton Council data
            </motion.p>
          </motion.div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-16 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl"></div>
          <div className="relative z-10 text-center py-16 px-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-2xl"
            >
              <Building2 className="h-10 w-10 text-white" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6"
            >
              Civic Intelligence
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-slate-600 max-w-4xl mx-auto mb-8 leading-relaxed"
            >
              Empowering Stoneclough residents with real-time civic data, transparent governance, and community engagement tools
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 px-4 py-2 text-sm font-medium">
                <Activity className="h-4 w-4 mr-2" />
                Live Data Feed
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 px-4 py-2 text-sm font-medium">
                <FileText className="h-4 w-4 mr-2" />
                {overview.totalServices} Services
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 px-4 py-2 text-sm font-medium">
                <Calendar className="h-4 w-4 mr-2" />
                {overview.totalMeetings} Meetings
              </Badge>
              <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 px-4 py-2 text-sm font-medium">
                <Star className="h-4 w-4 mr-2" />
                {(overview.averageQuality * 100).toFixed(0)}% Quality
              </Badge>
            </motion.div>
          </div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        </motion.section>

        {/* Intelligent Search Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Intelligent Civic Search
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    AI-powered search across {overview.totalServices} services, {overview.totalMeetings} meetings, and {overview.totalPages} documents
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search for services, meetings, planning applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-12 pr-4 py-3 text-base border-2 border-slate-200 focus:border-blue-400 rounded-xl"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={searchLoading}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 rounded-xl shadow-lg"
                >
                  {searchLoading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Activity className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <>Search <ChevronRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
                <Button 
                  onClick={() => setShowAdvancedSearch(true)}
                  variant="outline"
                  size="lg"
                  className="border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 px-6 rounded-xl"
                >
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Advanced
                </Button>
              </div>
              
              {searchResults && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6"
                >
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Search Results ({searchResults.data?.totalResults || 0} found in {searchResults.data?.searchTime || 0}ms)
                    </h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {searchResults.data?.services?.slice(0, 3).map((service: any, idx: number) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-800">{service.name}</span>
                            <Badge className={service.online_access ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}>
                              {service.online_access ? "Online" : "In-Person"}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">{service.description}</p>
                        </motion.div>
                      ))}
                      {searchResults.data?.meetings?.slice(0, 2).map((meeting: any, idx: number) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (idx + 3) * 0.1 }}
                          className="bg-white rounded-lg p-4 border-l-4 border-emerald-500 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-800">{meeting.title}</span>
                            <Badge className="bg-purple-100 text-purple-800">{meeting.committee}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(meeting.meeting_date).toLocaleDateString()}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* Key Metrics */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Total Services',
                value: overview.totalServices,
                subtitle: `${overview.onlineServices} available online`,
                icon: FileText,
                gradient: 'from-blue-600 to-blue-700',
                delay: 0
              },
              {
                title: 'Online Services',
                value: overview.onlineServices,
                subtitle: `${digitalTransformation.digitalizationRate}% digitalization rate`,
                icon: Activity,
                gradient: 'from-emerald-600 to-emerald-700',
                delay: 0.1
              },
              {
                title: 'Council Meetings',
                value: overview.totalMeetings,
                subtitle: `${recentActivity.upcomingMeetings.length} upcoming`,
                icon: Calendar,
                gradient: 'from-purple-600 to-purple-700',
                delay: 0.2
              },
              {
                title: 'Content Quality',
                value: `${(overview.averageQuality * 100).toFixed(0)}%`,
                subtitle: `Across ${overview.totalPages} pages`,
                icon: Star,
                gradient: 'from-orange-600 to-orange-700',
                delay: 0.3
              }
            ].map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1 + metric.delay, type: "spring", stiffness: 200 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group"
                >
                  <Card className={`bg-gradient-to-br ${metric.gradient} text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                          className="text-white/60"
                        >
                          <TrendingUp className="h-5 w-5" />
                        </motion.div>
                      </div>
                      <div>
                        <p className="text-white/80 text-sm font-medium mb-1">{metric.title}</p>
                        <motion.p 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.2 + metric.delay, type: "spring", stiffness: 300 }}
                          className="text-3xl font-bold mb-2"
                        >
                          {metric.value}
                        </motion.p>
                        <p className="text-white/70 text-xs">{metric.subtitle}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Charts Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.6 }}
              whileHover={{ y: -5 }}
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 hover:shadow-3xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent">
                        Service Categories
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Distribution across departments
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.8 }}
                  >
                    <Bar data={serviceDistributionData} options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(30, 41, 59, 0.9)',
                          titleColor: 'white',
                          bodyColor: 'white',
                          borderColor: 'rgba(99, 102, 241, 0.3)',
                          borderWidth: 1,
                          callbacks: {
                            afterLabel: (context) => {
                              const categoryData = serviceCategories[context.dataIndex];
                              return `Online: ${categoryData.onlineCount}/${categoryData.count}`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: { 
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                          },
                          ticks: {
                            color: 'rgba(100, 116, 139, 0.8)'
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          },
                          ticks: {
                            color: 'rgba(100, 116, 139, 0.8)'
                          }
                        }
                      }
                    }} />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.7 }}
              whileHover={{ y: -5 }}
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-emerald-50/30 to-blue-50/30 hover:shadow-3xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-lg">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl bg-gradient-to-r from-emerald-900 to-blue-900 bg-clip-text text-transparent">
                        Digital Transformation
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Online vs offline services
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.9 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-64 h-64 mb-4">
                      <Doughnut data={digitalTransformationData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { 
                            position: 'bottom',
                            labels: {
                              padding: 20,
                              usePointStyle: true,
                              font: {
                                size: 12,
                                weight: '500'
                              }
                            }
                          },
                          tooltip: {
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: 'rgba(99, 102, 241, 0.3)',
                            borderWidth: 1
                          }
                        }
                      }} />
                    </div>
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 2.1, type: "spring", stiffness: 200 }}
                      className="text-center bg-gradient-to-r from-emerald-100 to-blue-100 rounded-xl p-4 w-full"
                    >
                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-1">
                        {digitalTransformation.digitalizationRate}%
                      </div>
                      <p className="text-sm text-slate-600 font-medium">Services Available Online</p>
                    </motion.div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>

        {/* Content Quality Analysis */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2 }}
          className="mb-16"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-orange-50/30 to-red-50/30 hover:shadow-3xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-orange-900 to-red-900 bg-clip-text text-transparent">
                    Content Quality Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Quality scoring across different content categories
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.4 }}
              >
                <Bar data={qualityData} options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      titleColor: 'white',
                      bodyColor: 'white',
                      borderColor: 'rgba(99, 102, 241, 0.3)',
                      borderWidth: 1
                    }
                  },
                  scales: {
                    y: { 
                      beginAtZero: true,
                      max: 1,
                      grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(100, 116, 139, 0.8)',
                        callback: (value) => `${(Number(value) * 100).toFixed(0)}%`
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        color: 'rgba(100, 116, 139, 0.8)'
                      }
                    }
                  }
                }} />
              </motion.div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Data Export & Transparency */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          className="mb-16"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-slate-50/50 to-blue-50/50 hover:shadow-3xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-slate-600 to-blue-600 rounded-xl">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                    Data Export & Transparency
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Download civic data for analysis, reporting, or transparency initiatives
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Services Data', action: () => exportData('services'), icon: FileText, color: 'blue' },
                  { label: 'Meetings Data', action: () => exportData('meetings'), icon: Calendar, color: 'purple' },
                  { label: 'Statistics', action: () => exportData('statistics'), icon: TrendingUp, color: 'emerald' },
                  { label: 'API Access', action: () => window.open('/api/civic/db/dashboard', '_blank'), icon: Activity, color: 'orange' }
                ].map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2.6 + index * 0.1 }}
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        onClick={item.action}
                        variant="outline"
                        className={`w-full h-auto p-4 border-2 border-${item.color}-200 hover:border-${item.color}-400 hover:bg-${item.color}-50 text-${item.color}-700 rounded-xl group transition-all duration-300`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`p-2 bg-${item.color}-100 rounded-lg group-hover:bg-${item.color}-200 transition-colors`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      <Footer />
      
      {/* Advanced Search Modal */}
      <AdvancedSearch 
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        initialQuery={searchQuery}
      />
    </div>
  );
};
