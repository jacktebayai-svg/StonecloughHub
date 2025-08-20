import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BusinessCard } from "@/components/business/business-card";
import { ArticleCard } from "@/components/blog/article-card";
import { useAuth } from "@/hooks/useAuth";
import { 
  FileText, 
  Building2, 
  MessageSquare, 
  BarChart3, 
  Users,
  Search,
  Shield,
  TrendingUp,
  Globe,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { DataChart } from "@/components/charts/data-chart";
import { supabase } from "../../lib/supabase";
import { useState } from "react";

export default function Landing() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation('/dashboard');
    return null;
  }
  
  const handleLogin = () => {
    // Scroll to the auth form
    const authForm = document.getElementById('auth-form');
    if (authForm) {
      authForm.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleGetStarted = () => {
    // Scroll to the auth form for getting started
    const authForm = document.getElementById('auth-form');
    if (authForm) {
      authForm.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleDemoLogin = async (email: string, password: string, role: string) => {
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        // The auth state change will handle the redirect
        console.log(`Logged in as ${role}`);
      } else {
        console.error('Login error:', error);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      if (showSignUp) {
        const { error } = await supabase.auth.signUp({
          email: authData.email,
          password: authData.password,
          options: {
            data: {
              full_name: authData.name
            }
          }
        });
        if (error) {
          console.error('Sign up error:', error);
        } else {
          alert('Check your email for the confirmation link!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authData.email,
          password: authData.password
        });
        if (error) {
          console.error('Sign in error:', error);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Platform features with consistent Stoneclough branding
  const features = [
    {
      icon: Building2,
      title: 'Business Directory',
      description: 'Discover and support local businesses in Stoneclough. Find services, read reviews, and connect with entrepreneurs.',
      color: 'text-stoneclough-blue-700',
      bgColor: 'bg-stoneclough-blue-50'
    },
    {
      icon: MessageSquare,
      title: 'Community Forum',
      description: 'Engage in meaningful discussions about local issues, events, and community initiatives with your neighbors.',
      color: 'text-stoneclough-accent-green',
      bgColor: 'bg-green-50'
    },
    {
      icon: FileText,
      title: 'Local Blog & News',
      description: 'Stay informed with community-driven content, local news, and insights from residents and officials.',
      color: 'text-stoneclough-gray-700',
      bgColor: 'bg-stoneclough-gray-50'
    },
    {
      icon: BarChart3,
      title: 'Council Data Transparency',
      description: 'Access real-time council data including budgets, spending, planning applications, and meeting records.',
      color: 'text-stoneclough-accent-orange',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Users,
      title: 'Surveys & Polls',
      description: 'Participate in community surveys and polls to have your voice heard on local matters.',
      color: 'text-stoneclough-blue-600',
      bgColor: 'bg-stoneclough-blue-50'
    },
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Find any local information quickly with our intelligent search across all platform content.',
      color: 'text-stoneclough-gray-600',
      bgColor: 'bg-stoneclough-gray-100'
    }
  ];
  
  const stats = [
    { label: 'Active Users', value: '2,500+', icon: Users },
    { label: 'Local Businesses', value: '150+', icon: Building2 },
    { label: 'Council Documents', value: '10,000+', icon: FileText },
    { label: 'Community Posts', value: '5,000+', icon: MessageSquare }
  ];

  const { data: promotedBusinesses, isLoading: isLoadingBusinesses } = useQuery({
    queryKey: ['promotedBusinesses'],
    queryFn: async () => {
      const res = await fetch('/api/businesses/promoted?limit=3'); // Increased limit for carousel
      if (!res.ok) {
        throw new Error('Failed to fetch promoted businesses');
      }
      return res.json();
    },
  });

  const { data: promotedArticles, isLoading: isLoadingArticles } = useQuery({
    queryKey: ['promotedArticles'],
    queryFn: async () => {
      const res = await fetch('/api/blog/articles/promoted?limit=3'); // Increased limit for carousel
      if (!res.ok) {
        throw new Error('Failed to fetch promoted articles');
      }
      return res.json();
    },
  });

  // Sample data for harvested insights
  const sampleInsights = [
    { label: 'Planning Apps', value: 25 },
    { label: 'Council Spend', value: 1.2 },
    { label: 'Meetings', value: 8 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, staggerChildren: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-stoneclough-light to-white dark:from-stoneclough-blue dark:to-gray-800"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Logo and Login Button */}
      <header className="container mx-auto px-4 py-8 flex justify-between items-center">
        <motion.div
          className="flex items-center space-x-4"
          variants={itemVariants}
        >
          <motion.img
            src="/Logo.svg"
            alt="The Stoneclough Hub Logo"
            className="h-24 w-24 drop-shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <motion.span
            className="text-2xl font-bold text-stoneclough-blue dark:text-stoneclough-light"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            The Stoneclough Hub
          </motion.span>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button onClick={handleLogin} size="lg" className="shadow-lg">
            Sign In
          </Button>
        </motion.div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-stoneclough-blue-50 via-white to-stoneclough-blue-100 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Hero content */}
            <motion.div variants={itemVariants} className="space-y-8">
              <div>
                <Badge className="bg-stoneclough-blue-100 text-stoneclough-blue-800 hover:bg-stoneclough-blue-100 mb-6">
                  🚀 Now Live for Stoneclough Community
                </Badge>
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-stoneclough-gray-900 tracking-tight">
                  <span className="block">Connect with your</span>
                  <span className="block bg-gradient-to-r from-stoneclough-blue-700 to-stoneclough-blue-600 bg-clip-text text-transparent">
                    local community
                  </span>
                </h1>
                <p className="mt-6 text-xl text-stoneclough-gray-700 leading-relaxed max-w-2xl">
                  The Stoneclough Hub brings transparency to local government, connects residents with businesses, 
                  and fosters meaningful community discussions. Join engaged citizens building a stronger community together.
                </p>
              </div>
              
              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center shadow-sm"
                  >
                    <stat.icon className="h-6 w-6 text-stoneclough-blue-700 mx-auto mb-2" />
                    <div className="text-lg font-bold text-stoneclough-gray-900">{stat.value}</div>
                    <div className="text-xs text-stoneclough-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={handleGetStarted} className="bg-gradient-to-r from-stoneclough-blue-700 to-stoneclough-blue-600 hover:from-stoneclough-blue-800 hover:to-stoneclough-blue-700">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={scrollToFeatures} className="border-stoneclough-blue-600 text-stoneclough-blue-700 hover:bg-stoneclough-blue-50">
                  Learn More
                </Button>
              </div>
            </motion.div>
            
            {/* Right side - Auth form */}
            <motion.div variants={itemVariants} className="lg:pl-8">
              <Card id="auth-form" className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader className="space-y-1 pb-6">
                  <div className="flex justify-center space-x-1 mb-4">
                    <button
                      onClick={() => setShowSignUp(false)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        !showSignUp ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setShowSignUp(true)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        showSignUp ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                  <CardTitle className="text-2xl font-bold text-center text-slate-900">
                    {showSignUp ? 'Join the Community' : 'Welcome Back'}
                  </CardTitle>
                  <p className="text-center text-slate-600">
                    {showSignUp ? 'Create your account to get started' : 'Sign in to access your dashboard'}
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {showSignUp && (
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</label>
                        <input
                          id="name"
                          type="text"
                          value={authData.name}
                          onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                      <input
                        id="email"
                        type="email"
                        value={authData.email}
                        onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                      <input
                        id="password"
                        type="password"
                        value={authData.password}
                        onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {showSignUp ? 'Creating account...' : 'Signing in...'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {showSignUp ? 'Create Account' : 'Sign In'}
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600 mb-4">Or try a demo account:</p>
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        onClick={() => handleDemoLogin('demo@stoneclough.local', 'demo123', 'User')}
                        disabled={isLoggingIn}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Demo User (demo@stoneclough.local)
                      </Button>
                      <Button 
                        onClick={() => handleDemoLogin('admin@stoneclough.local', 'admin123', 'Admin')}
                        disabled={isLoggingIn}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Demo Admin (admin@stoneclough.local)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features-section" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything you need for civic engagement
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Powerful tools to stay informed, engaged, and connected with your local community
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 group-hover:scale-105">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Live Data Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Promoted Businesses */}
            <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                Featured Businesses
              </h3>
              {isLoadingBusinesses ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : promotedBusinesses && promotedBusinesses.length > 0 ? (
                <div className="space-y-4">
                  {promotedBusinesses.slice(0, 3).map((business: any) => (
                    <div key={business.id} className="border-l-4 border-blue-600 pl-4">
                      <h4 className="font-semibold text-slate-900">{business.name}</h4>
                      <p className="text-sm text-slate-600">{business.category}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-center py-8">Loading local businesses...</p>
              )}
            </motion.div>
            
            {/* Promoted Articles */}
            <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Community News
              </h3>
              {isLoadingArticles ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : promotedArticles && promotedArticles.length > 0 ? (
                <div className="space-y-4">
                  {promotedArticles.slice(0, 3).map((article: any) => (
                    <div key={article.id} className="border-l-4 border-green-600 pl-4">
                      <h4 className="font-semibold text-slate-900">{article.title}</h4>
                      <p className="text-sm text-slate-600">{article.excerpt}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-center py-8">Loading community articles...</p>
              )}
            </motion.div>
            
            {/* Council Data */}
            <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
                Council Data
              </h3>
              <div className="space-y-4">
                {sampleInsights.map((insight, index) => (
                  <div key={insight.label} className="flex justify-between items-center">
                    <span className="text-slate-600">{insight.label}</span>
                    <span className="font-semibold text-slate-900">{insight.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-4 text-center">
                Updated daily from Bolton Council
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-stoneclough-blue/20">
        <div className="text-center text-stoneclough-gray-blue">
          <p>&copy; 2025 The Stoneclough Hub. Data sourced from Bolton Council under Open Government License.</p>
        </div>
      </footer>
    </motion.div>
  );
}