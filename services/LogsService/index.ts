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
        .from('activity_log_with_profiles')
        .select('*')
        .order('timestamp', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch logs: ${error.message}`);
      }

      // Transform database entries to LogEntry format
      return data.map((logs) => ({
        ...logs,
        // If createMessage is async, you need to await it; otherwise, call directly
        message: this.createMessage(logs.action, logs.table_name || 'resource', logs.user_full_name, logs.old_data, logs.new_data),
      }));
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }

  async searchLogs(query: string) {
    try {
      const { data, error } = await this.supabase
        .from('activity_log_with_profiles')
        .select('*')
        .or(`action.ilike.%${query}%`)
        .order('timestamp', { ascending: true });

      if (error) {
        throw new Error(`Failed to search logs: ${error.message}`);
      }

      return data.map((logs) => ({
        ...logs,
        // If createMessage is async, you need to await it; otherwise, call directly
        message: this.createMessage(logs.action, logs.table_name || 'resource', logs.user_full_name, logs.old_data.name, logs.new_data.name),
      }));
    } catch (error) {
      console.error('Error searching logs:', error);
      throw error;
    }
  }
  createMessage(action: string, table: string, name: string, old_data?: string, new_data?: string): string {
    switch (action) {
      case 'INSERT':
        return `Created new entry in ${table} by ${name}` + (new_data ? ` with data: ${JSON.stringify(new_data)}` : '');
      case 'UPDATE':
        return `Updated entry in ${table} by ${name}` + (old_data ? ` from: ${JSON.stringify(old_data)} to: ${JSON.stringify(new_data)}` : '');
      case 'DELETE':
        return `Deleted entry from ${table} by ${name} ` + (old_data ? ` with data: ${JSON.stringify(old_data)}` : '');
      default:
        return `Performed ${action} on ${table} by ${name}` + (old_data ? ` with data: ${JSON.stringify(old_data)}` : '');
    }
  }
}

export const logsService = new LogsService();
