import { createClientAuth, createClient } from '@/utils/supabase/client';
import { Permission, PermissionAction } from '@/interfaces/UserManagement';
import { ResourceConfig } from '@/interfaces/Permissions';

export interface PermissionMatrix {
  [resource: string]: {
    [action in PermissionAction]?: boolean;
  };
}

export interface SavePermissionsInput {
  roleId: number;
  permissions: PermissionMatrix;
}

export interface CurrentUserPermissions {
  userId: string;
  email: string;
  roles: Array<{
    id: number;
    name: string;
    permissions: Permission[];
  }>;
  directPermissions: Permission[];
}

class PermissionsService {
  /**
   * Get current user's permissions from Supabase Auth
   */
  async getCurrentUserPermissions(): Promise<CurrentUserPermissions | null> {
    try {
      const supabase = createClient(); // Use main client for auth

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
                return null;
      }

      // Get user's roles and permissions using auth schema client
      const authClient = createClientAuth();
      const { data: userData, error: userDataError } = await authClient
        .from('users')
        .select(
          `
          id,
          email,
          user_roles(
            role:roles(
              id,
              name,
              role_permissions(
                permissions(
                  id,
                  name,
                  resource,
                  action,
                  description,
                  created_at
                )
              )
            )
          )
        `,
        )
        .eq('id', user.id)
        .single();

      if (userDataError) {
                return null;
      }

      // Transform the data to extract permissions
      const roles =
        userData.user_roles?.map((userRole: unknown) => {
          const ur = userRole as {
            role: {
              id: number;
              name: string;
              role_permissions: Array<{ permissions: Permission }>;
            };
          };
          const role = ur.role;
          const permissions =
            role.role_permissions
              ?.map((rp) => rp.permissions)
              .filter(Boolean) || [];

          return {
            id: role.id,
            name: role.name,
            permissions,
          };
        }) || [];

      // Get direct permissions (if any user has direct permissions)
      const { data: directPermissions } = await authClient
        .from('user_permissions')
        .select(
          `
          permissions(
            id,
            name,
            resource,
            action,
            description,
            created_at
          )
        `,
        )
        .eq('user_id', user.id);

      const directPerms =
        directPermissions
          ?.map((up: unknown) => {
            const userPerm = up as { permissions: Permission };
            return userPerm.permissions;
          })
          .filter(Boolean) || [];

      return {
        userId: user.id,
        email: user.email || '',
        roles,
        directPermissions: directPerms,
      };
    } catch (error) {
            return null;
    }
  }

  /**
   * Get all available permissions from Supabase
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true })
        .order('action', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch permissions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
            throw error;
    }
  }

  /**
   * Save role permissions to Supabase
   */
  async saveRolePermissions(
    roleId: number,
    permissions: PermissionMatrix,
  ): Promise<boolean> {
    try {
      const supabase = createClientAuth();

      // First, get all available permission IDs
      const allPermissions = await this.getAllPermissions();
      const permissionMap = new Map<string, number>();

      allPermissions.forEach((permission) => {
        const key = `${permission.resource}_${permission.action}`;
        permissionMap.set(key, permission.id);
      });

      // Delete existing role permissions
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      if (deleteError) {
        throw new Error(
          `Failed to delete existing permissions: ${deleteError.message}`,
        );
      }

      // Insert new permissions
      const newRolePermissions: Array<{
        role_id: number;
        permission_id: number;
      }> = [];

      Object.entries(permissions).forEach(([resource, actions]) => {
        Object.entries(actions).forEach(([action, enabled]) => {
          if (enabled) {
            const key = `${resource}_${action}`;
            const permissionId = permissionMap.get(key);

            if (permissionId) {
              newRolePermissions.push({
                role_id: roleId,
                permission_id: permissionId,
              });
            }
          }
        });
      });

      if (newRolePermissions.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(newRolePermissions);

        if (insertError) {
          throw new Error(
            `Failed to insert new permissions: ${insertError.message}`,
          );
        }
      }

      return true;
    } catch (error) {
            throw error;
    }
  }

  /**
   * Create a new permission in Supabase
   */
  async createPermission(
    name: string,
    resource: string,
    action: PermissionAction,
    description?: string,
  ): Promise<Permission> {
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from('permissions')
        .insert({
          name,
          resource,
          action,
          description,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create permission: ${error.message}`);
      }

      return data;
    } catch (error) {
            throw error;
    }
  }

  /**
   * Ensure all required permissions exist in the database
   */
  async ensurePermissionsExist(
    resources: Array<{ key: string; name: string }>,
    actions: Array<{ key: PermissionAction; name: string }>,
  ): Promise<void> {
    try {
      const supabase = createClientAuth();
      const existingPermissions = await this.getAllPermissions();

      const existingPermsSet = new Set(
        existingPermissions.map((p) => `${p.resource}_${p.action}`),
      );

      const newPermissions: Array<{
        name: string;
        resource: string;
        action: PermissionAction;
        description: string;
        created_at: string;
      }> = [];

      resources.forEach((resource) => {
        actions.forEach((action) => {
          const key = `${resource.key}_${action.key}`;

          if (!existingPermsSet.has(key)) {
            newPermissions.push({
              name: `${action.name} ${resource.name}`,
              resource: resource.key,
              action: action.key,
              description: `${action.name} access for ${resource.name}`,
              created_at: new Date().toISOString(),
            });
          }
        });
      });

      if (newPermissions.length > 0) {
        const { error } = await supabase
          .from('permissions')
          .insert(newPermissions);

        if (error) {
                    // Don't throw here, as this is non-critical
        } else {
                  }
      }
    } catch (error) {
            // Don't throw, as this is non-critical for the UI
    }
  }

  /**
   * Check if user has specific permission
   */
  async userHasPermission(
    userId: string,
    resource: string,
    action: PermissionAction,
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getCurrentUserPermissions();

      if (!userPermissions) {
        return false;
      }

      // Check in all user's roles
      for (const role of userPermissions.roles) {
        const hasPermission = role.permissions.some(
          (permission) =>
            permission.resource === resource && permission.action === action,
        );

        if (hasPermission) {
          return true;
        }
      }

      // Check direct permissions
      const hasDirectPermission = userPermissions.directPermissions.some(
        (permission) =>
          permission.resource === resource && permission.action === action,
      );

      return hasDirectPermission;
    } catch (error) {
            return false;
    }
  }

  /**
   * Get unique resources from permissions table
   */
  async getUniqueResources(): Promise<Array<ResourceConfig>> {
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from('permissions')
        .select('resource, action')
        .not('resource', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch resources: ${error.message}`);
      }

      if (!data) return [];

      // Group resources and their actions
      const resourceMap = data.reduce<Map<string, string[]>>((acc, row) => {
        const resource = row.resource as string;
        const action = row.action as string;

        if (!acc.has(resource)) {
          acc.set(resource, []);
        }
        acc.get(resource)!.push(action);

        return acc;
      }, new Map());

      // Convert map to desired output
      return Array.from(resourceMap.entries()).map(([key, actions]) => ({
        name: key,
        icon: 'lock', // Default icon for all resources
        displayName: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter for display
        description: `${key} resource permissions`,
        actions: Array.from(new Set(actions)),
      }));
    } catch (error) {
            throw error;
    }
  }

  /**
   * Get unique actions from permissions table
   */
  async getUniqueActions(): Promise<
    Array<{ key: PermissionAction; count: number; actions: string[] }>
  > {
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from('permissions')
        .select('resource, action')
        .not('action', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch actions: ${error.message}`);
      }

      if (!data) return [];

      // Group actions
      const grouped = data.reduce<Record<string, string[]>>((acc, row) => {
        const action = row.action as string;
        if (!acc[action]) {
          acc[action] = [];
        }
        acc[action].push(action);
        return acc;
      }, {});

      // Convert to desired format
      return Object.entries(grouped).map(([key, actions]) => ({
        key: key as PermissionAction,
        count: actions.length,
        actions,
      }));
    } catch (error) {
            throw error;
    }
  }

  /**
   * Get permissions matrix for a specific role
   */
  async getRolePermissionsMatrix(roleId: number): Promise<PermissionMatrix> {
    try {
      const supabase = createClientAuth();

      const { data, error } = await supabase
        .from('role_permissions')
        .select(
          `
          permissions(
            resource,
            action
          )
        `,
        )
        .eq('role_id', roleId);

      if (error) {
        throw new Error(`Failed to fetch role permissions: ${error.message}`);
      }

      const matrix: PermissionMatrix = {};

      data?.forEach((rp: unknown) => {
        const rolePermission = rp as {
          permissions: { resource: string; action: string };
        };
        const permission = rolePermission.permissions;
        if (permission && permission.resource && permission.action) {
          if (!matrix[permission.resource]) {
            matrix[permission.resource] = {};
          }
          matrix[permission.resource][permission.action as PermissionAction] =
            true;
        }
      });

      return matrix;
    } catch (error) {
            throw error;
    }
  }
}

export default PermissionsService;
