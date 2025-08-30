/**
 * useDashboard Hook - Comprehensive Dashboard Data Management
 *
 * Custom React hook for fetching and managing all dashboard-related data
 * including statistics, recent activities, chat sessions, and knowledge base information
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  dashboardService,
  type DashboardOverview,
  type ActivityItem,
  type ChatSession,
  type ChatMessage,
} from "@/services/DashboardService";
import { useStatistics } from "./useStatistics";
import type { DashboardStatistics } from "@/interfaces/Statistics";
import type { Project } from "@/interfaces/Project";

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
 * @param options - Configuration options for the hook
 * @returns Dashboard data, loading state, error state, and utility functions
 */
export const useDashboard = (
  options: UseDashboardOptions = {},
): UseDashboardReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutes default
    enableChatData = true,
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
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  // Use the statistics hook for real-time statistics updates
  const { statistics, refreshStatistics: refreshStatsOnly } = useStatistics({
    autoRefresh: true,
    refreshInterval: 60000, // Refresh stats every minute
    onError: (error) => {
      console.warn("Statistics update failed:", error);
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
          : "Failed to fetch dashboard data";

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

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchDashboardOverview();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchDashboardOverview]);

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
    refreshDashboard,
    refreshStatistics,
  };
};

export default useDashboard;
