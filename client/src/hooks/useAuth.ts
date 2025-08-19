import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function useAuth() {
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      // Check for mock session first
      const mockSession = localStorage.getItem('mock-session');
      if (mockSession) {
        const session = JSON.parse(mockSession);
        if (session?.access_token) {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            return data.user;
          }
        }
      }
      
      // Fallback to regular auth check
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        return await response.json();
      }
      
      return null;
    },
    retry: false, // Do not retry on auth failures
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  });

  const loginWithGoogle = () => {
    window.location.href = "/api/auth/google"; // Redirect to Google OAuth initiation
  };

  const logout = async () => {
    // Clear mock session
    localStorage.removeItem('mock-session');
    
    // Call logout endpoint
    await fetch("/api/logout");
    
    // Refetch to update state
    refetch();
    
    // Redirect to home
    window.location.href = '/';
  };

  // Listen for storage changes (when user signs in from another tab or the auth forms)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mock-session') {
        refetch(); // Refetch user data when session changes
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from the auth forms
    const handleAuthChange = () => {
      refetch();
    };
    
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [refetch]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginWithGoogle,
    logout,
    refetch, // Expose refetch for manual updates
  };
}
