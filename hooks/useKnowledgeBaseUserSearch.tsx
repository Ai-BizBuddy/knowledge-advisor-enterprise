'use client';

import { getAuthSession } from '@/utils/supabase/authUtils';
import { createClientAuth, createClientTable } from '@/utils/supabase/client';
import { useCallback, useState } from 'react';

/**
 * TypedResponse interface for consistent API responses
 */
interface TypedResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * User search result interface
 */
export interface UserSearchResult {
  id: string;
  email: string;
  display_name?: string;
  full_name?: string;
  avatar_url?: string;
  department_name?: string;
  created_at?: string;
}

/**
 * Database row interfaces for type safety
 */
interface AuthUserRow {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    avatar_url?: string;
  };
  created_at?: string;
  updated_at?: string;
  profiles?: Array<{
    full_name: string;
    avatar_url?: string;
  }>;
  department?: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * User search state interface
 */
interface UserSearchState {
  users: UserSearchResult[];
  searchResults: UserSearchResult[];
  assignmentResults: UserSearchResult[];
  loading: boolean;
  searchLoading: boolean;
  assignmentLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasMore: boolean;
  statistics: {
    totalUsers: number;
    activeUsers: number;
    roleDistribution: Array<{ role: string; count: number }>;
  } | null;
}

/**
 * User search actions interface
 */
interface UserSearchActions {
  // Main search functions
  searchUsers: (
    knowledgeBaseId: string,
    page?: number,
    limit?: number,
    searchTerm?: string,
  ) => Promise<void>;

  // Assignment search functions
  searchUsersForAssignment: (
    knowledgeBaseId: string,
    searchTerm: string,
    limit?: number,
  ) => Promise<void>;

  // Statistics functions
  loadStatistics: (knowledgeBaseId: string) => Promise<void>;

  // Utility functions
  clearError: () => void;
  clearResults: () => void;
  resetToFirstPage: () => void;
}

/**
 * Combined interface for the hook return value
 */
export interface UseKnowledgeBaseUserSearch
  extends UserSearchState,
    UserSearchActions {}

