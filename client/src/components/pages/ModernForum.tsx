import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock,
  Search,
  Plus,
  ThumbsUp,
  MessageCircle,
  User
} from "lucide-react";
import { Link } from "wouter";
import api from "@/lib/api";

export function ModernForum() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Mock data for demonstration since API might not be fully implemented
  const mockDiscussions = [
    {
      id: 1,
      title: "New Community Centre Plans - Your Thoughts?",
      excerpt: "The council has proposed building a new community centre on Manchester Road. What are your thoughts on the location and facilities?",
      author: "StonecloughResident",
      replies: 24,
      likes: 18,
      category: "Local Development",
      createdAt: "2 days ago",
      isHot: true
    },
    {
      id: 2,
      title: "Traffic Issues on Church Lane",
      excerpt: "Has anyone noticed increased traffic during rush hour? Discussing potential solutions...",
      author: "LocalCommuter",
      replies: 12,
      likes: 8,
      category: "Transport",
      createdAt: "5 days ago",
      isHot: false
    },
    {
      id: 3,
      title: "Local Business Spotlight: Green Valley Garden Centre",
      excerpt: "Sharing my experience with this fantastic local business. Great plants and friendly service!",
      author: "GardenEnthusiast",
      replies: 7,
      likes: 15,
      category: "Business",
      createdAt: "1 week ago",
      isHot: false
    }
  ];

  const categories = [
    "All Topics",
    "Local Development", 
    "Transport",
    "Business",
    "Community Events",
    "Environment",
    "Council Updates"
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Community Forum</h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Connect with your neighbors, discuss local issues, and help build a stronger Stoneclough community together.
          </p>
        </div>

        {/* Search and Actions Bar */}
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input 
                    type="search" 
                    placeholder="Search discussions, topics, or users..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-64">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase().replace(" ", "_")}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                New Discussion
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Forum Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">156</div>
              <div className="text-sm text-slate-600">Discussions</div>
            </CardContent>
          </Card>
          <Card className="text-center bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">89</div>
              <div className="text-sm text-slate-600">Active Members</div>
            </CardContent>
          </Card>
          <Card className="text-center bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">12</div>
              <div className="text-sm text-slate-600">Trending Topics</div>
            </CardContent>
          </Card>
          <Card className="text-center bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">24h</div>
              <div className="text-sm text-slate-600">Avg Response</div>
            </CardContent>
          </Card>
        </div>

        {/* Discussion List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Recent Discussions</h2>
          
          {mockDiscussions.map((discussion) => (
            <Card key={discussion.id} className="hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-semibold text-slate-900 hover:text-blue-600 cursor-pointer">
                          {discussion.title}
                        </h3>
                        {discussion.isHot && (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                            🔥 Hot
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="hidden sm:inline-flex">
                        {discussion.category}
                      </Badge>
                    </div>
                    
                    <p className="text-slate-600 mb-4 line-clamp-2">
                      {discussion.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm text-slate-500">
                        <span>by {discussion.author}</span>
                        <span>{discussion.createdAt}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <div className="flex items-center space-x-1">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{discussion.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{discussion.replies}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Read More →
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Forum Guidelines */}
        <Card className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">
              Community Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Be Respectful</h4>
                <p>Treat all community members with respect and courtesy.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Stay On Topic</h4>
                <p>Keep discussions relevant to Stoneclough and local issues.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">No Spam</h4>
                <p>Avoid repetitive posts and commercial advertisements.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Constructive Feedback</h4>
                <p>Provide helpful, constructive feedback and solutions.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
