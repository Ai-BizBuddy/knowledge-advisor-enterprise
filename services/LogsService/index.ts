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

export class LogsService {
  private supabase = createClientTable();

  /**
   * Fetch logs from the activity_log table
   */
  async getLogs(): Promise<LogEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('activity_log')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch logs: ${error.message}`);
      }

      // Transform database entries to LogEntry format
      return data.map((logs) => ({
        ...logs,
        // If createMessage is async, you need to await it; otherwise, call directly
        message: this.createMessage(logs.action, logs.table_name || 'resource'),
      }));
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }

  async searchLogs(query: string) {
    try {
      const { data, error } = await this.supabase
        .from('activity_log')
        .select('*')
        .or(`table_name.ilike.%${query}%`)
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to search logs: ${error.message}`);
      }

      return data.map((logs) => ({
        ...logs,
        // If createMessage is async, you need to await it; otherwise, call directly
        message: this.createMessage(logs.action, logs.table_name || 'resource'),
      }));
    } catch (error) {
      console.error('Error searching logs:', error);
      throw error;
    }
  }
  createMessage(action: string, table: string): string {
    switch (action) {
      case 'INSERT':
        return `Created new entry in ${table}`;
      case 'UPDATE':
        return `Updated entry in ${table}`;
      case 'DELETE':
        return `Deleted entry from ${table}`;
      default:
        return `Performed ${action} on ${table}`;
    }
  }
}

export const logsService = new LogsService();
