'use client';

import { useCallback, useState } from 'react';

/**
 * User search result interface
 */
interface UserSearchResult {
  id: string;
  email: string;
  display_name?: string;
  full_name?: string;
  avatar_url?: string;
  department_name?: string;
  created_at?: string;
}

/**
 * User search filter interface
 */
interface UserSearchFilter {
  search?: string;
  role?: string;
  department_id?: string;
  status?: 'active' | 'inactive' | 'all';
  limit?: number;
  exclude_ids?: string[];
}

/**
 * User service state interface
 */
interface UseUserServiceState {
  users: UserSearchResult[];
  searchResults: UserSearchResult[];
  userStatistics: {
    total: number;
    active: number;
    inactive: number;
    departments: number;
  } | null;
  loading: boolean;
  searchLoading: boolean;
  error: string | null;
}

/**
 * User service actions interface
 */
interface UseUserServiceActions {
  // Fetch all users
  fetchUsers: (filter?: UserSearchFilter) => Promise<void>;

  // Search users for assignment
  searchUsersForAssignment: (
    searchTerm: string,
    excludeIds?: string[],
    limit?: number,
  ) => Promise<void>;

  // Get user by ID
  getUserById: (userId: string) => Promise<UserSearchResult | null>;

  // Get multiple users by IDs
  getUsersByIds: (userIds: string[]) => Promise<UserSearchResult[]>;

  // Check if user exists
  checkUserExists: (
    email: string,
  ) => Promise<{ exists: boolean; user?: UserSearchResult }>;

  // Get user statistics
  fetchUserStatistics: () => Promise<void>;

  // Clear search results
  clearSearch: () => void;

  // Clear error
  clearError: () => void;

  // Refresh current data
  refresh: () => Promise<void>;
}

export interface UseUserService
  extends UseUserServiceState,
    UseUserServiceActions {}

/**
 * Hook for user service operations with error handling similar to knowledge base users
 */
export const useUserService = (): UseUserService => {
  const [state, setState] = useState<UseUserServiceState>({
    users: [],
    searchResults: [],
    userStatistics: null,
    loading: false,
    searchLoading: false,
    error: null,
  });

  const [lastFilter, setLastFilter] = useState<UserSearchFilter | null>(null);

  // Helper functions
  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setSearchLoading = useCallback((searchLoading: boolean) => {
    setState((prev) => ({ ...prev, searchLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Import the server actions (these would be defined in a separate actions file)
  const importServerActions = useCallback(async () => {
    // Dynamic import to avoid build issues
    const userServiceModule = await import('@/services/UserService');
    return new userServiceModule.default();
  }, []);

  /**
   * Fetch all users with optional filtering
   */
  const fetchUsers = useCallback(
    async (filter: UserSearchFilter = {}) => {
      try {
        setLoading(true);
        setError(null);
        setLastFilter(filter);

        const userService = await importServerActions();
        const result = await userService.getUsers(filter);

        if (result.success && result.data) {
          setState((prev) => ({
            ...prev,
            users: result.data!,
          }));
        } else {
          setError(result.error || 'Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, importServerActions],
  );

  /**
   * Search users for assignment purposes
   */
  const searchUsersForAssignment = useCallback(
    async (
      searchTerm: string,
      excludeIds: string[] = [],
      limit: number = 10,
    ) => {
      try {
        setSearchLoading(true);
        setError(null);

        const userService = await importServerActions();
        const result = await userService.searchUsersForAssignment(
          searchTerm,
          excludeIds,
          limit,
        );

        if (result.success && result.data) {
          setState((prev) => ({
            ...prev,
            searchResults: result.data!,
          }));
        } else {
          setError(result.error || 'Failed to search users');
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setSearchLoading(false);
      }
    },
    [setSearchLoading, setError, importServerActions],
  );

  /**
   * Get user by ID
   */
  const getUserById = useCallback(
    async (userId: string): Promise<UserSearchResult | null> => {
      try {
        setError(null);

        const userService = await importServerActions();
        const result = await userService.getUserById(userId);

        if (result.success && result.data) {
          return result.data;
        } else {
          setError(result.error || 'Failed to fetch user');
          return null;
        }
      } catch (error) {
        console.error('Error fetching user by ID:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        return null;
      }
    },
    [setError, importServerActions],
  );

  /**
   * Get multiple users by IDs
   */
  const getUsersByIds = useCallback(
    async (userIds: string[]): Promise<UserSearchResult[]> => {
      try {
        setError(null);

        const userService = await importServerActions();
        const result = await userService.getUsersByIds(userIds);

        if (result.success && result.data) {
          return result.data;
        } else {
          setError(result.error || 'Failed to fetch users');
          return [];
        }
      } catch (error) {
        console.error('Error fetching users by IDs:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        return [];
      }
    },
    [setError, importServerActions],
  );

  /**
   * Check if user exists by email
   */
  const checkUserExists = useCallback(
    async (
      email: string,
    ): Promise<{ exists: boolean; user?: UserSearchResult }> => {
      try {
        setError(null);

        const userService = await importServerActions();
        const result = await userService.checkUserExists(email);

        if (result.success && result.data) {
          return result.data;
        } else {
          setError(result.error || 'Failed to check user existence');
          return { exists: false };
        }
      } catch (error) {
        console.error('Error checking user existence:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        return { exists: false };
      }
    },
    [setError, importServerActions],
  );

  /**
   * Fetch user statistics
   */
  const fetchUserStatistics = useCallback(async () => {
    try {
      setError(null);

      const userService = await importServerActions();
      const result = await userService.getUserStatistics();

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          userStatistics: result.data!,
        }));
      } else {
        setError(result.error || 'Failed to fetch user statistics');
      }
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [setError, importServerActions]);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setState((prev) => ({ ...prev, searchResults: [] }));
  }, []);

  /**
   * Refresh current data
   */
  const refresh = useCallback(async () => {
    if (lastFilter) {
      await fetchUsers(lastFilter);
    }
  }, [fetchUsers, lastFilter]);

  return {
    // State
    ...state,

    // Actions
    fetchUsers,
    searchUsersForAssignment,
    getUserById,
    getUsersByIds,
    checkUserExists,
    fetchUserStatistics,
    clearSearch,
    clearError,
    refresh,
  };
};

export default useUserService;
