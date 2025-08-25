'use client';

/**
 * usePermissionsConfig Hook
 *
 * Hook for managing permissions configuration and resource definitions.
 * Provides structured permission resources with their available actions.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermissionResources } from './usePermissionResources';

export interface PermissionResourceConfig {
  key: string;
  name: string;
  description: string;
  actions: string[];
}

export interface UsePermissionsConfigReturn {
  resources: PermissionResourceConfig[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  refetch: () => Promise<void>;
}

/**
 * Hook to get permissions configuration with resource definitions
 */
export function usePermissionsConfig(): UsePermissionsConfigReturn {
  const {
    resourcesData,
    loading: resourcesLoading,
    error: resourcesError,
    refetch: refetchResources,
  } = usePermissionResources();

  const [error, setError] = useState<string | null>(null);

  // Transform resources data into configuration format
  const resources = useMemo(() => {
    const configs: PermissionResourceConfig[] = [];

    Object.entries(resourcesData).forEach(([resourceName, actions]) => {
      // Generate a friendly name and description from the resource name
      const name = resourceName
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const description = `Manage ${name.toLowerCase()} operations and access control`;

      const uniqueActions = Array.from(
        new Set(actions.map((action) => action.action)),
      ).sort();

      configs.push({
        key: resourceName,
        name,
        description,
        actions: uniqueActions,
      });
    });

    return configs.sort((a, b) => a.name.localeCompare(b.name));
  }, [resourcesData]);

  // Clear error handler
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refetch data
  const refetch = useCallback(async () => {
    try {
      setError(null);
      await refetchResources();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to refetch permissions config';
      setError(errorMessage);
    }
  }, [refetchResources]);

  // Handle errors from the underlying hook
  useEffect(() => {
    if (resourcesError) {
      setError(resourcesError);
    }
  }, [resourcesError]);

  return {
    resources,
    loading: resourcesLoading,
    error: error || resourcesError,
    clearError,
    refetch,
  };
}
