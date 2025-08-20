import { Switch, Route } from "wouter";
import { lazy, Suspense, useEffect } from "react";
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

// Lazy load components for better performance with preloading
const Home = lazy(() => import("@/pages/home"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Directory = lazy(() => import("@/pages/directory"));
const Forum = lazy(() => import("@/pages/forum"));
const Blog = lazy(() => import("@/pages/blog"));
const Surveys = lazy(() => import("@/pages/surveys"));
const Admin = lazy(() => import("@/pages/admin"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const Civic = lazy(() => import("@/pages/civic"));

// Preload commonly used components
const preloadComponents = () => {
  // Preload most common pages after initial load
  setTimeout(() => {
    import("@/pages/home");
    import("@/pages/directory");
    import("@/pages/forum");
  }, 2000);
};

// Fast loading component for better UX
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
    <div className="text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
      </div>
      <p className="text-gray-600 font-medium text-sm">Loading...</p>
    </div>
  </div>
);

// Minimal loading for page transitions
const FastLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
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
  // Preload components after initial app load
  useEffect(() => {
    preloadComponents();
  }, []);

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