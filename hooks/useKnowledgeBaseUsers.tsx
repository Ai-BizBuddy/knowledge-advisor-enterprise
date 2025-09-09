'use client';

import {
  AddUserToKnowledgeBaseInput,
  KnowledgeBaseUser,
  KnowledgeBaseUserFilter,
  UpdateKnowledgeBaseUserRoleInput,
} from '@/interfaces/KnowledgeBaseUserRole';
import {
  addUserToKnowledgeBase,
  getKnowledgeBaseUsers,
  removeUserFromKnowledgeBase,
  searchUsersForKnowledgeBase,
  updateKnowledgeBaseUserRole,
} from '@/services/knowledgeBaseUserHelpers';
import { useCallback, useEffect, useState } from 'react';

interface UseKnowledgeBaseUsersState {
  users: KnowledgeBaseUser[];
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  searchResults: Array<{
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  }>;
  searchLoading: boolean;
}

interface UseKnowledgeBaseUsersActions {
  // Fetch users
  fetchUsers: (
    knowledgeBaseId: string,
    page?: number,
    limit?: number,
    filter?: KnowledgeBaseUserFilter,
  ) => Promise<void>;

  // Add user
  addUser: (input: AddUserToKnowledgeBaseInput) => Promise<boolean>;

  // Update user role
  updateUserRole: (
    userId: string,
    knowledgeBaseId: string,
    updates: UpdateKnowledgeBaseUserRoleInput,
  ) => Promise<boolean>;

  // Remove user
  removeUser: (userId: string, knowledgeBaseId: string) => Promise<boolean>;

  // Search users
  searchUsers: (knowledgeBaseId: string, searchTerm: string) => Promise<void>;

  // Clear search
  clearSearch: () => void;

  // Clear error
  clearError: () => void;

  // Refresh current data
  refresh: () => Promise<void>;
}

export interface UseKnowledgeBaseUsers
  extends UseKnowledgeBaseUsersState,
    UseKnowledgeBaseUsersActions {}

/**
 * Hook for managing knowledge base users
 */
export const useKnowledgeBaseUsers = (
  initialKnowledgeBaseId?: string,
): UseKnowledgeBaseUsers => {
  const [state, setState] = useState<UseKnowledgeBaseUsersState>({
    users: [],
    totalUsers: 0,
    currentPage: 1,
    totalPages: 0,
    loading: false,
    error: null,
    searchResults: [],
    searchLoading: false,
  });

  const [lastFetchParams, setLastFetchParams] = useState<{
    knowledgeBaseId: string;
    page: number;
    limit: number;
    filter?: KnowledgeBaseUserFilter;
  } | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const fetchUsers = useCallback(
    async (
      knowledgeBaseId: string,
      page: number = 1,
      limit: number = 10,
      filter?: KnowledgeBaseUserFilter,
    ) => {
      try {
        setLoading(true);
        setError(null);

        // Store params for refresh
        setLastFetchParams({ knowledgeBaseId, page, limit, filter });

        const result = await getKnowledgeBaseUsers(
          knowledgeBaseId,
          page,
          limit,
          filter,
        );

        if (result.success && result.data) {
          setState((prev) => ({
            ...prev,
            users: result.data!.users,
            totalUsers: result.data!.total,
            currentPage: result.data!.page,
            totalPages: result.data!.totalPages,
          }));
        } else {
          setError(result.error || 'Failed to fetch users');
        }
      } catch (error) {
                setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  const addUser = useCallback(
    async (input: AddUserToKnowledgeBaseInput): Promise<boolean> => {
      try {
        setError(null);
        const result = await addUserToKnowledgeBase(input);

        if (result.success) {
          // Refresh the current data
          if (lastFetchParams) {
            await fetchUsers(
              lastFetchParams.knowledgeBaseId,
              lastFetchParams.page,
              lastFetchParams.limit,
              lastFetchParams.filter,
            );
          }
          return true;
        } else {
          setError(result.error || 'Failed to add user');
          return false;
        }
      } catch (error) {
                setError(error instanceof Error ? error.message : 'Unknown error');
        return false;
      }
    },
    [fetchUsers, lastFetchParams, setError],
  );

  const updateUserRole = useCallback(
    async (
      userId: string,
      knowledgeBaseId: string,
      updates: UpdateKnowledgeBaseUserRoleInput,
    ): Promise<boolean> => {
      try {
        setError(null);
        const result = await updateKnowledgeBaseUserRole(
          userId,
          knowledgeBaseId,
          updates,
        );

        if (result.success) {
          // Refresh the current data
          if (lastFetchParams) {
            await fetchUsers(
              lastFetchParams.knowledgeBaseId,
              lastFetchParams.page,
              lastFetchParams.limit,
              lastFetchParams.filter,
            );
          }
          return true;
        } else {
          setError(result.error || 'Failed to update user role');
          return false;
        }
      } catch (error) {
                setError(error instanceof Error ? error.message : 'Unknown error');
        return false;
      }
    },
    [fetchUsers, lastFetchParams, setError],
  );

  const removeUser = useCallback(
    async (userId: string, knowledgeBaseId: string): Promise<boolean> => {
      try {
        setError(null);
        const result = await removeUserFromKnowledgeBase(
          userId,
          knowledgeBaseId,
        );

        if (result.success) {
          // Refresh the current data
          if (lastFetchParams) {
            await fetchUsers(
              lastFetchParams.knowledgeBaseId,
              lastFetchParams.page,
              lastFetchParams.limit,
              lastFetchParams.filter,
            );
          }
          return true;
        } else {
          setError(result.error || 'Failed to remove user');
          return false;
        }
      } catch (error) {
                setError(error instanceof Error ? error.message : 'Unknown error');
        return false;
      }
    },
    [fetchUsers, lastFetchParams, setError],
  );

  const searchUsers = useCallback(
    async (knowledgeBaseId: string, searchTerm: string) => {
      try {
        setState((prev) => ({ ...prev, searchLoading: true }));
        setError(null);

        const result = await searchUsersForKnowledgeBase(
          knowledgeBaseId,
          searchTerm,
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
                setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setState((prev) => ({ ...prev, searchLoading: false }));
      }
    },
    [setError],
  );

  const clearSearch = useCallback(() => {
    setState((prev) => ({ ...prev, searchResults: [] }));
  }, []);

  const refresh = useCallback(async () => {
    if (lastFetchParams) {
      await fetchUsers(
        lastFetchParams.knowledgeBaseId,
        lastFetchParams.page,
        lastFetchParams.limit,
        lastFetchParams.filter,
      );
    }
  }, [fetchUsers, lastFetchParams]);

  // Auto-fetch if initial knowledge base ID is provided
  useEffect(() => {
    if (initialKnowledgeBaseId) {
      fetchUsers(initialKnowledgeBaseId);
    }
  }, [initialKnowledgeBaseId, fetchUsers]);

  return {
    // State
    ...state,

    // Actions
    fetchUsers,
    addUser,
    updateUserRole,
    removeUser,
    searchUsers,
    clearSearch,
    clearError,
    refresh,
  };
};
