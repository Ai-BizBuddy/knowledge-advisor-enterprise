import {
  createClient,
  createClientAuth,
  createClientTable,
} from '@/utils/supabase/client';
import { getAuthSession } from '@/utils/supabase/authUtils';

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
  profiles?: {
    full_name: string;
    // Export interfaces and service instance
    export type { UserSearchResult, UserSearchFilter, TypedResponse };
    export default UserService;
  ): Promise<
    TypedResponse<{
      totalUsers: number;
      activeUsers: number;
      roleDistribution: Array<{ role: string; count: number }>;
    }>
  > {
    try {
      const user = await this.getCurrentUser();
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
        .select(`
          role:roles(name),
          user_id
        `)
        .eq('knowledge_base_id', knowledgeBaseId);

      if (roleError) {
        return { success: false, error: roleError.message };
      }

      // Calculate role distribution
      const roleDistribution: { [key: string]: number } = {};
      (roleData || []).forEach((item: { role: { name: string }[]; user_id: string }) => {
        const roleName = item.role?.[0]?.name || 'Unknown';
        roleDistribution[roleName] = (roleDistribution[roleName] || 0) + 1;
      });

      const roleDistributionArray = Object.entries(roleDistribution).map(
        ([role, count]) => ({ role, count })
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
  }
}

// Export interfaces and service instance
export type { UserSearchResult, UserSearchFilter, TypedResponse };
export default UserService;
  ): Promise<TypedResponse<{ users: UserSearchResult[]; total: number; hasMore: boolean }>> {
    try {
      console.log(`[${this.serviceName}] Searching users in knowledge base:`, {
        knowledgeBaseId,
        page,
        limit,
        searchTerm,
      });

      const user = await this.getCurrentUser();
      const supabase = createClientAuth();
      const supabaseTable = createClientTable();

      // Verify user has access to the knowledge base
      const { data: kbAccess, error: kbError } = await supabaseTable
        .from('knowledge_base')
        .select('id, created_by')
        .eq('id', knowledgeBaseId)
        .single();

      if (kbError || !kbAccess) {
        return { success: false, error: 'Knowledge base not found or access denied' };
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
          return { success: false, error: 'Access denied to this knowledge base' };
        }
      }

      // Calculate pagination
      const offset = (page - 1) * limit;

      // Build query for searching users
      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          user_metadata,
          created_at,
          profiles(full_name, avatar_url),
          department(id, name)
        `, { count: 'exact' });

      // Apply search filter if provided
      if (searchTerm && searchTerm.trim()) {
        const search = searchTerm.trim().toLowerCase();
        query = query.or(
          `email.ilike.%${search}%,user_metadata->>display_name.ilike.%${search}%,user_metadata->>full_name.ilike.%${search}%`
        );
      }

      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error(`[${this.serviceName}] Supabase query error:`, error);
        return {
          success: false,
          error: `Failed to search users: ${error.message}`,
        };
      }

      // Transform data to match UserSearchResult interface
      const users: UserSearchResult[] = (data || []).map((userData: unknown) => {
        const user = userData as AuthUserRow;
        return {
          id: user.id,
          email: user.email || '',
          display_name:
            user.user_metadata?.display_name || user.user_metadata?.full_name,
          full_name:
            user.profiles?.[0]?.full_name || user.user_metadata?.full_name,
          avatar_url:
            user.profiles?.[0]?.avatar_url || user.user_metadata?.avatar_url,
          department_name: user.department?.[0]?.name,
          created_at: user.created_at,
        };
      });

      const total = count || 0;
      const hasMore = offset + limit < total;

      console.log(`[${this.serviceName}] Search results:`, {
        usersFound: users.length,
        total,
        hasMore,
        page,
      });

      return {
        success: true,
        data: {
          users,
          total,
          hasMore,
        },
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Error in searchUsersInKnowledgeBase:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Search users available for assignment to knowledge base
   * Excludes users who already have access
   */
  async searchUsersForKnowledgeBaseAssignment(
    knowledgeBaseId: string,
    searchTerm: string,
    limit: number = 10,
  ): Promise<TypedResponse<UserSearchResult[]>> {
    try {
      console.log(`[${this.serviceName}] Searching users for KB assignment:`, {
        knowledgeBaseId,
        searchTerm,
        limit,
      });

      const user = await this.getCurrentUser();
      const supabase = createClientAuth();
      const supabaseTable = createClientTable();

      // Get users who don't already have access to this knowledge base
      const { data: existingUserIds } = await supabaseTable
        .from('user_roles')
        .select('user_id')
        .eq('knowledge_base_id', knowledgeBaseId);

      const excludeIds =
        existingUserIds?.map((item: { user_id: string }) => item.user_id) || [];

      // Add the knowledge base owner to exclude list
      const { data: kbOwner } = await supabaseTable
        .from('knowledge_base')
        .select('created_by')
        .eq('id', knowledgeBaseId)
        .single();

      if (kbOwner?.created_by) {
        excludeIds.push(kbOwner.created_by);
      }

      // Search users from auth.users
      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          user_metadata,
          profiles(full_name, avatar_url),
          department(name)
        `)
        .limit(limit);

      // Apply search filter
      if (searchTerm && searchTerm.trim()) {
        const search = searchTerm.trim().toLowerCase();
        query = query.or(
          `email.ilike.%${search}%,user_metadata->>display_name.ilike.%${search}%,user_metadata->>full_name.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[${this.serviceName}] Assignment search error:`, error);
        return { success: false, error: error.message };
      }

      // Filter out users who already have access and transform data
      const users = (data || [])
        .filter((userData: { id: string }) => !excludeIds.includes(userData.id))
        .map((userData: unknown) => {
          const user = userData as AuthUserRow;
          return {
            id: user.id,
            email: user.email || '',
            display_name:
              user.user_metadata?.display_name ||
              user.user_metadata?.full_name ||
              user.profiles?.[0]?.full_name,
            full_name:
              user.profiles?.[0]?.full_name || user.user_metadata?.full_name,
            avatar_url: 
              user.user_metadata?.avatar_url ||
              user.profiles?.[0]?.avatar_url,
            department_name: user.department?.[0]?.name,
          };
        });

      console.log(`[${this.serviceName}] Assignment search found:`, users.length);

      return { success: true, data: users };
    } catch (error) {
      console.error(`[${this.serviceName}] Error in searchUsersForKnowledgeBaseAssignment:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user statistics for knowledge base
   */
  async getKnowledgeBaseUserStatistics(
    knowledgeBaseId: string,
  ): Promise<
    TypedResponse<{
      totalUsers: number;
      activeUsers: number;
      roleDistribution: Array<{ role: string; count: number }>;
    }>
  > {
    try {
      const user = await this.getCurrentUser();
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
        .select(`
          role:roles(name),
          user_id
        `)
        .eq('knowledge_base_id', knowledgeBaseId);

      if (roleError) {
        return { success: false, error: roleError.message };
      }

      // Calculate role distribution
      const roleDistribution: { [key: string]: number } = {};
      (roleData || []).forEach((item: { role: { name: string }[]; user_id: string }) => {
        const roleName = item.role?.[0]?.name || 'Unknown';
        roleDistribution[roleName] = (roleDistribution[roleName] || 0) + 1;
      });

      const roleDistributionArray = Object.entries(roleDistribution).map(
        ([role, count]) => ({ role, count })
      );

      return {
        success: true,
        data: {
          totalUsers: totalUsers || 0,
          activeUsers: totalUsers || 0, // For now, assume all users are active
          roleDistribution: roleDistributionArray,
        },
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getKnowledgeBaseUserStatistics:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all users with filtering and search capabilities
   */
  async getUsers(
    filter: UserSearchFilter = {},
  ): Promise<TypedResponse<UserSearchResult[]>> {
    try {
      const supabase = createClientAuth();

      // Check authentication
      const supabaseClient = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      // Build query for auth.users with related data
      let query = supabase.from('users').select(`
          id,
          email,
          user_metadata,
          created_at,
          updated_at,
          profiles(full_name, avatar_url),
          department(id, name)
        `);

      // Apply search filter
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        query = query.or(
          `email.ilike.%${searchTerm}%,user_metadata->>display_name.ilike.%${searchTerm}%,user_metadata->>full_name.ilike.%${searchTerm}%`,
        );
      }

      // Apply department filter
      if (filter.department_id) {
        query = query.eq('department_id', filter.department_id);
      }

      // Exclude specific user IDs
      if (filter.exclude_ids && filter.exclude_ids.length > 0) {
        query = query.not('id', 'in', `(${filter.exclude_ids.join(',')})`);
      }

      // Apply limit
      const limit = filter.limit || 50;
      query = query.limit(limit);

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error(`[${this.serviceName}] Error fetching users:`, error);
        return {
          success: false,
          error: `Failed to fetch users: ${error.message}`,
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
              user.user_metadata?.display_name || user.user_metadata?.full_name,
            full_name:
              user.profiles?.[0]?.full_name || user.user_metadata?.full_name,
            avatar_url:
              user.profiles?.[0]?.avatar_url || user.user_metadata?.avatar_url,
            department_name: user.department?.[0]?.name,
            created_at: user.created_at,
          };
        },
      );

      return { success: true, data: users };
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getUsers:`, error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Search users for assignment/selection purposes
   * Excludes users who already have certain associations
   */
  async searchUsersForAssignment(
    searchTerm: string,
    excludeIds: string[] = [],
    limit: number = 10,
  ): Promise<TypedResponse<UserSearchResult[]>> {
    try {
      const supabase = createClientAuth();

      // Check authentication
      const supabaseClient = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      // Build search query
      let query = supabase
        .from('users')
        .select(
          `
          id,
          email,
          user_metadata,
          profiles(full_name, avatar_url),
          department(name)
        `,
        )
        .limit(limit);

      // Apply search filter
      if (searchTerm) {
        query = query.or(
          `email.ilike.%${searchTerm}%,user_metadata->>display_name.ilike.%${searchTerm}%,user_metadata->>full_name.ilike.%${searchTerm}%`,
        );
      }

      // Exclude specific user IDs
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[${this.serviceName}] Error searching users:`, error);
        return {
          success: false,
          error: `Failed to search users: ${error.message}`,
        };
      }

      // Transform data
      const users: UserSearchResult[] = (data || []).map(
        (userData: unknown) => {
          const user = userData as AuthUserRow;
          return {
            id: user.id,
            email: user.email || '',
            display_name:
              user.user_metadata?.display_name || user.user_metadata?.full_name,
            full_name:
              user.profiles?.[0]?.full_name || user.user_metadata?.full_name,
            avatar_url:
              user.profiles?.[0]?.avatar_url || user.user_metadata?.avatar_url,
            department_name: user.department?.[0]?.name,
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
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get user by ID with detailed information
   */
  async getUserById(userId: string): Promise<TypedResponse<UserSearchResult>> {
    try {
      const supabase = createClientAuth();

      // Check authentication
      const supabaseClient = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          email,
          user_metadata,
          created_at,
          profiles(full_name, avatar_url),
          department(name)
        `,
        )
        .eq('id', userId)
        .single();

      if (error) {
        console.error(
          `[${this.serviceName}] Error fetching user by ID:`,
          error,
        );
        return {
          success: false,
          error: `Failed to fetch user: ${error.message}`,
        };
      }

      if (!data) {
        return { success: false, error: 'User not found' };
      }

      // Transform data
      const userResult: UserSearchResult = {
        id: data.id,
        email: data.email || '',
        display_name:
          data.user_metadata?.display_name || data.user_metadata?.full_name,
        full_name:
          data.profiles?.[0]?.full_name || data.user_metadata?.full_name,
        avatar_url:
          data.profiles?.[0]?.avatar_url || data.user_metadata?.avatar_url,
        department_name: data.department?.[0]?.name,
        created_at: data.created_at,
      };

      return { success: true, data: userResult };
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getUserById:`, error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get users by multiple IDs
   */
  async getUsersByIds(
    userIds: string[],
  ): Promise<TypedResponse<UserSearchResult[]>> {
    try {
      if (userIds.length === 0) {
        return { success: true, data: [] };
      }

      const supabase = createClientAuth();

      // Check authentication
      const supabaseClient = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          email,
          user_metadata,
          created_at,
          profiles(full_name, avatar_url),
          department(name)
        `,
        )
        .in('id', userIds);

      if (error) {
        console.error(
          `[${this.serviceName}] Error fetching users by IDs:`,
          error,
        );
        return {
          success: false,
          error: `Failed to fetch users: ${error.message}`,
        };
      }

      // Transform data
      const users: UserSearchResult[] = (data || []).map(
        (userData: unknown) => {
          const user = userData as AuthUserRow;
          return {
            id: user.id,
            email: user.email || '',
            display_name:
              user.user_metadata?.display_name || user.user_metadata?.full_name,
            full_name:
              user.profiles?.[0]?.full_name || user.user_metadata?.full_name,
            avatar_url:
              user.profiles?.[0]?.avatar_url || user.user_metadata?.avatar_url,
            department_name: user.department?.[0]?.name,
            created_at: user.created_at,
          };
        },
      );

      return { success: true, data: users };
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getUsersByIds:`, error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if user exists by email
   */
  async checkUserExists(
    email: string,
  ): Promise<TypedResponse<{ exists: boolean; user?: UserSearchResult }>> {
    try {
      const supabase = createClientAuth();

      // Check authentication
      const supabaseClient = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          email,
          user_metadata,
          profiles(full_name, avatar_url),
          department(name)
        `,
        )
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error
        console.error(
          `[${this.serviceName}] Error checking user existence:`,
          error,
        );
        return {
          success: false,
          error: `Failed to check user existence: ${error.message}`,
        };
      }

      if (!data) {
        return { success: true, data: { exists: false } };
      }

      // Transform data
      const userResult: UserSearchResult = {
        id: data.id,
        email: data.email || '',
        display_name:
          data.user_metadata?.display_name || data.user_metadata?.full_name,
        full_name:
          data.profiles?.[0]?.full_name || data.user_metadata?.full_name,
        avatar_url:
          data.profiles?.[0]?.avatar_url || data.user_metadata?.avatar_url,
        department_name: data.department?.[0]?.name,
      };

      return { success: true, data: { exists: true, user: userResult } };
    } catch (error) {
      console.error(`[${this.serviceName}] Error in checkUserExists:`, error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get user statistics
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
      const supabase = createClientAuth();
      const supabaseTable = createClientTable();

      // Check authentication
      const supabaseClient = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
      }

      // Get total users count
      const { count: totalUsers, error: totalError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error(
          `[${this.serviceName}] Error fetching total users:`,
          totalError,
        );
        return {
          success: false,
          error: `Failed to fetch user statistics: ${totalError.message}`,
        };
      }

      // Get departments count
      const { count: totalDepartments, error: deptError } = await supabaseTable
        .from('department')
        .select('*', { count: 'exact', head: true });

      if (deptError) {
        console.error(
          `[${this.serviceName}] Error fetching departments:`,
          deptError,
        );
        return {
          success: false,
          error: `Failed to fetch department statistics: ${deptError.message}`,
        };
      }

      const stats = {
        total: totalUsers || 0,
        active: totalUsers || 0, // For now, assume all users are active
        inactive: 0,
        departments: totalDepartments || 0,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getUserStatistics:`, error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export default UserService;
