'use client';

import type {
  PaginatedResponse,
  PaginationParams,
} from '@/interfaces/Pagination';
import { DEFAULT_PAGE_SIZE } from '@/interfaces/Pagination';
import type {
  CreateDepartmentInput,
  CreateRoleInput,
  CreateUserInput,
  Department,
  Permission,
  Role,
  UpdateDepartmentInput,
  UpdateRoleInput,
  UpdateUserInput,
  User,
  UserFilter,
} from '@/interfaces/UserManagement';
import PaginatedUserManagementService from '@/services/UserManagementService/PaginatedUserManagementService';
import { useCallback, useState } from 'react';

interface UsePaginatedUserManagementState {
  // Paginated data
  users: PaginatedResponse<User> | null;
  roles: PaginatedResponse<Role> | null;
  permissions: PaginatedResponse<Permission> | null;
  departments: PaginatedResponse<Department> | null;

  // Simple lists for dropdowns
  allRoles: Role[];
  allDepartments: Department[];

  // User statistics
  userStatistics: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    suspendedUsers: number;
    pendingUsers: number;
  } | null;

  // UI state
  loading: boolean;
  error: string | null;
  uploadingImage: boolean;
}

interface UsePaginatedUserManagementActions {
  // Paginated operations
  getUsersPaginated: (
    params?: PaginationParams,
    filter?: UserFilter,
  ) => Promise<void>;
  getRolesPaginated: (params?: PaginationParams) => Promise<void>;
  getPermissionsPaginated: (params?: PaginationParams) => Promise<void>;
  getDepartmentsPaginated: (params?: PaginationParams) => Promise<void>;

  // Simple list operations (for dropdowns)
  getAllRoles: () => Promise<void>;
  getAllDepartments: () => Promise<void>;

  // User statistics
  getUserStatistics: () => Promise<void>;

  // User operations
  createUser: (userData: CreateUserInput) => Promise<User | null>;
  updateUser: (id: string, updates: UpdateUserInput) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;

  // Role operations
  createRole: (roleData: CreateRoleInput) => Promise<Role | null>;
  updateRole: (id: number, updates: UpdateRoleInput) => Promise<Role | null>;
  deleteRole: (id: number) => Promise<boolean>;

  // Department operations
  createDepartment: (
    departmentData: CreateDepartmentInput,
  ) => Promise<Department | null>;
  updateDepartment: (
    id: string,
    updates: UpdateDepartmentInput,
  ) => Promise<Department | null>;
  deleteDepartment: (id: string) => Promise<boolean>;

  // Profile operations
  uploadProfilePicture: (userId: string, file: File) => Promise<string | null>;
  updateUserProfile: (
    userId: string,
    updates: {
      display_name?: string;
      avatar_url?: string;
      department_id?: string;
    },
  ) => Promise<User | null>;

  // Utility
  clearError: () => void;
  refreshCurrentPage: () => Promise<void>;
}

export interface UsePaginatedUserManagement
  extends UsePaginatedUserManagementState,
    UsePaginatedUserManagementActions {}

const paginatedUserManagementService = new PaginatedUserManagementService();

