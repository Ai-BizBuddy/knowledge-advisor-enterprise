/**
 * useLogs Hook
 * 
 * Custom hook for managing application logs with Thai datetime formatting and pagination
 */

'use client';

import type { LogEntry } from '@/interfaces/LogsTable';
import { logsService } from '@/services/LogsService';
import { useCallback, useEffect, useState } from 'react';

export interface UseLogsOptions {
  initialLimit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface PaginationState {
  page: number;
  limit: number;
  sortBy: 'timestamp' | 'action' | 'table_name' | 'user_full_name';
  sortOrder: 'asc' | 'desc';
  filterAction?: string;
}

export interface UseLogsReturn {
  logs: LogEntry[];
  total: number;
  loading: boolean;
  error: string | null;
  paginationState: PaginationState;
  updatePagination: (updates: Partial<PaginationState>) => void;
  refreshLogs: () => Promise<void>;
}

/**
 * Hook for managing application logs with server-side pagination
 */
export const useLogs = (options: UseLogsOptions = {}): UseLogsReturn => {
  const {
    initialLimit = 10,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paginationState, setPaginationState] = useState<PaginationState>({
    page: 1,
    limit: initialLimit,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  });

  /**
   * Format timestamp to Thai locale
   */
  const formatThaiTimestamp = useCallback((timestamp: string): string => {
    try {
      // Handle different timestamp formats from database
      let date: Date;
      
      // If timestamp includes timezone info (like +00), parse directly
      if (timestamp.includes('+') || timestamp.includes('Z')) {
        date = new Date(timestamp);
      } else {
        // If no timezone, assume UTC and convert
        date = new Date(timestamp + 'Z');
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return timestamp; // Return original if parsing fails
      }

      return date.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Bangkok',
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return timestamp; // Return original if error occurs
    }
  }, []);

  /**
   * Transform logs with Thai datetime formatting
   */
  const transformLogsWithThaiTime = useCallback((logEntries: LogEntry[]): LogEntry[] => {
    return logEntries.map(log => ({
      ...log,
      timestamp: formatThaiTimestamp(log.timestamp),
    }));
  }, [formatThaiTimestamp]);

  /**
   * Update pagination state with merge
   */
  const updatePagination = useCallback((updates: Partial<PaginationState>) => {
    setPaginationState((prev) => ({
      ...prev,
      ...updates,
      // Reset to page 1 when changing filters or sorting
      page: updates.sortBy || updates.sortOrder || updates.filterAction !== undefined ? 1 : (updates.page ?? prev.page),
    }));
  }, []);

  /**
   * Fetch logs from the database with pagination
   */
  const refreshLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const offset = (paginationState.page - 1) * paginationState.limit;

      const result = await logsService.getLogsWithCount({
        sortBy: paginationState.sortBy,
        sortOrder: paginationState.sortOrder,
        filterAction: paginationState.filterAction,
        limit: paginationState.limit,
        offset,
      });
      
      const logsWithThaiTime = transformLogsWithThaiTime(result.data);
      
      setLogs(logsWithThaiTime);
      setTotal(result.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logs';
      setError(errorMessage);
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [paginationState, transformLogsWithThaiTime]);

  // Load logs when pagination state changes
  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  // Auto refresh logs
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      refreshLogs();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshLogs]);

  return {
    logs,
    total,
    loading,
    error,
    paginationState,
    updatePagination,
    refreshLogs,
  };
};