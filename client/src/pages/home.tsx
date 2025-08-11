import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataChart } from "@/components/charts/data-chart";
import { BusinessCard } from "@/components/business/business-card";
import { ArticleCard } from "@/components/blog/article-card";
import { Link } from "wouter";
import { Building, PoundSterling, Calendar } from "lucide-react";

export default function Home() {
  const { data: stats } = useQuery({
    queryKey: ["/api/council-data/stats"],
  });

  const { data: featuredBusinesses } = useQuery({
    queryKey: ["/api/businesses"],
  });

  const { data: featuredArticle } = useQuery({
    queryKey: ["/api/blog/articles/featured"],
  });

  const { data: recentArticles } = useQuery({
    queryKey: ["/api/blog/articles"],
  });

  // Sample data for the preview chart
  const chartData = [
    { label: 'Jan', value: 65 },
    { label: 'Feb', value: 75 },
    { label: 'Mar', value: 80 },
    { label: 'Apr', value: 72 },
    { label: 'May', value: 85 },
    { label: 'Jun', value: 90 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-hub-blue to-hub-dark-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Your Community's Data, <span className="text-blue-200">Simplified</span>
              </h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                The definitive source for Stoneclough's local government data, business directory, and community discussions. Transparent, accessible, and built for residents.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-hub-blue hover:bg-blue-50">
                    Explore Data Dashboard
                  </Button>
                </Link>
                <Link href="/forum">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-hub-blue">
                    Join the Forum
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              {/* Interactive dashboard preview */}
              <Card className="bg-white text-hub-dark shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Live Data Preview</h3>
                    <span className="text-sm text-hub-gray">Updated today</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-hub-blue">
                        {stats?.planningApplications || 0}
                      </div>
                      <div className="text-sm text-hub-gray">Planning Applications</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-hub-green">
                        £{((stats?.totalSpending || 0) / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-sm text-hub-gray">Council Spending</div>
                    </div>
                  </div>
                  <DataChart 
                    data={chartData} 
                    type="line"
                    height={120}
                    colors={['#2563EB']}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Data Dashboard Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-hub-dark mb-4">Community Data Dashboard</h2>
            <p className="text-lg text-hub-gray max-w-3xl mx-auto">
              Real-time access to local government data from Bolton Council. All data sourced directly from 
              <span className="font-semibold"> data.bolton.gov.uk</span> under the Open Government Licence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-slate-50 border border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-hub-dark">Planning Applications</h3>
                  <Building className="text-hub-blue text-xl" />
                </div>
                <div className="text-3xl font-bold text-hub-blue mb-2">
                  {stats?.planningApplications || 0}
                </div>
                <p className="text-hub-gray text-sm mb-4">Applications in the last 30 days</p>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="w-full text-hub-blue hover:text-hub-dark-blue">
                    View All Applications →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 border border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-hub-dark">Council Spending</h3>
                  <PoundSterling className="text-hub-green text-xl" />
                </div>
                <div className="text-3xl font-bold text-hub-green mb-2">
                  £{((stats?.totalSpending || 0) / 1000000).toFixed(1)}M
                </div>
                <p className="text-hub-gray text-sm mb-4">Total spending this quarter</p>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="w-full text-hub-blue hover:text-hub-dark-blue">
                    View Spending Details →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 border border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-hub-dark">Council Meetings</h3>
                  <Calendar className="text-hub-blue text-xl" />
                </div>
                <div className="text-3xl font-bold text-hub-blue mb-2">
                  {stats?.upcomingMeetings || 0}
                </div>
                <p className="text-hub-gray text-sm mb-4">Upcoming meetings this month</p>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="w-full text-hub-blue hover:text-hub-dark-blue">
                    View All Meetings →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-hub-dark mb-4">Featured Local Businesses</h2>
            <p className="text-lg text-hub-gray max-w-3xl mx-auto">
              Discover and support local businesses in Stoneclough. All listings are community-verified and regularly updated.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredBusinesses?.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>

          <div className="text-center">
            <Link href="/directory">
              <Button size="lg" className="bg-hub-blue hover:bg-hub-dark-blue">
                Browse All Businesses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Blog Content */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-hub-dark mb-4">Community Blog</h2>
            <p className="text-lg text-hub-gray max-w-3xl mx-auto">
              Data-driven insights, community news, and expert analysis to keep you informed about what matters locally.
            </p>
          </div>

          {featuredArticle && (
            <div className="mb-12">
              <ArticleCard article={featuredArticle} featured />
            </div>
          )}

          {recentArticles && recentArticles.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {recentArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          <div className="text-center">
            <Link href="/blog">
              <Button size="lg" variant="outline" className="border-hub-blue text-hub-blue hover:bg-hub-blue hover:text-white">
                Read More Articles
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-gradient-to-r from-hub-blue to-hub-dark-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Stay Informed</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Get our weekly newsletter with the latest data insights, community news, and local business highlights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-hub-dark focus:ring-2 focus:ring-white focus:outline-none"
            />
            <Button className="bg-white text-hub-blue hover:bg-blue-50">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
