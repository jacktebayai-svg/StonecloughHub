import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DiscussionCard } from "@/components/forum/discussion-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

const categoryLabels = {
  general: "General Discussion",
  local_events: "Local Events", 
  business_recommendations: "Business Recommendations",
  council_planning: "Council & Planning",
  buy_sell: "Buy & Sell"
};

export default function Forum() {
  const [selectedCategory, setSelectedCategory] = useState<string>("general");

  const { data: discussions, isLoading } = useQuery({
    queryKey: ["/api/forum/discussions", { category: selectedCategory }],
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-hub-dark mb-4">Community Forum</h1>
          <p className="text-lg text-hub-gray max-w-3xl mx-auto">
            Connect with your neighbors, ask questions, share recommendations, and organize local initiatives.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Forum categories sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-50 border border-slate-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-hub-dark mb-4">Categories</h3>
                <nav className="space-y-2">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                        selectedCategory === key
                          ? 'bg-hub-blue text-white'
                          : 'hover:bg-slate-100 text-hub-gray'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedCategory === key
                          ? 'bg-white bg-opacity-20'
                          : 'bg-slate-200'
                      }`}>
                        0
                      </span>
                    </button>
                  ))}
                </nav>
                <Button className="w-full mt-6 bg-hub-green hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Discussion
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Forum discussions */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <Card className="bg-slate-50 border border-slate-200">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-3 mb-4">
                          <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-slate-200 rounded mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded"></div>
                          </div>
                        </div>
                        <div className="h-5 bg-slate-200 rounded mb-3"></div>
                        <div className="h-4 bg-slate-200 rounded mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded"></div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : discussions && discussions.length > 0 ? (
              <>
                <div className="space-y-6">
                  {discussions.map((discussion) => (
                    <DiscussionCard key={discussion.id} discussion={discussion} />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center mt-12">
                  <nav className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" className="bg-hub-blue text-white">1</Button>
                    <Button variant="ghost" size="sm">2</Button>
                    <Button variant="ghost" size="sm">3</Button>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </nav>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-hub-gray text-lg">
                  No discussions found in this category.
                </p>
                <p className="text-sm text-hub-gray mt-2">
                  Be the first to start a conversation!
                </p>
                <Button className="mt-4 bg-hub-green hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Discussion
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
