import { supabase } from './supabase'
import { getConfig } from '../config/environment'

const config = getConfig()
const API_BASE_URL = config.api.baseUrl

// TypeScript types for API responses
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success?: boolean
}

export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: any
}

export interface ApiOptions extends RequestInit {
  skipAuth?: boolean
  skipCache?: boolean
  timeout?: number
  retries?: number
}

interface CacheEntry {
  data: any
  timestamp: number
  expiry: number
}

export class ApiError extends Error {
  status?: number
  code?: string
  details?: any

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

class ApiClient {
  private baseURL: string
  private cache = new Map<string, CacheEntry>()
  private requestQueue = new Map<string, Promise<any>>()
  private readonly defaultTimeout = config.api.timeout
  private readonly defaultRetries = config.api.retries
  private readonly cacheTimeout = config.cache.timeout

  constructor(baseURL: string) {
    this.baseURL = baseURL
    
    // Clear cache when it exceeds max size
    if (this.cache.size > config.cache.maxSize) {
      this.clearCache()
    }
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession()
    
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        'Authorization': `Bearer ${session.access_token}`
      })
    }
  }

  private getCacheKey(url: string, options: ApiOptions): string {
    const method = options.method || 'GET'
    const body = options.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  private getFromCache(cacheKey: string): any | null {
    const entry = this.cache.get(cacheKey)
    if (!entry) return null
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(cacheKey)
      return null
    }
    
    return entry.data
  }

  private setCache(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + this.cacheTimeout
    })
  }

  private async requestWithTimeout(url: string, config: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        throw new ApiError('Request timeout', 408, 'TIMEOUT')
      }
      throw error
    }
  }

  private async requestWithRetry<T>(
    url: string,
    config: RequestInit,
    retries: number,
    timeout: number
  ): Promise<Response> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.requestWithTimeout(url, config, timeout)
        
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          return response
        }
        
        // Retry on server errors (5xx) and network errors
        if (response.status >= 500 && attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000) // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        return response
      } catch (error) {
        lastError = error as Error
        
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
    }
    
    throw lastError || new ApiError('Max retries exceeded')
  }

  private async request<T>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const timeout = options.timeout || this.defaultTimeout
    const retries = options.retries ?? this.defaultRetries
    const cacheKey = this.getCacheKey(url, options)
    
    // Check cache for GET requests
    if ((!options.method || options.method === 'GET') && !options.skipCache) {
      const cachedData = this.getFromCache(cacheKey)
      if (cachedData) {
        return cachedData
      }
      
      // Check if request is already in progress
      const ongoingRequest = this.requestQueue.get(cacheKey)
      if (ongoingRequest) {
        return ongoingRequest
      }
    }
    
    const requestPromise = this.executeRequest<T>(url, options, timeout, retries, cacheKey)
    
    // Store promise in queue for deduplication
    if ((!options.method || options.method === 'GET') && !options.skipCache) {
      this.requestQueue.set(cacheKey, requestPromise)
      requestPromise.finally(() => {
        this.requestQueue.delete(cacheKey)
      })
    }
    
    return requestPromise
  }

  private async executeRequest<T>(
    url: string,
    options: ApiOptions,
    timeout: number,
    retries: number,
    cacheKey: string
  ): Promise<T> {
    const headers = options.skipAuth ? {} : await this.getAuthHeaders()

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    }

    const response = await this.requestWithRetry(url, config, retries, timeout)

    if (!response.ok) {
      let errorData: any = { message: 'Network error' }
      try {
        errorData = await response.json()
      } catch (e) {
        // Fallback if response is not JSON
      }
      
      throw new ApiError(
        errorData.message || errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData.code,
        errorData.details
      )
    }

    const data = await response.json()
    
    // Cache GET requests
    if ((!options.method || options.method === 'GET') && !options.skipCache) {
      this.setCache(cacheKey, data)
    }

    return data
  }

  public clearCache(): void {
    this.cache.clear()
    this.requestQueue.clear()
  }

  public getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }

  // Auth endpoints
  auth = {
    me: () => this.request<any>('/api/auth/me'),
    updateProfile: (data: any) => this.request<any>('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  }

  // Council Data endpoints
  councilData = {
    getStats: () => this.request<any>('/api/council-data/stats'),
    getData: (type?: string, limit?: number) => {
      const params = new URLSearchParams()
      if (type) params.append('type', type)
      if (limit) params.append('limit', limit.toString())
      return this.request<any[]>(`/api/council-data?${params}`)
    },
  }

  // Business endpoints
  businesses = {
    getAll: (category?: string, limit?: number) => {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (limit) params.append('limit', limit.toString())
      return this.request<any[]>(`/api/businesses?${params}`)
    },
    getById: (id: string) => this.request<any>(`/api/businesses/${id}`),
    getPromoted: (limit?: number) => {
      const params = new URLSearchParams()
      if (limit) params.append('limit', limit.toString())
      return this.request<any[]>(`/api/businesses/promoted?${params}`)
    },
    search: (query: string) => {
      const params = new URLSearchParams({ q: query })
      return this.request<any[]>(`/api/businesses/search?${params}`)
    },
    create: (data: any) => this.request<any>('/api/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => this.request<any>(`/api/businesses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/api/businesses/${id}`, {
      method: 'DELETE',
    }),
  }

  // Forum endpoints
  forum = {
    getDiscussions: (category?: string, limit?: number) => {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (limit) params.append('limit', limit.toString())
      return this.request<any[]>(`/api/forum/discussions?${params}`)
    },
    getDiscussion: (id: string) => this.request<any>(`/api/forum/discussions/${id}`),
    createDiscussion: (data: any) => this.request<any>('/api/forum/discussions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateDiscussion: (id: string, data: any) => this.request<any>(`/api/forum/discussions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    deleteDiscussion: (id: string) => this.request<void>(`/api/forum/discussions/${id}`, {
      method: 'DELETE',
    }),
    getReplies: (discussionId: string) => this.request<any[]>(`/api/forum/discussions/${discussionId}/replies`),
    createReply: (discussionId: string, data: any) => this.request<any>(`/api/forum/discussions/${discussionId}/replies`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    deleteReply: (id: string) => this.request<void>(`/api/forum/replies/${id}`, {
      method: 'DELETE',
    }),
  }

  // Blog endpoints
  blog = {
    getArticles: (limit?: number) => {
      const params = new URLSearchParams()
      if (limit) params.append('limit', limit.toString())
      return this.request<any[]>(`/api/blog/articles?${params}`)
    },
    getArticle: (id: string) => this.request<any>(`/api/blog/articles/${id}`),
    getFeatured: () => this.request<any>('/api/blog/articles/featured'),
    getPromoted: (limit?: number) => {
      const params = new URLSearchParams()
      if (limit) params.append('limit', limit.toString())
      return this.request<any[]>(`/api/blog/articles/promoted?${params}`)
    },
    create: (data: any) => this.request<any>('/api/blog/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => this.request<any>(`/api/blog/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/api/blog/articles/${id}`, {
      method: 'DELETE',
    }),
  }

  // Survey endpoints
  surveys = {
    getAll: (status?: string) => {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      return this.request<any[]>(`/api/surveys?${params}`)
    },
    getById: (id: string) => this.request<any>(`/api/surveys/${id}`),
    create: (data: any) => this.request<any>('/api/surveys', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => this.request<any>(`/api/surveys/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/api/surveys/${id}`, {
      method: 'DELETE',
    }),
    submitResponse: (id: string, responses: any) => this.request<any>(`/api/surveys/${id}/responses`, {
      method: 'POST',
      body: JSON.stringify({ responses }),
    }),
    getResults: (id: string) => this.request<any>(`/api/surveys/${id}/results`),
  }

  // Search endpoint
  search = {
    global: (query: string, type?: string, category?: string, sort?: string, limit?: number) => {
      const params = new URLSearchParams({ q: query })
      if (type) params.append('type', type)
      if (category) params.append('category', category)
      if (sort) params.append('sort', sort)
      if (limit) params.append('limit', limit.toString())
      return this.request<any[]>(`/api/search?${params}`)
    },
  }

  // File upload endpoints
  upload = {
    image: async (file: File, category?: string, resize?: string) => {
      const formData = new FormData()
      formData.append('image', file)
      if (category) formData.append('category', category)
      if (resize) formData.append('resize', resize)

      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${this.baseURL}/api/upload/images`, {
        method: 'POST',
        headers: {
          ...(session?.access_token && {
            'Authorization': `Bearer ${session.access_token}`
          })
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(error.message)
      }

      return response.json()
    },

    document: async (file: File) => {
      const formData = new FormData()
      formData.append('document', file)

      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${this.baseURL}/api/upload/documents`, {
        method: 'POST',
        headers: {
          ...(session?.access_token && {
            'Authorization': `Bearer ${session.access_token}`
          })
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(error.message)
      }

      return response.json()
    },
  }

  // Profile endpoints
  profile = {
    get: (userId: string) => this.request<any>(`/api/profile/${userId}`),
    update: (userId: string, data: any) => this.request<any>(`/api/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  }

  // User endpoints
  users = {
    getBusinesses: (userId: string) => this.request<any[]>(`/api/users/${userId}/businesses`),
    createBusiness: (userId: string, data: any) => this.request<any>(`/api/users/${userId}/businesses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getSkills: (userId: string) => this.request<any[]>(`/api/users/${userId}/skills`),
    addSkill: (userId: string, name: string, level: string) => this.request<any>(`/api/users/${userId}/skills`, {
      method: 'POST',
      body: JSON.stringify({ name, level }),
    }),
    removeSkill: (userId: string, skillId: string) => this.request<void>(`/api/users/${userId}/skills/${skillId}`, {
      method: 'DELETE',
    }),
  }

  // Admin endpoints
  admin = {
    getDashboard: () => this.request<any>('/api/admin/dashboard'),
    getUsers: (page?: number, limit?: number, role?: string, search?: string) => {
      const params = new URLSearchParams()
      if (page) params.append('page', page.toString())
      if (limit) params.append('limit', limit.toString())
      if (role) params.append('role', role)
      if (search) params.append('search', search)
      return this.request<any>(`/api/admin/users?${params}`)
    },
    updateUserRole: (userId: string, role: string) => this.request<any>(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
    getPendingBusinesses: (page?: number, limit?: number) => {
      const params = new URLSearchParams()
      if (page) params.append('page', page.toString())
      if (limit) params.append('limit', limit.toString())
      return this.request<any>(`/api/admin/businesses/pending?${params}`)
    },
    moderateBusiness: (id: string, action: string, reason?: string) => this.request<any>(`/api/admin/businesses/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ action, reason }),
    }),
    sendNewsletter: (subject: string, content: string, recipients?: string[]) => this.request<any>('/api/admin/emails/send-newsletter', {
      method: 'POST',
      body: JSON.stringify({ subject, content, recipients }),
    }),
  }
}

export const api = new ApiClient(API_BASE_URL)
export default api
