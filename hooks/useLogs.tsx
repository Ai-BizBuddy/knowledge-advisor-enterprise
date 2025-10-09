/**
 * useLogs Hook
 * 
 * Custom hook for managing application logs with Thai datetime formatting
 */

'use client';

import type { LogEntry } from '@/interfaces/LogsTable';
import { logsService } from '@/services/LogsService';
import { useCallback, useEffect, useState } from 'react';

export interface UseLogsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseLogsReturn {
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  refreshLogs: () => Promise<void>;
  searchLogs: (query: string) => Promise<void>;
}

/**
 * Hook for managing application logs
 */
export const useLogs = (options: UseLogsOptions = {}): UseLogsReturn => {
  const {
    limit = 50,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
   * Fetch logs from the database
   */
  const refreshLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const logEntries = await logsService.getLogs(limit);
      const logsWithThaiTime = transformLogsWithThaiTime(logEntries);
      
      setLogs(logsWithThaiTime);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logs';
      setError(errorMessage);
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, transformLogsWithThaiTime]);

  /**
   * Search logs by query
   */
  const searchLogs = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const logEntries = query.trim() 
        ? await logsService.searchLogs(query, limit)
        : await logsService.getLogs(limit);
      
      const logsWithThaiTime = transformLogsWithThaiTime(logEntries);
      setLogs(logsWithThaiTime);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search logs';
      setError(errorMessage);
      console.error('Error searching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, transformLogsWithThaiTime]);

  // Load logs on mount
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
    loading,
    error,
    refreshLogs,
    searchLogs,
  };
};