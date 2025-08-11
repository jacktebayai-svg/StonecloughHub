import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DataChart } from "@/components/charts/data-chart";

export default function Surveys() {
  const { data: surveys, isLoading } = useQuery({
    queryKey: ["/api/surveys"],
  });

  const activeSurveys = surveys?.filter(s => s.status === 'active') || [];
  const completedSurveys = surveys?.filter(s => s.status === 'closed') || [];

  // Sample data for survey results chart
  const sampleResults = [
    { label: 'Strongly Support', value: 45 },
    { label: 'Somewhat Support', value: 28 },
    { label: 'Neutral', value: 15 },
    { label: 'Oppose', value: 12 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-hub-dark mb-4">Community Surveys</h1>
          <p className="text-lg text-hub-gray max-w-3xl mx-auto">
            Have your voice heard on local issues. Participate in community surveys and see how your neighbors feel about topics that matter.
          </p>
        </div>

        {/* Active surveys */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-hub-dark mb-6">Active Surveys</h2>
          
          {isLoading ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <Card>
                    <CardContent className="p-6">
                      <div className="h-4 bg-slate-200 rounded mb-4"></div>
                      <div className="h-5 bg-slate-200 rounded mb-3"></div>
                      <div className="h-4 bg-slate-200 rounded mb-4"></div>
                      <div className="h-8 bg-slate-200 rounded"></div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : activeSurveys.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {activeSurveys.map((survey) => (
                <Card key={survey.id} className="bg-slate-50 border border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-hub-green text-white">Active Survey</Badge>
                      <span className="text-sm text-hub-gray">
                        {survey.endsAt ? 
                          `Ends ${new Date(survey.endsAt).toLocaleDateString()}` : 
                          'No end date'
                        }
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-hub-dark mb-3">
                      {survey.title}
                    </h3>
                    <p className="text-hub-gray mb-4">
                      {survey.description}
                    </p>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-hub-gray mb-2">
                        <span>Progress</span>
                        <span>{survey.responseCount} responses</span>
                      </div>
                      <Progress value={(survey.responseCount || 0) / 200 * 100} className="h-2" />
                    </div>
                    <Button className="w-full bg-hub-blue hover:bg-hub-dark-blue text-white">
                      Take Survey
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-hub-gray text-lg">
                  No active surveys at the moment.
                </p>
                <p className="text-sm text-hub-gray mt-2">
                  Check back soon for new community surveys.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Survey results preview */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-hub-dark mb-6">Recent Survey Results</h2>
          
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-hub-dark">
                Sample Survey Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-hub-dark mb-4">Traffic Management Survey Results</h4>
                  <div className="space-y-3">
                    {sampleResults.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.label}</span>
                          <span className="font-medium">{item.value}%</span>
                        </div>
                        <Progress value={item.value} className="h-2" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-hub-gray mt-4">238 total responses</p>
                </div>
                <div className="flex items-center justify-center">
                  <DataChart 
                    data={sampleResults} 
                    type="doughnut"
                    height={250}
                    colors={['#059669', '#3B82F6', '#64748B', '#EF4444']}
                  />
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200">
                <Button variant="ghost" className="text-hub-blue hover:text-hub-dark-blue">
                  View Full Survey Results →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completed surveys */}
        {completedSurveys.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-hub-dark mb-6">Completed Surveys</h2>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {completedSurveys.map((survey) => (
                <Card key={survey.id} className="border border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary">Completed</Badge>
                      <span className="text-sm text-hub-gray">
                        Ended {survey.endsAt ? new Date(survey.endsAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-hub-dark mb-3">
                      {survey.title}
                    </h3>
                    <p className="text-hub-gray mb-4">
                      {survey.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-hub-gray">
                        {survey.responseCount} total responses
                      </span>
                      <Button variant="ghost" size="sm" className="text-hub-blue hover:text-hub-dark-blue">
                        View Results →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
