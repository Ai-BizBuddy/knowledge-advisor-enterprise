/**
 * useDashboard Hook - Comprehensive Dashboard Data Management
 *
 * Custom React hook for fetching and managing all dashboard-related data
 * including statistics, recent activities, chat sessions, and knowledge base information.
 * Features intelligent refresh interval that only runs when the page/tab is visible.
 */

'use client';

import type { Project } from '@/interfaces/Project';
import type { DashboardStatistics } from '@/interfaces/Statistics';
import {
  dashboardService,
  type ActivityItem,
  type ChatMessage,
  type ChatSession,
  type DashboardOverview,
} from '@/services/DashboardService';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStatistics } from './useStatistics';

/**
 * Dashboard hook state interface
 */
interface UseDashboardState {
  overview: DashboardOverview | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Dashboard hook return interface
 */
interface UseDashboardReturn {
  // Data
  overview: DashboardOverview | null;
  statistics: DashboardStatistics | null;
  recentKnowledgeBases: Project[];
  recommendedKnowledgeBases: Project[];
  recentActivities: ActivityItem[];
  activeChatSessions: ChatSession[];
  recentChatMessages: ChatMessage[];

  // State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isPageVisible: boolean; // New: Track page visibility

  // Actions
  refreshDashboard: () => Promise<void>;
  refreshStatistics: () => Promise<void>;
}

/**
 * Dashboard hook options interface
 */
interface UseDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  enableChatData?: boolean; // Enable chat session and message fetching
  onError?: (error: string) => void;
  onSuccess?: (data: DashboardOverview) => void;
}

/**
 * Custom hook for managing complete dashboard data
 * 
 * Features:
 * - Automatic data refresh only when page/tab is visible
 * - Pauses refresh interval when user switches tabs or minimizes window
 * - Resumes refresh when user returns to the dashboard
 * - Real-time statistics updates
 * - Comprehensive error handling
 *
 * @param options - Configuration options for the hook
 * @returns Dashboard data, loading state, error state, and utility functions
 */
export const useDashboard = (
  options: UseDashboardOptions = {},
): UseDashboardReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes default
    enableChatData = false,
    onError,
    onSuccess,
  } = options;

  // Use refs to store the latest callback functions to avoid dependency issues
  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const [state, setState] = useState<UseDashboardState>({
    overview: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  // Use the statistics hook without auto-refresh
  const { statistics, refreshStatistics: refreshStatsOnly } = useStatistics({
    autoRefresh: false,
    onError: (error) => {
            // Don't fail the entire dashboard if stats fail
    },
  });

  /**
   * Fetch complete dashboard overview
   */
  const fetchDashboardOverview = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const overview = await dashboardService.getDashboardOverview();

      setState({
        overview,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });

      onSuccessRef.current?.(overview);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch dashboard data';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      onErrorRef.current?.(errorMessage);
    }
  }, []);

  /**
   * Refresh complete dashboard data
   */
  const refreshDashboard = useCallback(async (): Promise<void> => {
    await fetchDashboardOverview();
  }, [fetchDashboardOverview]);

  /**
   * Refresh only statistics
   */
  const refreshStatistics = useCallback(async (): Promise<void> => {
    await refreshStatsOnly();
  }, [refreshStatsOnly]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardOverview();
  }, [fetchDashboardOverview]);

  // Page visibility tracking
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Track page visibility for auto-refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    // Set initial visibility state
    setIsPageVisible(!document.hidden);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-refresh setup - only when page is visible
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && isPageVisible) {
      refreshIntervalRef.current = setInterval(() => {
        fetchDashboardOverview();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    } else if (refreshIntervalRef.current) {
      // Clear interval when page is not visible or autoRefresh is disabled
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, [autoRefresh, refreshInterval, isPageVisible, fetchDashboardOverview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Extract data from overview for easy access
  const recentKnowledgeBases = state.overview?.recentKnowledgeBases || [];
  const recommendedKnowledgeBases =
    state.overview?.recommendedKnowledgeBases || [];
  const recentActivities = state.overview?.recentActivities || [];
  const activeChatSessions = enableChatData
    ? state.overview?.activeChatSessions || []
    : [];
  const recentChatMessages = enableChatData
    ? state.overview?.recentChatMessages || []
    : [];

  return {
    overview: state.overview,
    statistics: statistics || state.overview?.statistics || null,
    recentKnowledgeBases,
    recommendedKnowledgeBases,
    recentActivities,
    activeChatSessions,
    recentChatMessages,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    isPageVisible,
    refreshDashboard,
    refreshStatistics,
  };
};

export default useDashboard;
