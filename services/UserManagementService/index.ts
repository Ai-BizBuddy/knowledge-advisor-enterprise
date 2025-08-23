/**
 * User Management Service
 *
 * Handles all user, role, and permission operations using Supabase
 * with comprehensive type safety and error handling.
 */

import { createClient, createClientAuth } from "@/utils/supabase/client";
import { executeWithAuth, getAuthSession } from "@/utils/supabase/authUtils";
import { extractUserClaims, hasRole, hasPermission } from "@/utils/jwtUtils";
import {
  User,
  Role,
  Permission,
  Department,
  CreateUserInput,
  UpdateUserInput,
  CreateRoleInput,
  UpdateRoleInput,
  CreatePermissionInput,
  UpdatePermissionInput,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  UserFilter,
  UserStatus,
  PermissionAction,
  PermissionCheckResult,
  UserSession,
  FeatureAccess,
  AccessLevel,
  UserDisplayPermission,
  UserRoleRow,
  Profile,
  UserManagementError,
} from "@/interfaces/UserManagement";

/**
 * User Management Service Class
 */
class UserManagementService {
  private readonly serviceName = "UserManagement";
  private readonly useMockData: boolean;

  constructor() {
    // Disable mock data to use production Supabase database
    this.useMockData = false;
  }

  /**
   * Get current authenticated user
   */
  private async getCurrentUser() {
    try {
      const session = await getAuthSession();

      if (!session?.user) {
        throw new Error("User not authenticated");
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
    try {
      return await executeWithAuth(async (client) => {
        // Use auth.users as the primary source
        const authClient = client.schema("auth");

        let query = authClient.from("users").select(`
            id,
            email,
            avatar_url,
            department_id,
            created_at,
            updated_at,
            raw_user_meta_data,
            raw_app_meta_data,
            department (
              id,
              name
            ),
            user_roles(
              roles(
                id,
                name,
                description
              )
            ),
            profiles(full_name, avatar_url)
          `);

        // Filter out deleted users unless explicitly requested
        if (!filter.include_deleted) {
          query = query.is("deleted_at", null);
        }

        // Apply search filter
        if (filter.search) {
          query = query.or(
            `email.ilike.%${filter.search}%,raw_user_meta_data->>'display_name'.ilike.%${filter.search}%`,
          );
        }

        // Apply sorting
        const sortBy = filter.sort_by || "created_at";
        const sortOrder = filter.sort_order || "desc";
        query = query.order(sortBy, { ascending: sortOrder === "asc" });

        const { data: usersData, error } = await query;

        if (error) {
          console.error(`[${this.serviceName}] Error fetching users:`, error);
          throw new Error(`Failed to fetch users: ${error.message}`);
        }

        // Transform the raw Supabase data to match User interface
        const transformedUsers: User[] = (usersData || []).map((rawUser) => {
          // Extract display name from metadata or use email as fallback
          const displayName =
            rawUser.raw_user_meta_data?.display_name ||
            rawUser.raw_user_meta_data?.full_name ||
            rawUser.profiles?.[0]?.full_name ||
            rawUser.email ||
            "";

          // Transform user_roles array structure - now roles is nested inside user_roles
          const userRoles: UserRoleRow[] = (rawUser.user_roles || []).flatMap(
            (userRoleEntry: {
              roles: { id: number; name: string; description: string }[];
            }) =>
              (userRoleEntry.roles || []).map((role) => ({
                role: {
                  id: role.id || 0,
                  name: role.name || "",
                  description: role.description || "",
                },
              })),
          );

          // Extract profile information
          const profile: Profile = {
            full_name: rawUser.profiles?.[0]?.full_name || displayName,
            avatar_url:
              rawUser.profiles?.[0]?.avatar_url || rawUser.avatar_url || "",
          };

          // Transform department if exists
          const department = rawUser.department?.[0]
            ? {
                id: rawUser.department[0].id,
                name: rawUser.department[0].name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_active: true,
              }
            : undefined;

          return {
            id: rawUser.id,
            email: rawUser.email || "",
            display_name: displayName,
            avatar_url: rawUser.avatar_url || profile.avatar_url,
            user_roles: userRoles,
            department_id: rawUser.department_id,
            department,
            status: UserStatus.ACTIVE, // Default status since auth.users are typically active
            profile,
            created_at: rawUser.created_at || new Date().toISOString(),
            updated_at:
              rawUser.updated_at ||
              rawUser.created_at ||
              new Date().toISOString(),
          } satisfies User;
        });

        return transformedUsers;
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
    if (this.useMockData) {
      // Return a mock user since getMockUsers doesn't exist
      return {
        id: "mock-user-1",
        email: "mock@example.com",
        display_name: "Mock User",
        user_roles: [],
        status: UserStatus.ACTIVE,
        profile: {
          full_name: "Mock User",
          avatar_url: "",
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          email,
          display_name,
          avatar_url,
          role_id,
          status,
          created_at,
          updated_at,
          user_roles(
            role:roles(
              id,
              name,
              description,
              permissions:role_permissions(
                permission:permissions(
                  id,
                  name,
                  resource,
                  action,
                  description
                )
              )
            )
          )
        `,
        )
        .eq("id", id)
        .single<UserDisplayPermission>();

      if (error) {
        if (error.code === "PGRST116") {
          // User not found in custom table, try auth.users
          return await this.getUserByIdFromAuth(id);
        }
        if (error.code === "42P01") {
          // Table doesn't exist, fall back to auth.users
          return await this.getUserByIdFromAuth(id);
        }
        console.error(`[${this.serviceName}] Error fetching user:`, error);
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      const userWithRole = data;

      return userWithRole;
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getUserById:`, error);
      throw error;
    }
  }

  /**
   * Fallback method to get user by ID from auth.users
   */
  private async getUserByIdFromAuth(id: string): Promise<User> {
    try {
      const authClient = createClient();
      const { data, error } = await authClient.auth.admin.getUserById(id);

      if (error) {
        throw new Error(`Failed to fetch auth user: ${error.message}`);
      }

      if (!data.user) {
        throw new Error(`User with ID ${id} not found`);
      }

      const authUser = data.user;
      const displayName =
        authUser.user_metadata?.display_name || authUser.email || "";
      return {
        id: authUser.id,
        email: authUser.email || "",
        display_name: displayName,
        user_roles: [], // Default role as array
        status: UserStatus.ACTIVE,
        profile: {
          full_name: displayName,
          avatar_url: authUser.user_metadata?.avatar_url || "",
        },
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || authUser.created_at,
      };
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error in getUserByIdFromAuth:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create a new user using create_user_full RPC function
   */
  async createUser(userData: CreateUserInput): Promise<User> {
    try {
      const supabaseAuth = createClientAuth();

      // Call the create_user_full RPC function
      const { data: rpcResult, error: rpcError } = await supabaseAuth.rpc(
        "create_user_full",
        {
          p_email: userData.email,
          p_password: userData.password,
          p_display_name: userData.display_name || null,
          p_department_id: userData.department_id || null,
          p_role_ids: userData.role_ids,
        },
      );

      if (rpcError) {
        console.error(
          `[${this.serviceName}] Error creating user via RPC:`,
          rpcError,
        );

        // Handle specific error cases
        if (
          rpcError.message?.includes("duplicate key") ||
          rpcError.message?.includes("already exists") ||
          rpcError.code === "23505"
        ) {
          const emailExistsError: UserManagementError = new Error(
            "A user with this email address has already been registered",
          );
          emailExistsError.code = "email_exists";
          throw emailExistsError;
        }

        throw new Error(`Failed to create user: ${rpcError.message}`);
      }

      if (!rpcResult || rpcResult.length === 0) {
        throw new Error(
          "Failed to create user - no user data returned from RPC",
        );
      }

      const createdUserId = rpcResult[0].user_id;
      const createdUserEmail = rpcResult[0].email;

      console.log(`[${this.serviceName}] User created successfully via RPC:`, {
        id: createdUserId,
        email: createdUserEmail,
      });

      // Fetch the complete user data with roles and profile
      const { data: completeUserData, error: fetchError } = await supabaseAuth
        .from("profiles")
        .select(
          `
          id,
          full_name,
          avatar_url,
          created_at,
          updated_at
        `,
        )
        .eq("id", createdUserId)
        .single();

      if (fetchError) {
        console.error(
          `[${this.serviceName}] Error fetching created user profile:`,
          fetchError,
        );
        throw new Error(
          `Failed to fetch created user profile: ${fetchError.message}`,
        );
      }

      // Fetch user roles for the created user
      let userRoles: UserRoleRow[] = [];
      if (userData.role_ids && userData.role_ids.length > 0) {
        try {
          const { data: rolesData, error: rolesError } = await supabaseAuth
            .from("user_roles")
            .select(
              `
              role:roles(
                id,
                name,
                description
              )
            `,
            )
            .eq("user_id", createdUserId);

          if (!rolesError && rolesData) {
            userRoles = (rolesData as unknown[]).map((userRole: unknown) => {
              const roleEntry = userRole as {
                role: { id: number; name: string; description: string };
              };
              return {
                role: {
                  id: roleEntry.role?.id || 0,
                  name: roleEntry.role?.name || "",
                  description: roleEntry.role?.description || "",
                },
              };
            });
          }
        } catch (rolesFetchError) {
          console.warn(
            `[${this.serviceName}] Could not fetch roles for created user:`,
            rolesFetchError,
          );
        }
      }

      // Construct User object to return
      const newUser: User = {
        id: createdUserId,
        email: createdUserEmail,
        display_name: completeUserData.full_name,
        avatar_url: completeUserData.avatar_url || "",
        user_roles: userRoles,
        department_id: userData.department_id,
        status: UserStatus.ACTIVE,
        profile: {
          full_name: completeUserData.full_name || "",
          avatar_url: completeUserData.avatar_url || "",
        },
        created_at: completeUserData.created_at || new Date().toISOString(),
        updated_at: completeUserData.updated_at || new Date().toISOString(),
      };

      return newUser;
    } catch (error) {
      console.error(`[${this.serviceName}] Error in createUser:`, error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, updates: UpdateUserInput): Promise<User> {
    try {
      const supabase = createClient();
      const supabaseAuth = createClientAuth();

      // Use update_user RPC function to handle all user updates
      const { data: updateResult, error: updateError } = await supabaseAuth.rpc(
        "update_user",
        {
          p_user_id: id,
          p_email: updates.email || null,
          p_display_name: updates.display_name || null,
          p_department_id: updates.department_id || null,
        },
      );

      if (updateError) {
        console.error(
          `[${this.serviceName}] Error updating user via RPC:`,
          updateError,
        );
        throw new Error(`Failed to update user: ${updateError.message}`);
      }

      console.log("User updated successfully via RPC", updateResult);

      // Handle role updates
      if (updates.role_ids && updates.role_ids.length > 0) {
        // First, remove existing user roles
        await supabaseAuth.from("user_roles").delete().eq("user_id", id);

        // Then add new roles
        const roleInserts = updates.role_ids.map((roleId) => ({
          user_id: id,
          role_id: roleId,
        }));

        const { error: roleError } = await supabaseAuth
          .from("user_roles")
          .insert(roleInserts);

        if (roleError) {
          console.error(
            `[${this.serviceName}] Error updating user roles:`,
            roleError,
          );
          // Don't throw here, continue
        }
      }

      // Get updated user data
      const { data, error } = await supabaseAuth
        .from("users")
        .select(
          `
          id,
          email,
          avatar_url,
          department_id,
          status,
          created_at,
          updated_at,
          user_roles(
            role:roles(
              id,
              name,
              description
            )
          )
        `,
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error(
          `[${this.serviceName}] Error fetching updated user:`,
          error,
        );
        throw new Error(`Failed to fetch updated user: ${error.message}`);
      }

      // Get display_name from auth.users metadata
      const { data: authUser } = await supabase.auth.admin.getUserById(id);
      const displayName =
        authUser.user?.user_metadata?.display_name ||
        authUser.user?.email ||
        "";

      // Transform user_roles to match expected format
      const userRoles: UserRoleRow[] = (data.user_roles || []).map(
        (userRole: {
          role:
            | { id: number; name: string; description: string }
            | { id: number; name: string; description: string }[];
        }) => {
          const role = Array.isArray(userRole.role)
            ? userRole.role[0]
            : userRole.role;
          return {
            role: {
              id: role?.id || 0,
              name: role?.name || "",
              description: role?.description || "",
            },
          };
        },
      );

      return {
        id: data.id,
        email: data.email,
        display_name: displayName,
        avatar_url: data.avatar_url,
        user_roles: userRoles,
        department_id: data.department_id,
        status: data.status,
        profile: {
          full_name: displayName,
          avatar_url: data.avatar_url || "",
        },
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as User;
    } catch (error) {
      console.error(`[${this.serviceName}] Error in updateUser:`, error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const supabase = createClient();
      const supabaseTable = createClientAuth();

      // Delete user profile first
      const { error: profileError } = await supabaseTable
        .from("users")
        .delete()
        .eq("id", id);

      if (profileError) {
        console.error(
          `[${this.serviceName}] Error deleting user profile:`,
          profileError,
        );
        throw new Error(
          `Failed to delete user profile: ${profileError.message}`,
        );
      }

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(id);

      if (authError) {
        console.warn(
          `[${this.serviceName}] Warning - failed to delete auth user:`,
          authError,
        );
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
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from("roles")
        .select(
          `
          id,
          name,
          description,
          level,
          is_system_role,
          created_at,
          updated_at
        `,
        )
        .order("level", { ascending: false });

      if (error) {
        console.error(`[${this.serviceName}] Error fetching roles:`, error);
        throw new Error(`Failed to fetch roles: ${error.message}`);
      }

      // Fetch permissions for each role separately
      const rolesWithPermissions = await Promise.all(
        (data || []).map(async (role) => {
          try {
            const { data: permissionsData } = await supabase
              .from("role_permissions")
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
              .eq("role_id", role.id);

            const permissions =
              permissionsData
                ?.map((rp) => rp.permissions)
                .filter(Boolean)
                .flat() || [];

            return {
              ...role,
              permissions,
            } as Role;
          } catch (permError) {
            console.warn(
              `[${this.serviceName}] Could not fetch permissions for role ${role.id}:`,
              permError,
            );
            return {
              ...role,
              permissions: [],
            } as Role;
          }
        }),
      );

      return rolesWithPermissions;
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getRoles:`, error);
      throw error;
    }
  }

  /**
   * Get all permissions
   */
  async getPermissions(): Promise<Permission[]> {
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("resource", { ascending: true })
        .order("action", { ascending: true });

      if (error) {
        console.error(
          `[${this.serviceName}] Error fetching permissions:`,
          error,
        );
        throw new Error(`Failed to fetch permissions: ${error.message}`);
      }

      return (data as Permission[]) || [];
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getPermissions:`, error);
      throw error;
    }
  }

  /**
   * Get unique permission resources from auth.permissions table
   */
  async getPermissionResources(): Promise<{
    [key: string]: { action: string; id: string }[];
  }> {
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from("permissions")
        .select("id, resource, action")
        .not("resource", "is", null)
        .order("resource", { ascending: true })
        .order("action", { ascending: true });

      if (error) {
        console.error(
          `[${this.serviceName}] Error fetching permission resources:`,
          error,
        );
        throw new Error(
          `Failed to fetch permission resources: ${error.message}`,
        );
      }

      // Build the new data structure: { [resource]: [{ action, id }] }
      const objects = {} as { [key: string]: { action: string; id: string }[] };
      for (const item of data || []) {
        if (!item.resource || !item.action) continue;

        if (!objects[item.resource]) {
          objects[item.resource] = [];
        }

        // Avoid duplicates
        const exists = objects[item.resource].some(
          (existing) =>
            existing.action === item.action && existing.id === item.id,
        );

        if (!exists) {
          objects[item.resource].push({
            action: item.action,
            id: item.id.toString(),
          });
        }
      }

      return objects;
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error in getPermissionResources:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create a new permission
   */
  async createPermission(
    permissionData: CreatePermissionInput,
  ): Promise<Permission> {
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from("permissions")
        .insert([
          {
            name: permissionData.name,
            resource: permissionData.resource,
            action: permissionData.action,
            description: permissionData.description,
            created_at: new Date().toISOString(),
          },
        ])
        .select("*")
        .single();

      if (error) {
        console.error(
          `[${this.serviceName}] Error creating permission:`,
          error,
        );
        throw new Error(`Failed to create permission: ${error.message}`);
      }

      return data as Permission;
    } catch (error) {
      console.error(`[${this.serviceName}] Error in createPermission:`, error);
      throw error;
    }
  }

  /**
   * Update permission
   */
  async updatePermission(
    id: number,
    updates: UpdatePermissionInput,
  ): Promise<Permission> {
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from("permissions")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        console.error(
          `[${this.serviceName}] Error updating permission:`,
          error,
        );
        throw new Error(`Failed to update permission: ${error.message}`);
      }

      return data as Permission;
    } catch (error) {
      console.error(`[${this.serviceName}] Error in updatePermission:`, error);
      throw error;
    }
  }

  /**
   * Delete permission
   */
  async deletePermission(id: number): Promise<void> {
    try {
      const supabase = createClientAuth();

      const { error } = await supabase
        .from("permissions")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          `[${this.serviceName}] Error deleting permission:`,
          error,
        );
        throw new Error(`Failed to delete permission: ${error.message}`);
      }
    } catch (error) {
      console.error(`[${this.serviceName}] Error in deletePermission:`, error);
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(roleData: CreateRoleInput): Promise<Role> {
    try {
      const supabase = createClientAuth();

      console.log("Creating role with data:", roleData);

      // Create role
      const { data: roleRow, error: roleError } = await supabase
        .from("roles")
        .insert([
          {
            name: roleData.name,
            description: roleData.description,
            level: roleData.level,
            is_system_role: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select("*")
        .single();

      if (roleError) {
        console.error(`[${this.serviceName}] Error creating role:`, roleError);
        throw new Error(`Failed to create role: ${roleError.message}`);
      }

      console.log("Created role:", roleRow);
      debugger;
      // Add permissions to role in auth.role_permissions table
      if (roleData.permission_ids.length > 0) {
        const rolePermissions = roleData.permission_ids.map((permissionId) => ({
          role_id: roleRow.id,
          permission_id: permissionId,
        }));

        console.log("Inserting role permissions:", rolePermissions);

        const { error: permError } = await supabase
          .from("role_permissions")
          .insert(rolePermissions);

        if (permError) {
          console.error(
            `[${this.serviceName}] Error adding permissions to role:`,
            permError,
          );
          // Don't throw here to avoid orphaned role, just log the error
        } else {
          console.log("Successfully inserted role permissions");
        }
      }

      // Fetch complete role with permissions
      return await this.getRoleById(roleRow.id);
    } catch (error) {
      console.error(`[${this.serviceName}] Error in createRole:`, error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(id: number, updates: UpdateRoleInput): Promise<Role> {
    try {
      const supabase = createClientAuth();

      console.log("Updating role with ID:", id, "updates:", updates);

      // Update role
      const { error: roleError } = await supabase
        .from("roles")
        .update({
          name: updates.name,
          description: updates.description,
          level: updates.level,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (roleError) {
        console.error(`[${this.serviceName}] Error updating role:`, roleError);
        throw new Error(`Failed to update role: ${roleError.message}`);
      }

      console.log("Updated role successfully");

      // Update permissions if provided in auth.role_permissions table
      if (updates.permission_ids !== undefined) {
        console.log("Updating permissions to:", updates.permission_ids);

        // Remove existing permissions
        const { error: deleteError } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role_id", id);

        if (deleteError) {
          console.error(
            `[${this.serviceName}] Error removing existing permissions:`,
            deleteError,
          );
        } else {
          console.log("Removed existing permissions");
        }

        // Add new permissions
        if (updates.permission_ids.length > 0) {
          const rolePermissions = updates.permission_ids.map(
            (permissionId) => ({
              role_id: id,
              permission_id: permissionId,
            }),
          );

          console.log("Inserting new permissions:", rolePermissions);

          const { error: permError } = await supabase
            .from("role_permissions")
            .insert(rolePermissions);

          if (permError) {
            console.error(
              `[${this.serviceName}] Error updating role permissions:`,
              permError,
            );
          } else {
            console.log("Successfully updated role permissions");
          }
        }
      }

      // Fetch updated role with permissions
      return await this.getRoleById(id);
    } catch (error) {
      console.error(`[${this.serviceName}] Error in updateRole:`, error);
      throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(id: number): Promise<void> {
    try {
      const supabase = createClientAuth();

      const { error } = await supabase.from("roles").delete().eq("id", id);

      if (error) {
        console.error(`[${this.serviceName}] Error deleting role:`, error);
        throw new Error(`Failed to delete role: ${error.message}`);
      }
    } catch (error) {
      console.error(`[${this.serviceName}] Error in deleteRole:`, error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: number): Promise<Role> {
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from("roles")
        .select(
          `
          id,
          name,
          description,
          level,
          is_system_role,
          created_at,
          updated_at
        `,
        )
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error(`Role with ID ${id} not found`);
        }
        console.error(`[${this.serviceName}] Error fetching role:`, error);
        throw new Error(`Failed to fetch role: ${error.message}`);
      }

      // Fetch permissions separately
      let permissions: Permission[] = [];
      try {
        const { data: permissionsData } = await supabase
          .from("role_permissions")
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
          .eq("role_id", id);

        permissions =
          permissionsData
            ?.map((rp) => rp.permissions)
            .filter(Boolean)
            .flat() || [];
      } catch (permError) {
        console.warn(
          `[${this.serviceName}] Could not fetch permissions for role ${id}:`,
          permError,
        );
      }

      return {
        ...data,
        permissions,
      } as Role;
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getRoleById:`, error);
      throw error;
    }
  }

  /**
   * Get all departments
   */
  async getDepartments(): Promise<Department[]> {
    if (this.useMockData) {
      return this.getMockDepartments();
    }

    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from("department")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error(
          `[${this.serviceName}] Error fetching departments:`,
          error,
        );
        throw new Error(`Failed to fetch departments: ${error.message}`);
      }

      return (data as Department[]) || [];
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getDepartments:`, error);
      throw error;
    }
  }

  /**
   * Create a new department
   */
  async createDepartment(
    departmentData: CreateDepartmentInput,
  ): Promise<Department> {
    try {
      const supabase = createClientAuth();
      const currentUser = await this.getCurrentUser();

      const { data, error } = await supabase
        .from("department")
        .insert([
          {
            name: departmentData.name,
            description: departmentData.description,
            is_active: departmentData.is_active ?? true,
            settings: departmentData.settings || {},
            created_by: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select("*")
        .single();

      if (error) {
        console.error(
          `[${this.serviceName}] Error creating department:`,
          error,
        );
        throw new Error(`Failed to create department: ${error.message}`);
      }

      return data as Department;
    } catch (error) {
      console.error(`[${this.serviceName}] Error in createDepartment:`, error);
      throw error;
    }
  }

  /**
   * Update department
   */
  async updateDepartment(
    id: string,
    updates: UpdateDepartmentInput,
  ): Promise<Department> {
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from("department")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        console.error(
          `[${this.serviceName}] Error updating department:`,
          error,
        );
        throw new Error(`Failed to update department: ${error.message}`);
      }

      return data as Department;
    } catch (error) {
      console.error(`[${this.serviceName}] Error in updateDepartment:`, error);
      throw error;
    }
  }

  /**
   * Delete department
   */
  async deleteDepartment(id: string): Promise<void> {
    try {
      const supabase = createClientAuth();

      const { error } = await supabase.from("department").delete().eq("id", id);

      if (error) {
        console.error(
          `[${this.serviceName}] Error deleting department:`,
          error,
        );
        throw new Error(`Failed to delete department: ${error.message}`);
      }
    } catch (error) {
      console.error(`[${this.serviceName}] Error in deleteDepartment:`, error);
      throw error;
    }
  }

  private getMockDepartments(): Department[] {
    return [
      {
        id: "dept-1",
        name: "Engineering",
        description: "Software development and technical teams",
        created_by: "admin",
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z",
        is_active: true,
        settings: {},
      },
      {
        id: "dept-2",
        name: "Marketing",
        description: "Marketing and communications",
        created_by: "admin",
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z",
        is_active: true,
        settings: {},
      },
      {
        id: "dept-3",
        name: "Sales",
        description: "Sales and business development",
        created_by: "admin",
        created_at: "2024-01-02T10:00:00Z",
        updated_at: "2024-01-02T10:00:00Z",
        is_active: true,
        settings: {},
      },
      {
        id: "dept-4",
        name: "Human Resources",
        description: "People operations and talent management",
        created_by: "admin",
        created_at: "2024-01-03T10:00:00Z",
        updated_at: "2024-01-03T10:00:00Z",
        is_active: true,
        settings: {},
      },
      {
        id: "dept-5",
        name: "Finance",
        description: "Financial planning and accounting",
        created_by: "admin",
        created_at: "2024-01-04T10:00:00Z",
        updated_at: "2024-01-04T10:00:00Z",
        is_active: false,
        settings: {},
      },
      {
        id: "dept-6",
        name: "Operations",
        description: "Business operations and logistics",
        created_by: "admin",
        created_at: "2024-01-05T10:00:00Z",
        updated_at: "2024-01-05T10:00:00Z",
        is_active: true,
        settings: {},
      },
    ];
  }

  /**
   * Build feature access list based on permissions
   * Simple heuristic: resource maps to a feature of same name where possible
   */
  private mapPermissionsToFeatures(permissions: Permission[]): FeatureAccess[] {
    const featureMap = new Map<string, FeatureAccess>();

    const upgradeLevel = (
      current: AccessLevel | undefined,
      perm: Permission,
    ): AccessLevel => {
      if (!perm.action) return current || AccessLevel.READ;
      switch (perm.action) {
        case PermissionAction.MANAGE:
          return AccessLevel.ADMIN;
        case PermissionAction.CREATE:
        case PermissionAction.UPDATE:
        case PermissionAction.DELETE:
          return current === AccessLevel.ADMIN
            ? AccessLevel.ADMIN
            : AccessLevel.WRITE;
        case PermissionAction.READ:
        default:
          return current || AccessLevel.READ;
      }
    };

    permissions.forEach((p) => {
      if (!p.resource) return;
      const existing = featureMap.get(p.resource);
      const nextLevel = upgradeLevel(existing?.access_level, p);
      const actions = new Set<PermissionAction>(existing?.permissions || []);
      if (p.action) actions.add(p.action);
      featureMap.set(p.resource, {
        feature: p.resource,
        access_level: nextLevel,
        permissions: Array.from(actions),
      });
    });

    return Array.from(featureMap.values());
  }

  /**
   * Extract user information from JWT access token
   * This provides roles, permissions, and department_name directly from the token
   */
  private extractUserFromJWT(accessToken: string): {
    roles: string[];
    permissions: string[];
    role_ids: number[];
    department_name?: string;
    department_id?: string;
  } | null {
    try {
      const claims = extractUserClaims(accessToken);
      if (!claims) {
        return null;
      }

      return {
        roles: claims.roles,
        permissions: claims.permissions,
        role_ids: claims.role_ids,
        department_name: claims.department_name,
        department_id: claims.department_id,
      };
    } catch (error) {
      console.warn(
        `[${this.serviceName}] Could not extract JWT claims:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get role data from role name (for JWT role mapping)
   */
  private async getRoleByName(roleName: string): Promise<Role | null> {
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from("roles")
        .select(
          `
          id,
          name,
          description,
          level,
          is_system_role,
          created_at,
          updated_at
        `,
        )
        .ilike("name", roleName)
        .single();

      if (error) {
        console.warn(
          `[${this.serviceName}] Role '${roleName}' not found in database:`,
          error,
        );
        return null;
      }

      // Fetch permissions for this role
      let permissions: Permission[] = [];
      try {
        const { data: permissionsData } = await supabase
          .from("role_permissions")
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
          .eq("role_id", data.id);

        permissions =
          permissionsData
            ?.map((rp) => rp.permissions)
            .filter(Boolean)
            .flat() || [];
      } catch (permError) {
        console.warn(
          `[${this.serviceName}] Could not fetch permissions for role ${roleName}:`,
          permError,
        );
      }

      return {
        ...data,
        permissions,
      } as Role;
    } catch (error) {
      console.warn(
        `[${this.serviceName}] Error in getRoleByName for '${roleName}':`,
        error,
      );
      return null;
    }
  }

  /**
   * Get user session (user + permissions + derived features)
   */
  async getUserSession(userId: string): Promise<UserSession> {
    try {
      // First, get the auth user data
      const authClient = createClient();
      const { data: authData, error: authError } =
        await authClient.auth.admin.getUserById(userId);

      if (authError) {
        throw new Error(`Failed to fetch auth user: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Try to extract additional data from JWT access token if available
      let jwtData: {
        roles: string[];
        permissions: string[];
        role_ids: number[];
        department_name?: string;
        department_id?: string;
      } | null = null;

      try {
        // Get current session to access the JWT token
        const session = await getAuthSession();
        if (session?.access_token) {
          jwtData = this.extractUserFromJWT(session.access_token);
        }
      } catch (jwtError) {
        console.warn(
          `[${this.serviceName}] Could not extract JWT data:`,
          jwtError,
        );
      }

      const userRoles = jwtData?.roles.map(
        (role, index) =>
          ({
            role: {
              id: jwtData?.role_ids[index],
              name: role,
              description: "",
            },
          }) as UserRoleRow,
      ) as UserRoleRow[];

      let permissions: Permission[] = [];
      const userData: User = {
        id: authData.user.id,
        email: authData.user.email || "",
        display_name:
          (authData.user.user_metadata?.display_name as string) ||
          authData.user.email ||
          "",
        user_roles: userRoles,
        status: UserStatus.ACTIVE,
        profile: {
          full_name:
            (authData.user.user_metadata?.display_name as string) ||
            authData.user.email ||
            "",
          avatar_url: (authData.user.user_metadata?.avatar_url as string) || "",
        },
        created_at: authData.user.created_at,
        updated_at: authData.user.updated_at || authData.user.created_at,
        department_id: jwtData?.department_id,
        department: jwtData?.department_name
          ? {
              id: jwtData.department_id || "",
              name: jwtData.department_name,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_active: true,
            }
          : undefined,
      };

      if (jwtData?.permissions.length) {
        const jwtPermissions = jwtData.permissions.map((perm, index) => ({
          id: permissions.length + index + 1,
          name: perm,
          resource: perm.split(":")[0] || "general",
          action:
            (perm.split(":")[1] as PermissionAction) || PermissionAction.READ,
          description: `Permission from JWT: ${perm}`,
          created_at: new Date().toISOString(),
        }));

        // Combine and deduplicate permissions
        const allPermissions = [...permissions, ...jwtPermissions];
        permissions = allPermissions.filter(
          (perm, index, self) =>
            index === self.findIndex((p) => p.name === perm.name),
        );
      }

      // Add JWT permissions if available (in addition to role permissions)
      if (jwtData?.permissions.length) {
        const jwtPermissions = jwtData.permissions.map((perm, index) => ({
          id: permissions.length + index + 1,
          name: perm,
          resource: perm.split(":")[0] || "general",
          action:
            (perm.split(":")[1] as PermissionAction) || PermissionAction.READ,
          description: `Permission from JWT: ${perm}`,
          created_at: new Date().toISOString(),
        }));

        // Combine and deduplicate permissions
        const allPermissions = [...permissions, ...jwtPermissions];
        permissions = allPermissions.filter(
          (perm, index, self) =>
            index === self.findIndex((p) => p.name === perm.name),
        );
      }

      // Merge JWT permissions with database permissions
      if (jwtData?.permissions.length) {
        const jwtPermissions: Permission[] = jwtData.permissions.map(
          (perm, index) => ({
            id: permissions.length + index + 1,
            name: perm,
            resource: perm.split(":")[0] || "general",
            action:
              (perm.split(":")[1] as PermissionAction) || PermissionAction.READ,
            description: `Permission from JWT: ${perm}`,
            created_at: new Date().toISOString(),
          }),
        );

        // Combine and deduplicate permissions
        const allPermissions = [...permissions, ...jwtPermissions];
        permissions = allPermissions.filter(
          (perm, index, self) =>
            index === self.findIndex((p) => p.name === perm.name),
        );
      }

      const features = this.mapPermissionsToFeatures(permissions);

      const session: UserSession = {
        user: userData,
        permissions,
        features,
        session_id: `${userData.id}:${Date.now()}`,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1h expiry
      };

      return session;
    } catch (error) {
      console.error(`[${this.serviceName}] Error in getUserSession:`, error);
      throw error instanceof Error
        ? error
        : new Error("Unknown error getting user session");
    }
  }

  /**
   * Check if a user has a given permission (resource + action)
   */
  async checkPermission(
    userId: string,
    resource: string,
    action: PermissionAction,
  ): Promise<PermissionCheckResult> {
    try {
      const session = await this.getUserSession(userId);

      // Role level short-circuit: if any role has ADMIN level high (>=90) allow
      if (session.user.user_roles && session.user.user_roles.length > 0) {
        // First, get full role data by checking role IDs
        const roleIds = session.user.user_roles.map((ur) => ur.role.id);
        try {
          const roles = await this.getRoles();
          const userRoles = roles.filter((role) => roleIds.includes(role.id));
          const hasAdminRole = userRoles.some(
            (role: Role) => role.level && role.level >= 90,
          );
          if (hasAdminRole) {
            return { allowed: true };
          }
        } catch (roleError) {
          console.warn(
            `[${this.serviceName}] Could not check role levels:`,
            roleError,
          );
        }
      }

      // Also check JWT roles for admin bypass
      try {
        const authSession = await getAuthSession();
        if (authSession?.access_token) {
          const jwtData = this.extractUserFromJWT(authSession.access_token);
          if (jwtData?.roles) {
            // Check if user has admin role in JWT
            const hasAdminRole = jwtData.roles.some((role) =>
              ["admin", "super_admin", "administrator"].includes(
                role.toLowerCase(),
              ),
            );
            if (hasAdminRole) {
              return { allowed: true };
            }
          }
        }
      } catch (jwtError) {
        console.warn(
          `[${this.serviceName}] Could not check JWT roles for admin bypass:`,
          jwtError,
        );
      }

      // Check permissions from database
      const has = session.permissions.some((p) => {
        if (!p.resource || !p.action) return false;
        if (p.resource !== resource) return false;
        if (p.action === PermissionAction.MANAGE) return true; // manage implies all
        if (p.action === action) return true;
        return false;
      });

      // If not found in database permissions, check JWT permissions
      if (!has) {
        try {
          const authSession = await getAuthSession();
          if (authSession?.access_token) {
            const jwtData = this.extractUserFromJWT(authSession.access_token);
            if (jwtData?.permissions) {
              const jwtPermissionString = `${resource}:${action}`;
              const hasJWTPermission =
                jwtData.permissions.includes(jwtPermissionString) ||
                jwtData.permissions.includes(
                  `${resource}:${PermissionAction.MANAGE}`,
                );

              if (hasJWTPermission) {
                return { allowed: true };
              }
            }
          }
        } catch (jwtError) {
          console.warn(
            `[${this.serviceName}] Could not check JWT permissions:`,
            jwtError,
          );
        }
      }

      return has
        ? { allowed: true }
        : {
            allowed: false,
            reason: "Permission denied",
            required_permission: `${resource}:${action}`,
          };
    } catch (error) {
      return {
        allowed: false,
        reason:
          error instanceof Error ? error.message : "Permission check error",
      };
    }
  }
  /**
   * Get user roles from JWT token
   */
  async getUserRolesFromJWT(): Promise<string[]> {
    try {
      const session = await getAuthSession();
      if (!session?.access_token) {
        return [];
      }

      const jwtData = this.extractUserFromJWT(session.access_token);
      return jwtData?.roles || [];
    } catch (error) {
      console.warn(
        `[${this.serviceName}] Could not get roles from JWT:`,
        error,
      );
      return [];
    }
  }

  /**
   * Get user permissions from JWT token
   */
  async getUserPermissionsFromJWT(): Promise<string[]> {
    try {
      const session = await getAuthSession();
      if (!session?.access_token) {
        return [];
      }

      const jwtData = this.extractUserFromJWT(session.access_token);
      return jwtData?.permissions || [];
    } catch (error) {
      console.warn(
        `[${this.serviceName}] Could not get permissions from JWT:`,
        error,
      );
      return [];
    }
  }

  /**
   * Get user department from JWT token
   */
  async getUserDepartmentFromJWT(): Promise<{
    name?: string;
    id?: string;
  } | null> {
    try {
      const session = await getAuthSession();
      if (!session?.access_token) {
        return null;
      }

      const jwtData = this.extractUserFromJWT(session.access_token);
      if (!jwtData?.department_name && !jwtData?.department_id) {
        return null;
      }

      return {
        name: jwtData.department_name,
        id: jwtData.department_id,
      };
    } catch (error) {
      console.warn(
        `[${this.serviceName}] Could not get department from JWT:`,
        error,
      );
      return null;
    }
  }

  /**
   * Check if user has role from JWT token
   */
  async hasRoleFromJWT(role: string): Promise<boolean> {
    try {
      const session = await getAuthSession();
      if (!session?.access_token) {
        return false;
      }

      return hasRole(session.access_token, role);
    } catch (error) {
      console.warn(
        `[${this.serviceName}] Could not check role from JWT:`,
        error,
      );
      return false;
    }
  }

  /**
   * Check if user has permission from JWT token
   */
  async hasPermissionFromJWT(
    resource: string,
    action: PermissionAction,
  ): Promise<boolean> {
    try {
      const session = await getAuthSession();
      if (!session?.access_token) {
        return false;
      }

      const permissionString = `${resource}:${action}`;
      return (
        hasPermission(session.access_token, permissionString) ||
        hasPermission(
          session.access_token,
          `${resource}:${PermissionAction.MANAGE}`,
        )
      );
    } catch (error) {
      console.warn(
        `[${this.serviceName}] Could not check permission from JWT:`,
        error,
      );
      return false;
    }
  }

  /**
   * Get role permissions by role ID
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from("role_permissions")
        .select(
          `
          permissions (
            id,
            name,
            resource,
            action,
            description,
            created_at,
            updated_at
          )
        `,
        )
        .eq("role_id", roleId);

      if (error) {
        console.error(
          `[${this.serviceName}] Error fetching role permissions:`,
          error,
        );
        throw new Error(`Failed to fetch role permissions: ${error.message}`);
      }

      return (
        (data
          ?.map((rp) => rp.permissions)
          .filter(Boolean)
          .flat() as Permission[]) || []
      );
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error in getRolePermissions:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get resource metadata (icons and display names) from database
   */
  async getResourceMetadata(): Promise<{
    [resource: string]: { icon: string; displayName: string };
  }> {
    try {
      const supabase = createClientAuth();

      // Get unique resources from permissions table
      const { data, error } = await supabase
        .from("permissions")
        .select("resource")
        .not("resource", "is", null);

      if (error) {
        console.error(
          `[${this.serviceName}] Error fetching resource metadata:`,
          error,
        );
        throw new Error(`Failed to fetch resource metadata: ${error.message}`);
      }

      // Create metadata mapping from unique resources
      const uniqueResources = [
        ...new Set(data?.map((item) => item.resource).filter(Boolean) || []),
      ];
      const metadata: {
        [resource: string]: { icon: string; displayName: string };
      } = {};

      uniqueResources.forEach((resource) => {
        // Generate display name from resource
        const displayName = resource
          .split("-")
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        // Map resource to icon (you can extend this based on your resource types)
        let icon = "📋"; // default icon
        switch (resource) {
          case "dashboard":
            icon = "🏠";
            break;
          case "department":
            icon = "🏢";
            break;
          case "document":
          case "document-department":
          case "document-public":
            icon = "📄";
            break;
          case "user":
            icon = "👤";
            break;
          case "knowledge-base":
            icon = "📚";
            break;
          case "project":
            icon = "📁";
            break;
          case "role":
            icon = "🔒";
            break;
          case "permission":
            icon = "🛡️";
            break;
          case "chat":
            icon = "💬";
            break;
          case "settings":
            icon = "⚙️";
            break;
          case "team":
            icon = "👥";
            break;
          case "analytics":
            icon = "📊";
            break;
          default:
            icon = "📋";
        }

        metadata[resource] = { icon, displayName };
      });

      return metadata;
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error in getResourceMetadata:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get action display mappings from database
   */
  async getActionDisplayMappings(): Promise<{ [action: string]: string }> {
    try {
      const supabase = createClientAuth();

      // Get unique actions from permissions table
      const { data, error } = await supabase
        .from("permissions")
        .select("action")
        .not("action", "is", null);

      if (error) {
        console.error(
          `[${this.serviceName}] Error fetching action mappings:`,
          error,
        );
        throw new Error(`Failed to fetch action mappings: ${error.message}`);
      }

      // Create action display mapping from unique actions
      const uniqueActions = [
        ...new Set(data?.map((item) => item.action).filter(Boolean) || []),
      ];
      const mappings: { [action: string]: string } = {};

      uniqueActions.forEach((action) => {
        // Generate display mapping for action
        switch (action.toLowerCase()) {
          case "create":
          case "insert":
            mappings[action] = "CREATE";
            break;
          case "read":
          case "view":
            mappings[action] = "READ";
            break;
          case "update":
          case "edit":
            mappings[action] = "UPDATE";
            break;
          case "delete":
          case "remove":
            mappings[action] = "DELETE";
            break;
          case "admin":
          case "manage":
            mappings[action] = "ADMIN";
            break;
          default:
            mappings[action] = action.toUpperCase();
        }
      });

      return mappings;
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error in getActionDisplayMappings:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Add permissions to a role
   */
  async addRolePermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<void> {
    try {
      const supabase = createClientAuth();

      const rolePermissions = permissionIds.map((permissionId) => ({
        role_id: roleId,
        permission_id: permissionId,
      }));

      const { error } = await supabase
        .from("role_permissions")
        .insert(rolePermissions);

      if (error) {
        console.error(
          `[${this.serviceName}] Error adding role permissions:`,
          error,
        );
        throw new Error(`Failed to add role permissions: ${error.message}`);
      }
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error in addRolePermissions:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Remove permissions from a role
   */
  async removeRolePermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<void> {
    try {
      const supabase = createClientAuth();

      const { error } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", roleId)
        .in("permission_id", permissionIds);

      if (error) {
        console.error(
          `[${this.serviceName}] Error removing role permissions:`,
          error,
        );
        throw new Error(`Failed to remove role permissions: ${error.message}`);
      }
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error in removeRolePermissions:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Set exact permissions for a role (replaces all existing permissions)
   */
  async setRolePermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<void> {
    try {
      const supabase = createClientAuth();

      // Remove all existing permissions
      const { error: deleteError } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", roleId);

      if (deleteError) {
        console.error(
          `[${this.serviceName}] Error removing existing role permissions:`,
          deleteError,
        );
        throw new Error(
          `Failed to remove existing role permissions: ${deleteError.message}`,
        );
      }

      // Add new permissions if any
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permissionId) => ({
          role_id: roleId,
          permission_id: permissionId,
        }));

        const { error: insertError } = await supabase
          .from("role_permissions")
          .insert(rolePermissions);

        if (insertError) {
          console.error(
            `[${this.serviceName}] Error adding new role permissions:`,
            insertError,
          );
          throw new Error(
            `Failed to add new role permissions: ${insertError.message}`,
          );
        }
      }
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error in setRolePermissions:`,
        error,
      );
      throw error;
    }
  }
}

export default UserManagementService;