export const useKnowledgeBaseUserSearch = (): UseKnowledgeBaseUserSearch => {
  // State management
  const [state, setState] = useState<UserSearchState>({
    users: [],
    searchResults: [],
    assignmentResults: [],
    loading: false,
    searchLoading: false,
    assignmentLoading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasMore: false,
    statistics: null,
  });

  /**
   * Get current user from Supabase auth
   */
  const getCurrentUser = useCallback(async () => {
    const session = await getAuthSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }
    return session.user;
  }, []);

  /**
   * Search users within knowledge base using Supabase
   */
  const searchUsersSupabase = useCallback(
    async (
      knowledgeBaseId: string,
      page: number = 1,
      limit: number = 10,
      searchTerm?: string,
    ): Promise<
      TypedResponse<{
        users: UserSearchResult[];
        total: number;
        hasMore: boolean;
      }>
    > => {
      try {
        const user = await getCurrentUser();
        const supabase = createClientAuth();
        const supabaseTable = createClientTable();

        // Verify user has access to the knowledge base
        const { data: kbAccess, error: kbError } = await supabaseTable
          .from('knowledge_base')
          .select('id, created_by')
          .eq('id', knowledgeBaseId)
          .single();

        if (kbError || !kbAccess) {
          return {
            success: false,
            error: 'Knowledge base not found or access denied',
          };
        }

        // Check if user has access (owner or has role)
        if (kbAccess.created_by !== user.id) {
          const { data: roleAccess } = await supabaseTable
            .from('user_roles')
            .select('user_id')
            .eq('knowledge_base_id', knowledgeBaseId)
            .eq('user_id', user.id)
            .single();

          if (!roleAccess) {
            return {
              success: false,
              error: 'Access denied to this knowledge base',
            };
          }
        }

        // Calculate pagination
        const offset = (page - 1) * limit;

        // Build query for searching users
        let query = supabase.from('users').select(
          `
            id,
            email,
            user_metadata,
            created_at,
            profiles(full_name, avatar_url),
            department(id, name)
          `,
          { count: 'exact' },
        );

        // Apply search filter if provided
        if (searchTerm && searchTerm.trim()) {
          const search = searchTerm.trim().toLowerCase();
          query = query.or(
            `email.ilike.%${search}%,user_metadata->>display_name.ilike.%${search}%,user_metadata->>full_name.ilike.%${search}%`,
          );
        }

        // Apply pagination
        query = query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
          return {
            success: false,
            error: `Failed to search users: ${error.message}`,
          };
        }

        // Transform data to match UserSearchResult interface
        const users: UserSearchResult[] = (data || []).map(
          (userData: unknown) => {
            const user = userData as AuthUserRow;
            return {
              id: user.id,
              email: user.email || '',
              display_name:
                user.user_metadata?.display_name ||
                user.user_metadata?.full_name,
              full_name:
                user.profiles?.[0]?.full_name || user.user_metadata?.full_name,
              avatar_url:
                user.profiles?.[0]?.avatar_url ||
                user.user_metadata?.avatar_url,
              department_name: user.department?.[0]?.name,
              created_at: user.created_at,
            };
          },
        );

        const total = count || 0;
        const hasMore = offset + limit < total;

        return {
          success: true,
          data: {
            users,
            total,
            hasMore,
          },
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
    [getCurrentUser],
  );

  /**
   * Search users for assignment to knowledge base using Supabase
   */
  const searchUsersForAssignmentSupabase = useCallback(
    async (
      knowledgeBaseId: string,
      searchTerm: string,
      limit: number = 10,
    ): Promise<TypedResponse<UserSearchResult[]>> => {
      try {
        const user = await getCurrentUser();
        const supabase = createClientAuth();
        const supabaseTable = createClientTable();

        // Verify user has admin access to the knowledge base
        const { data: kbAccess, error: kbError } = await supabaseTable
          .from('knowledge_base')
          .select('id, created_by')
          .eq('id', knowledgeBaseId)
          .single();

        if (kbError || !kbAccess) {
          return {
            success: false,
            error: 'Knowledge base not found or access denied',
          };
        }

        // Check if user is owner or has admin role
        if (kbAccess.created_by !== user.id) {
          const { data: adminAccess } = await supabaseTable
            .from('user_roles')
            .select(
              `
              user_id,
              roles!inner(name)
            `,
            )
            .eq('knowledge_base_id', knowledgeBaseId)
            .eq('user_id', user.id)
            .single();

          if (
            !adminAccess ||
            !adminAccess.roles ||
            adminAccess.roles[0]?.name !== 'admin'
          ) {
            return {
              success: false,
              error: 'Admin access required for user assignment',
            };
          }
        }

        // Get users who already have access to this knowledge base
        const { data: existingUsers } = await supabaseTable
          .from('user_roles')
          .select('user_id')
          .eq('knowledge_base_id', knowledgeBaseId);

        const existingUserIds = (existingUsers || []).map(
          (item: { user_id: string }) => item.user_id,
        );

        // Search for users excluding those who already have access
        const search = searchTerm.trim().toLowerCase();
        let query = supabase
          .from('users')
          .select(
            `
            id,
            email,
            user_metadata,
            created_at,
            profiles(full_name, avatar_url),
            department(id, name)
          `,
          )
          .or(
            `email.ilike.%${search}%,user_metadata->>display_name.ilike.%${search}%,user_metadata->>full_name.ilike.%${search}%`,
          )
          .limit(limit);

        // Exclude existing users
        if (existingUserIds.length > 0) {
          query = query.not('id', 'in', `(${existingUserIds.join(',')})`);
        }

        const { data, error } = await query;

        if (error) {
          return {
            success: false,
            error: `Failed to search users for assignment: ${error.message}`,
          };
        }

        // Transform data to match UserSearchResult interface
        const users: UserSearchResult[] = (data || []).map(
          (userData: unknown) => {
            const user = userData as AuthUserRow;
            return {
              id: user.id,
              email: user.email || '',
              display_name:
                user.user_metadata?.display_name ||
                user.user_metadata?.full_name,
              full_name:
                user.profiles?.[0]?.full_name || user.user_metadata?.full_name,
              avatar_url:
                user.profiles?.[0]?.avatar_url ||
                user.user_metadata?.avatar_url,
              department_name: user.department?.[0]?.name,
              created_at: user.created_at,
            };
          },
        );

        return {
          success: true,
          data: users,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
    [getCurrentUser],
  );

  /**
   * Get user statistics for knowledge base using Supabase
   */
  const getUserStatisticsSupabase = useCallback(
    async (
      knowledgeBaseId: string,
    ): Promise<
      TypedResponse<{
        totalUsers: number;
        activeUsers: number;
        roleDistribution: Array<{ role: string; count: number }>;
      }>
    > => {
      try {
        const user = await getCurrentUser();
        const supabaseTable = createClientTable();

        // Verify user has access to the knowledge base
        const { data: kbAccess, error: kbError } = await supabaseTable
          .from('knowledge_base')
          .select('id, created_by')
          .eq('id', knowledgeBaseId)
          .single();

        if (kbError || !kbAccess) {
          return {
            success: false,
            error: 'Knowledge base not found or access denied',
          };
        }

        // Check if user has access (owner or has role)
        if (kbAccess.created_by !== user.id) {
          const { data: roleAccess } = await supabaseTable
            .from('user_roles')
            .select('user_id')
            .eq('knowledge_base_id', knowledgeBaseId)
            .eq('user_id', user.id)
            .single();

          if (!roleAccess) {
            return {
              success: false,
              error: 'Access denied to this knowledge base',
            };
          }
        }

        // Get user count for this knowledge base
        const { count: totalUsers, error: countError } = await supabaseTable
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('knowledge_base_id', knowledgeBaseId);

        if (countError) {
          return { success: false, error: countError.message };
        }

        // Get role distribution
        const { data: roleData, error: roleError } = await supabaseTable
          .from('user_roles')
          .select(
            `
            roles!inner(name),
            user_id
          `,
          )
          .eq('knowledge_base_id', knowledgeBaseId);

        if (roleError) {
          return { success: false, error: roleError.message };
        }

        // Calculate role distribution
        const roleDistribution: { [key: string]: number } = {};
        (roleData || []).forEach(
          (item: { roles: { name: string }[]; user_id: string }) => {
            const roleName = item.roles?.[0]?.name || 'Unknown';
            roleDistribution[roleName] = (roleDistribution[roleName] || 0) + 1;
          },
        );

        const roleDistributionArray = Object.entries(roleDistribution).map(
          ([role, count]) => ({ role, count }),
        );

        return {
          success: true,
          data: {
            totalUsers: totalUsers || 0,
            activeUsers: totalUsers || 0,
            roleDistribution: roleDistributionArray,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [getCurrentUser],
  );
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Clear all search results
   */
  const clearResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      users: [],
      searchResults: [],
      assignmentResults: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasMore: false,
    }));
  }, []);

  /**
   * Reset pagination to first page
   */
  const resetToFirstPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentPage: 1,
    }));
  }, []);

  /**
   * Search users within knowledge base context
   */
  const searchUsersFn = useCallback(
    async (
      knowledgeBaseId: string,
      page: number = 1,
      limit: number = 10,
      searchTerm?: string,
    ): Promise<void> => {
      try {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
          currentPage: page,
        }));

        console.log('[useKnowledgeBaseUserSearch] Searching users:', {
          knowledgeBaseId,
          page,
          limit,
          searchTerm,
        });

        const result = await searchUsersSupabase(
          knowledgeBaseId,
          page,
          limit,
          searchTerm,
        );

        if (!result.success) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: result.error || 'Failed to search users',
          }));
          return;
        }

        const { users, total, hasMore } = result.data!;
        const totalPages = Math.ceil(total / limit);

        setState((prev) => ({
          ...prev,
          loading: false,
          users: page === 1 ? users : [...prev.users, ...users],
          totalItems: total,
          totalPages,
          hasMore,
          error: null,
        }));

        console.log('[useKnowledgeBaseUserSearch] Users loaded:', {
          count: users.length,
          total,
          hasMore,
          page,
        });
      } catch (error) {
        console.error('[useKnowledgeBaseUserSearch] Search error:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    },
    [searchUsersSupabase],
  );

  /**
   * Search users for assignment to knowledge base
   */
  const searchUsersForAssignmentFn = useCallback(
    async (
      knowledgeBaseId: string,
      searchTerm: string,
      limit: number = 10,
    ): Promise<void> => {
      try {
        setState((prev) => ({
          ...prev,
          assignmentLoading: true,
          error: null,
        }));

        console.log('[useKnowledgeBaseUserSearch] Searching for assignment:', {
          knowledgeBaseId,
          searchTerm,
          limit,
        });

        const result = await searchUsersForAssignmentSupabase(
          knowledgeBaseId,
          searchTerm,
          limit,
        );

        if (!result.success) {
          setState((prev) => ({
            ...prev,
            assignmentLoading: false,
            error: result.error || 'Failed to search users for assignment',
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          assignmentLoading: false,
          assignmentResults: result.data || [],
          error: null,
        }));

        console.log('[useKnowledgeBaseUserSearch] Assignment results:', {
          count: result.data?.length || 0,
        });
      } catch (error) {
        console.error(
          '[useKnowledgeBaseUserSearch] Assignment search error:',
          error,
        );
        setState((prev) => ({
          ...prev,
          assignmentLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    },
    [searchUsersForAssignmentSupabase],
  );

  /**
   * Load user statistics for knowledge base
   */
  const loadStatistics = useCallback(
    async (knowledgeBaseId: string): Promise<void> => {
      try {
        setState((prev) => ({ ...prev, error: null }));

        console.log(
          '[useKnowledgeBaseUserSearch] Loading statistics for:',
          knowledgeBaseId,
        );

        const result = await getUserStatisticsSupabase(knowledgeBaseId);

        if (!result.success) {
          setState((prev) => ({
            ...prev,
            error: result.error || 'Failed to load user statistics',
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          statistics: result.data || null,
          error: null,
        }));

        console.log(
          '[useKnowledgeBaseUserSearch] Statistics loaded:',
          result.data,
        );
      } catch (error) {
        console.error('[useKnowledgeBaseUserSearch] Statistics error:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    },
    [getUserStatisticsSupabase],
  );

  // Return state and actions
  return {
    // State
    users: state.users,
    searchResults: state.searchResults,
    assignmentResults: state.assignmentResults,
    loading: state.loading,
    searchLoading: state.searchLoading,
    assignmentLoading: state.assignmentLoading,
    error: state.error,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalItems: state.totalItems,
    hasMore: state.hasMore,
    statistics: state.statistics,

    // Actions
    searchUsers: searchUsersFn,
    searchUsersForAssignment: searchUsersForAssignmentFn,
    loadStatistics,
    clearError,
    clearResults,
    resetToFirstPage,
  };
};
