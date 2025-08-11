import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ArticleCard } from "@/components/blog/article-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Blog() {
  const { data: featuredArticle } = useQuery({
    queryKey: ["/api/blog/articles/featured"],
  });

  const { data: articles, isLoading } = useQuery({
    queryKey: ["/api/blog/articles", { limit: 9 }],
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-hub-dark mb-4">Community Blog</h1>
          <p className="text-lg text-hub-gray max-w-3xl mx-auto">
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
                  <div className="h-48 bg-slate-200"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-200 rounded mb-3"></div>
                    <div className="h-5 bg-slate-200 rounded mb-3"></div>
                    <div className="h-4 bg-slate-200 rounded mb-4"></div>
                    <div className="h-3 bg-slate-200 rounded"></div>
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
            <p className="text-hub-gray text-lg">
              No blog articles available at the moment.
            </p>
            <p className="text-sm text-hub-gray mt-2">
              Check back soon for community insights and data analysis.
            </p>
          </div>
        )}

        {/* Newsletter signup */}
        <div className="bg-gradient-to-r from-hub-blue to-hub-dark-blue rounded-xl p-8 text-white text-center mt-12">
          <h3 className="text-2xl font-bold mb-4">Stay Informed</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Get our weekly newsletter with the latest data insights, community news, and local business highlights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email"
              className="flex-1 text-hub-dark"
            />
            <Button className="bg-white text-hub-blue hover:bg-blue-50">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
