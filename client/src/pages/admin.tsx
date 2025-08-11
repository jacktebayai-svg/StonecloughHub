import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Database, Download, RefreshCw } from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/seed", "POST"),
    onSuccess: () => {
      toast({
        title: "Database Seeded",
        description: "Sample data has been added to the database",
      });
    },
    onError: () => {
      toast({
        title: "Seeding Failed",
        description: "Could not seed the database",
        variant: "destructive",
      });
    },
  });

  const scrapeMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/scrape", "POST"),
    onSuccess: () => {
      toast({
        title: "Scraping Complete",
        description: "Data has been scraped from Bolton Council sources",
      });
    },
    onError: () => {
      toast({
        title: "Scraping Failed",
        description: "Could not scrape data from Bolton Council",
        variant: "destructive",
      });
    },
  });

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/scraper/status");
      const data = await response.json();
      
      toast({
        title: "Connection Test",
        description: data.connected 
          ? "Successfully connected to Bolton Council sources" 
          : "Cannot connect to Bolton Council sources",
        variant: data.connected ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: "Could not test connection to Bolton Council",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hub-dark mb-2">Admin Dashboard</h1>
          <p className="text-hub-gray">Manage data scraping and database operations</p>
        </div>

        {/* Warning */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="text-orange-600" size={20} />
            <p className="text-orange-800">
              These operations should only be performed by administrators. 
              Data scraping may take several minutes to complete.
            </p>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Database Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database size={20} />
                Database Operations
              </CardTitle>
              <CardDescription>
                Manage sample data and database state
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="w-full"
              >
                {seedMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Seed Database with Sample Data
              </Button>
              
              <p className="text-sm text-hub-gray">
                Adds sample planning applications, businesses, articles, and forum discussions 
                to demonstrate the platform features.
              </p>
            </CardContent>
          </Card>

          {/* Data Scraping */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download size={20} />
                Data Scraping
              </CardTitle>
              <CardDescription>
                Scrape live data from Bolton Council sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testConnection}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Test Connection to Bolton Council
              </Button>
              
              <Button 
                onClick={() => scrapeMutation.mutate()}
                disabled={scrapeMutation.isPending}
                className="w-full"
              >
                {scrapeMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Start Data Scraping
              </Button>
              
              <div className="text-sm text-hub-gray space-y-2">
                <p><strong>Sources:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Planning applications from paplanning.bolton.gov.uk</li>
                  <li>Council meetings and agendas from bolton.gov.uk</li>
                  <li>Spending and transparency data</li>
                </ul>
                <p className="text-xs mt-2">
                  The scraper goes multiple layers deep to extract complete datasets 
                  and respects rate limits with proper delays.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scraper Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Advanced Web Scraper Details</CardTitle>
            <CardDescription>
              Technical information about the Bolton Council data scraper
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Features</h4>
                <ul className="text-sm text-hub-gray space-y-1">
                  <li>• Multi-layer deep crawling</li>
                  <li>• Retry logic with exponential backoff</li>
                  <li>• Rate limiting and respectful delays</li>
                  <li>• Comprehensive error handling</li>
                  <li>• Data validation and cleaning</li>
                  <li>• Structured metadata extraction</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Data Sources</h4>
                <ul className="text-sm text-hub-gray space-y-1">
                  <li>• Planning Applications Portal</li>
                  <li>• Council Meeting Minutes</li>
                  <li>• Committee Agendas</li>
                  <li>• Transparency Data</li>
                  <li>• Spending Reports</li>
                  <li>• Decision Documents</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}