import { getAuthSession } from '@/utils/supabase/authUtils';
import { createClientAuth, createClientTable } from '@/utils/supabase/client';

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
  }>;
}

/**
 * User Service Class
 *
 * Handles all user management operations including user search,
 * user statistics, and user profile management.
 */
class UserService {
  private readonly serviceName = 'UserService';

  constructor() {
    // Service initialization
  }

  /**
   * Get current user from Supabase auth
   */
  private async getCurrentUser() {
    return await getAuthSession();
  }

  /**
   * Get user statistics - general statistics (not knowledge base specific)
   */
  async getUserStatistics(): Promise<
    TypedResponse<{
      total: number;
      active: number;
      inactive: number;
      departments: number;
    }>
  > {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const supabaseAuth = createClientAuth();

      // Get total users count
      const { count: totalUsers, error: totalError } = await supabaseAuth
        .from('auth.users')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        return { success: false, error: totalError.message };
      }

      return {
        success: true,
        data: {
          total: totalUsers || 0,
          active: totalUsers || 0, // Assuming all users are active for now
          inactive: 0,
          departments: 0, // Would need to implement departments functionality
        },
      };
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error getting user statistics:`,
        error,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user statistics for a knowledge base
   */
  async getKnowledgeBaseUserStatistics(knowledgeBaseId: string): Promise<
    TypedResponse<{
      totalUsers: number;
      activeUsers: number;
      roleDistribution: Array<{ role: string; count: number }>;
    }>
  > {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const supabaseTable = createClientTable();

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
        .select('role, user_id')
        .eq('knowledge_base_id', knowledgeBaseId);

      if (roleError) {
        return { success: false, error: roleError.message };
      }

      // Calculate role distribution
      const roleDistribution: { [key: string]: number } = {};
      (roleData || []).forEach((item: { role: string; user_id: string }) => {
        const roleName = item.role || 'Unknown';
        roleDistribution[roleName] = (roleDistribution[roleName] || 0) + 1;
      });

      const roleDistArray = Object.entries(roleDistribution).map(
        ([role, count]) => ({
          role,
          count,
        }),
      );

      return {
        success: true,
        data: {
          totalUsers: totalUsers || 0,
          activeUsers: totalUsers || 0, // Assuming all users are active for now
          roleDistribution: roleDistArray,
        },
      };
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error getting user statistics:`,
        error,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all users with optional filtering (matching the hook's expectation)
   */
  async getUsers(
    filter: UserSearchFilter = {},
  ): Promise<TypedResponse<UserSearchResult[]>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const supabaseAuth = createClientAuth();
      const limit = filter?.limit || 100;

      let query = supabaseAuth
        .from('auth.users')
        .select(
          `
          id,
          email,
          user_metadata,
          created_at,
          profiles(full_name)
        `,
        )
        .limit(limit);

      // Apply search filter if provided - search by email only for now
      if (filter?.search && filter.search.trim()) {
        const search = `%${filter.search.trim().toLowerCase()}%`;
        query = query.ilike('email', search);
      }

      // Exclude specific user IDs if provided
      if (filter?.exclude_ids && filter.exclude_ids.length > 0) {
        query = query.not('id', 'in', `(${filter.exclude_ids.join(',')})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[${this.serviceName}] Error getting all users:`, error);
        return { success: false, error: error.message };
      }

      // Transform data to match UserSearchResult interface
      const users: UserSearchResult[] = (data || []).map(
        (userData: unknown) => {
          const user = userData as AuthUserRow;
          return {
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.display_name,
            full_name:
              user.profiles?.[0]?.full_name || user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
            created_at: user.created_at,
          };
        },
      );

      return { success: true, data: users };
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getUsers:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search users in a knowledge base with pagination
   */
  async searchUsersInKnowledgeBase(
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
  > {
    try {
      console.log(`[${this.serviceName}] Searching users in knowledge base:`, {
        knowledgeBaseId,
        page,
        limit,
        searchTerm,
      });

      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const supabaseAuth = createClientAuth();
      const offset = (page - 1) * limit;

      let query = supabaseAuth
        .from('auth.users')
        .select(
          `
          id,
          email,
          user_metadata,
          created_at,
          profiles(full_name)
        `,
          { count: 'exact' },
        )
        .limit(limit)
        .range(offset, offset + limit - 1);

      // Apply search filter if provided - search by email only for now
      if (searchTerm && searchTerm.trim()) {
        const search = `%${searchTerm.trim().toLowerCase()}%`;
        query = query.ilike('email', search);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error(`[${this.serviceName}] Error searching users:`, error);
        return { success: false, error: error.message };
      }

      // Transform data to match UserSearchResult interface
      const users: UserSearchResult[] = (data || []).map(
        (userData: unknown) => {
          const user = userData as AuthUserRow;
          return {
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.display_name,
            full_name:
              user.profiles?.[0]?.full_name || user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
            created_at: user.created_at,
          };
        },
      );

      const total = count || 0;
      const hasMore = offset + limit < total;

      console.log(`[${this.serviceName}] Search completed:`, {
        usersFound: users.length,
        total,
        hasMore,
      });

      return {
        success: true,
        data: { users, total, hasMore },
      };
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error in searchUsersInKnowledgeBase:`,
        error,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search for users to assign to knowledge base (excluding already assigned users)
   */
  async searchUsersForAssignment(
    searchTerm: string,
    excludeIds: string[] = [],
    limit: number = 10,
  ): Promise<TypedResponse<UserSearchResult[]>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const supabaseAuth = createClientAuth();

      let query = supabaseAuth
        .from('auth.users')
        .select(
          `
          id,
          email,
          user_metadata,
          created_at,
          profiles(full_name)
        `,
        )
        .limit(limit);

      // Apply search filter - search by email only for now
      if (searchTerm && searchTerm.trim()) {
        const search = `%${searchTerm.trim().toLowerCase()}%`;
        query = query.ilike('email', search);
      }

      // Exclude specific user IDs
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          `[${this.serviceName}] Error searching users for assignment:`,
          error,
        );
        return { success: false, error: error.message };
      }

      // Transform data to match UserSearchResult interface
      const users: UserSearchResult[] = (data || []).map(
        (userData: unknown) => {
          const user = userData as AuthUserRow;
          return {
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.display_name,
            full_name:
              user.profiles?.[0]?.full_name || user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
            created_at: user.created_at,
          };
        },
      );

      return { success: true, data: users };
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error in searchUsersForAssignment:`,
        error,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get a user by ID
   */
  async getUserById(userId: string): Promise<TypedResponse<UserSearchResult>> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      const supabaseAuth = createClientAuth();

      const { data, error } = await supabaseAuth
        .from('auth.users')
        .select(
          `
          id,
          email,
          user_metadata,
          created_at,
          profiles(full_name)
        `,
        )
        .eq('id', userId)
        .single();

      if (error) {
        console.error(`[${this.serviceName}] Error getting user by ID:`, error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'User not found' };
      }

      const user = data as AuthUserRow;
      const userResult: UserSearchResult = {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.display_name,
        full_name:
          user.profiles?.[0]?.full_name || user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
        created_at: user.created_at,
      };

      return { success: true, data: userResult };
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getUserById:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get multiple users by IDs
   */
  async getUsersByIds(
    userIds: string[],
  ): Promise<TypedResponse<UserSearchResult[]>> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      if (userIds.length === 0) {
        return { success: true, data: [] };
      }

      const supabaseAuth = createClientAuth();

      const { data, error } = await supabaseAuth
        .from('auth.users')
        .select(
          `
          id,
          email,
          user_metadata,
          created_at,
          profiles(full_name)
        `,
        )
        .in('id', userIds);

      if (error) {
        console.error(
          `[${this.serviceName}] Error getting users by IDs:`,
          error,
        );
        return { success: false, error: error.message };
      }

      const users: UserSearchResult[] = (data || []).map(
        (userData: unknown) => {
          const user = userData as AuthUserRow;
          return {
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.display_name,
            full_name:
              user.profiles?.[0]?.full_name || user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
            created_at: user.created_at,
          };
        },
      );

      return { success: true, data: users };
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getUsersByIds:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if user exists and get user data
   */
  async checkUserExists(
    email: string,
  ): Promise<TypedResponse<{ exists: boolean; user?: UserSearchResult }>> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      const supabaseAuth = createClientAuth();

      const { data, error } = await supabaseAuth
        .from('auth.users')
        .select(
          `
          id,
          email,
          user_metadata,
          created_at,
          profiles(full_name)
        `,
        )
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        // User not found is not really an error for this function
        if (error.code === 'PGRST116') {
          return { success: true, data: { exists: false } };
        }
        console.error(
          `[${this.serviceName}] Error checking user exists:`,
          error,
        );
        return { success: false, error: error.message };
      }

      const user = data as AuthUserRow;
      const userResult: UserSearchResult = {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.display_name,
        full_name:
          user.profiles?.[0]?.full_name || user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
        created_at: user.created_at,
      };

      return { success: true, data: { exists: true, user: userResult } };
    } catch (error) {
      console.error(`[${this.serviceName}] Error in checkUserExists:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export interfaces and service instance
export type { TypedResponse, UserSearchFilter, UserSearchResult };
export default UserService;
