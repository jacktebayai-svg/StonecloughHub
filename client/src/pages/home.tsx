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
  MapPin
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useAuth();

  // Mock data for demonstration
  const civicStats = [
    { label: 'Active Users', value: '2,500+', icon: Users, color: 'text-blue-600' },
    { label: 'Local Businesses', value: '150+', icon: Building2, color: 'text-green-600' },
    { label: 'Council Documents', value: '10,000+', icon: FileText, color: 'text-purple-600' },
    { label: 'Community Posts', value: '5,000+', icon: MessageSquare, color: 'text-orange-600' }
  ];

  const featuredBusinesses = [
    { name: 'Stoneclough Café', category: 'Food & Drink', rating: 4.8, location: 'High Street' },
    { name: 'Green Valley Garden Centre', category: 'Retail', rating: 4.9, location: 'Manchester Road' },
    { name: 'Community Pharmacy', category: 'Healthcare', rating: 4.7, location: 'Church Lane' }
  ];

  const recentNews = [
    { title: 'New Community Garden Opens', excerpt: 'Local residents celebrate the opening of a new community garden space...', date: '2 days ago' },
    { title: 'Council Budget 2025 Released', excerpt: 'Bolton Council announces investment in local infrastructure projects...', date: '5 days ago' },
    { title: 'Local Business Awards Winners', excerpt: 'Celebrating excellence in the Stoneclough business community...', date: '1 week ago' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Welcome Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 mb-6">
                Welcome back, {user?.user_metadata?.full_name || user?.email || 'Community Member'}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Your Community
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
                Stay connected with Stoneclough through real-time civic data, local business updates, and community discussions.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Community Statistics */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Community Overview</h2>
            <p className="text-slate-600 text-lg">Real-time insights into our vibrant community</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {civicStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * (index + 3) }}
                >
                  <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white">
                    <CardContent className="p-6">
                      <div className={`inline-flex p-3 rounded-full bg-slate-100 mb-4`}>
                        <IconComponent className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div className="text-3xl font-bold text-slate-900 mb-2">
                        {stat.value}
                      </div>
                      <div className="text-sm text-slate-600">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Promoted Businesses Section */}
      <section className="py-16 bg-stoneclough-light dark:bg-stoneclough-blue">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-stoneclough-blue dark:text-stoneclough-light mb-4">Featured Local Businesses</h3>
            <p className="text-stoneclough-gray-blue dark:text-stoneclough-gray-blue text-lg">Discover top-rated businesses in Stoneclough</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Placeholder for Business Cards */}
            <Card className="h-64 flex items-center justify-center text-stoneclough-gray-blue dark:text-stoneclough-light">
              <p>Promoted Business 1 Placeholder</p>
            </Card>
            <Card className="h-64 flex items-center justify-center text-stoneclough-gray-blue dark:text-stoneclough-light">
              <p>Promoted Business 2 Placeholder</p>
            </Card>
            <Card className="h-64 flex items-center justify-center text-stoneclough-gray-blue dark:text-stoneclough-light">
              <p>Promoted Business 3 Placeholder</p>
            </Card>
          </div>
          <div className="text-center mt-12">
            <Link href="/directory">
              <Button size="lg" variant="outline">View All Businesses</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Promoted Articles Section */}
      <section className="py-16 bg-stoneclough-light dark:bg-stoneclough-blue/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-stoneclough-blue dark:text-stoneclough-light mb-4">Latest Community Insights</h3>
            <p className="text-stoneclough-gray-blue dark:text-stoneclough-gray-blue text-lg">Stay informed with our featured blog articles</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Placeholder for Article Cards */}
            <Card className="h-64 flex items-center justify-center text-stoneclough-gray-blue dark:text-stoneclough-light">
              <p>Promoted Article 1 Placeholder</p>
            </Card>
            <Card className="h-64 flex items-center justify-center text-stoneclough-gray-blue dark:text-stoneclough-light">
              <p>Promoted Article 2 Placeholder</p>
            </Card>
            <Card className="h-64 flex items-center justify-center text-stoneclough-gray-blue dark:text-stoneclough-light">
              <p>Promoted Article 3 Placeholder</p>
            </Card>
          </div>
          <div className="text-center mt-12">
            <Link href="/blog">
              <Button size="lg" variant="outline">Read All Articles</Button>
            </Link>
          </div>
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
                  <Building className="h-8 w-8 text-stoneclough-blue mb-2" />
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