import { z } from 'zod'

// Environment schema for validation
const envSchema = z.object({
  // API Configuration
  VITE_API_URL: z.string().url().default('http://localhost:5000'),
  VITE_WS_URL: z.string().optional(),
  
  // Supabase Configuration
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  
  // Feature Flags
  VITE_ENABLE_ANALYTICS: z.string().default('false'),
  VITE_ENABLE_SENTRY: z.string().default('false'),
  VITE_ENABLE_PWA: z.string().default('true'),
  VITE_ENABLE_NOTIFICATIONS: z.string().default('true'),
  VITE_ENABLE_REAL_TIME: z.string().default('true'),
  
  // Application Configuration
  VITE_APP_NAME: z.string().default('Stoneclough Hub'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_APP_DESCRIPTION: z.string().default('Community hub for Stoneclough'),
  VITE_APP_URL: z.string().url().optional(),
  
  // External Services
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_GA_TRACKING_ID: z.string().optional(),
  
  // Cache Configuration
  VITE_CACHE_TIMEOUT: z.string().default('300000'), // 5 minutes
  VITE_MAX_CACHE_SIZE: z.string().default('100'),
  
  // Upload Configuration
  VITE_MAX_FILE_SIZE: z.string().default('10485760'), // 10MB
  VITE_ALLOWED_FILE_TYPES: z.string().default('image/*,application/pdf'),
  
  // Rate Limiting
  VITE_RATE_LIMIT_REQUESTS: z.string().default('100'),
  VITE_RATE_LIMIT_WINDOW: z.string().default('900000'), // 15 minutes
})

// Parse and validate environment variables
function parseEnvVars() {
  const envVars = {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_WS_URL: import.meta.env.VITE_WS_URL,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
    VITE_ENABLE_SENTRY: import.meta.env.VITE_ENABLE_SENTRY,
    VITE_ENABLE_PWA: import.meta.env.VITE_ENABLE_PWA,
    VITE_ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS,
    VITE_ENABLE_REAL_TIME: import.meta.env.VITE_ENABLE_REAL_TIME,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    VITE_APP_DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION,
    VITE_APP_URL: import.meta.env.VITE_APP_URL,
    VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID,
    VITE_CACHE_TIMEOUT: import.meta.env.VITE_CACHE_TIMEOUT,
    VITE_MAX_CACHE_SIZE: import.meta.env.VITE_MAX_CACHE_SIZE,
    VITE_MAX_FILE_SIZE: import.meta.env.VITE_MAX_FILE_SIZE,
    VITE_ALLOWED_FILE_TYPES: import.meta.env.VITE_ALLOWED_FILE_TYPES,
    VITE_RATE_LIMIT_REQUESTS: import.meta.env.VITE_RATE_LIMIT_REQUESTS,
    VITE_RATE_LIMIT_WINDOW: import.meta.env.VITE_RATE_LIMIT_WINDOW,
  }

  try {
    return envSchema.parse(envVars)
  } catch (error) {
    console.error('❌ Invalid environment configuration:', error)
    throw new Error('Invalid environment configuration. Please check your .env file.')
  }
}

// Parse environment variables once
const parsedEnv = parseEnvVars()

// Environment configuration object
export const config = {
  // Environment info
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
  
  // API Configuration
  api: {
    baseUrl: parsedEnv.VITE_API_URL,
    wsUrl: parsedEnv.VITE_WS_URL || parsedEnv.VITE_API_URL.replace(/^http/, 'ws'),
    timeout: 30000,
    retries: 3,
  },
  
  // Supabase Configuration
  supabase: {
    url: parsedEnv.VITE_SUPABASE_URL,
    anonKey: parsedEnv.VITE_SUPABASE_ANON_KEY,
  },
  
  // Feature Flags
  features: {
    analytics: parsedEnv.VITE_ENABLE_ANALYTICS === 'true',
    sentry: parsedEnv.VITE_ENABLE_SENTRY === 'true',
    pwa: parsedEnv.VITE_ENABLE_PWA === 'true',
    notifications: parsedEnv.VITE_ENABLE_NOTIFICATIONS === 'true',
    realTime: parsedEnv.VITE_ENABLE_REAL_TIME === 'true',
  },
  
  // Application Configuration
  app: {
    name: parsedEnv.VITE_APP_NAME,
    version: parsedEnv.VITE_APP_VERSION,
    description: parsedEnv.VITE_APP_DESCRIPTION,
    url: parsedEnv.VITE_APP_URL,
  },
  
  // External Services
  services: {
    googleMapsApiKey: parsedEnv.VITE_GOOGLE_MAPS_API_KEY,
    sentryDsn: parsedEnv.VITE_SENTRY_DSN,
    gaTrackingId: parsedEnv.VITE_GA_TRACKING_ID,
  },
  
  // Cache Configuration
  cache: {
    timeout: parseInt(parsedEnv.VITE_CACHE_TIMEOUT, 10),
    maxSize: parseInt(parsedEnv.VITE_MAX_CACHE_SIZE, 10),
  },
  
  // Upload Configuration
  upload: {
    maxFileSize: parseInt(parsedEnv.VITE_MAX_FILE_SIZE, 10),
    allowedTypes: parsedEnv.VITE_ALLOWED_FILE_TYPES.split(','),
  },
  
  // Rate Limiting
  rateLimit: {
    requests: parseInt(parsedEnv.VITE_RATE_LIMIT_REQUESTS, 10),
    windowMs: parseInt(parsedEnv.VITE_RATE_LIMIT_WINDOW, 10),
  },
} as const

// Environment-specific configurations
export const environmentConfigs = {
  development: {
    ...config,
    api: {
      ...config.api,
      baseUrl: 'http://localhost:5000',
      wsUrl: 'ws://localhost:5000',
    },
    features: {
      ...config.features,
      analytics: false,
      sentry: false,
    },
  },
  
  staging: {
    ...config,
    api: {
      ...config.api,
      timeout: 20000,
    },
    cache: {
      ...config.cache,
      timeout: 600000, // 10 minutes
    },
  },
  
  production: {
    ...config,
    api: {
      ...config.api,
      timeout: 15000,
    },
    cache: {
      ...config.cache,
      timeout: 900000, // 15 minutes
    },
  },
}

// Get current environment config
export function getConfig() {
  const env = import.meta.env.MODE as keyof typeof environmentConfigs
  return environmentConfigs[env] || config
}

// Validation functions
export function validateConfig() {
  const errors: string[] = []
  
  if (!config.supabase.url) {
    errors.push('VITE_SUPABASE_URL is required')
  }
  
  if (!config.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required')
  }
  
  if (config.features.analytics && !config.services.gaTrackingId) {
    errors.push('VITE_GA_TRACKING_ID is required when analytics is enabled')
  }
  
  if (config.features.sentry && !config.services.sentryDsn) {
    errors.push('VITE_SENTRY_DSN is required when Sentry is enabled')
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration validation errors:', errors)
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`)
  }
  
  console.log('✅ Configuration validated successfully')
  return true
}

// Initialize and validate configuration
validateConfig()

export default config
