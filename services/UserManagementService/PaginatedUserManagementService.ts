import {
  DEFAULT_PAGE_SIZE,
  PaginatedResponse,
  PaginationParams,
} from '@/interfaces/Pagination';
import {
  CreateRoleInput,
  Department,
  Permission,
  Role,
  UpdateRoleInput,
  User,
  UserFilter,
} from '@/interfaces/UserManagement';
import {
  createClient,
  createClientAuth,
  createClientTable,
} from '@/utils/supabase/client';
import UserManagementService from '../UserManagementService';

class PaginatedUserManagementService extends UserManagementService {
  /**
   * Get users with pagination
   */
  async getUsersPaginated(
    params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
    filter: UserFilter = {},
  ): Promise<PaginatedResponse<User>> {
    const {
      page,
      pageSize,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;
    const offset = (page - 1) * pageSize;

    try {
      const supabase = createClientAuth();

      // Build the query
      let query = supabase.from('users').select(
        `
          id,
          email,
          avatar_url,
          department_id,
          created_at,
          updated_at,
          status,
          user_roles(
            role:roles(
              id,
              name,
              description
            )
          ),
          profile:profiles(full_name, avatar_url),
          department!fk_users_department(name)
        `,
        { count: 'exact' },
      );
      // Apply filters
      if (!filter.include_deleted) {
        query = query.is('deleted_at', null);
      }

      if (search) {
        query = query.or(`email.ilike.%${search}%`);
      }

      if (filter.status && filter.status.length > 0) {
        query = query.in('status', filter.status);
      }

      if (filter.role_ids && filter.role_ids.length > 0) {
        query = query.overlaps('role_id', filter.role_ids);
      }

      if (filter.department_ids && filter.department_ids.length > 0) {
        query = query.in('department_id', filter.department_ids);
      }
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(offset, offset + pageSize - 1);
      const { data, error, count } = await query;

      if (error) {
                throw new Error(`Failed to fetch users: ${error.message}`);
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);
      return {
        data: data.map(
          (user) =>
            ({
              ...user,
              user_roles: user.user_roles,
              profile: user.profile,
            }) as unknown as User,
        ),
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
            throw error;
    }
  }

  /**
   * Get roles with pagination
   */
  async getRolesPaginated(
    params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
  ): Promise<PaginatedResponse<Role>> {
    const {
      page,
      pageSize,
      search,
      sortBy = 'level',
      sortOrder = 'desc',
    } = params;
    const offset = (page - 1) * pageSize;

    try {
      const supabase = createClientAuth();

      let query = supabase.from('roles').select(
        `
          id,
          name,
          description,
          level,
          is_system_role,
          created_at,
          updated_at
        `,
        { count: 'exact' },
      );

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,description.ilike.%${search}%`,
        );
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch roles: ${error.message}`);
      }

      // Fetch permissions for each role
      const rolesWithPermissions = await Promise.all(
        (data || []).map(async (role) => {
          try {
            const { data: permissionsData } = await supabase
              .from('role_permissions')
              .select(
                `
                permissions (
                  id,
                  name,
                  resource,
                  action,
                  description,
                  created_at
                )
              `,
              )
              .eq('role_id', role.id);

            const permissions =
              permissionsData
                ?.map((rp) => rp.permissions)
                .filter(Boolean)
                .flat() || [];

            return {
              ...role,
              permissions,
            } as Role;
          } catch {
            return {
              ...role,
              permissions: [],
            } as Role;
          }
        }),
      );

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: rolesWithPermissions,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
            throw error;
    }
  }

  /**
   * Get permissions with pagination
   */
  async getPermissionsPaginated(
    params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
  ): Promise<PaginatedResponse<Permission>> {
    const {
      page,
      pageSize,
      search,
      sortBy = 'resource',
      sortOrder = 'asc',
    } = params;
    const offset = (page - 1) * pageSize;

    try {
      const supabase = createClientAuth();

      let query = supabase.from('permissions').select('*', { count: 'exact' });

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,resource.ilike.%${search}%,description.ilike.%${search}%`,
        );
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch permissions: ${error.message}`);
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: (data as Permission[]) || [],
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
            throw error;
    }
  }

  /**
   * Get departments with pagination
   */
  async getDepartmentsPaginated(
    params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
  ): Promise<PaginatedResponse<Department>> {
    const {
      page,
      pageSize,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = params;
    const offset = (page - 1) * pageSize;

    try {
      const supabase = createClientAuth();

      let query = supabase.from('department_view').select('*', { count: 'exact' });

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,description.ilike.%${search}%`,
        );
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch departments: ${error.message}`);
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: (data as Department[]) || [],
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
            throw error;
    }
  }

  /**
   * Upload user profile picture to Supabase Storage
   */
  async uploadProfilePicture(userId: string, file: File): Promise<string> {
    try {
      const supabase = createClient();

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
            throw error;
    }
  }

  /**
   * Update user profile with avatar
   */
  async updateUserProfile(
    userId: string,
    updates: {
      display_name?: string;
      avatar_url?: string;
      department_id?: string;
    },
  ): Promise<User> {
    try {
      const supabase = createClientTable();

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update user profile: ${error.message}`);
      }

      // Also update auth.profiles if it exists
      try {
        const authClient = supabase.schema('auth');
        await authClient
          .from('profiles')
          .update({
            full_name: updates.display_name,
            avatar_url: updates.avatar_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      } catch (profileError) {
              }

      return data as User;
    } catch (error) {
            throw error;
    }
  }

  /**
   * Get user statistics including total users and active users count
   */
  async getUserStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    suspendedUsers: number;
    pendingUsers: number;
  }> {
    try {
      const supabase = createClientAuth();

      // Get total users count
      const { count: totalUsers, error: totalError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      if (totalError) {
        throw new Error(
          `Failed to get total users count: ${totalError.message}`,
        );
      }

      // Get active users count
      const { count: activeUsers, error: activeError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('deleted_at', null);

      if (activeError) {
        throw new Error(
          `Failed to get active users count: ${activeError.message}`,
        );
      }

      // Get inactive users count
      const { count: inactiveUsers, error: inactiveError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'inactive')
        .is('deleted_at', null);

      if (inactiveError) {
        throw new Error(
          `Failed to get inactive users count: ${inactiveError.message}`,
        );
      }

      // Get suspended users count
      const { count: suspendedUsers, error: suspendedError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'suspended')
        .is('deleted_at', null);

      if (suspendedError) {
        throw new Error(
          `Failed to get suspended users count: ${suspendedError.message}`,
        );
      }

      // Get pending users count
      const { count: pendingUsers, error: pendingError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .is('deleted_at', null);

      if (pendingError) {
        throw new Error(
          `Failed to get pending users count: ${pendingError.message}`,
        );
      }

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        inactiveUsers: inactiveUsers || 0,
        suspendedUsers: suspendedUsers || 0,
        pendingUsers: pendingUsers || 0,
      };
    } catch (error) {
            throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(roleData: CreateRoleInput): Promise<Role> {
    try {
      return await super.createRole(roleData);
    } catch (error) {
            throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(id: number, updates: UpdateRoleInput): Promise<Role> {
    try {
      return await super.updateRole(id, updates);
    } catch (error) {
            throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(id: number): Promise<void> {
    try {
      await super.deleteRole(id);
    } catch (error) {
            throw error;
    }
  }
}

export default PaginatedUserManagementService;
