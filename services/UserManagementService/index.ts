/**
 * User Management Service
 * 
 * Handles all user, role, and permission operations using Supabase
 * with comprehensive type safety and error handling.
 */

import { createClient, createClientTable } from "@/utils/supabase/client";
import { executeWithAuth, getAuthSession } from "@/utils/supabase/authUtils";
import {
  User,
  Role,
  Permission,
  CreateUserInput,
  UpdateUserInput,
  UserFilter,
  PermissionCheckResult,
  UserSession,
  UserStatus,
  PermissionAction,
  AccessLevel,
  FeatureAccess
} from "@/interfaces/UserManagement";

/**
 * User Management Service Configuration
 */
interface UserManagementServiceConfig {
  useMockData?: boolean;
}

/**
 * User Management Service Class
 */
class UserManagementService {
  private readonly serviceName = 'UserManagement';
  private readonly useMockData: boolean;

  constructor(config: UserManagementServiceConfig = {}) {
    this.useMockData = config.useMockData || false;
  }

  /**
   * Get current authenticated user
   */
  private async getCurrentUser() {
    try {
      const session = await getAuthSession();
      
      if (!session?.user) {
        throw new Error('User not authenticated');
      }
      
      return session.user;
    } catch (error) {
      console.error(`[${this.serviceName}] Error getting current user:`, error);
      throw error;
    }
  }

