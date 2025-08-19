import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BusinessCard } from "@/components/business/business-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function Directory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["/api/businesses", { category: categoryFilter !== "all" ? categoryFilter : undefined }],
  });

  const { data: searchResults } = useQuery({
    queryKey: ["/api/businesses/search", { q: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  const displayBusinesses = searchQuery.length > 2 ? searchResults : businesses;

  return (
    <div className="min-h-screen bg-stoneclough-light">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-stoneclough-blue mb-4">Local Business Directory</h1>
          <p className="text-lg text-stoneclough-gray-blue max-w-3xl mx-auto">
            Discover and support local businesses in Stoneclough. All listings are community-verified and regularly updated.
          </p>
        </div>

        {/* Search and filter section */}
        <Card className="shadow-sm border border-stoneclough-blue/20 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input 
                  type="search" 
                  placeholder="Search businesses, services, or products..."
                  className="w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-64">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="restaurant_cafe">Restaurants & Cafes</SelectItem>
                  <SelectItem value="retail_shopping">Retail & Shopping</SelectItem>
                  <SelectItem value="health_beauty">Health & Beauty</SelectItem>
                  <SelectItem value="professional_services">Professional Services</SelectItem>
                  <SelectItem value="home_garden">Home & Garden</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-stoneclough-blue hover:bg-stoneclough-blue/90 text-stoneclough-light">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Business listings */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-stoneclough-light rounded-xl border border-stoneclough-blue/20 overflow-hidden">
                  <div className="h-48 bg-stoneclough-blue/10"></div>
                  <div className="p-6">
                    <div className="h-4 bg-stoneclough-blue/10 rounded mb-3"></div>
                    <div className="h-3 bg-stoneclough-blue/10 rounded mb-2"></div>
                    <div className="h-3 bg-stoneclough-blue/10 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayBusinesses && displayBusinesses.length > 0 ? (
          <>
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-stoneclough-blue mb-6">
                {searchQuery.length > 2 ? `Search Results for "${searchQuery}"` : "All Businesses"}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayBusinesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-stoneclough-gray-blue text-lg">
              {searchQuery.length > 2 
                ? `No businesses found for "${searchQuery}"`
                : "No businesses found in this category"
              }
            </p>
            <p className="text-sm text-stoneclough-gray-blue mt-2">
              Try adjusting your search or browse all categories.
            </p>
          </div>
        )}

        {/* Call to action for businesses */}
        <div className="bg-stoneclough-blue rounded-xl p-8 text-stoneclough-light text-center mt-12">
          <h3 className="text-2xl font-bold text-stoneclough-blue mb-4">Is Your Business Listed?</h3>
          <p className="text-stoneclough-light mb-6 max-w-2xl mx-auto">
            Join hundreds of local businesses in our community directory. Get discovered by residents and build trust through community verification.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-stoneclough-light text-stoneclough-blue hover:bg-stoneclough-light/90">
              Add Free Listing
            </Button>
            <Button variant="outline" className="border-stoneclough-light text-stoneclough-light hover:bg-stoneclough-light hover:text-stoneclough-blue">
              View Pricing Plans
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
