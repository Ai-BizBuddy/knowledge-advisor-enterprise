'use client';

/**
 * useChunkCount Hook - Chunk Count Management with Error Handling
 *
 * Custom React hook for fetching chunk count from StatisticsService
 * with proper error states and loading management
 */

import { statisticsService } from '@/services/StatisticsService';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Chunk count hook state interface
 */
interface UseChunkCountState {
  chunkCount: number | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Chunk count hook return interface
 */
interface UseChunkCountReturn {
  chunkCount: number | null;
  isLoading: boolean;
  error: string | null;
  hasError: boolean;
  lastUpdated: Date | null;
  refreshChunkCount: () => Promise<void>;
}

/**
 * Hook options interface
 */
interface UseChunkCountOptions {
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
  onError?: (error: string) => void;
  onSuccess?: (count: number) => void;
}

/**
 * Custom hook for managing chunk count with error handling
 *
 * @param options - Configuration options for the hook
 * @returns Chunk count data, loading state, error state, and utility functions
 */
export const useChunkCount = (
  options: UseChunkCountOptions = {},
): UseChunkCountReturn => {
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

  const [state, setState] = useState<UseChunkCountState>({
    chunkCount: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  /**
   * Fetch chunk count with enhanced error handling
   * Uses the dedicated getTotalChunks method for better error reporting
   */
  const fetchChunkCount = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Try to get chunk count using the dedicated method first
      try {
        const chunkStatistic = await statisticsService.getTotalChunks();
        const chunkCount = typeof chunkStatistic.value === 'number' 
          ? chunkStatistic.value 
          : parseInt(chunkStatistic.value.toString()) || 0;

        setState({
          chunkCount,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        });

        onSuccessRef.current?.(chunkCount);
        return;
      } catch (directError) {
        console.warn('Direct chunk count method failed, falling back to dashboard statistics:', directError);
        
        // Fallback to getting chunk count from dashboard statistics
        const statistics = await statisticsService.getDashboardStatistics();
        const chunkCount = statistics.totalChunks ?? 0;

        setState({
          chunkCount,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        });

        onSuccessRef.current?.(chunkCount);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error 
          ? `Chunk count calculation failed: ${error.message}`
          : 'Failed to fetch chunk count from all available sources';

      console.error('useChunkCount fetchChunkCount error:', errorMessage);

      setState((prev) => ({
        ...prev,
        chunkCount: null,
        isLoading: false,
        error: errorMessage,
      }));

      onErrorRef.current?.(errorMessage);
    }
  }, []); // No dependencies since we use refs

  /**
   * Manually refresh chunk count
   */
  const refreshChunkCount = useCallback(async (): Promise<void> => {
    await fetchChunkCount();
  }, [fetchChunkCount]);

  // Initial fetch on mount
  useEffect(() => {
    fetchChunkCount();
  }, [fetchChunkCount]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(fetchChunkCount, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [fetchChunkCount, autoRefresh, refreshInterval]);

  return {
    chunkCount: state.chunkCount,
    isLoading: state.isLoading,
    error: state.error,
    hasError: !!state.error,
    lastUpdated: state.lastUpdated,
    refreshChunkCount,
  };
};

export default useChunkCount;