/**
 * usePermissionResources Hook
 *
 * React hook for fetching permission resources with actions from Supabase auth.permissions table.
 * Returns structured data: { [resource]: [{ action, id }] }
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import UserManagementService from "@/services/UserManagementService";

export interface PermissionResourceData {
  [resource: string]: { action: string; id: string }[];
}

export interface UsePermissionResourcesReturn {
  resourcesData: PermissionResourceData;
  resources: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getActionsForResource: (resource: string) => { action: string; id: string }[];
  getAllAvailableActions: () => string[];
}

/**
 * Hook to fetch permission resources with actions from Supabase
 */
export function usePermissionResources(): UsePermissionResourcesReturn {
  const [resourcesData, setResourcesData] = useState<PermissionResourceData>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userManagementService = useMemo(() => new UserManagementService(), []);

  /**
   * Fetch permission resources from Supabase
   */
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userManagementService.getPermissionResources();

      console.log(
        "[usePermissionResources] Fetched resources data:",
        Object.keys(data).length,
        data,
      );
      setResourcesData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch permission resources";
      console.error("[usePermissionResources] Error:", errorMessage);
      setError(errorMessage);

      // Don't set fallback data - let it stay empty to force real Supabase data
      setResourcesData({});
    } finally {
      setLoading(false);
    }
  }, [userManagementService]);

  // Extract resource names
  const resources = useMemo(() => {
    return Object.keys(resourcesData).sort();
  }, [resourcesData]);

  // Helper function to get actions for a specific resource
  const getActionsForResource = useCallback(
    (resource: string) => {
      return resourcesData[resource] || [];
    },
    [resourcesData],
  );

  // Helper function to get all unique actions across all resources
  const getAllAvailableActions = useCallback(() => {
    const allActions = new Set<string>();
    Object.values(resourcesData).forEach((actions) => {
      actions.forEach((actionItem) => {
        allActions.add(actionItem.action);
      });
    });
    return Array.from(allActions).sort();
  }, [resourcesData]);

  // Fetch resources on mount
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return {
    resourcesData,
    resources,
    loading,
    error,
    refetch: fetchResources,
    getActionsForResource,
    getAllAvailableActions,
  };
}
