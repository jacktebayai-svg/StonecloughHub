import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions, useSession, type UserRole, type PermissionKey } from '../src/hooks/usePermissions';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Alert, AlertDescription } from '../ui/alert';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: PermissionKey | PermissionKey[];
  resource?: string;
  action?: string;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  showUnauthorized?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requiredPermission,
  resource,
  action,
  requireAuth = true,
  fallback,
  showUnauthorized = true
}) => {
  const { user, loading } = useAuth();
  const { hasPermission, canAccess, isRole } = usePermissions();
  const { isActive } = useSession();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check session validity
  if (requireAuth && !isActive) {
    return <Navigate to="/auth" state={{ from: location, reason: 'session_expired' }} replace />;
  }

  // Check role requirements
  if (requiredRole && !isRole(requiredRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showUnauthorized) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <AlertDescription>
              You don't have permission to access this page. Required role: {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    return <Navigate to="/dashboard" replace />;
  }

  // Check permission requirements
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showUnauthorized) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <AlertDescription>
              You don't have permission to perform this action.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    return <Navigate to="/dashboard" replace />;
  }

  // Check resource-action permissions
  if (resource && action && !canAccess(resource, action)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showUnauthorized) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <AlertDescription>
              You don't have permission to {action} {resource}.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
