import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import LandingPage from './components/landing/LandingPage';
import AuthPage from './components/auth/AuthPage';
import CivicDashboard from './components/dashboard/CivicDashboard';
import IntelligentSearch from './components/search/IntelligentSearch';
import BusinessManagement from './components/business/BusinessManagement';
import DiscussionsBoard from './components/discussions/DiscussionsBoard';
import BusinessDirectory from './components/business/BusinessDirectory';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/business-directory" element={<BusinessDirectory />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <CivicDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/search" element={
            <ProtectedRoute>
              <Layout>
                <IntelligentSearch />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/discussions/*" element={
            <ProtectedRoute>
              <Layout>
                <DiscussionsBoard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/my-business" element={
            <ProtectedRoute>
              <Layout>
                <BusinessManagement />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Catch all - redirect to appropriate page */}
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
        </Routes>
        
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: '#4aed88',
              },
            },
          }}
        />
      </div>
    </Router>
  );
};

export default App;
