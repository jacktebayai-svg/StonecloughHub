import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Building2, 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar, 
  PoundSterling,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Activity,
  Clock,
  MapPin,
  Zap,
  Star,
  Eye,
  Search,
  AlertTriangle,
  CheckCircle,
  Globe,
  Heart,
  Sparkles
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import React, { useState, useEffect } from 'react';

export default function Home() {
  const { user } = useAuth();
  const [civicData, setCivicData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real civic data
  useEffect(() => {
    const fetchCivicData = async () => {
      try {
        const response = await fetch('/api/civic/db/dashboard');
        const data = await response.json();
        setCivicData(data);
      } catch (error) {
        console.error('Failed to fetch civic data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCivicData();
  }, []);

  // Dynamic community statistics based on real data
  const civicStats = civicData ? [
    { 
      label: 'Civic Services', 
      value: civicData.overview?.totalServices?.toString() || '0', 
      icon: Globe, 
      color: 'text-accent', 
      bgColor: 'bg-accent/10',
      gradient: 'from-stoneclough-blue-600 to-stoneclough-blue-800',
      description: `${civicData.overview?.onlineServices || 0} available online`
    },
    { 
      label: 'Council Meetings', 
      value: civicData.overview?.totalMeetings?.toString() || '0', 
      icon: Calendar, 
      color: 'text-secondary', 
      bgColor: 'bg-secondary/10',
      gradient: 'from-stoneclough-gray-600 to-stoneclough-gray-800',
      description: 'Tracked and monitored'
    },
    { 
      label: 'Data Quality', 
      value: civicData.overview?.averageQuality ? `${(civicData.overview.averageQuality * 100).toFixed(0)}%` : '0%', 
      icon: Star, 
      color: 'text-community-warning', 
      bgColor: 'bg-community-warning/10',
      gradient: 'from-community-warning to-stoneclough-accent-orange',
      description: `Across ${civicData.overview?.totalPages || 0} pages`
    },
    { 
      label: 'Active Monitoring', 
      value: 'LIVE', 
      icon: Activity, 
      color: 'text-community-success', 
      bgColor: 'bg-community-success/10',
      gradient: 'from-community-success to-stoneclough-accent-green',
      description: 'Real-time civic data'
    }
  ] : [
    { label: 'Loading...', value: '...', icon: Activity, color: 'text-muted-foreground', bgColor: 'bg-muted', gradient: 'from-muted to-muted-foreground', description: 'Fetching data' }
  ];

  // Real civic data for featured items
  const recentCivicUpdates = civicData ? [
    {
      title: 'Council Services Available',
      excerpt: `${civicData.overview?.totalServices || 0} services tracked with ${civicData.overview?.onlineServices || 0} available online`,
      date: 'Live Data',
      type: 'services',
      icon: Globe
    },
    {
      title: 'Digital Transformation Progress',
      excerpt: `${civicData.digitalTransformation?.digitalizationRate || 0}% of council services now available online`,
      date: 'Updated',
      type: 'digital',
      icon: TrendingUp
    },
    {
      title: 'Council Meetings Monitored',
      excerpt: `${civicData.overview?.totalMeetings || 0} meetings tracked for transparency and accountability`,
      date: 'Ongoing',
      type: 'meetings',
      icon: Calendar
    }
  ] : [
    { title: 'Loading civic data...', excerpt: 'Fetching latest information', date: 'Pending', type: 'loading', icon: Activity }
  ];

  const civicEngagementTools = [
    {
      title: 'Council Search',
      description: 'Find services, meetings, and documents',
      icon: Search,
      color: 'accent',
      href: '/civic',
      count: civicData?.overview?.totalServices || 0
    },
    {
      title: 'Meeting Tracker',
      description: 'Monitor council meetings and decisions',
      icon: Calendar,
      color: 'secondary', 
      href: '/civic',
      count: civicData?.overview?.totalMeetings || 0
    },
    {
      title: 'Data Quality',
      description: 'Transparency and data integrity monitoring',
      icon: CheckCircle,
      color: 'community-success',
      href: '/civic',
      count: civicData?.overview?.averageQuality ? Math.round(civicData.overview.averageQuality * 100) : 0
    },
    {
      title: 'Community Voice',
      description: 'Participate in local governance',
      icon: MessageSquare,
      color: 'community-warning',
      href: '/forum',
      count: '+'  
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Welcome Section */}
      <section className="bg-gradient-to-br from-background via-stoneclough-blue-50 to-stoneclough-blue-100 py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-gradient-to-br from-stoneclough-blue-400/20 to-stoneclough-gray-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-gradient-to-br from-stoneclough-blue-300/20 to-stoneclough-blue-400/20 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-stoneclough-blue-100 to-stoneclough-gray-100 text-foreground px-6 py-3 rounded-full mb-8 shadow-lg"
              >
                <Sparkles className="h-5 w-5 text-community-success" />
                Welcome back, {user?.user_metadata?.full_name || user?.email || 'Community Member'}
                <Heart className="h-4 w-4 text-destructive" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-5xl md:text-7xl font-bold text-foreground mb-6"
              >
                Your Civic
                <span className="block bg-gradient-to-r from-brand via-accent to-brand bg-clip-text text-transparent">
                  Intelligence Hub
                </span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-muted-foreground mb-10 max-w-4xl mx-auto leading-relaxed"
              >
                Your central hub for community engagement, local business directory, civic participation, and neighborhood connections.
              </motion.p>
              
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-3 text-muted-foreground"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Activity className="h-6 w-6" />
                  </motion.div>
                  <span>Loading civic intelligence...</span>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="flex flex-wrap items-center justify-center gap-4"
                >
                  <Badge className="bg-community-success/10 text-community-success hover:bg-community-success/10 px-4 py-2 text-base font-medium">
                    <Activity className="h-4 w-4 mr-2" />
                    Live Monitoring Active
                  </Badge>
                  <Badge className="bg-accent/10 text-accent hover:bg-accent/10 px-4 py-2 text-base font-medium">
                    <Globe className="h-4 w-4 mr-2" />
                    {civicData?.overview?.totalServices || 0} Services Tracked
                  </Badge>
                  <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/10 px-4 py-2 text-base font-medium">
                    <Calendar className="h-4 w-4 mr-2" />
                    {civicData?.overview?.totalMeetings || 0} Meetings Monitored
                  </Badge>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Civic Intelligence Overview */}
      <section className="py-20 bg-gradient-to-br from-background to-stoneclough-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-16"
          >
              <h2 className="text-4xl font-bold text-foreground mb-4">
              Community Overview
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Real-time insights into your local community, connecting residents, businesses, and civic opportunities
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {civicStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.1 * index,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group"
                >
                  <Card className={`text-center border-0 bg-gradient-to-br ${stat.gradient} text-white shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden`}>
                    <CardContent className="p-8">
                      <motion.div 
                        className="inline-flex p-4 rounded-2xl bg-white/20 backdrop-blur-sm mb-6"
                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </motion.div>
                      <motion.div 
                        className="text-4xl font-bold mb-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 300 }}
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-lg font-semibold text-white/90 mb-2">
                        {stat.label}
                      </div>
                      <div className="text-sm text-white/70">
                        {stat.description}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Civic Engagement Tools */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl font-bold text-foreground mb-4">
              Community Engagement Tools
            </h3>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Powerful tools to connect with your community, explore local businesses, and participate in neighborhood discussions
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {civicEngagementTools.map((tool, index) => {
              const IconComponent = tool.icon;
              const colorClasses = {
                accent: 'from-accent to-accent/80 hover:from-accent/90 hover:to-accent',
                secondary: 'from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary',
                'community-success': 'from-community-success to-community-success/80 hover:from-community-success/90 hover:to-community-success',
                'community-warning': 'from-community-warning to-community-warning/80 hover:from-community-warning/90 hover:to-community-warning'
              };
              
              return (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <Link href={tool.href}>
                    <Card className={`h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer group overflow-hidden hover:bg-gradient-to-br ${colorClasses[tool.color]}`}>
                      <CardContent className="p-8 group-hover:text-white transition-colors duration-300">
                        <motion.div 
                          className={`inline-flex p-4 rounded-2xl bg-${tool.color}/10 group-hover:bg-white/20 transition-colors duration-300 mb-6`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <IconComponent className={`h-8 w-8 text-${tool.color} group-hover:text-white transition-colors duration-300`} />
                        </motion.div>
                        <h4 className="text-xl font-bold mb-3 group-hover:text-white transition-colors duration-300">
                          {tool.title}
                        </h4>
                        <p className="text-muted-foreground group-hover:text-white/90 transition-colors duration-300 mb-4">
                          {tool.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className={`bg-${tool.color}/10 text-${tool.color} group-hover:bg-white/20 group-hover:text-white transition-colors duration-300`}>
                            {typeof tool.count === 'number' && tool.count > 0 ? tool.count : tool.count}
                          </Badge>
                          <motion.div
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            whileHover={{ x: 5 }}
                          >
                            <ArrowRight className="h-5 w-5 text-white" />
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest Civic Updates */}
      <section className="py-20 bg-gradient-to-br from-muted to-stoneclough-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl font-bold text-foreground mb-4">
              Latest Community Updates
            </h3>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Stay connected with the latest happenings in your local community
            </p>
          </motion.div>
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
            {recentCivicUpdates.map((update, index) => {
              const IconComponent = update.icon;
              const typeColors = {
                services: 'from-accent to-accent/80',
                digital: 'from-community-success to-community-success/80', 
                meetings: 'from-secondary to-secondary/80',
                loading: 'from-muted-foreground to-muted'
              };
              
              return (
                <motion.div
                  key={update.title}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1, type: "spring", stiffness: 200 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 h-full relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${typeColors[update.type]}`}></div>
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4 mb-6">
                        <motion.div 
                          className={`p-3 rounded-xl bg-gradient-to-br ${typeColors[update.type]} text-white shadow-lg`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <IconComponent className="h-6 w-6" />
                        </motion.div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors duration-300">
                            {update.title}
                          </h4>
                          <Badge className="bg-muted text-muted-foreground text-xs">
                            {update.date}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {update.excerpt}
                      </p>
                      <motion.div 
                        className="mt-6 flex items-center gap-2 text-accent font-medium group-hover:gap-3 transition-all duration-300"
                        whileHover={{ x: 5 }}
                      >
                        <span>Learn more</span>
                        <ArrowRight className="h-4 w-4" />
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-center mt-12"
          >
            <Link href="/civic">
              <Button size="lg" className="gradient-brand text-brand-light px-8 py-3 rounded-xl shadow-lg">
                View Full Civic Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-stoneclough-light dark:bg-stoneclough-blue/90 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-stoneclough-blue dark:text-stoneclough-light mb-4">Explore The Community</h3>
            <p className="text-stoneclough-gray-blue dark:text-stoneclough-gray-blue text-lg">Discover what Stoneclough has to offer</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/directory">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Building2 className="h-8 w-8 text-stoneclough-blue mb-2" />
                  <CardTitle>Business Directory</CardTitle>
                  <CardDescription>Discover local businesses and services</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            
            <Link href="/forum">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Users className="h-8 w-8 text-stoneclough-gray-blue mb-2" />
                  <CardTitle>Community Forum</CardTitle>
                  <CardDescription>Join discussions on local topics</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            
            <Link href="/blog">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <FileText className="h-8 w-8 text-stoneclough-blue mb-2" />
                  <CardTitle>Community Blog</CardTitle>
                  <CardDescription>Read the latest community news</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            
            <Link href="/surveys">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-stoneclough-gray-blue mb-2" />
                  <CardTitle>Surveys & Polls</CardTitle>
                  <CardDescription>Voice your opinion on local issues</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}