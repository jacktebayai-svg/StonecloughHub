import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './useAuth'
import { wsClient, type WebSocketEvents } from '../lib/websocket'
import { getConfig } from '../config/environment'

const config = getConfig()

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: number
  read: boolean
  persistent?: boolean
  actionUrl?: string
  actionLabel?: string
  userId?: string
}

export interface NotificationPreferences {
  showToasts: boolean
  showInApp: boolean
  enableSound: boolean
  enableDesktop: boolean
  categories: {
    civic: boolean
    business: boolean
    forum: boolean
    system: boolean
    personal: boolean
  }
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  showToasts: true,
  showInApp: true,
  enableSound: true,
  enableDesktop: true,
  categories: {
    civic: true,
    business: true,
    forum: true,
    system: true,
    personal: true,
  }
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const [permissionGranted, setPermissionGranted] = useState(false)

  // Load preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('notification_preferences')
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
      } catch (error) {
        console.error('Failed to parse notification preferences:', error)
      }
    }
  }, [])

  // Save preferences to localStorage
  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPreferences }
    setPreferences(updated)
    localStorage.setItem('notification_preferences', JSON.stringify(updated))
  }, [preferences])

  // Request desktop notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      setPermissionGranted(true)
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      const granted = permission === 'granted'
      setPermissionGranted(granted)
      return granted
    }

    return false
  }, [])

  // Check notification permission on load
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted')
    }
  }, [])

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!preferences.enableSound) return

    try {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('Failed to play notification sound:', error)
    }
  }, [preferences.enableSound])

  // Show desktop notification
  const showDesktopNotification = useCallback((notification: Notification) => {
    if (!preferences.enableDesktop || !permissionGranted) return

    const desktopNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: notification.id,
      requireInteraction: notification.persistent,
    })

    desktopNotification.onclick = () => {
      window.focus()
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl
      }
      desktopNotification.close()
    }

    // Auto-close non-persistent notifications
    if (!notification.persistent) {
      setTimeout(() => {
        desktopNotification.close()
      }, 5000)
    }
  }, [preferences.enableDesktop, permissionGranted])

  // Show toast notification
  const showToast = useCallback((notification: Notification) => {
    if (!preferences.showToasts) return

    const toastOptions = {
      duration: notification.persistent ? Infinity : 4000,
      position: 'top-right' as const,
    }

    switch (notification.type) {
      case 'success':
        toast.success(notification.message, toastOptions)
        break
      case 'error':
        toast.error(notification.message, toastOptions)
        break
      case 'warning':
        toast.error(notification.message, toastOptions) // Use error styling for warnings
        break
      case 'info':
      default:
        toast(notification.message, toastOptions)
        break
    }
  }, [preferences.showToasts])

  // Add notification to state
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const fullNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
    }

    setNotifications(prev => [fullNotification, ...prev.slice(0, 99)]) // Keep only 100 notifications

    // Show notifications based on preferences
    if (preferences.showToasts) {
      showToast(fullNotification)
    }

    if (preferences.enableDesktop && permissionGranted) {
      showDesktopNotification(fullNotification)
    }

    if (preferences.enableSound) {
      playNotificationSound()
    }

    return fullNotification.id
  }, [preferences, permissionGranted, showToast, showDesktopNotification, playNotificationSound])

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // WebSocket event handlers
  useEffect(() => {
    if (!user || !config.features.realTime) return

    const handleNotification = (payload: WebSocketEvents['notification']) => {
      // Check if notification is for current user
      if (payload.userId && payload.userId !== user.id) return

      addNotification({
        title: payload.title,
        message: payload.message,
        type: payload.type,
        userId: payload.userId,
      })
    }

    const handleCivicUpdate = (payload: WebSocketEvents['civic_data_update']) => {
      if (!preferences.categories.civic) return

      addNotification({
        title: 'Civic Data Update',
        message: `New ${payload.type} data available`,
        type: 'info',
        actionUrl: '/dashboard',
        actionLabel: 'View Dashboard',
      })
    }

    const handleBusinessUpdate = (payload: WebSocketEvents['business_update']) => {
      if (!preferences.categories.business) return

      const actionText = payload.action === 'create' ? 'added' : 
                        payload.action === 'update' ? 'updated' : 'removed'

      addNotification({
        title: 'Business Update',
        message: `A business was ${actionText}: ${payload.business.name}`,
        type: 'info',
        actionUrl: `/business-directory`,
        actionLabel: 'View Businesses',
      })
    }

    const handleForumUpdate = (payload: WebSocketEvents['forum_update']) => {
      if (!preferences.categories.forum) return

      const actionText = payload.action === 'create' ? 'created' : 
                        payload.action === 'update' ? 'updated' : 'deleted'
      const itemType = payload.reply ? 'reply' : 'discussion'

      addNotification({
        title: 'Forum Update',
        message: `A ${itemType} was ${actionText}: ${payload.discussion.title}`,
        type: 'info',
        actionUrl: `/discussions`,
        actionLabel: 'View Discussions',
      })
    }

    const handleSystemAnnouncement = (payload: WebSocketEvents['system_announcement']) => {
      if (!preferences.categories.system) return

      addNotification({
        title: payload.title,
        message: payload.message,
        type: payload.priority === 'high' ? 'warning' : 'info',
        persistent: payload.priority === 'high',
      })
    }

    // Subscribe to WebSocket events
    wsClient.subscribeToNotifications(user.id, handleNotification)
    wsClient.subscribeToCivicUpdates(handleCivicUpdate)
    wsClient.subscribeToBusinessUpdates(handleBusinessUpdate)
    wsClient.subscribeToForumUpdates(handleForumUpdate)
    wsClient.subscribeToSystemAnnouncements(handleSystemAnnouncement)

    // Cleanup subscriptions
    return () => {
      wsClient.off('notification', handleNotification)
      wsClient.off('civic_data_update', handleCivicUpdate)
      wsClient.off('business_update', handleBusinessUpdate)
      wsClient.off('forum_update', handleForumUpdate)
      wsClient.off('system_announcement', handleSystemAnnouncement)
    }
  }, [user, preferences, addNotification])

  // Computed values
  const unreadCount = notifications.filter(n => !n.read).length
  const hasUnread = unreadCount > 0

  return {
    notifications,
    unreadCount,
    hasUnread,
    preferences,
    permissionGranted,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    updatePreferences,
    requestPermission,
  }
}
