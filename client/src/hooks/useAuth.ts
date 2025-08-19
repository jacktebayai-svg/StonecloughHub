import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { User } from '@supabase/supabase-js';

// Export types needed by usePermissions
export type UserRole = 'user' | 'moderator' | 'admin';
export type Permission = {
  action: string;
  resource: string;
};
export type AuthUser = User & {
  role: UserRole;
  permissions?: Permission[];
};

export function useAuth() {
  const {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  } = useAuthContext();

  // Backwards compatibility methods
  const loginWithGoogle = async () => {
    // Implement Google OAuth with Supabase if needed
    console.log('Google OAuth not yet implemented');
  };

  const logout = signOut;

  return {
    user,
    session,
    userProfile,
    isLoading: loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    loginWithGoogle,
    logout,
  };
}
