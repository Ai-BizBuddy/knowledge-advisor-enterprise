'use client';
/**
 * Permissions Hook
 *
 * Hook for checking user permissions and controlling
 * feature access throughout the application.
 */

import type {
  FeatureAccess,
  Permission,
  User,
  UserSession,
} from '@/interfaces/UserManagement';
import UserManagementService from '@/services/UserManagementService';
import { createClient } from '@/utils/supabase/client';
import { useCallback, useEffect, useState } from 'react';

interface UsePermissionsState {
  currentUser: User | null;
  permissions: Permission[];
  features: FeatureAccess[];
  userSession: UserSession | null;
  loading: boolean;
  error: string | null;
}

interface UsePermissionsActions {
  checkPermission: (resource: string, action: string) => boolean;
  hasFeatureAccess: (feature: string) => boolean;
  canAccessMenu: (menuItem: string) => boolean;
  refreshPermissions: () => Promise<void>;
  clearError: () => void;
}

export interface UsePermissions
  extends UsePermissionsState,
    UsePermissionsActions {}

// Use real UserManagementService (no mock data)
const userManagementService = new UserManagementService();

export const usePermissions = (): UsePermissions => {
  const [state, setState] = useState<UsePermissionsState>({
    currentUser: null,
    permissions: [],
    features: [],
    userSession: null,
    loading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  /**
   * Load user permissions and session data
   */
  const loadUserPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState((prev) => ({
          ...prev,
          currentUser: null,
          permissions: [],
          features: [],
          userSession: null,
        }));
        return;
      }

      // Get user session with permissions
      const userSession = await userManagementService.getUserSession(user.id);

      setState((prev) => ({
        ...prev,
        currentUser: userSession.user,
        permissions: userSession.permissions,
        features: userSession.features,
        userSession,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load permissions';
      setError(errorMessage);
          } finally {
      setLoading(false);
    }
    // Remove setLoading and setError from dependencies as they're state setters and stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Check if user has a specific permission
   */
  const checkPermission = useCallback(
    (resource: string, action: string): boolean => {
      if (!state.permissions.length) return false;

      return state.permissions.some(
        (permission) =>
          permission.resource === resource &&
          (permission.action === action || permission.action === 'manage'),
      );
    },
    [state.permissions],
  );

  /**
   * Check if user has access to a feature
   */
  const hasFeatureAccess = useCallback(
    (feature: string): boolean => {
      if (!state.features.length) return false;

      const featureAccess = state.features.find((f) => f.feature === feature);
      return featureAccess ? featureAccess.access_level !== 'none' : false;
    },
    [state.features],
  );

  /**
   * Check if user can access a specific menu item
   */
  const canAccessMenu = useCallback(
    (menuItem: string): boolean => {
      // Define menu permission requirements
      const menuPermissions: Record<
        string,
        {
          feature?: string;
          resource?: string;
          action?: string;
          adminOnly?: boolean;
        }
      > = {
        '/dashboard': { feature: 'dashboard' },
        '/chat': { feature: 'chat' },
        '/knowledge-base': {
          feature: 'projects',
          resource: 'project',
          action: 'read',
        },
        '/documents': {
          feature: 'documents',
          resource: 'document',
          action: 'read',
        },
        '/user-management': {
          feature: 'user_management',
          resource: 'user',
          action: 'read',
          adminOnly: true,
        },
        '/settings': {
          feature: 'user_management',
          resource: 'user',
          action: 'read',
          adminOnly: true,
        },
      };

      const requirements = menuPermissions[menuItem];
      if (!requirements) return true; // Allow access if no requirements defined

      // Check admin-only requirement
      if (requirements.adminOnly) {
        // Since User interface doesn't have roles directly, we need to check user_roles
        // and potentially call the UserManagementService to get full role data
        const hasAdminRole = state.currentUser?.user_roles?.some((userRole) => {
          // Basic check based on role name for common admin patterns
          const roleName = userRole.role.name?.toLowerCase();
          return roleName?.includes('admin') || roleName?.includes('super');
        });

        if (!hasAdminRole) return false;
      }

      // Check feature access
      if (requirements.feature && !hasFeatureAccess(requirements.feature)) {
        return false;
      }

      // Check specific permission
      if (requirements.resource && requirements.action) {
        return checkPermission(requirements.resource, requirements.action);
      }

      return true;
    },
    [state.currentUser, hasFeatureAccess, checkPermission],
  );

  /**
   * Refresh permissions data
   */
  const refreshPermissions = useCallback(async () => {
    await loadUserPermissions();
  }, [loadUserPermissions]);

  // Load permissions on mount only - don't re-run when loadUserPermissions changes
  useEffect(() => {
    loadUserPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return {
    // State
    ...state,

    // Actions
    checkPermission,
    hasFeatureAccess,
    canAccessMenu,
    refreshPermissions,
    clearError,
  };
};
