import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, FileText, MessageSquare, BarChart3, Building2 } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              The Stoneclough Hub
            </h1>
          </div>
          <Button onClick={handleLogin} size="lg">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <div className="text-center py-16">
          <Badge variant="secondary" className="mb-4">
            Community Data Platform
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Your Local Government
            <span className="text-blue-600"> Transparent</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Access local government data, discover businesses, engage with your community, 
            and stay informed about Stoneclough through our comprehensive platform.
          </p>
          <Button onClick={handleLogin} size="lg" className="mr-4">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 py-16">
          <Card>
            <CardHeader>
              <FileText className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Government Data</CardTitle>
              <CardDescription>
                Access planning applications, council spending, and meeting minutes in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Planning applications tracker</li>
                <li>• Council spending transparency</li>
                <li>• Meeting schedules & minutes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Building2 className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Business Directory</CardTitle>
              <CardDescription>
                Discover and connect with local businesses in Stoneclough.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Verified business listings</li>
                <li>• Categories & search</li>
                <li>• Contact information</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Community Forum</CardTitle>
              <CardDescription>
                Engage in discussions about local issues and community topics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Topic-based discussions</li>
                <li>• Community moderation</li>
                <li>• Local issue reporting</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Community Blog</CardTitle>
              <CardDescription>
                Stay updated with local news, events, and community stories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Local news & events</li>
                <li>• Community highlights</li>
                <li>• Featured articles</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-red-600 mb-2" />
              <CardTitle>Surveys & Polls</CardTitle>
              <CardDescription>
                Participate in community surveys and voice your opinions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Community feedback</li>
                <li>• Public opinion polls</li>
                <li>• Local issue voting</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-teal-600 mb-2" />
              <CardTitle>Transparent Access</CardTitle>
              <CardDescription>
                All data sourced from official Bolton Council sources under Open Government License.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Open government data</li>
                <li>• Real-time updates</li>
                <li>• Verified information</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 bg-blue-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to get involved?
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join The Stoneclough Hub and become part of an informed, engaged community.
          </p>
          <Button onClick={handleLogin} size="lg">
            Sign In to Continue
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 The Stoneclough Hub. Data sourced from Bolton Council under Open Government License.</p>
        </div>
      </footer>
    </div>
  );
}