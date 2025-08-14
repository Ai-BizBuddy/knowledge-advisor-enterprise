/**
 * usePermissionData Hook
 *
 * React hook for fetching and managing dynamic permission data from Supabase.
 * Now includes full resource+action data structure for enhanced permissions table.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import UserManagementService from "@/services/UserManagementService";
import type { Permission } from "@/interfaces/UserManagement";
import { usePermissionResources } from "./usePermissionResources";

export interface DynamicPermissionData {
  resources: string[];
  actions: string[];
  resourcesWithActions: Record<string, string[]>;
  resourcesData: Record<string, { action: string; id: string }[]>;
}

export interface UsePermissionDataReturn {
  permissionData: DynamicPermissionData | null;
  permissions: Permission[];
  resources: string[];
  actions: string[];
  resourcesData: Record<string, { action: string; id: string }[]>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getActionsForResource: (resource: string) => { action: string; id: string }[];
  getStandardActions: () => string[];
  getCustomActionsForResource: (
    resource: string,
  ) => { action: string; id: string }[];
}

/**
 * Hook to fetch and structure permission data from Supabase
 */
export function usePermissionData(): UsePermissionDataReturn {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userManagementService = useMemo(() => new UserManagementService(), []);

  // Get resource data with actions
  const {
    resourcesData,
    resources: resourcesList,
    loading: resourcesLoading,
    error: resourcesError,
    getActionsForResource: getResourceActions,
    getAllAvailableActions,
  } = usePermissionResources();

  /**
   * Extract permission structure helper
   */
  const extractStructure = useCallback(
    (perms: Permission[]): DynamicPermissionData => {
      const resourcesSet = new Set<string>();
      const actionsSet = new Set<string>();
      const resourcesWithActions: Record<string, string[]> = {};

      perms.forEach((permission) => {
        if (permission.resource) {
          const resource = permission.resource;
          resourcesSet.add(resource);

          if (permission.action) {
            const action = permission.action.toLowerCase();
            actionsSet.add(action);

            if (!resourcesWithActions[resource]) {
              resourcesWithActions[resource] = [];
            }
            if (!resourcesWithActions[resource].includes(action)) {
              resourcesWithActions[resource].push(action);
            }
          }
        }
      });

      // Merge with data from resourcesData
      Object.keys(resourcesData).forEach((resource) => {
        resourcesSet.add(resource);
        if (!resourcesWithActions[resource]) {
          resourcesWithActions[resource] = [];
        }

        resourcesData[resource].forEach((actionItem) => {
          const action = actionItem.action.toLowerCase();
          actionsSet.add(action);
          if (!resourcesWithActions[resource].includes(action)) {
            resourcesWithActions[resource].push(action);
          }
        });
      });

      return {
        resources: Array.from(resourcesSet).sort(),
        actions: Array.from(actionsSet).sort(),
        resourcesWithActions,
        resourcesData,
      };
    },
    [resourcesData],
  );

  /**
   * Fetch permissions from Supabase
   */
  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const permissionsData = await userManagementService.getPermissions();
      setPermissions(permissionsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch permissions";
      console.error("[usePermissionData] Error:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userManagementService]);

  /**
   * Extract structured permission data
   */
  const permissionData = useMemo(() => {
    if (resourcesLoading) return null;

    const data = extractStructure(permissions);
    return data;
  }, [permissions, extractStructure, resourcesLoading]);

  // Helper functions
  const getActionsForResource = useCallback(
    (
      resource: string,
    ): {
      action: string;
      id: string;
    }[] => {
      const resourceActions = getResourceActions(resource);
      return resourceActions;
    },
    [getResourceActions],
  );

  const getStandardActions = useCallback((): string[] => {
    return ["insert", "read", "update", "delete"];
  }, []);

  const getCustomActionsForResource = useCallback(
    (resource: string): { action: string; id: string }[] => {
      const allActions = getActionsForResource(resource);
      const standardActions = getStandardActions();
      return allActions.filter(
        (permission) => !standardActions.includes(permission.action),
      );
    },
    [getActionsForResource, getStandardActions],
  );

  // Fetch permissions on mount
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Combine loading states
  const isLoading = loading || resourcesLoading;
  const combinedError = error || resourcesError;

  return {
    permissionData,
    permissions,
    resources: permissionData?.resources || resourcesList,
    actions: permissionData?.actions || getAllAvailableActions(),
    resourcesData,
    loading: isLoading,
    error: combinedError,
    refetch: fetchPermissions,
    getActionsForResource,
    getStandardActions,
    getCustomActionsForResource,
  };
}

/**
 * Hook for fallback to static constants when dynamic data is not available
 */
export function usePermissionDataWithFallback(): UsePermissionDataReturn {
  const dynamicData = usePermissionData();

  const resources = useMemo(() => {
    return dynamicData.resources.length > 0 ? dynamicData.resources : [];
  }, [dynamicData.resources]);

  const actions = useMemo(() => {
    return dynamicData.actions.length > 0 ? dynamicData.actions : [];
  }, [dynamicData.actions]);

  return {
    ...dynamicData,
    resources,
    actions,
  };
}
