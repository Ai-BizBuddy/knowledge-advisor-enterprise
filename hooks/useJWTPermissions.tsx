'use client';

import { decodeJWT } from '@/utils/jwt';
import { createClient } from '@/utils/supabase/client';
import { useCallback, useEffect, useState } from 'react';

/**
 * Extended user type with custom claims
 * Based on actual Supabase JWT structure where custom claims are at root level
 */
interface ExtendedUser {
  id: string;
  email?: string;
  // Custom claims at root level (from custom_access_token_hook)
  permissions?: string[];
  roles?: string[];
  role?: string;
  department_id?: string;
  department_name?: string;
  // Standard Supabase metadata
  app_metadata?: {
    provider?: string;
    providers?: string[];
    [key: string]: unknown;
  };
  user_metadata?: {
    email?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Hook to get and check JWT permissions for conditional rendering
 * 
 * Usage:
 * ```tsx
 * const { hasPermission, hasAnyPermission, hasAllPermissions, permissions, roles, loading } = useJWTPermissions();
 * 
 * // Check single permission
 * {hasPermission('user:create') && <Button>Create User</Button>}
 * 
 * // Check multiple permissions (any)
 * {hasAnyPermission(['user:create', 'user:update']) && <Button>Add/Edit</Button>}
 * 
 * // Check all permissions required
 * {hasAllPermissions(['user:read', 'user:update']) && <Button>Edit</Button>}
 * ```
 */
export const useJWTPermissions = () => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  /**
   * Decode JWT token manually to extract custom claims
   * @param token - JWT access token string
   * @returns Decoded payload or null
   */
  const decodeJWTToken = (token: string): ExtendedUser | null => {
    return decodeJWT(token) as ExtendedUser | null;
  };

  /**
   * Load JWT permissions from Supabase session
   */
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true);
        
        // Get the current session with JWT token
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.warn('No active session found');
          setPermissions([]);
          setRoles([]);
          return;
        }

        // Method 1: Decode JWT manually to get ALL custom claims using utility function
        const decodedPayload = decodeJWTToken(session.access_token);
        
        if (!decodedPayload) {
          console.error('Failed to decode JWT token');
          setPermissions([]);
          setRoles([]);
          return;
        }

        // Method 2: Also check session.user (Supabase may filter some claims)
        const user = session.user as unknown as ExtendedUser;
        
        // Use decoded payload as primary source (has ALL claims)
        // Fallback to session.user if needed
        const userPermissions = decodedPayload.permissions || user.permissions || [];
        const userRoles = decodedPayload.roles || user.roles || [];
        
        setPermissions(Array.isArray(userPermissions) ? userPermissions : []);
        setRoles(Array.isArray(userRoles) ? userRoles : []);
        
        console.log('✅ JWT Permissions loaded:', { 
          permissions: userPermissions, 
          roles: userRoles,
          department_id: decodedPayload.department_id || user.department_id,
          department_name: decodedPayload.department_name || user.department_name,
          email: decodedPayload.email || user.email,
          source: decodedPayload.permissions ? 'decoded_jwt' : 'session_user'
        });
      } catch (error) {
        console.error('Error loading JWT permissions:', error);
        setPermissions([]);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();

    // Subscribe to auth changes to refresh permissions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadPermissions();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  /**
   * Check if user has a specific permission
   * @param permission - Permission string (e.g., 'user:create', 'knowledge-base:read')
   * @returns true if user has the permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  /**
   * Check if user has ANY of the specified permissions
   * @param permissionList - Array of permission strings
   * @returns true if user has at least one of the permissions
   */
  const hasAnyPermission = useCallback((permissionList: string[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission));
  }, [permissions]);

  /**
   * Check if user has ALL of the specified permissions
   * @param permissionList - Array of permission strings
   * @returns true if user has all of the permissions
   */
  const hasAllPermissions = useCallback((permissionList: string[]): boolean => {
    return permissionList.every(permission => permissions.includes(permission));
  }, [permissions]);

  /**
   * Check if user has a specific role
   * @param role - Role string (e.g., 'admin', 'user')
   * @returns true if user has the role
   */
  const hasRole = useCallback((role: string): boolean => {
    return roles.includes(role);
  }, [roles]);

  /**
   * Check if user has ANY of the specified roles
   * @param roleList - Array of role strings
   * @returns true if user has at least one of the roles
   */
  const hasAnyRole = useCallback((roleList: string[]): boolean => {
    return roleList.some(role => roles.includes(role));
  }, [roles]);

  /**
   * Check if user is an admin (has 'admin' role)
   * @returns true if user has admin role
   */
  const isAdmin = useCallback((): boolean => {
    return roles.includes('admin');
  }, [roles]);

  return {
    permissions,
    roles,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
  };
};
