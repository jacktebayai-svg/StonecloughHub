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
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stoneclough-blue"></div>
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

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
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