import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary, { LoadingBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Landing from "./pages/landing";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

// Lazy load components for better performance
const Home = lazy(() => import("@/pages/home"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Directory = lazy(() => import("@/pages/directory"));
const Forum = lazy(() => import("@/pages/forum"));
const Blog = lazy(() => import("@/pages/blog"));
const Surveys = lazy(() => import("@/pages/surveys"));
const Admin = lazy(() => import("@/pages/admin"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const Civic = lazy(() => import("@/pages/civic"));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
    <div className="text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4">
          <div className="absolute inset-2 bg-white rounded-full"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full w-24 mx-auto mb-2"></div>
          <div className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full w-16 mx-auto"></div>
        </div>
      </div>
      <p className="text-gray-600 font-medium mt-4">Loading Community Hub...</p>
    </div>
  </div>
);

// HOC to wrap lazy components with Suspense
const withSuspense = (Component: React.ComponentType) => (props: any) => (
  <Suspense fallback={<PageLoader />}>
    <Component {...props} />
  </Suspense>
);

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while authentication is being determined
  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Switch>
      {/* Landing page - always accessible */}
      <Route path="/landing" component={Landing} />
      
      {/* Protected routes */}
      {isAuthenticated ? (
        <>
          <Route path="/" component={withSuspense(Home)} />
          <Route path="/dashboard" component={withSuspense(Dashboard)} />
          <Route path="/directory" component={withSuspense(Directory)} />
          <Route path="/forum" component={withSuspense(Forum)} />
          <Route path="/blog" component={withSuspense(Blog)} />
          <Route path="/surveys" component={withSuspense(Surveys)} />
          <Route path="/civic" component={withSuspense(Civic)} />
          <Route path="/admin" component={withSuspense(Admin)} />
          <Route path="/profile" component={withSuspense(ProfilePage)} />
        </>
      ) : (
        /* Show landing page when not authenticated, redirect protected routes */
        <>
          <Route path="/" component={Landing} />
          <Route path="/profile" component={Landing} />
          <Route path="/dashboard" component={Landing} />
          <Route path="/directory" component={Landing} />
          <Route path="/forum" component={Landing} />
          <Route path="/blog" component={Landing} />
          <Route path="/surveys" component={Landing} />
          <Route path="/civic" component={Landing} />
          <Route path="/admin" component={Landing} />
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LoadingBoundary>
            <TooltipProvider>
              <Toaster />
              <Router />
              <BottomNavigation />
            </TooltipProvider>
          </LoadingBoundary>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;