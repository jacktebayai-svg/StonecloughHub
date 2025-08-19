import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'user' | 'admin' | 'moderator' | 'business_owner';

export interface Permission {
  action: string;
  resource: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  permissions?: Permission[];
  email_confirmed?: boolean;
  phone_verified?: boolean;
  two_factor_enabled?: boolean;
  last_active?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  profileImageUrl?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy?: {
      profileVisible: boolean;
      showEmail: boolean;
      showPhone: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  session: Session | null;
}

export interface AuthActions {
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (data: Partial<UserProfile & { name?: string }>) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  // Refresh user data from API
  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setProfile(data.profile);
        } else {
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setProfile(null);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        
        if (session) {
          await refreshUser();
        } else {
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: { message: data.message } as AuthError };
      }

      // Sign in after successful signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error: signInError };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: { message: 'An error occurred during signup' } as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      console.error('Signin error:', error);
      return { error: { message: 'An error occurred during signin' } as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        setUser(null);
        setProfile(null);
        setSession(null);
      }
      
      return { error };
    } catch (error) {
      console.error('Signout error:', error);
      return { error: { message: 'An error occurred during signout' } as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: { message: data.message } as AuthError };
      }

      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: { message: 'An error occurred during password reset' } as AuthError };
    }
  };

  // Update password
  const updatePassword = async (password: string) => {
    try {
      if (!session?.access_token) {
        return { error: { message: 'Not authenticated' } as AuthError };
      }

      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: { message: data.message } as AuthError };
      }

      return { error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: { message: 'An error occurred during password update' } as AuthError };
    }
  };

  // Update profile
  const updateProfile = async (data: Partial<UserProfile & { name?: string }>) => {
    try {
      if (!session?.access_token) {
        return { error: new Error('Not authenticated') };
      }

      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        return { error: new Error(responseData.message) };
      }

      // Refresh user data
      await refreshUser();

      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: error as Error };
    }
  };

  return {
    user,
    profile,
    loading,
    session,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshUser,
  };
}
