import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, auth } from '@/lib/supabase'
import { api } from '@/lib/api'

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: any | null
  loading: boolean
  isLoading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, userData: { firstName: string; lastName: string }) => Promise<{ data: any; error: any }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ data: any; error: any }>
  updatePassword: (password: string) => Promise<{ data: any; error: any }>
  updateProfile: (data: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Auth loading timeout - forcing loading to false')
      setLoading(false)
    }, 5000) // 5 second timeout

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        // Don't wait for profile - set loading to false immediately after auth check
        setLoading(false)
        clearTimeout(timeoutId)
        
        // Fetch profile in background without blocking loading
        if (session?.user) {
          fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          } else {
            setUserProfile(null)
          }
        } catch (error) {
          console.error('Error in auth state change:', error)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const profile = await api.profile.get(userId)
      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Set a basic profile if API call fails
      setUserProfile({ id: userId, role: 'user' })
    }
  }

  const signUp = async (email: string, password: string, userData: { firstName: string; lastName: string }) => {
    const result = await auth.signUp(email, password, userData)
    return result
  }

  const signIn = async (email: string, password: string) => {
    const result = await auth.signIn(email, password)
    return result
  }

  const signOut = async () => {
    const result = await auth.signOut()
    if (!result.error) {
      setUserProfile(null)
    }
    return result
  }

  const resetPassword = async (email: string) => {
    return await auth.resetPassword(email)
  }

  const updatePassword = async (password: string) => {
    return await auth.updatePassword(password)
  }

  const updateProfile = async (data: any) => {
    if (!user) throw new Error('No user logged in')
    
    try {
      const updatedProfile = await api.profile.update(user.id, data)
      setUserProfile(updatedProfile)
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const value = {
    user,
    session,
    userProfile,
    loading,
    isLoading: loading,
    isAuthenticated: !!user && !!session,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