export const usePaginatedUserManagement = (): UsePaginatedUserManagement => {
  const [state, setState] = useState<UsePaginatedUserManagementState>({
    users: null,
    roles: null,
    permissions: null,
    departments: null,
    allRoles: [],
    allDepartments: [],
    userStatistics: null,
    loading: false,
    error: null,
    uploadingImage: false,
  });

  // Track current pagination parameters for refresh
  const [currentParams, setCurrentParams] = useState<{
    users?: { params: PaginationParams; filter: UserFilter };
    roles?: { params: PaginationParams };
    permissions?: { params: PaginationParams };
    departments?: { params: PaginationParams };
  }>({});

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const setUploadingImage = useCallback((uploadingImage: boolean) => {
    setState((prev) => ({ ...prev, uploadingImage }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  /**
   * Get users with pagination
   */
  const getUsersPaginated = useCallback(
    async (
      params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
      filter: UserFilter = {},
    ) => {
      try {
        setLoading(true);
        setError(null);

        const result = await paginatedUserManagementService.getUsersPaginated(
          params,
          filter,
        );
        setState((prev) => ({ ...prev, users: result }));

        // Store current params for refresh
        setCurrentParams((prev) => ({
          ...prev,
          users: { params, filter },
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch users';
        setError(errorMessage);
              } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * Get roles with pagination
   */
  const getRolesPaginated = useCallback(
    async (
      params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
    ) => {
      try {
        setLoading(true);
        setError(null);

        const result =
          await paginatedUserManagementService.getRolesPaginated(params);
        setState((prev) => ({ ...prev, roles: result }));

        setCurrentParams((prev) => ({
          ...prev,
          roles: { params },
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch roles';
        setError(errorMessage);
              } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * Get permissions with pagination
   */
  const getPermissionsPaginated = useCallback(
    async (
      params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
    ) => {
      try {
        setLoading(true);
        setError(null);

        const result =
          await paginatedUserManagementService.getPermissionsPaginated(params);
        setState((prev) => ({ ...prev, permissions: result }));

        setCurrentParams((prev) => ({
          ...prev,
          permissions: { params },
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to fetch permissions';
        setError(errorMessage);
              } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * Get departments with pagination
   */
  const getDepartmentsPaginated = useCallback(
    async (
      params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
    ) => {
      try {
        setLoading(true);
        setError(null);

        const result =
          await paginatedUserManagementService.getDepartmentsPaginated(params);
        setState((prev) => ({ ...prev, departments: result }));

        setCurrentParams((prev) => ({
          ...prev,
          departments: { params },
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to fetch departments';
        setError(errorMessage);
              } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * Get all roles (for dropdowns)
   */
  const getAllRoles = useCallback(async () => {
    try {
      setError(null);
      const roles = await paginatedUserManagementService.getRoles();
      setState((prev) => ({ ...prev, allRoles: roles }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch roles';
      setError(errorMessage);
          }
  }, [setError]);

  /**
   * Get all departments (for dropdowns)
   */
  const getAllDepartments = useCallback(async () => {
    try {
      setError(null);
      const departments = await paginatedUserManagementService.getDepartments();
      setState((prev) => ({ ...prev, allDepartments: departments }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch departments';
      setError(errorMessage);
          }
  }, [setError]);

  /**
   * Get user statistics (total, active, inactive, suspended, pending)
   */
  const getUserStatistics = useCallback(async () => {
    try {
      setError(null);
      const statistics =
        await paginatedUserManagementService.getUserStatistics();
      setState((prev) => ({ ...prev, userStatistics: statistics }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch user statistics';
      setError(errorMessage);
          }
  }, [setError]);

  /**
   * Create new user
   */
  const createUser = useCallback(
    async (userData: CreateUserInput): Promise<User | null> => {
      try {
        setLoading(true);
        setError(null);

        const newUser =
          await paginatedUserManagementService.createUser(userData);

        // Refresh current users page if available
        if (currentParams.users) {
          await getUsersPaginated(
            currentParams.users.params,
            currentParams.users.filter,
          );
        }

        return newUser;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create user';
        setError(errorMessage);
                return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, currentParams.users, getUsersPaginated],
  );

  /**
   * Update user
   */
  const updateUser = useCallback(
    async (id: string, updates: UpdateUserInput): Promise<User | null> => {
      try {
        setLoading(true);
        setError(null);

        const updatedUser = await paginatedUserManagementService.updateUser(
          id,
          updates,
        );

        // Refresh current users page if available
        if (currentParams.users) {
          await getUsersPaginated(
            currentParams.users.params,
            currentParams.users.filter,
          );
        }

        return updatedUser;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update user';
        setError(errorMessage);
                return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, currentParams.users, getUsersPaginated],
  );

  /**
   * Delete user
   */
  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        await paginatedUserManagementService.deleteUser(id);

        // Refresh current users page if available
        if (currentParams.users) {
          await getUsersPaginated(
            currentParams.users.params,
            currentParams.users.filter,
          );
        }

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete user';
        setError(errorMessage);
                return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, currentParams.users, getUsersPaginated],
  );

  /**
   * Upload profile picture
   */
  const uploadProfilePicture = useCallback(
    async (userId: string, file: File): Promise<string | null> => {
      try {
        setUploadingImage(true);
        setError(null);

        const avatarUrl =
          await paginatedUserManagementService.uploadProfilePicture(
            userId,
            file,
          );
        return avatarUrl;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to upload profile picture';
        setError(errorMessage);
                return null;
      } finally {
        setUploadingImage(false);
      }
    },
    [setUploadingImage, setError],
  );

  /**
   * Update user profile
   */
  const updateUserProfile = useCallback(
    async (
      userId: string,
      updates: {
        display_name?: string;
        avatar_url?: string;
        department_id?: string;
      },
    ): Promise<User | null> => {
      try {
        setLoading(true);
        setError(null);

        const updatedUser =
          await paginatedUserManagementService.updateUserProfile(
            userId,
            updates,
          );

        // Refresh current users page if available
        if (currentParams.users) {
          await getUsersPaginated(
            currentParams.users.params,
            currentParams.users.filter,
          );
        }

        return updatedUser;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to update user profile';
        setError(errorMessage);
                return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, currentParams.users, getUsersPaginated],
  );

  /**
   * Create new role
   */
  const createRole = useCallback(
    async (roleData: CreateRoleInput): Promise<Role | null> => {
      try {
        setLoading(true);
        setError(null);

        const newRole =
          await paginatedUserManagementService.createRole(roleData);

        // Refresh current roles page if available
        if (currentParams.roles) {
          await getRolesPaginated(currentParams.roles.params);
        }

        return newRole;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create role';
        setError(errorMessage);
                return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, currentParams.roles, getRolesPaginated],
  );

  /**
   * Update role
   */
  const updateRole = useCallback(
    async (id: number, updates: UpdateRoleInput): Promise<Role | null> => {
      try {
        setLoading(true);
        setError(null);

        const updatedRole = await paginatedUserManagementService.updateRole(
          id,
          updates,
        );

        // Refresh current roles page if available
        if (currentParams.roles) {
          await getRolesPaginated(currentParams.roles.params);
        }

        return updatedRole;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update role';
        setError(errorMessage);
                return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, currentParams.roles, getRolesPaginated],
  );

  /**
   * Delete role
   */
  const deleteRole = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        await paginatedUserManagementService.deleteRole(id);

        // Refresh current roles page if available
        if (currentParams.roles) {
          await getRolesPaginated(currentParams.roles.params);
        }

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete role';
        setError(errorMessage);
                return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, currentParams.roles, getRolesPaginated],
  );

  /**
   * Create new department
   */
  const createDepartment = useCallback(
    async (
      departmentData: CreateDepartmentInput,
    ): Promise<Department | null> => {
      try {
        setLoading(true);
        setError(null);

        const newDepartment =
          await paginatedUserManagementService.createDepartment(departmentData);

        // Refresh current departments page if available
        if (currentParams.departments) {
          await getDepartmentsPaginated(currentParams.departments.params);
        }

        return newDepartment;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to create department';
        setError(errorMessage);
                return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, currentParams.departments, getDepartmentsPaginated],
  );

  /**
   * Update department
   */
  const updateDepartment = useCallback(
    async (
      id: string,
      updates: UpdateDepartmentInput,
    ): Promise<Department | null> => {
      try {
        setLoading(true);
        setError(null);

        const updatedDepartment =
          await paginatedUserManagementService.updateDepartment(id, updates);

        // Refresh current departments page if available
        if (currentParams.departments) {
          await getDepartmentsPaginated(currentParams.departments.params);
        }

        return updatedDepartment;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to update department';
        setError(errorMessage);
                return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, currentParams.departments, getDepartmentsPaginated],
  );

  /**
   * Delete department
   */
  const deleteDepartment = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        await paginatedUserManagementService.deleteDepartment(id);

        // Refresh current departments page if available
        if (currentParams.departments) {
          await getDepartmentsPaginated(currentParams.departments.params);
        }

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to delete department';
        setError(errorMessage);
                return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, currentParams.departments, getDepartmentsPaginated],
  );

  /**
   * Refresh current pages
   */
  const refreshCurrentPage = useCallback(async () => {
    const refreshPromises: Promise<void>[] = [];

    if (currentParams.users) {
      refreshPromises.push(
        getUsersPaginated(
          currentParams.users.params,
          currentParams.users.filter,
        ),
      );
    }

    if (currentParams.roles) {
      refreshPromises.push(getRolesPaginated(currentParams.roles.params));
    }

    if (currentParams.permissions) {
      refreshPromises.push(
        getPermissionsPaginated(currentParams.permissions.params),
      );
    }

    if (currentParams.departments) {
      refreshPromises.push(
        getDepartmentsPaginated(currentParams.departments.params),
      );
    }

    await Promise.all(refreshPromises);
  }, [
    currentParams,
    getUsersPaginated,
    getRolesPaginated,
    getPermissionsPaginated,
    getDepartmentsPaginated,
  ]);

  return {
    // State
    ...state,

    // Actions
    getUsersPaginated,
    getRolesPaginated,
    getPermissionsPaginated,
    getDepartmentsPaginated,
    getAllRoles,
    getAllDepartments,
    getUserStatistics,
    createUser,
    updateUser,
    deleteUser,
    createRole,
    updateRole,
    deleteRole,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    uploadProfilePicture,
    updateUserProfile,
    clearError,
    refreshCurrentPage,
  };
};
