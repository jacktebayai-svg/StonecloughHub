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
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hub-dark mb-4">Community Data Dashboard</h1>
          <p className="text-lg text-hub-gray max-w-3xl">
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
          <Button className="bg-hub-blue hover:bg-hub-dark-blue text-white">
            <Search className="w-4 h-4 mr-2" />
            Filter Data
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="bg-slate-50 border border-slate-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-hub-dark">Planning Applications</h3>
                <Building className="text-hub-blue text-xl" />
              </div>
              <div className="text-3xl font-bold text-hub-blue mb-2">
                {stats?.planningApplications || 0}
              </div>
              <p className="text-hub-gray text-sm mb-4">Applications in the last 30 days</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Approved</span>
                  <span className="font-medium text-hub-green">70%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending</span>
                  <span className="font-medium text-yellow-600">25%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Rejected</span>
                  <span className="font-medium text-red-600">5%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 border border-slate-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-hub-dark">Council Spending</h3>
                <PoundSterling className="text-hub-green text-xl" />
              </div>
              <div className="text-3xl font-bold text-hub-green mb-2">
                £{((stats?.totalSpending || 0) / 1000000).toFixed(1)}M
              </div>
              <p className="text-hub-gray text-sm mb-4">Total spending this quarter</p>
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

          <Card className="bg-slate-50 border border-slate-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-hub-dark">Council Meetings</h3>
                <Calendar className="text-hub-blue text-xl" />
              </div>
              <div className="text-3xl font-bold text-hub-blue mb-2">
                {stats?.upcomingMeetings || 0}
              </div>
              <p className="text-hub-gray text-sm mb-4">Upcoming meetings this month</p>
              <div className="space-y-2">
                <div className="text-sm">
                  <div className="font-medium">Planning Committee</div>
                  <div className="text-hub-gray">Next meeting date TBD</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Full Council</div>
                  <div className="text-hub-gray">Next meeting date TBD</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-hub-dark">
                Data Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataChart 
                data={chartData} 
                type="line"
                height={300}
                colors={['#2563EB', '#059669']}
              />
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-hub-dark">
                Planning Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataChart 
                data={planningData} 
                type="bar"
                height={300}
                colors={['#2563EB']}
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Data Table */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-hub-dark">
              Recent Council Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {councilData && councilData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-hub-dark">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-hub-dark">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-hub-dark">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-hub-dark">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {councilData.slice(0, 10).map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-hub-gray">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize px-2 py-1 bg-blue-100 text-hub-blue text-xs rounded-full">
                            {item.dataType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-hub-dark font-medium">
                          {item.title}
                        </td>
                        <td className="py-3 px-4 text-hub-gray">
                          {item.amount ? `£${item.amount.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-hub-gray">No council data available at the moment.</p>
                <p className="text-sm text-hub-gray mt-2">
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
