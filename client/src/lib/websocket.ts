import { getConfig } from '../config/environment'
import { supabase } from './supabase'

const config = getConfig()

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
  id?: string
}

export interface WebSocketEvents {
  'civic_data_update': { type: 'planning' | 'council' | 'news', data: any }
  'business_update': { action: 'create' | 'update' | 'delete', business: any }
  'forum_update': { action: 'create' | 'update' | 'delete', discussion: any, reply?: any }
  'notification': { title: string, message: string, type: 'info' | 'success' | 'warning' | 'error', userId?: string }
  'user_activity': { userId: string, action: string, timestamp: number }
  'system_announcement': { title: string, message: string, priority: 'low' | 'medium' | 'high' }
}

export type WebSocketEventType = keyof WebSocketEvents

class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private messageQueue: WebSocketMessage[] = []
  private eventHandlers = new Map<string, Function[]>()
  private isConnecting = false
  private isAuthenticated = false

  constructor(url: string) {
    this.url = url
    this.setupHeartbeat()
  }

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true

    try {
      // Get auth token for WebSocket connection
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const wsUrl = token ? `${this.url}?token=${token}` : this.url
      
      this.ws = new WebSocket(wsUrl)
      this.setupEventListeners()
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'))
        }, 10000)

        this.ws!.onopen = () => {
          clearTimeout(timeout)
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.isAuthenticated = !!token
          console.log('WebSocket connected')
          
          // Send queued messages
          this.flushMessageQueue()
          
          resolve()
        }

        this.ws!.onerror = (error) => {
          clearTimeout(timeout)
          this.isConnecting = false
          console.error('WebSocket connection error:', error)
          reject(error)
        }
      })
    } catch (error) {
      this.isConnecting = false
      console.error('Failed to connect WebSocket:', error)
      throw error
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason)
      this.isAuthenticated = false
      
      // Attempt to reconnect unless it was a deliberate close
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  private scheduleReconnect(): void {
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('WebSocket reconnect failed:', error)
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      })
    }, delay)
  }

  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          payload: { timestamp: Date.now() },
          timestamp: Date.now()
        })
      }
    }, 30000) // Send heartbeat every 30 seconds
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle system messages
    if (message.type === 'heartbeat_ack') {
      return
    }

    if (message.type === 'auth_required') {
      console.log('WebSocket authentication required')
      this.authenticate()
      return
    }

    if (message.type === 'auth_success') {
      this.isAuthenticated = true
      console.log('WebSocket authentication successful')
      return
    }

    // Emit event to handlers
    this.emit(message.type, message.payload)
  }

  private async authenticate(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      this.send({
        type: 'authenticate',
        payload: { token: session.access_token },
        timestamp: Date.now()
      })
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // Queue message for later
      this.messageQueue.push(message)
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message))
      }
    }
  }

  on<T extends WebSocketEventType>(event: T, handler: (payload: WebSocketEvents[T]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off<T extends WebSocketEventType>(event: T, handler: (payload: WebSocketEvents[T]) => void): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(event: string, payload: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload)
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error)
        }
      })
    }
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.eventHandlers.clear()
    this.messageQueue = []
    this.isAuthenticated = false
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  get connectionState(): string {
    if (!this.ws) return 'disconnected'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting'
      case WebSocket.OPEN: return 'connected'
      case WebSocket.CLOSING: return 'closing'
      case WebSocket.CLOSED: return 'closed'
      default: return 'unknown'
    }
  }

  // Convenience methods for common events
  subscribeToNotifications(userId: string, handler: (notification: WebSocketEvents['notification']) => void): void {
    this.on('notification', (payload) => {
      if (!payload.userId || payload.userId === userId) {
        handler(payload)
      }
    })
  }

  subscribeToCivicUpdates(handler: (update: WebSocketEvents['civic_data_update']) => void): void {
    this.on('civic_data_update', handler)
  }

  subscribeToBusinessUpdates(handler: (update: WebSocketEvents['business_update']) => void): void {
    this.on('business_update', handler)
  }

  subscribeToForumUpdates(handler: (update: WebSocketEvents['forum_update']) => void): void {
    this.on('forum_update', handler)
  }

  subscribeToSystemAnnouncements(handler: (announcement: WebSocketEvents['system_announcement']) => void): void {
    this.on('system_announcement', handler)
  }
}

// Create singleton instance
export const wsClient = new WebSocketClient(config.api.wsUrl)

// Auto-connect if real-time features are enabled
if (config.features.realTime) {
  wsClient.connect().catch(console.error)
}

export default wsClient
