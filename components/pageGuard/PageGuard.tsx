'use client';

import { AccessDenied } from '@/components/accessDenied';
import { useJWTPermissions } from '@/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppLoading } from '../AppLoading';
import type { PageGuardProps } from './PageGuard.types';

/**
 * PageGuard Component
 * 
 * Protects pages by checking user permissions before rendering content.
 * Shows loading state while checking, and AccessDenied component if unauthorized.
 * 
 * @example
 * ```tsx
 * // Require any of the listed permissions
 * <PageGuard requiredPermissions={['dashboard:read']}>
 *   <DashboardContent />
 * </PageGuard>
 * 
 * // Require all permissions
 * <PageGuard 
 *   requiredPermissions={['user:read', 'user:update']} 
 *   requirementType="all"
 * >
 *   <UserManagement />
 * </PageGuard>
 * 
 * // Redirect on denied access
 * <PageGuard 
 *   requiredPermissions={['admin:access']}
 *   redirectTo="/dashboard"
 * >
 *   <AdminPanel />
 * </PageGuard>
 * ```
 */
export const PageGuard: React.FC<PageGuardProps> = ({
  requiredPermissions = [],
  requirementType = 'any',
  deniedMessage,
  deniedTitle,
  redirectTo,
  showLoading = true,
  loadingComponent,
  children,
  className = '',
}) => {
  const router = useRouter();
  const { loading, hasAnyPermission, hasAllPermissions } = useJWTPermissions();

  // Check if user has required permissions
  const hasAccess = (() => {
    // If no permissions required, grant access
    if (requiredPermissions.length === 0) {
      return true;
    }

    // Check based on requirement type
    if (requirementType === 'all') {
      return hasAllPermissions(requiredPermissions);
    }
    
    return hasAnyPermission(requiredPermissions);
  })();

  // Handle redirect if access is denied
  useEffect(() => {
    if (!loading && !hasAccess && redirectTo) {
      router.push(redirectTo);
    }
  }, [loading, hasAccess, redirectTo, router]);

  // Show loading state
  if (loading && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <AppLoading 
        variant='fullscreen' 
        message='Checking permissions...' 
        className={className} 
      />
    );
  }

  // Show access denied (only if not redirecting)
  if (!loading && !hasAccess && !redirectTo) {
    const defaultMessage = requiredPermissions.length > 0
      ? `You need ${requirementType === 'all' ? 'all of these' : 'one of these'} permissions to access this page: ${requiredPermissions.join(', ')}`
      : 'You do not have permission to access this page.';

    return (
      <div className={className}>
        <AccessDenied
          title={deniedTitle}
          message={deniedMessage || defaultMessage}
        />
      </div>
    );
  }

  // Render children if has access or if redirecting
  if (!loading && hasAccess) {
    return <div className={className}>{children}</div>;
  }

  // Return null while redirecting
  return null;
};
