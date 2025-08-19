import React from 'react';
import { useLocation } from 'wouter';
import { AuthForms } from '../../components/auth/AuthForms';
import { useAuthContext } from '../../contexts/AuthContext';

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuthContext();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!loading && user) {
      setLocation('/');
    }
  }, [user, loading, setLocation]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthForms
          onSuccess={() => setLocation('/')}
          redirectTo="/"
        />
      </div>
    </div>
  );
}