  /**
   * Get all users with filtering and pagination
   */
  async getUsers(filter: UserFilter = {}): Promise<User[]> {
    console.log(`[${this.serviceName}] Fetching users with filter:`, filter);

    if (this.useMockData) {
      return this.getMockUsers();
    }

    try {
      return await executeWithAuth(async (client) => {
        const supabase = client.schema(process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'knowledge_advisor');
        
        let query = supabase
          .from('users')
          .select(`
            id,
            email,
            display_name,
            avatar_url,
            role_id,
            status,
            created_at,
            updated_at,
            last_login_at,
            metadata,
            roles (
              id,
              name,
              description,
              level,
              is_system_role
            )
          `);

        // Apply filters
        if (filter.status && filter.status.length > 0) {
          query = query.in('status', filter.status);
        }

        if (filter.role_ids && filter.role_ids.length > 0) {
          query = query.in('role_id', filter.role_ids);
        }

        if (filter.search) {
          query = query.or(`email.ilike.%${filter.search}%,display_name.ilike.%${filter.search}%`);
        }

        // Apply sorting
        const sortBy = filter.sort_by || 'created_at';
        const sortOrder = filter.sort_order || 'desc';
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        const { data, error } = await query;

        if (error) {
          console.error(`[${this.serviceName}] Error fetching users:`, error);
          throw new Error(`Failed to fetch users: ${error.message}`);
        }

        return (data as User[]) || [];
      });
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getUsers:`, error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    console.log(`[${this.serviceName}] Fetching user by ID:`, id);
    if (this.useMockData) {
      const mockUsers = this.getMockUsers();
      return mockUsers[0];
      // const user = mockUsers.find(u => u.id === id);
      // if (!user) {
      //   throw new Error(`User with ID ${id} not found`);
      // }
      // return user;
    }

    try {
      const supabase = createClientTable();
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          display_name,
          avatar_url,
          role_id,
          status,
          created_at,
          updated_at,
          last_login_at,
          metadata,
          roles (
            id,
            name,
            description,
            level,
            is_system_role,
            role_permissions (
              permissions (
                id,
                name,
                resource,
                action,
                description
              )
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error(`User with ID ${id} not found`);
        }
        console.error(`[${this.serviceName}] Error fetching user:`, error);
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      return data as User;
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getUserById:`, error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserInput): Promise<User> {
    console.log(`[${this.serviceName}] Creating user:`, userData.email);

    if (this.useMockData) {
      const mockUser: User = {
        id: `mock-user-${Date.now()}`,
        email: userData.email,
        display_name: userData.display_name,
        role_id: userData.role_id,
        status: UserStatus.ACTIVE,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: userData.metadata || {}
      };
      return mockUser;
    }

    try {
      const supabase = createClient();
      const supabaseTable = createClientTable();

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create auth user - no user data returned');
      }

      // Create user profile
      const { data, error } = await supabaseTable
        .from('users')
        .insert([{
          id: authData.user.id,
          email: userData.email,
          display_name: userData.display_name,
          role_id: userData.role_id,
          status: UserStatus.ACTIVE,
          metadata: userData.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          id,
          email,
          display_name,
          avatar_url,
          role_id,
          status,
          created_at,
          updated_at,
          last_login_at,
          metadata
        `)
        .single();

      if (error) {
        console.error(`[${this.serviceName}] Error creating user profile:`, error);
        throw new Error(`Failed to create user profile: ${error.message}`);
      }

      return data as User;
    } catch (error) {
      console.error(`[${this.serviceName}] Error in createUser:`, error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, updates: UpdateUserInput): Promise<User> {
    console.log(`[${this.serviceName}] Updating user:`, id, updates);

    try {
      const supabase = createClientTable();
      
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          id,
          email,
          display_name,
          avatar_url,
          role_id,
          status,
          created_at,
          updated_at,
          last_login_at,
          metadata
        `)
        .single();

      if (error) {
        console.error(`[${this.serviceName}] Error updating user:`, error);
        throw new Error(`Failed to update user: ${error.message}`);
      }

      return data as User;
    } catch (error) {
      console.error(`[${this.serviceName}] Error in updateUser:`, error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    console.log(`[${this.serviceName}] Deleting user:`, id);

    try {
      const supabase = createClient();
      const supabaseTable = createClientTable();

      // Delete user profile first
      const { error: profileError } = await supabaseTable
        .from('users')
        .delete()
        .eq('id', id);

      if (profileError) {
        console.error(`[${this.serviceName}] Error deleting user profile:`, profileError);
        throw new Error(`Failed to delete user profile: ${profileError.message}`);
      }

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(id);

      if (authError) {
        console.warn(`[${this.serviceName}] Warning - failed to delete auth user:`, authError);
        // Don't throw here as profile is already deleted
      }
    } catch (error) {
      console.error(`[${this.serviceName}] Error in deleteUser:`, error);
      throw error;
    }
  }

  /**
   * Get all roles
   */
  async getRoles(): Promise<Role[]> {
    console.log(`[${this.serviceName}] Fetching roles`);

    if (this.useMockData) {
      return this.getMockRoles();
    }

    try {
      const supabase = createClientTable();
      
      const { data, error } = await supabase
        .from('roles')
        .select(`
          id,
          name,
          description,
          level,
          is_system_role,
          created_at,
          updated_at,
          role_permissions (
            permissions (
              id,
              name,
              resource,
              action,
              description,
              created_at
            )
          )
        `)
        .order('level', { ascending: false });

      if (error) {
        console.error(`[${this.serviceName}] Error fetching roles:`, error);
        throw new Error(`Failed to fetch roles: ${error.message}`);
      }

      return (data as unknown as Role[]) || [];
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getRoles:`, error);
      throw error;
    }
  }

  /**
   * Get all permissions
   */
  async getPermissions(): Promise<Permission[]> {
    console.log(`[${this.serviceName}] Fetching permissions`);

    if (this.useMockData) {
      return this.getMockPermissions();
    }

    try {
      const supabase = createClientTable();
      
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true })
        .order('action', { ascending: true });

      if (error) {
        console.error(`[${this.serviceName}] Error fetching permissions:`, error);
        throw new Error(`Failed to fetch permissions: ${error.message}`);
      }

      return (data as Permission[]) || [];
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getPermissions:`, error);
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  async checkPermission(userId: string, resource: string, action: PermissionAction): Promise<PermissionCheckResult> {
    console.log(`[${this.serviceName}] Checking permission for user ${userId}: ${resource}.${action}`);

    try {
      const user = await this.getUserById(userId);
      
      if (!user.role) {
        return {
          allowed: false,
          reason: 'User has no role assigned',
          required_permission: `${resource}.${action}`
        };
      }

      const hasPermission = user.role.permissions?.some(
        p => p.resource === resource && (p.action === action || p.action === PermissionAction.MANAGE)
      );

      return {
        allowed: hasPermission || false,
        reason: hasPermission ? undefined : 'Insufficient permissions',
        required_permission: `${resource}.${action}`
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Error checking permission:`, error);
      return {
        allowed: false,
        reason: 'Error checking permissions',
        required_permission: `${resource}.${action}`
      };
    }
  }

  /**
   * Get user session with permissions
   */
  async getUserSession(userId: string): Promise<UserSession> {
    console.log(`[${this.serviceName}] Getting user session:`, userId);

    try {
      const user = await this.getUserById(userId);
      const permissions = user.role?.permissions || [];
      
      // Calculate feature access based on permissions
      const features: FeatureAccess[] = [
        {
          feature: 'dashboard',
          access_level: AccessLevel.READ,
          permissions: [PermissionAction.READ]
        },
        {
          feature: 'projects',
          access_level: this.calculateAccessLevel(permissions, 'project'),
          permissions: this.getResourcePermissions(permissions, 'project')
        },
        {
          feature: 'documents',
          access_level: this.calculateAccessLevel(permissions, 'document'),
          permissions: this.getResourcePermissions(permissions, 'document')
        },
        {
          feature: 'user_management',
          access_level: this.calculateAccessLevel(permissions, 'user'),
          permissions: this.getResourcePermissions(permissions, 'user')
        }
      ];

      return {
        user,
        permissions,
        features,
        session_id: `session-${Date.now()}`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Error getting user session:`, error);
      throw error;
    }
  }

  /**
   * Calculate access level for a resource
   */
  private calculateAccessLevel(permissions: Permission[], resource: string): AccessLevel {
    const resourcePermissions = permissions.filter(p => p.resource === resource);
    
    if (resourcePermissions.some(p => p.action === PermissionAction.MANAGE)) {
      return AccessLevel.ADMIN;
    }
    
    if (resourcePermissions.some(p => [PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE].includes(p.action))) {
      return AccessLevel.WRITE;
    }
    
    if (resourcePermissions.some(p => p.action === PermissionAction.READ)) {
      return AccessLevel.READ;
    }
    
    return AccessLevel.NONE;
  }

  /**
   * Get all permission actions for a resource
   */
  private getResourcePermissions(permissions: Permission[], resource: string): PermissionAction[] {
    return permissions
      .filter(p => p.resource === resource)
      .map(p => p.action);
  }

  /**
   * Mock data for development
   */
  private getMockUsers(): User[] {
    return [
      {
        id: "1",
        email: "admin@example.com",
        display_name: "System Administrator",
        role_id: "admin-role",
        status: UserStatus.ACTIVE,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-03-15T14:30:00Z",
        last_login_at: "2024-03-16T09:15:00Z",
        role: {
          id: "admin-role",
          name: "Administrator",
          description: "Full system access",
          level: 100,
          permissions: [],
          is_system_role: true,
          created_at: "2024-01-01T10:00:00Z",
          updated_at: "2024-01-01T10:00:00Z"
        }
      },
      {
        id: "2",
        email: "manager@example.com",
        display_name: "Project Manager",
        role_id: "manager-role",
        status: UserStatus.ACTIVE,
        created_at: "2024-01-15T11:00:00Z",
        updated_at: "2024-03-10T16:45:00Z",
        last_login_at: "2024-03-15T14:20:00Z"
      },
      {
        id: "3",
        email: "user@example.com",
        display_name: "Regular User",
        role_id: "user-role",
        status: UserStatus.ACTIVE,
        created_at: "2024-02-01T09:30:00Z",
        updated_at: "2024-03-14T12:15:00Z",
        last_login_at: "2024-03-14T08:45:00Z"
      }
    ];
  }

  private getMockRoles(): Role[] {
    return [
      {
        id: "admin-role",
        name: "Administrator",
        description: "Full system access with all permissions",
        level: 100,
        permissions: [],
        is_system_role: true,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: "manager-role", 
        name: "Manager",
        description: "Project and team management access",
        level: 80,
        permissions: [],
        is_system_role: true,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: "user-role",
        name: "User",
        description: "Standard user access to assigned projects",
        level: 50,
        permissions: [],
        is_system_role: true,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      }
    ];
  }

  private getMockPermissions(): Permission[] {
    return [
      {
        id: "1",
        name: "Create Projects",
        resource: "project",
        action: PermissionAction.CREATE,
        description: "Create new knowledge base projects",
        created_at: "2024-01-01T10:00:00Z"
      },
      {
        id: "2",
        name: "Read Projects",
        resource: "project",
        action: PermissionAction.READ,
        description: "View knowledge base projects",
        created_at: "2024-01-01T10:00:00Z"
      },
      {
        id: "3",
        name: "Manage Users",
        resource: "user",
        action: PermissionAction.MANAGE,
        description: "Full user management access",
        created_at: "2024-01-01T10:00:00Z"
      }
    ];
  }
}

export default UserManagementService;
