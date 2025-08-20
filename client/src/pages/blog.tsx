import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ArticleCard } from "@/components/blog/article-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-stoneclough-light">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-stoneclough-blue mb-4">Community Blog</h1>
          <p className="text-lg text-stoneclough-gray-blue max-w-3xl mx-auto">
            Data-driven insights, community news, and expert analysis to keep you informed about what matters locally.
          </p>
        </div>

        {/* Featured article */}
        {featuredArticle && (
          <div className="mb-12">
            <ArticleCard article={featuredArticle} featured />
          </div>
        )}

        {/* Recent articles grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <Card className="overflow-hidden">
                  <div className="h-48 bg-stoneclough-light/80"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-stoneclough-light/80 rounded mb-3"></div>
                    <div className="h-5 bg-stoneclough-light/80 rounded mb-3"></div>
                    <div className="h-4 bg-stoneclough-light/80 rounded mb-4"></div>
                    <div className="h-3 bg-stoneclough-light/80 rounded"></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-stoneclough-gray-blue text-lg">
              No blog articles available at the moment.
            </p>
            <p className="text-sm text-stoneclough-gray-blue mt-2">
              Check back soon for community insights and data analysis.
            </p>
          </div>
        )}

        {/* Newsletter signup */}
        <div className="bg-gradient-to-r from-stoneclough-blue to-stoneclough-blue/90 rounded-xl p-8 text-stoneclough-light text-center mt-12">
          <h3 className="text-2xl font-bold mb-4">Stay Informed</h3>
          <p className="text-stoneclough-light mb-6 max-w-2xl mx-auto">
            Get our weekly newsletter with the latest data insights, community news, and local business highlights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email"
              className="flex-1 text-stoneclough-blue"
            />
            <Button className="bg-stoneclough-light text-stoneclough-blue hover:bg-stoneclough-light/90">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}