import { useState, useEffect, useCallback } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getConfig } from '../config/environment'

const config = getConfig()

export interface SessionInfo {
  session: Session | null
  isActive: boolean
  expiresAt: Date | null
  timeUntilExpiry: number | null
  isExpiring: boolean // Less than 5 minutes remaining
  refreshToken: string | null
}

export interface SessionActions {
  refreshSession: () => Promise<{ error: Error | null }>
  extendSession: () => Promise<{ error: Error | null }>
  endSession: () => Promise<{ error: Error | null }>
  monitorSession: boolean
  setMonitorSession: (monitor: boolean) => void
}

const SESSION_CHECK_INTERVAL = 30000 // 30 seconds
const EXPIRY_WARNING_TIME = 5 * 60 * 1000 // 5 minutes
const AUTO_REFRESH_TIME = 10 * 60 * 1000 // 10 minutes before expiry

export function useSession(): SessionInfo & SessionActions {
  const [session, setSession] = useState<Session | null>(null)
  const [monitorSession, setMonitorSession] = useState(true)

  const getSessionInfo = useCallback((currentSession: Session | null): Omit<SessionInfo, 'session'> => {
    if (!currentSession) {
      return {
        isActive: false,
        expiresAt: null,
        timeUntilExpiry: null,
        isExpiring: false,
        refreshToken: null,
      }
    }

    const expiresAt = new Date(currentSession.expires_at! * 1000)
    const timeUntilExpiry = expiresAt.getTime() - Date.now()
    const isExpiring = timeUntilExpiry <= EXPIRY_WARNING_TIME
    const isActive = timeUntilExpiry > 0

    return {
      isActive,
      expiresAt,
      timeUntilExpiry,
      isExpiring,
      refreshToken: currentSession.refresh_token,
    }
  }, [])

  const refreshSession = useCallback(async (): Promise<{ error: Error | null }> => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Session refresh error:', error)
        return { error: new Error(error.message) }
      }

      if (data.session) {
        setSession(data.session)
      }

      return { error: null }
    } catch (error) {
      console.error('Session refresh error:', error)
      return { error: error as Error }
    }
  }, [])

  const extendSession = useCallback(async (): Promise<{ error: Error | null }> => {
    // In a real implementation, you might call a backend endpoint to extend session
    // For now, we'll just refresh the session
    return refreshSession()
  }, [refreshSession])

  const endSession = useCallback(async (): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Session end error:', error)
        return { error: new Error(error.message) }
      }

      setSession(null)
      return { error: null }
    } catch (error) {
      console.error('Session end error:', error)
      return { error: error as Error }
    }
  }, [])

  // Initialize session monitoring
  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }

    initializeSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Session auth state changed:', event, !!session)
        setSession(session)

        // Handle session events
        switch (event) {
          case 'SIGNED_IN':
            console.log('User signed in')
            break
          case 'SIGNED_OUT':
            console.log('User signed out')
            setSession(null)
            break
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed')
            break
          case 'USER_UPDATED':
            console.log('User updated')
            break
          case 'PASSWORD_RECOVERY':
            console.log('Password recovery initiated')
            break
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Session monitoring and auto-refresh
  useEffect(() => {
    if (!monitorSession || !session) return

    const interval = setInterval(async () => {
      const sessionInfo = getSessionInfo(session)
      
      if (!sessionInfo.isActive) {
        console.log('Session has expired')
        await endSession()
        return
      }

      // Auto-refresh if session is expiring soon
      if (sessionInfo.timeUntilExpiry! <= AUTO_REFRESH_TIME) {
        console.log('Auto-refreshing session')
        await refreshSession()
      }

      // Warn user if session is expiring
      if (sessionInfo.isExpiring) {
        console.log('Session expiring soon:', sessionInfo.timeUntilExpiry)
        // You could show a notification here
      }
    }, SESSION_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [session, monitorSession, getSessionInfo, refreshSession, endSession])

  // Security monitoring
  useEffect(() => {
    if (!session || !config.isProduction) return

    const checkSecurityEvents = () => {
      // Check for suspicious activity
      const lastActivity = localStorage.getItem('last_activity')
      const currentTime = Date.now()
      
      if (lastActivity) {
        const timeSinceLastActivity = currentTime - parseInt(lastActivity)
        // If inactive for more than 1 hour, consider ending session
        if (timeSinceLastActivity > 60 * 60 * 1000) {
          console.log('Long inactivity detected, ending session')
          endSession()
          return
        }
      }

      // Update last activity
      localStorage.setItem('last_activity', currentTime.toString())

      // Check for tab focus changes (potential security risk)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          console.log('Tab became inactive')
        } else {
          console.log('Tab became active')
          localStorage.setItem('last_activity', Date.now().toString())
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }

    const cleanup = checkSecurityEvents()
    
    // Run security checks periodically
    const securityInterval = setInterval(checkSecurityEvents, 5 * 60 * 1000) // Every 5 minutes

    return () => {
      cleanup?.()
      clearInterval(securityInterval)
    }
  }, [session, endSession])

  const sessionInfo = getSessionInfo(session)

  return {
    session,
    ...sessionInfo,
    refreshSession,
    extendSession,
    endSession,
    monitorSession,
    setMonitorSession,
  }
}

// Hook for session warnings and notifications
export function useSessionNotifications() {
  const { isExpiring, timeUntilExpiry, isActive } = useSession()
  const [hasWarned, setHasWarned] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setHasWarned(false)
      return
    }

    if (isExpiring && !hasWarned) {
      // Show session expiry warning
      const minutes = Math.floor((timeUntilExpiry || 0) / 60000)
      console.log(`Session expires in ${minutes} minutes`)
      
      // You could integrate with your notification system here
      // Example: toast.warning(`Your session expires in ${minutes} minutes`)
      
      setHasWarned(true)
    }
  }, [isExpiring, timeUntilExpiry, hasWarned, isActive])

  return {
    shouldShowWarning: isExpiring && isActive,
    timeUntilExpiry,
    hasWarned,
  }
}
