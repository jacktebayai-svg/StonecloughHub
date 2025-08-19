import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/user"], // This endpoint will now return the authenticated user
    retry: false, // Do not retry on auth failures
  });

  const loginWithGoogle = () => {
    window.location.href = "/api/auth/google"; // Redirect to Google OAuth initiation
  };

  const logout = async () => {
    // Implement logout logic here, e.g., redirect to a logout endpoint
    // For now, we'll just clear the user data and refetch
    await fetch("/api/logout"); // Assuming a /api/logout endpoint will be created
    refetch();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginWithGoogle,
    logout,
  };
}