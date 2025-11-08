'use client';

import { activityLogService } from '@/services';
import type { ActivityLogWithProfile } from '@/services/ActivityLogService';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface ActivityItem {
  id: string;
  type: 'upload' | 'query' | 'knowledgebase' | 'processing' | 'error';
  message: string;
  time: string;
  status: 'success' | 'error' | 'info' | 'warning';
  projectId?: string;
  documentId?: string;
}

export interface UseRecentActivityOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  page?: number;
  pageSize?: number;
}

export interface UseRecentActivityReturn {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  pagination: {
    currentPage: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export const useRecentActivity = (
  options: UseRecentActivityOptions = {},
): UseRecentActivityReturn => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(options.page || 1);
  const [pageSize, setPageSize] = useState(options.pageSize || options.limit || 10);
  const [totalActivities, setTotalActivities] = useState(0);

  const { limit = 10 } = options;

  // Use ref to store the latest limit value to avoid stale closures
  const limitRef = useRef(limit);
  const pageSizeRef = useRef(pageSize);
  const currentPageRef = useRef(currentPage);
  
  useEffect(() => {
    limitRef.current = limit;
    pageSizeRef.current = pageSize;
    currentPageRef.current = currentPage;
  }, [limit, pageSize, currentPage]);

  // Function to format relative time (e.g., "2 hours ago")
  const formatRelativeTime = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'Just now';
    } 
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } 
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }

    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }, []);

  // Load recent activities - stable reference with no dependencies
  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (currentPageRef.current - 1) * pageSizeRef.current;

      // Fetch activity logs from the service with pagination
      const result = await activityLogService.getActivityLogs({
        limit: pageSizeRef.current,
        offset,
        ascending: false,
      });

      // Transform activity logs to ActivityItem format
      const activities: ActivityItem[] = result.data.map((log: ActivityLogWithProfile) => ({
        id: log.id,
        type: activityLogService.getActivityType(log.table_name, log.action, log.changed_fields),
        message: activityLogService.formatActivityMessage(log),
        time: formatRelativeTime(log.timestamp),
        status: activityLogService.getActivityStatus(log.action, log.table_name, log.changed_fields, log.new_data),
        projectId: log.knowledge_base_id || undefined,
        documentId: log.record_id || undefined,
      }));

      setActivities(activities);
      setTotalActivities(result.total);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to load recent activity';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [formatRelativeTime]);

  // Load on mount and when limit changes
  useEffect(() => {
    loadActivities();
  }, [loadActivities, limit, currentPage, pageSize]);

  const totalPages = Math.ceil(totalActivities / pageSize);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  return {
    activities,
    loading,
    error,
    refresh: loadActivities,
    pagination: {
      currentPage,
      pageSize,
      total: totalActivities,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    },
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
  };
};

export default useRecentActivity;
