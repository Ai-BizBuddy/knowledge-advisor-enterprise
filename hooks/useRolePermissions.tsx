/**
 * Role Permissions Management Hook
 *
 * Hook for managing role permissions with CRUD operations
 * and integration with the PermissionsTable component.
 */

import { useState, useCallback, useMemo } from 'react';
import UserManagementService from '@/services/UserManagementService';
import { useToast } from '@/components/toast';
import type { Permission } from '@/interfaces/UserManagement';

interface UseRolePermissionsState {
  permissions: Permission[];
  currentRolePermissions: number[];
  loading: boolean;
  error: string | null;
  saving: boolean;
}

interface UseRolePermissionsActions {
  loadPermissions: () => Promise<void>;
  loadRolePermissions: (roleId: number) => Promise<void>;
  updateRolePermissions: (
    roleId: number,
    permissionIds: number[],
  ) => Promise<void>;
  clearError: () => void;
  setPermissions: (permissionIds: number[]) => void;
}

export interface UseRolePermissions
  extends UseRolePermissionsState,
    UseRolePermissionsActions {}

/**
 * Role permissions management hook
 */
export const useRolePermissions = (): UseRolePermissions => {
  const { showToast } = useToast();
  const userManagementService = useMemo(() => new UserManagementService(), []);

  const [state, setState] = useState<UseRolePermissionsState>({
    permissions: [],
    currentRolePermissions: [],
    loading: false,
    error: null,
    saving: false,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setSaving = useCallback((saving: boolean) => {
    setState((prev) => ({ ...prev, saving }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  /**
   * Load all available permissions
   */
  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const permissionsData = await userManagementService.getPermissions();

      setState((prev) => ({
        ...prev,
        permissions: permissionsData,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load permissions';
      setError(errorMessage);
      showToast('Error loading permissions: ' + errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [userManagementService, showToast, setLoading, setError]);

  /**
   * Load permissions for a specific role
   */
  const loadRolePermissions = useCallback(
    async (roleId: number) => {
      try {
        setLoading(true);
        setError(null);

        const rolePermissions =
          await userManagementService.getRolePermissions(roleId);
        const permissionIds = rolePermissions.map((p) => p.id);

        setState((prev) => ({
          ...prev,
          currentRolePermissions: permissionIds,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to load role permissions';
        setError(errorMessage);
        showToast('Error loading role permissions: ' + errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    },
    [userManagementService, showToast, setLoading, setError],
  );

  /**
   * Update permissions for a role
   */
  const updateRolePermissions = useCallback(
    async (roleId: number, permissionIds: number[]) => {
      try {
        setSaving(true);
        setError(null);

        // Use the new setRolePermissions method for atomic update
        await userManagementService.setRolePermissions(roleId, permissionIds);

        setState((prev) => ({
          ...prev,
          currentRolePermissions: permissionIds,
        }));

        showToast('Role permissions updated successfully', 'success');
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to update role permissions';
        setError(errorMessage);
        showToast('Error updating permissions: ' + errorMessage, 'error');
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [userManagementService, showToast, setSaving, setError],
  );

  /**
   * Set permissions without saving (for optimistic updates)
   */
  const setPermissions = useCallback((permissionIds: number[]) => {
    setState((prev) => ({
      ...prev,
      currentRolePermissions: permissionIds,
    }));
  }, []);

  return {
    // State
    ...state,

    // Actions
    loadPermissions,
    loadRolePermissions,
    updateRolePermissions,
    clearError,
    setPermissions,
  };
};
