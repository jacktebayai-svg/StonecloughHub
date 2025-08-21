import Link from 'next/link';
import { Building2, BarChart3, Users, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Stoneclough Hub
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your comprehensive platform for civic transparency, community engagement, 
            and local government insights. Explore real-time data from Bolton Council 
            with our advanced transparency dashboard.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/civic">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <BarChart3 className="h-5 w-5 mr-2" />
                View Civic Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <BarChart3 className="h-6 w-6 mr-2" />
                Civic Transparency
              </CardTitle>
              <CardDescription>
                Real-time insights into Bolton Council operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 3,709+ council records analyzed</li>
                <li>• Planning applications tracking</li>
                <li>• Council spending transparency</li>
                <li>• Meeting schedules & agendas</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <MapPin className="h-6 w-6 mr-2" />
                Planning & Development
              </CardTitle>
              <CardDescription>
                Track local planning applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Live planning application updates</li>
                <li>• Location-based mapping</li>
                <li>• Application status tracking</li>
                <li>• Community impact assessment</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-600">
                <Users className="h-6 w-6 mr-2" />
                Democratic Engagement
              </CardTitle>
              <CardDescription>
                Connect with council representatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Councillor contact information</li>
                <li>• Committee meeting schedules</li>
                <li>• Public consultation tracking</li>
                <li>• Democratic process insights</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Preview */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">
              <Building2 className="h-8 w-8 mx-auto mb-4" />
              Civic Transparency Dashboard
            </CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              The centerpiece of Stoneclough Hub - providing unprecedented access to local government data
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 rounded-lg p-4">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">3,709</div>
                <div className="text-blue-100">Records Analyzed</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">2</div>
                <div className="text-blue-100">Planning Applications</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">58</div>
                <div className="text-blue-100">Council Meetings</div>
              </div>
            </div>
            <Link href="/civic">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                Explore Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>
            Powered by advanced web crawling and AI analysis • 
            Data sourced from Bolton Council • 
            Built for transparency and community engagement
          </p>
        </div>
      </div>
    </div>
  );
}
