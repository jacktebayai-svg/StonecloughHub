import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-stoneclough-light">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-stoneclough-gray-blue" />
            <h1 className="text-2xl font-bold text-stoneclough-blue">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-stoneclough-gray-blue">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}