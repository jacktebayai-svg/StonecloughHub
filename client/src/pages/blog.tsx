import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ArticleCard } from "@/components/blog/article-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { FileText, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import type { BlogArticle } from "@shared/schema";

export default function Blog() {
  const { data: featuredArticle } = useQuery({
    queryKey: ["/api/blog/articles/featured"],
    queryFn: () => api.blog.getFeatured(),
  }) as { data: BlogArticle | undefined };

  const { data: articles, isLoading } = useQuery({
    queryKey: ["/api/blog/articles", { limit: 9 }],
    queryFn: () => api.blog.getArticles(9),
  }) as { data: BlogArticle[] | undefined; isLoading: boolean };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
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
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-blue-100 text-slate-800 px-6 py-3 rounded-full mb-8 shadow-lg"
              >
                <Sparkles className="h-5 w-5 text-emerald-600" />
                Discover Community Stories
                <FileText className="h-4 w-4 text-blue-500" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-5xl md:text-7xl font-bold text-slate-900 mb-6"
              >
                Community
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Blog
                </span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-slate-600 mb-10 max-w-4xl mx-auto leading-relaxed"
              >
                Discover community insights, local stories, and engaging content from your neighborhood.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 px-4 py-2 text-base font-medium">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Fresh Content Daily
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 px-4 py-2 text-base font-medium">
                  <FileText className="h-4 w-4 mr-2" />
                  {articles?.length || 0} Articles Available
                </Badge>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Featured article */}
        {featuredArticle && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-4">
                Featured Article
              </h2>
              <p className="text-slate-600 text-lg">
                Don't miss our highlighted community story
              </p>
            </div>
            <ArticleCard article={featuredArticle} featured />
          </motion.div>
        )}

        {/* Recent articles grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-4">
              Latest Articles
            </h2>
            <p className="text-slate-600 text-lg max-w-3xl mx-auto">
              Stay up to date with the latest community news, insights, and stories
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="animate-pulse"
                >
                  <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                    <div className="h-48 bg-gradient-to-br from-slate-200 to-blue-300"></div>
                    <CardContent className="p-6">
                      <div className="h-4 bg-gradient-to-r from-slate-200 to-blue-300 rounded mb-3"></div>
                      <div className="h-5 bg-gradient-to-r from-slate-200 to-blue-300 rounded mb-3"></div>
                      <div className="h-4 bg-gradient-to-r from-slate-200 to-blue-300 rounded mb-4"></div>
                      <div className="h-3 bg-gradient-to-r from-slate-200 to-blue-300 rounded"></div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.1 * index,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <ArticleCard article={article} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center py-16"
            >
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 max-w-2xl mx-auto">
                <CardContent className="p-12">
                  <motion.div 
                    className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-blue-100 mb-6"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <FileText className="h-8 w-8 text-blue-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    No Articles Yet
                  </h3>
                  <p className="text-slate-600 text-lg mb-4">
                    No blog articles available at the moment.
                  </p>
                  <p className="text-slate-500">
                    Check back soon for community insights and engaging stories.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Newsletter signup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative overflow-hidden"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
            </div>
            <CardContent className="p-12 text-center relative z-10">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full mb-6"
              >
                <Sparkles className="h-5 w-5" />
                Stay Updated
              </motion.div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Never Miss a Story
              </h3>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                Get the latest community stories, local insights, and neighborhood updates delivered straight to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <Input 
                  type="email" 
                  placeholder="Enter your email address"
                  className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30 backdrop-blur-sm"
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-white/90 font-semibold px-8 shadow-lg"
                    onClick={() => alert('Newsletter signup coming soon! Thank you for your interest.')}
                  >
                    Subscribe
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}