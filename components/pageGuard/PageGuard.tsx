'use client';

import { AccessDenied } from '@/components/accessDenied';
import { useJWTPermissions } from '@/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
      <div className={`flex min-h-[50vh] items-center justify-center ${className}`}>
        <div className='text-center'>
          <svg
            aria-hidden='true'
            className='mx-auto h-12 w-12 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600'
            viewBox='0 0 100 101'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
              fill='currentColor'
            />
            <path
              d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
              fill='currentFill'
            />
          </svg>
          <p className='mt-4 text-sm text-gray-500 dark:text-gray-400'>
            Checking permissions...
          </p>
        </div>
      </div>
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
