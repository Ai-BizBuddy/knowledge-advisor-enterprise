'use client';
/**
 * User Management Hook
 *
 * React hook for managing users, roles, and permissions
 * with proper state management and error handling.
 */

import type {
  CreateUserInput,
  Department,
  Permission,
  PermissionAction,
  PermissionCheckResult,
  Role,
  UpdateUserInput,
  User,
  UserFilter,
  UserSession,
} from '@/interfaces/UserManagement';
import UserManagementService from '@/services/UserManagementService';
import { useCallback, useState } from 'react';

interface UseUserManagementState {
  users: User[];
  roles: Role[];
  permissions: Permission[];
  departments: Department[];
  currentUserSession: UserSession | null;
  loading: boolean;
  error: string | null;
}

interface UseUserManagementActions {
  // User operations
  getUsers: (filter?: UserFilter) => Promise<void>;
  getUserById: (id: string) => Promise<User | null>;
  createUser: (userData: CreateUserInput) => Promise<User | null>;
  updateUser: (id: string, updates: UpdateUserInput) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;

  // Role operations
  getRoles: () => Promise<void>;

  // Permission operations
  getPermissions: () => Promise<void>;
  checkPermission: (
    userId: string,
    resource: string,
    action: string,
  ) => Promise<PermissionCheckResult>;

  // Department operations
  getDepartments: () => Promise<void>;

  // Session operations
  getCurrentUserSession: (userId: string) => Promise<void>;

  // Utility
  clearError: () => void;
  refetch: () => Promise<void>;
}

export interface UseUserManagement
  extends UseUserManagementState,
    UseUserManagementActions {}

// Instantiate without mock data (production / real Supabase data)
const userManagementService = new UserManagementService();

export const useUserManagement = (): UseUserManagement => {
  const [state, setState] = useState<UseUserManagementState>({
    users: [],
    roles: [],
    permissions: [],
    departments: [],
    currentUserSession: null,
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
   * Get users with optional filtering
   */
  const getUsers = useCallback(
    async (filter: UserFilter = {}) => {
      try {
        setLoading(true);
        setError(null);

        const users = await userManagementService.getUsers(filter);
        setState((prev) => ({ ...prev, users }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch users';
        setError(errorMessage);
        console.error('[useUserManagement] Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * Get user by ID
   */
  const getUserById = useCallback(
    async (id: string): Promise<User | null> => {
      try {
        setError(null);
        return await userManagementService.getUserById(id);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch user';
        setError(errorMessage);
        console.error('[useUserManagement] Error fetching user:', error);
        return null;
      }
    },
    [setError],
  );

  /**
   * Create new user
   */
  const createUser = useCallback(
    async (userData: CreateUserInput): Promise<User | null> => {
      try {
        setLoading(true);
        setError(null);

        const newUser = await userManagementService.createUser(userData);

        // Add to users list
        setState((prev) => ({
          ...prev,
          users: [newUser, ...prev.users],
        }));

        return newUser;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create user';
        setError(errorMessage);
        console.error('[useUserManagement] Error creating user:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * Update user
   */
  const updateUser = useCallback(
    async (id: string, updates: UpdateUserInput): Promise<User | null> => {
      try {
        setLoading(true);
        setError(null);

        const updatedUser = await userManagementService.updateUser(id, updates);

        // Update users list
        setState((prev) => ({
          ...prev,
          users: prev.users.map((user) =>
            user.id === id ? updatedUser : user,
          ),
        }));

        return updatedUser;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update user';
        setError(errorMessage);
        console.error('[useUserManagement] Error updating user:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * Delete user
   */
  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        await userManagementService.deleteUser(id);

        // Remove from users list
        setState((prev) => ({
          ...prev,
          users: prev.users.filter((user) => user.id !== id),
        }));

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete user';
        setError(errorMessage);
        console.error('[useUserManagement] Error deleting user:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * Get all roles
   */
  const getRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const roles = await userManagementService.getRoles();
      setState((prev) => ({ ...prev, roles }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch roles';
      setError(errorMessage);
      console.error('[useUserManagement] Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  /**
   * Get all permissions
   */
  const getPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const permissions = await userManagementService.getPermissions();
      setState((prev) => ({ ...prev, permissions }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch permissions';
      setError(errorMessage);
      console.error('[useUserManagement] Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  /**
   * Get all departments
   */
  const getDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const departments = await userManagementService.getDepartments();
      setState((prev) => ({ ...prev, departments }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch departments';
      setError(errorMessage);
      console.error('[useUserManagement] Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  /**
   * Check user permission
   */
  const checkPermission = useCallback(
    async (
      userId: string,
      resource: string,
      action: string,
    ): Promise<PermissionCheckResult> => {
      try {
        setError(null);
        return await userManagementService.checkPermission(
          userId,
          resource,
          action as PermissionAction,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to check permission';
        setError(errorMessage);
        console.error('[useUserManagement] Error checking permission:', error);
        return {
          allowed: false,
          reason: 'Error checking permissions',
        };
      }
    },
    [setError],
  );

  /**
   * Get current user session with permissions
   */
  const getCurrentUserSession = useCallback(
    async (userId: string) => {
      try {
        setLoading(true);
        setError(null);

        const session = await userManagementService.getUserSession(userId);
        setState((prev) => ({ ...prev, currentUserSession: session }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to get user session';
        setError(errorMessage);
        console.error('[useUserManagement] Error getting user session:', error);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * Refetch all data
   */
  const refetch = useCallback(async () => {
    await Promise.all([
      getUsers(),
      getRoles(),
      getPermissions(),
      getDepartments(),
    ]);
  }, [getUsers, getRoles, getPermissions, getDepartments]);

  return {
    // State
    ...state,

    // Actions
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getRoles,
    getPermissions,
    getDepartments,
    checkPermission,
    getCurrentUserSession,
    clearError,
    refetch,
  };
};
