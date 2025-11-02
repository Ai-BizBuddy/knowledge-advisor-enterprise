import {
  AddUserToKnowledgeBaseInput,
  KnowledgeBaseRole,
  KnowledgeBaseUser,
  KnowledgeBaseUserFilter,
  PaginatedKnowledgeBaseUsers,
  UpdateKnowledgeBaseUserRoleInput,
} from '@/interfaces/KnowledgeBaseUserRole';
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
 * User search result interface matching UserService pattern
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
 * Knowledge Base User Service Class
 *
 * Handles all knowledge base user management operations including adding users,
 * updating roles, removing users, and searching for users to assign.
 */
class KnowledgeBaseUserService {
  private readonly serviceName = 'KnowledgeBaseUser';

  constructor() {
    // Service initialization
  }

  /**
   * Get current user from Supabase auth
   */
  private async getCurrentUser() {
    try {
      const session = await getAuthSession();

      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      return session.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user has permission to manage knowledge base users
   */
  private async hasManagementPermission(
    knowledgeBaseId: string,
  ): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Check if user is the owner of the knowledge base
      const { data: kbData, error: kbError } = await supabaseTable
        .from('knowledge_base_view')
        .select('created_by')
        .eq('id', knowledgeBaseId)
        .single();

      if (kbError) {
        return false;
      }

      if (kbData?.created_by === user.id) {
        return true;
      }

      // Check if user has admin role in this knowledge base
      const { data: roleData, error: roleError } = await supabaseTable
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('knowledge_base_id', knowledgeBaseId)
        .eq('is_active', true)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        return false;
      }

      if (roleData?.role) {
        const userRole = roleData.role;
        return (
          userRole === KnowledgeBaseRole.SUPER_ADMIN ||
          userRole === KnowledgeBaseRole.ADMIN
        );
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get knowledge base users with pagination and filtering
   */
  async getKnowledgeBaseUsers(
    knowledgeBaseId: string,
    page: number = 1,
    limit: number = 10,
    filter?: KnowledgeBaseUserFilter,
  ): Promise<TypedResponse<PaginatedKnowledgeBaseUsers>> {
    try {
      const supabaseAuth = createClientAuth();
      const supabaseTable = createClientTable();

      // Verify user has access to this knowledge base
      const hasAccess = await this.hasManagementPermission(knowledgeBaseId);
      if (!hasAccess) {
        return {
          success: false,
          error: 'Access denied to manage users for this knowledge base',
        };
      }

      // Calculate pagination
      const offset = (page - 1) * limit;

      // Build base query for user roles in this knowledge base
      let countQuery = supabaseTable
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('knowledge_base_id', knowledgeBaseId);

      let dataQuery = supabaseTable
        .from('user_roles')
        .select(
          `
          id,
          user_id,
          knowledge_base_id,
          role,
          granted_by,
          granted_at,
          expires_at,
          is_active,
          metadata
        `,
        )
        .eq('knowledge_base_id', knowledgeBaseId);

      // Apply filters
      if (filter?.role && filter.role.length > 0) {
        countQuery = countQuery.in('role', filter.role);
        dataQuery = dataQuery.in('role', filter.role);
      }

      if (filter?.is_active !== undefined) {
        countQuery = countQuery.eq('is_active', filter.is_active);
        dataQuery = dataQuery.eq('is_active', filter.is_active);
      }

      if (filter?.granted_by) {
        countQuery = countQuery.eq('granted_by', filter.granted_by);
        dataQuery = dataQuery.eq('granted_by', filter.granted_by);
      }

      // Apply sorting
      const sortBy = filter?.sort_by || 'granted_at';
      const sortOrder =
        filter?.sort_order === 'asc'
          ? { ascending: true }
          : { ascending: false };
      dataQuery = dataQuery.order(sortBy, sortOrder);

      // Get total count
      const { count, error: countError } = await countQuery;
      if (countError) {
        return { success: false, error: countError.message };
      }

      // Get paginated data
      const { data: userRoles, error: dataError } = await dataQuery.range(
        offset,
        offset + limit - 1,
      );

      if (dataError) {
        return { success: false, error: dataError.message };
      }

      // Get user details from auth.users - get name, email and user_id only (no metadata)
      const userIds = (userRoles || []).map(
        (ur: { user_id: string }) => ur.user_id,
      );
      const { data: usersData, error: userError } = await supabaseAuth
        .from('users')
        .select(
          `
          id,
          email,
          profiles(full_name)
        `,
        )
        .in('id', userIds);

      if (userError) {
        return { success: false, error: userError.message };
      }

      // Get granter information - get name and email only (no metadata)
      const granterIds = [
        ...new Set(
          (userRoles || []).map((ur: { granted_by: string }) => ur.granted_by),
        ),
      ];
      const { data: granterData } = await supabaseAuth
        .from('users')
        .select(
          `
          id,
          email,
          profiles(full_name)
        `,
        )
        .in('id', granterIds);

      // Combine data
      const users: KnowledgeBaseUser[] = (userRoles || []).map(
        (userRole: {
          id: string;
          user_id: string;
          role: string;
          granted_by: string;
          granted_at: string;
          expires_at?: string;
          is_active: boolean;
        }) => {
          const userData = (usersData || []).find(
            (u: { id: string }) => u.id === userRole.user_id,
          );
          const granterInfo = (granterData || []).find(
            (g: { id: string }) => g.id === userRole.granted_by,
          );

          return {
            id: userRole.user_id,
            email: userData?.email || '',
            display_name:
              userData?.profiles?.[0]?.full_name || userData?.email || '', // Use profile name or fallback to email
            full_name:
              userData?.profiles?.[0]?.full_name || userData?.email || '', // Use profile name or fallback to email
            avatar_url: undefined, // No avatar display
            role: userRole.role as KnowledgeBaseRole,
            granted_by: userRole.granted_by,
            granted_at: userRole.granted_at,
            expires_at: userRole.expires_at,
            is_active: userRole.is_active,
            granter_name:
              granterInfo?.profiles?.[0]?.full_name ||
              granterInfo?.email ||
              'Unknown', // Use granter profile name or email
          };
        },
      );

      // Apply search filter on processed data
      let filteredUsers = users;
      if (filter?.search && filter.search.trim()) {
        const searchTerm = filter.search.toLowerCase();
        filteredUsers = users.filter(
          (user) =>
            user.email.toLowerCase().includes(searchTerm) ||
            user.display_name?.toLowerCase().includes(searchTerm) ||
            user.full_name?.toLowerCase().includes(searchTerm),
        );
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        success: true,
        data: {
          users: filteredUsers,
          total: count || 0,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add user to knowledge base with specific role
   */
  async addUserToKnowledgeBase(
    input: AddUserToKnowledgeBaseInput,
  ): Promise<TypedResponse<KnowledgeBaseUser>> {
    try {
      const currentUser = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Verify permission
      const hasPermission = await this.hasManagementPermission(
        input.knowledge_base_id,
      );
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied to manage users for this knowledge base',
        };
      }

      // Check if user already has access
      const { data: existingRole, error: checkError } = await supabaseTable
        .from('user_roles')
        .select('id')
        .eq('user_id', input.user_id)
        .eq('knowledge_base_id', input.knowledge_base_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        return { success: false, error: checkError.message };
      }

      if (existingRole) {
        return {
          success: false,
          error: 'User already has access to this knowledge base',
        };
      }

      // Add user role
      const { data: newRole, error: insertError } = await supabaseTable
        .from('user_roles')
        .insert({
          user_id: input.user_id,
          knowledge_base_id: input.knowledge_base_id,
          role: input.role,
          granted_by: currentUser.id,
          granted_at: new Date().toISOString(),
          expires_at: input.expires_at || null,
          is_active: true,
          metadata: {},
        })
        .select(
          `
          id,
          user_id,
          role,
          granted_by,
          granted_at,
          expires_at,
          is_active
        `,
        )
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      // Get user details - get name, email and user_id only (no metadata)
      const supabaseAuth = createClientAuth();
      const { data: userData, error: userError } = await supabaseAuth
        .from('users')
        .select(
          `
          id,
          email,
          profiles(full_name)
        `,
        )
        .eq('id', input.user_id)
        .single();

      if (userError) {
        return { success: false, error: userError.message };
      }

      const knowledgeBaseUser: KnowledgeBaseUser = {
        id: userData.id,
        email: userData.email || '',
        display_name: userData.profiles?.[0]?.full_name || userData.email || '', // Use profile name or fallback to email
        full_name: userData.profiles?.[0]?.full_name || userData.email || '', // Use profile name or fallback to email
        avatar_url: undefined, // No avatar display
        role: input.role,
        granted_by: newRole.granted_by,
        granted_at: newRole.granted_at,
        expires_at: newRole.expires_at,
        is_active: newRole.is_active,
      };

      return { success: true, data: knowledgeBaseUser };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update user role in knowledge base
   */
  async updateKnowledgeBaseUserRole(
    userId: string,
    knowledgeBaseId: string,
    updates: UpdateKnowledgeBaseUserRoleInput,
  ): Promise<TypedResponse<KnowledgeBaseUser>> {
    try {
      const supabaseTable = createClientTable();

      // Verify permission
      const hasPermission = await this.hasManagementPermission(knowledgeBaseId);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied to manage users for this knowledge base',
        };
      }

      // Build update data
      const updateData: Record<string, unknown> = {};

      if (updates.role) {
        updateData.role = updates.role;
      }

      if (updates.expires_at !== undefined) {
        updateData.expires_at = updates.expires_at;
      }

      if (updates.is_active !== undefined) {
        updateData.is_active = updates.is_active;
      }

      if (updates.metadata !== undefined) {
        updateData.metadata = updates.metadata;
      }

      // Update user role
      const { data: updatedRole, error: updateError } = await supabaseTable
        .from('user_roles')
        .update(updateData)
        .eq('user_id', userId)
        .eq('knowledge_base_id', knowledgeBaseId)
        .select(
          `
          id,
          user_id,
          role,
          granted_by,
          granted_at,
          expires_at,
          is_active
        `,
        )
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Get user details - get name, email and user_id only (no metadata)
      const supabaseAuth = createClientAuth();
      const { data: userData, error: userError } = await supabaseAuth
        .from('users')
        .select(
          `
          id,
          email,
          profiles(full_name)
        `,
        )
        .eq('id', userId)
        .single();

      if (userError) {
        return { success: false, error: userError.message };
      }

      const knowledgeBaseUser: KnowledgeBaseUser = {
        id: userData.id,
        email: userData.email || '',
        display_name: userData.profiles?.[0]?.full_name || userData.email || '', // Use profile name or fallback to email
        full_name: userData.profiles?.[0]?.full_name || userData.email || '', // Use profile name or fallback to email
        avatar_url: undefined, // No avatar display
        role: updatedRole.role as KnowledgeBaseRole,
        granted_by: updatedRole.granted_by,
        granted_at: updatedRole.granted_at,
        expires_at: updatedRole.expires_at,
        is_active: updatedRole.is_active,
      };

      return { success: true, data: knowledgeBaseUser };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Remove user from knowledge base
   */
  async removeUserFromKnowledgeBase(
    userId: string,
    knowledgeBaseId: string,
  ): Promise<TypedResponse<void>> {
    try {
      const supabaseTable = createClientTable();

      // Verify permission
      const hasPermission = await this.hasManagementPermission(knowledgeBaseId);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied to manage users for this knowledge base',
        };
      }

      // Check if user is the owner of the knowledge base
      const { data: kbData, error: kbError } = await supabaseTable
        .from('knowledge_base_view')
        .select('created_by')
        .eq('id', knowledgeBaseId)
        .single();

      if (kbError) {
        return { success: false, error: kbError.message };
      }

      if (kbData?.created_by === userId) {
        return {
          success: false,
          error: 'Cannot remove the owner of the knowledge base',
        };
      }

      // Remove user role
      const { error: deleteError } = await supabaseTable
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('knowledge_base_id', knowledgeBaseId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search users for knowledge base assignment
   */
  async searchUsersForKnowledgeBase(
    knowledgeBaseId: string,
    searchTerm: string,
    limit: number = 10,
  ): Promise<TypedResponse<UserSearchResult[]>> {
    try {
      const supabaseAuth = createClientAuth();
      const supabaseTable = createClientTable();

      // Verify permission
      const hasPermission = await this.hasManagementPermission(knowledgeBaseId);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied to manage users for this knowledge base',
        };
      }

      // Get users who already have access to this knowledge base
      const { data: existingUsers } = await supabaseTable
        .from('user_roles')
        .select('user_id')
        .eq('knowledge_base_id', knowledgeBaseId);

      const excludeIds = (existingUsers || []).map(
        (ur: { user_id: string }) => ur.user_id,
      );

      // Also exclude the owner
      const { data: kbData } = await supabaseTable
        .from('knowledge_base_view')
        .select('created_by')
        .eq('id', knowledgeBaseId)
        .single();

      if (kbData?.created_by) {
        excludeIds.push(kbData.created_by);
      }

      // Search for users - get name, email and user_id only (no metadata)
      let query = supabaseAuth
        .from('users')
        .select(
          `
          id,
          email,
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

      const { data: usersData, error: searchError } = await query;

      if (searchError) {
        return { success: false, error: searchError.message };
      }

      // Filter out users who already have access
      const availableUsers = (usersData || [])
        .filter((userData: { id: string }) => !excludeIds.includes(userData.id))
        .map(
          (userData: {
            id: string;
            email: string;
            created_at?: string;
            profiles?: Array<{
              full_name?: string;
            }>;
          }) => ({
            id: userData.id,
            email: userData.email || '',
            display_name:
              userData.profiles?.[0]?.full_name || userData.email || '', // Use profile name or fallback to email
            full_name:
              userData.profiles?.[0]?.full_name || userData.email || '', // Use profile name or fallback to email
            avatar_url: undefined, // No avatar display
            department_name: undefined, // No department display
            created_at: userData.created_at,
          }),
        );

      return { success: true, data: availableUsers };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export the service instance and types
const knowledgeBaseUserService = new KnowledgeBaseUserService();
export default knowledgeBaseUserService;
export type { TypedResponse, UserSearchResult };
