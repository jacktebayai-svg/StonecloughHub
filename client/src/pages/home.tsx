import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Building, Users, FileText, TrendingUp, Calendar, PoundSterling } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BusinessCard } from "@/components/business/business-card";
import { ArticleCard } from "@/components/blog/article-card";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-stoneclough-blue">
      <Header />
      
      {/* Hero Section - New */}
      <section className="bg-gradient-to-br from-stoneclough-blue to-stoneclough-blue/80 text-stoneclough-light py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 text-stoneclough-blue">
            The Stoneclough Hub
            <span className="block text-stoneclough-light/80 text-3xl md:text-5xl mt-2">Your Gateway to Local Data & Community</span>
          </h1>
          <p className="text-xl text-stoneclough-light/90 mb-10 max-w-3xl mx-auto">
            Access transparent local government data, discover vibrant businesses, engage in community discussions, and stay informed about Stoneclough.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/directory">
              <Button size="lg" className="bg-stoneclough-light text-stoneclough-blue hover:bg-stoneclough-light/90 shadow-lg">
                Explore Businesses
              </Button>
            </Link>
            <Link href="/blog">
              <Button size="lg" variant="outline" className="border-stoneclough-light text-stoneclough-light hover:bg-stoneclough-light hover:text-stoneclough-blue shadow-lg">
                Read Our Blog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-stoneclough-blue dark:text-stoneclough-light mb-4">Council Data at a Glance</h3>
            <p className="text-stoneclough-gray-blue dark:text-stoneclough-light text-lg">Real-time insights from Bolton Council's open data</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stoneclough-gray-blue dark:text-stoneclough-light">Planning Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-3xl font-bold text-stoneclough-blue dark:text-stoneclough-light">
                      25
                    </div>
                    <div className="flex items-center text-stoneclough-gray-blue text-sm mt-1">
                      <Building className="h-4 w-4 mr-1" />
                      Active this month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stoneclough-gray-blue dark:text-stoneclough-gray-blue/80">Total Spending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-3xl font-bold text-stoneclough-blue dark:text-stoneclough-light">
                      £2.4M
                    </div>
                    <div className="flex items-center text-stoneclough-blue text-sm mt-1">
                      <PoundSterling className="h-4 w-4 mr-1" />
                      Public expenditure
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stoneclough-gray-blue dark:text-stoneclough-gray-blue/80">Upcoming Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-3xl font-bold text-stoneclough-blue dark:text-stoneclough-light">
                      8
                    </div>
                    <div className="flex items-center text-stoneclough-gray-blue text-sm mt-1">
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