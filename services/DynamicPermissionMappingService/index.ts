import { createClientAuth } from '@/utils/supabase/client';
import { Permission } from '@/interfaces/UserManagement';

// Type definitions
export type ActionKey = string;

export interface PermissionMapping {
  resource: string;
  action: ActionKey;
  permissionId: number;
  permissionName: string;
}

export class DynamicPermissionMappingService {
  private static instance: DynamicPermissionMappingService;
  private mappings: PermissionMapping[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): DynamicPermissionMappingService {
    if (!DynamicPermissionMappingService.instance) {
      DynamicPermissionMappingService.instance =
        new DynamicPermissionMappingService();
    }
    return DynamicPermissionMappingService.instance;
  }

  /**
   * Fetch permissions from database and create mappings
   */
  async fetchAndCreateMappings(): Promise<PermissionMapping[]> {
    const now = Date.now();

    // Return cached mappings if recent
    if (
      this.mappings.length > 0 &&
      now - this.lastFetch < this.CACHE_DURATION
    ) {
      console.log('Using cached permission mappings');
      return this.mappings;
    }

    try {
      console.log('Fetching permissions from database...');
      const supabase = createClientAuth();

      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true })
        .order('action', { ascending: true });

      if (error) {
        console.error('Error fetching permissions:', error);
        throw new Error(`Failed to fetch permissions: ${error.message}`);
      }

      console.log('Fetched permissions from database:', permissions);

      // Convert database permissions to mapping format
      this.mappings = (permissions || []).map((permission: Permission) => {
        return {
          resource: permission.resource || '',
          action: (permission.action || 'read') as ActionKey,
          permissionId: permission.id,
          permissionName: permission.name,
        };
      });

      this.lastFetch = now;
      console.log('Created dynamic mappings:', this.mappings);

      return this.mappings;
    } catch (error) {
      console.error('Error in fetchAndCreateMappings:', error);
      throw error;
    }
  }

  /**
   * Get cached mappings
   */
  getCachedMappings(): PermissionMapping[] {
    return [...this.mappings];
  }

  /**
   * Clear cache to force refresh
   */
  clearCache(): void {
    this.mappings = [];
    this.lastFetch = 0;
  }

  /**
   * Convert permission IDs back to permission row format using dynamic mappings
   */
  async convertIdsToPermissionRows(
    permissionIds: number[],
  ): Promise<{ resource: string; actions: Record<string, boolean> }[]> {
    const mappings = await this.fetchAndCreateMappings();
    const resourceActions: Record<string, Record<string, boolean>> = {};

    // Group mappings by resource
    mappings.forEach((mapping) => {
      if (permissionIds.includes(mapping.permissionId)) {
        if (!resourceActions[mapping.resource]) {
          resourceActions[mapping.resource] = {};
        }
        resourceActions[mapping.resource][mapping.action] = true;
      }
    });

    // Convert to array format
    return Object.entries(resourceActions).map(([resource, actions]) => ({
      resource,
      actions,
    }));
  }

  /**
   * Find permission by resource and action
   */
  async findPermissionId(
    resource: string,
    action: ActionKey,
  ): Promise<number | null> {
    const mappings = await this.fetchAndCreateMappings();
    const mapping = mappings.find(
      (m) => m.resource === resource && m.action === action,
    );
    return mapping ? mapping.permissionId : null;
  }

  /**
   * Convert permission rows to permission IDs
   */
  async convertPermissionsToIds(
    permissions: { resource: string; actions: Record<string, boolean> }[],
  ): Promise<number[]> {
    const mappings = await this.fetchAndCreateMappings();
    const permissionIds: number[] = [];

    for (const permission of permissions) {
      for (const [action, isEnabled] of Object.entries(permission.actions)) {
        if (isEnabled) {
          const mapping = mappings.find(
            (m) => m.resource === permission.resource && m.action === action,
          );
          if (mapping) {
            permissionIds.push(mapping.permissionId);
          } else {
            console.warn(
              `No mapping found for resource: ${permission.resource}, action: ${action}`,
            );
          }
        }
      }
    }

    return permissionIds;
  }
}

// Export singleton instance
export const dynamicPermissionMappingService =
  DynamicPermissionMappingService.getInstance();
