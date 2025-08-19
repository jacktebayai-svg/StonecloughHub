import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BusinessCard } from "@/components/business/business-card";
import { ArticleCard } from "@/components/blog/article-card";
import { FileText, Building2, MessageSquare, BarChart3, Users } from "lucide-react";
import { motion } from "framer-motion";
import { DataChart } from "@/components/charts/data-chart"; // Import DataChart

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/auth/google";
  };

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

      {/* Featured Content Grid */}
      <main className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Promoted Businesses */}
          <motion.section
            className="bg-stoneclough-light dark:bg-stoneclough-blue p-6 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-2xl font-bold text-stoneclough-blue dark:text-stoneclough-light mb-6 text-center">Featured Local Businesses</h3>
            {isLoadingBusinesses ? (
              <p className="text-center text-stoneclough-gray-blue">Loading businesses...</p>
            ) : promotedBusinesses && promotedBusinesses.length > 0 ? (
              <div className="space-y-4">
                {promotedBusinesses.map((business: any) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            ) : (
              <p className="text-center text-stoneclough-gray-blue">No promoted businesses found.</p>
            )}
            <div className="text-center mt-6">
              <Link href="/directory">
                <Button size="lg" variant="outline" className="shadow-md">View All Businesses</Button>
              </Link>
            </div>
          </motion.section>

          {/* Promoted Articles */}
          <motion.section
            className="bg-white dark:bg-stoneclough-blue/90 p-6 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-2xl font-bold text-stoneclough-blue dark:text-stoneclough-light mb-6 text-center">Latest Community Insights</h3>
            {isLoadingArticles ? (
              <p className="text-center text-stoneclough-gray-blue">Loading articles...</p>
            ) : promotedArticles && promotedArticles.length > 0 ? (
              <div className="space-y-4">
                {promotedArticles.map((article: any) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <p className="text-center text-stoneclough-gray-blue">No promoted articles found.</p>
            )}
            <div className="text-center mt-6">
              <Link href="/blog">
                <Button size="lg" variant="outline" className="shadow-md">Read All Articles</Button>
              </Link>
            </div>
          </motion.section>

          {/* Harvested Data Insights */}
          <motion.section
            className="bg-stoneclough-light dark:bg-stoneclough-blue p-6 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-2xl font-bold text-stoneclough-blue dark:text-stoneclough-light mb-6 text-center">Fast Data Insights</h3>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-stoneclough-blue">Council Data Overview</CardTitle>
                <CardDescription className="text-stoneclough-gray-blue">Key metrics from Bolton Council</CardDescription>
              </CardHeader>
              <CardContent>
                <DataChart 
                  data={sampleInsights} 
                  type="bar"
                  height={200}
                  colors={['#254974', '#a2876f', '#dd6b20']}
                />
                <p className="text-sm text-stoneclough-gray-blue mt-4 text-center">
                  Data updated daily from official sources.
                </p>
              </CardContent>
            </Card>
            <div className="text-center mt-6">
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="shadow-md">View Full Dashboard</Button>
              </Link>
            </div>
          </motion.section>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-stoneclough-blue/20">
        <div className="text-center text-stoneclough-gray-blue">
          <p>&copy; 2025 The Stoneclough Hub. Data sourced from Bolton Council under Open Government License.</p>
        </div>
      </footer>
    </motion.div>
  );
}