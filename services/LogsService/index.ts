/**
 * Logs Service
 *
 * Service for fetching application logs from the database
 */

import type { LogEntry } from '@/interfaces/LogsTable';
import { createClientTable } from '@/utils/supabase/client';

export interface DatabaseLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  timestamp: string;
}

export interface LogsQueryOptions {
  sortBy?: 'timestamp' | 'action' | 'table_name' | 'user_full_name';
  sortOrder?: 'asc' | 'desc';
  filterAction?: string;
  limit?: number;
  offset?: number;
}

export interface LogsResult {
  data: LogEntry[];
  total: number;
}

export class LogsService {
  private supabase = createClientTable();

  /**
   * Get total count of logs with filters
   */
  async getTotalCount(options: Omit<LogsQueryOptions, 'limit' | 'offset' | 'sortBy' | 'sortOrder'> = {}): Promise<number> {
    try {
      const { filterAction } = options;

      let query = this.supabase
        .from('activity_log_with_profiles')
        .select('*', { count: 'exact', head: true });

      // Apply action filter if provided
      if (filterAction) {
        query = query.or(`action.ilike.%${filterAction}%`);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count logs: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Error counting logs:', error);
      throw error;
    }
  }

  /**
   * Fetch logs from the activity_log table with sorting, filtering, and pagination
   */
  async getLogs(options: LogsQueryOptions = {}): Promise<LogEntry[]> {
    try {
      const {
        sortBy = 'timestamp',
        sortOrder = 'desc',
        filterAction,
        limit = 10,
        offset = 0,
      } = options;

      let query = this.supabase
        .from('activity_log_with_profiles')
        .select('*');

      // Apply action filter if provided
      if (filterAction) {
        query = query.or(`action.ilike.%${filterAction}%`);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch logs: ${error.message}`);
      }

      // Transform database entries to LogEntry format
      return data.map((logs) => ({
        ...logs,
        message: this.createMessage(
          logs.action,
          logs.table_name || 'resource',
          logs.user_full_name,
          logs.old_data,
          logs.new_data,
        ),
      }));
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }

  /**
   * Fetch logs with pagination and return total count
   */
  async getLogsWithCount(options: LogsQueryOptions = {}): Promise<LogsResult> {
    try {
      const [data, total] = await Promise.all([
        this.getLogs(options),
        this.getTotalCount(options),
      ]);

      return { data, total };
    } catch (error) {
      console.error('Error fetching logs with count:', error);
      throw error;
    }
  }

  /**
   * @deprecated Use getLogs with filterAction option instead
   */
  async searchLogs(query: string, options: LogsQueryOptions = {}): Promise<LogEntry[]> {
    return this.getLogs({ ...options, filterAction: query });
  }
  
  createMessage(
    action: string,
    table: string,
    name: string,
    old_data?: Record<string, unknown>,
    new_data?: Record<string, unknown>,
  ): string {
    const oldDataStr = old_data ? old_data.name : '';
    const newDataStr = new_data ? new_data.name : '';

    switch (action) {
      case 'INSERT':
        return `Created new entry in ${table} by ${name ? name : 'System'}` + (new_data ? ` with data: ${newDataStr}` : '');
      case 'UPDATE':
        return `Updated entry in ${table} by ${name ? name : 'System'}` + (old_data ? ` with data: ${oldDataStr}` : '');
      case 'DELETE':
        return `Deleted entry from ${table} by ${name ? name : 'System'}` + (old_data ? ` with data: ${oldDataStr}` : '');
      default:
        return `Performed ${action} on ${table} by ${name ? name : 'System'}` + (old_data ? ` with data: ${oldDataStr}` : '');
    }
  }
}

export const logsService = new LogsService();
