import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Building, Users, FileText, TrendingUp, Calendar, PoundSterling } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <Header />
      
      {/* Welcome Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-800">
              Welcome, {user?.firstName || 'Community Member'}!
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Your Community Dashboard
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-3xl mx-auto">
              Access local government data, discover businesses, and engage with your community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-blue-800 hover:bg-blue-50">
                  Explore Data Dashboard
                </Button>
              </Link>
              <Link href="/forum">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-800">
                  Join the Forum
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Council Data at a Glance</h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Real-time insights from Bolton Council's open data</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Planning Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      25
                    </div>
                    <div className="flex items-center text-green-600 text-sm mt-1">
                      <Building className="h-4 w-4 mr-1" />
                      Active this month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      £2.4M
                    </div>
                    <div className="flex items-center text-blue-600 text-sm mt-1">
                      <PoundSterling className="h-4 w-4 mr-1" />
                      Public expenditure
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      8
                    </div>
                    <div className="flex items-center text-purple-600 text-sm mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      Council sessions
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Explore The Community</h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Discover what Stoneclough has to offer</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/directory">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Building className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Business Directory</CardTitle>
                  <CardDescription>Discover local businesses and services</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            
            <Link href="/forum">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Users className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>Community Forum</CardTitle>
                  <CardDescription>Join discussions on local topics</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            
            <Link href="/blog">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <FileText className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle>Community Blog</CardTitle>
                  <CardDescription>Read the latest community news</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            
            <Link href="/surveys">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-orange-600 mb-2" />
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