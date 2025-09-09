'use client';
/**
 * useStatistics Hook - Dashboard Statistics Management
 *
 * Custom React hook for fetching and managing dashboard statistics
 * Following the project's strict TypeScript standards and modern React patterns
 */

import type { DashboardStatistics } from '@/interfaces/Statistics';
import { statisticsService } from '@/services/StatisticsService';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Statistics hook state interface
 */
interface UseStatisticsState {
  statistics: DashboardStatistics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Statistics hook return interface
 */
interface UseStatisticsReturn {
  statistics: DashboardStatistics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshStatistics: () => Promise<void>;
  recordQuery: (
    projectId: string,
    queryText: string,
    responseTimeMs: number,
    status: 'completed' | 'failed' | 'timeout',
  ) => Promise<void>;
}

/**
 * Hook options interface
 */
interface UseStatisticsOptions {
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
  onError?: (error: string) => void;
  onSuccess?: (data: DashboardStatistics) => void;
}

/**
 * Custom hook for managing dashboard statistics
 *
 * @param options - Configuration options for the hook
 * @returns Statistics data, loading state, error state, and utility functions
 */
export const useStatistics = (
  options: UseStatisticsOptions = {},
): UseStatisticsReturn => {
  const {
    refreshInterval = 60000, // 1 minute default
    autoRefresh = true,
    onError,
    onSuccess,
  } = options;

  // Use refs to store the latest callback functions to avoid dependency issues
  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);

  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const [state, setState] = useState<UseStatisticsState>({
    statistics: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  /**
   * Fetch dashboard statistics from the API
   */
  const fetchStatistics = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const data = await statisticsService.getDashboardStatistics();

      setState({
        statistics: data,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });

      onSuccessRef.current?.(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch statistics';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      onErrorRef.current?.(errorMessage);
          }
  }, []); // No dependencies since we use refs

  /**
   * Manually refresh statistics
   */
  const refreshStatistics = useCallback(async (): Promise<void> => {
    await fetchStatistics();
  }, [fetchStatistics]);

  /**
   * Record query activity for real-time statistics updates
   */
  const recordQuery = useCallback(
    async (
      projectId: string,
      queryText: string,
      responseTimeMs: number,
      status: 'completed' | 'failed' | 'timeout',
    ): Promise<void> => {
      try {
        await statisticsService.recordQueryActivity({
          projectId,
          queryText,
          responseTimeMs,
          status,
        });

        // Optionally refresh statistics after recording activity
        // You can make this configurable if needed
        if (status === 'completed') {
          setTimeout(() => {
            fetchStatistics();
          }, 500); // Delay to allow backend processing
        }
      } catch (error) {
                // Don't update the error state for this operation as it's background
      }
    },
    [fetchStatistics],
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(fetchStatistics, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [fetchStatistics, autoRefresh, refreshInterval]);

  return {
    statistics: state.statistics,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refreshStatistics,
    recordQuery,
  };
};

export default useStatistics;
