import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataChart } from "@/components/charts/data-chart";
import { Building, PoundSterling, Calendar, Search } from "lucide-react";

export default function Dashboard() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("30");

  const { data: stats } = useQuery({
    queryKey: ["/api/council-data/stats"],
  });

  const { data: councilData } = useQuery({
    queryKey: ["/api/council-data", { limit: 100 }],
  });

  // Process data for charts
  const chartData = councilData?.slice(0, 10).map(item => ({
    label: new Date(item.date).toLocaleDateString(),
    value: item.amount || 1
  })) || [];

  const planningData = councilData?.filter(item => item.dataType === 'planning_application').slice(0, 6).map(item => ({
    label: new Date(item.date).toLocaleDateString(),
    value: 1
  })) || [];

  return (
    <div className="min-h-screen bg-stoneclough-light">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stoneclough-blue mb-4">Community Data Dashboard</h1>
          <p className="text-lg text-stoneclough-gray-blue max-w-3xl">
            Real-time access to local government data from Bolton Council. All data sourced directly from 
            <span className="font-semibold"> data.bolton.gov.uk</span> under the Open Government Licence.
          </p>
        </div>
        
        {/* Data filters */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="planning_application">Planning Applications</SelectItem>
              <SelectItem value="council_meeting">Council Meetings</SelectItem>
              <SelectItem value="council_spending">Financial Reports</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-stoneclough-blue hover:bg-stoneclough-blue/90 text-stoneclough-light">
            <Search className="w-4 h-4 mr-2" />
            Filter Data
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="bg-stoneclough-light border border-stoneclough-blue/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-stoneclough-blue">Planning Applications</h3>
                <Building className="text-stoneclough-blue text-xl" />
              </div>
              <div className="text-3xl font-bold text-stoneclough-blue mb-2">
                {stats?.planningApplications || 0}
              </div>
              <p className="text-stoneclough-gray-blue text-sm mb-4">Applications in the last 30 days</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Approved</span>
                  <span className="font-medium text-stoneclough-gray-blue">70%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending</span>
                  <span className="font-medium text-stoneclough-orange">25%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Rejected</span>
                  <span className="font-medium text-stoneclough-gray-blue">5%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stoneclough-light border border-stoneclough-blue/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-stoneclough-blue">Council Spending</h3>
                <PoundSterling className="text-stoneclough-gray-blue text-xl" />
              </div>
              <div className="text-3xl font-bold text-stoneclough-gray-blue mb-2">
                £{((stats?.totalSpending || 0) / 1000000).toFixed(1)}M
              </div>
              <p className="text-stoneclough-gray-blue text-sm mb-4">Total spending this quarter</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Infrastructure</span>
                  <span className="font-medium">50%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Services</span>
                  <span className="font-medium">33%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Administration</span>
                  <span className="font-medium">17%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stoneclough-light border border-stoneclough-blue/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-stoneclough-blue">Council Meetings</h3>
                <Calendar className="text-stoneclough-blue text-xl" />
              </div>
              <div className="text-3xl font-bold text-stoneclough-blue mb-2">
                {stats?.upcomingMeetings || 0}
              </div>
              <p className="text-stoneclough-gray-blue text-sm mb-4">Upcoming meetings this month</p>
              <div className="space-y-2">
                <div className="text-sm">
                  <div className="font-medium">Planning Committee</div>
                  <div className="text-stoneclough-gray-blue">Next meeting date TBD</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Full Council</div>
                  <div className="text-stoneclough-gray-blue">Next meeting date TBD</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card className="border border-stoneclough-blue/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-stoneclough-blue">
                Data Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataChart 
                data={chartData} 
                type="line"
                height={300}
                colors={['#254974', '#a2876f']}
              />
            </CardContent>
          </Card>

          <Card className="border border-stoneclough-blue/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-stoneclough-blue">
                Planning Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataChart 
                data={planningData} 
                type="bar"
                height={300}
                colors={['#254974']}
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Data Table */}
        <Card className="border border-stoneclough-blue/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-stoneclough-blue">
              Recent Council Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {councilData && councilData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stoneclough-blue/20">
                      <th className="text-left py-3 px-4 font-semibold text-stoneclough-blue">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-stoneclough-blue">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-stoneclough-blue">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-stoneclough-blue">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {councilData.slice(0, 10).map((item) => (
                      <tr key={item.id} className="border-b border-stoneclough-blue/10 hover:bg-stoneclough-light/50">
                        <td className="py-3 px-4 text-stoneclough-gray-blue">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize px-2 py-1 bg-stoneclough-blue/10 text-stoneclough-blue text-xs rounded-full">
                            {item.dataType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stoneclough-blue font-medium">
                          {item.title}
                        </td>
                        <td className="py-3 px-4 text-stoneclough-gray-blue">
                          {item.amount ? `£${item.amount.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-stoneclough-gray-blue">No council data available at the moment.</p>
                <p className="text-sm text-stoneclough-gray-blue mt-2">
                  Data will be populated automatically from Bolton Council sources.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}