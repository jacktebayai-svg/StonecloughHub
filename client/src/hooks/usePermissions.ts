import React, { useMemo } from 'react'
import { useAuth } from './useAuth'
import type { UserRole, Permission, AuthUser } from './useAuth'

// Define available permissions
export const PERMISSIONS = {
  // User permissions
  'user:read': { action: 'read', resource: 'user' },
  'user:update': { action: 'update', resource: 'user' },
  'user:delete': { action: 'delete', resource: 'user' },
  
  // Profile permissions
  'profile:read': { action: 'read', resource: 'profile' },
  'profile:update': { action: 'update', resource: 'profile' },
  
  // Business permissions
  'business:create': { action: 'create', resource: 'business' },
  'business:read': { action: 'read', resource: 'business' },
  'business:update': { action: 'update', resource: 'business' },
  'business:delete': { action: 'delete', resource: 'business' },
  'business:moderate': { action: 'moderate', resource: 'business' },
  
  // Forum permissions
  'forum:create': { action: 'create', resource: 'forum' },
  'forum:read': { action: 'read', resource: 'forum' },
  'forum:update': { action: 'update', resource: 'forum' },
  'forum:delete': { action: 'delete', resource: 'forum' },
  'forum:moderate': { action: 'moderate', resource: 'forum' },
  
  // Blog permissions
  'blog:create': { action: 'create', resource: 'blog' },
  'blog:read': { action: 'read', resource: 'blog' },
  'blog:update': { action: 'update', resource: 'blog' },
  'blog:delete': { action: 'delete', resource: 'blog' },
  'blog:publish': { action: 'publish', resource: 'blog' },
  
  // Admin permissions
  'admin:dashboard': { action: 'access', resource: 'admin_dashboard' },
  'admin:users': { action: 'manage', resource: 'users' },
  'admin:roles': { action: 'manage', resource: 'roles' },
  'admin:settings': { action: 'manage', resource: 'settings' },
  'admin:analytics': { action: 'view', resource: 'analytics' },
  
  // Survey permissions
  'survey:create': { action: 'create', resource: 'survey' },
  'survey:read': { action: 'read', resource: 'survey' },
  'survey:update': { action: 'update', resource: 'survey' },
  'survey:delete': { action: 'delete', resource: 'survey' },
  'survey:respond': { action: 'respond', resource: 'survey' },
} as const

export type PermissionKey = keyof typeof PERMISSIONS

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  user: [
    'profile:read',
    'profile:update',
    'business:create',
    'business:read',
    'business:update',
    'forum:create',
    'forum:read',
    'forum:update',
    'blog:read',
    'survey:read',
    'survey:respond',
    'survey:create',
  ],
  
  moderator: [
    'profile:read',
    'profile:update',
    'business:read',
    'business:moderate',
    'forum:create',
    'forum:read',
    'forum:update',
    'forum:moderate',
    'forum:delete',
    'blog:read',
    'blog:create',
    'blog:update',
    'survey:read',
    'survey:respond',
    'survey:create',
  ],
  
  admin: [
    'user:read',
    'user:update',
    'user:delete',
    'profile:read',
    'profile:update',
    'business:create',
    'business:read',
    'business:update',
    'business:delete',
    'business:moderate',
    'forum:create',
    'forum:read',
    'forum:update',
    'forum:delete',
    'forum:moderate',
    'blog:create',
    'blog:read',
    'blog:update',
    'blog:delete',
    'blog:publish',
    'admin:dashboard',
    'admin:users',
    'admin:roles',
    'admin:settings',
    'admin:analytics',
    'survey:create',
    'survey:read',
    'survey:update',
    'survey:delete',
    'survey:respond',
  ],
}

export interface PermissionHookReturn {
  user: AuthUser | null
  hasPermission: (permission: PermissionKey | PermissionKey[]) => boolean
  canAccess: (resource: string, action: string) => boolean
  userPermissions: Permission[]
  isRole: (role: UserRole | UserRole[]) => boolean
  isAdmin: boolean
  isModerator: boolean
  isBusinessOwner: boolean
  canModerate: boolean
}

export function usePermissions(): PermissionHookReturn {
  const { user, userProfile } = useAuth()

  const userPermissions = useMemo(() => {
    if (!user || !userProfile) return []
    
    // Get permissions from user's role from userProfile
    const userRole = userProfile.role as UserRole
    const rolePermissions = ROLE_PERMISSIONS[userRole] || []
    const permissions = rolePermissions.map((key: PermissionKey) => PERMISSIONS[key])
    
    return permissions
  }, [user, userProfile])

  const hasPermission = (permission: PermissionKey | PermissionKey[]): boolean => {
    if (!user || !userProfile) return false
    
    const permissionsToCheck = Array.isArray(permission) ? permission : [permission]
    const userPerms = userPermissions.map((p: Permission) => `${p.action}:${p.resource}`)
    
    return permissionsToCheck.every(perm => {
      if (perm in PERMISSIONS) {
        const { action, resource } = PERMISSIONS[perm]
        return userPerms.includes(`${action}:${resource}`)
      }
      return false
    })
  }

  const canAccess = (resource: string, action: string): boolean => {
    if (!user || !userProfile) return false
    
    return userPermissions.some((p: Permission) => 
      p.resource === resource && p.action === action
    )
  }

  const isRole = (role: UserRole | UserRole[]): boolean => {
    if (!user || !userProfile) return false
    
    const rolesToCheck = Array.isArray(role) ? role : [role]
    return rolesToCheck.includes(userProfile.role as UserRole)
  }

  const isAdmin = useMemo(() => userProfile?.role === 'admin', [userProfile])
  const isModerator = useMemo(() => userProfile?.role === 'moderator' || isAdmin, [userProfile, isAdmin])
  // Business ownership is determined by profile.isBusinessOwner, not role
  const isBusinessOwner = useMemo(() => userProfile?.isBusinessOwner || false, [userProfile]) 
  const canModerate = useMemo(() => isModerator || isAdmin, [isModerator, isAdmin])

  return {
    user: user as AuthUser | null,
    hasPermission,
    canAccess,
    userPermissions,
    isRole,
    isAdmin,
    isModerator,
    isBusinessOwner,
    canModerate,
  }
}

// Higher-order component for permission-based rendering
export interface WithPermissionProps {
  permission?: PermissionKey | PermissionKey[]
  role?: UserRole | UserRole[]
  resource?: string
  action?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function WithPermission({
  permission,
  role,
  resource,
  action,
  fallback = null,
  children,
}: WithPermissionProps) {
  const { hasPermission, canAccess, isRole } = usePermissions()

  let hasAccess = true

  if (permission) {
    hasAccess = hasAccess && hasPermission(permission)
  }

  if (role) {
    hasAccess = hasAccess && isRole(role)
  }

  if (resource && action) {
    hasAccess = hasAccess && canAccess(resource, action)
  }

  return hasAccess ? children : fallback
}

// Hook for checking if user can perform an action on a specific resource instance
export function useResourcePermissions(resourceType: string, ownerId?: string) {
  const { user, hasPermission, canAccess, isAdmin } = usePermissions()
  
  const isOwner = user?.id === ownerId
  
  const canCreate = () => canAccess(resourceType, 'create')
  const canRead = () => canAccess(resourceType, 'read')
  const canUpdate = () => isOwner || isAdmin || canAccess(resourceType, 'update')
  const canDelete = () => isOwner || isAdmin || canAccess(resourceType, 'delete')
  const canModerate = () => isAdmin || canAccess(resourceType, 'moderate')
  
  return {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canModerate,
    isOwner,
  }
}
