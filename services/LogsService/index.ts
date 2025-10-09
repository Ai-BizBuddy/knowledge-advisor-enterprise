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
  timeStamp: string;
}

export class LogsService {
  private supabase = createClientTable();

  /**
   * Fetch logs from the activity_logs table
   */
  async getLogs(limit: number = 50): Promise<LogEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('activity_log')
        .select('*')
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch logs: ${error.message}`);
      }

      // Transform database entries to LogEntry format
      return (data || []).map(this.transformToLogEntry);
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }

  /**
   * Transform database log entry to LogEntry interface
   */
  private transformToLogEntry = (dbLog: DatabaseLogEntry): LogEntry => {
    // Create a descriptive message based on action and details
    let message = dbLog.action;
    
    if (dbLog.details) {
      try {
        const details = typeof dbLog.details === 'string' 
          ? JSON.parse(dbLog.details) 
          : dbLog.details;
        
        if (details.message) {
          message = details.message;
        } else if (details.description) {
          message = details.description;
        } else {
          // Create message based on action and resource
          if (dbLog.resource_type && dbLog.action) {
            message = `${dbLog.action} ${dbLog.resource_type}`;
            if (details.name || details.title) {
              message += `: ${details.name || details.title}`;
            }
          }
        }
      } catch {
        // If details is not valid JSON, use action as message
        message = dbLog.action;
      }
    }

    // Determine log level based on action
    let level: 'info' | 'warning' | 'error' | 'debug' = 'info';
    const actionLower = dbLog.action.toLowerCase();
    
    if (actionLower.includes('error') || actionLower.includes('fail') || actionLower.includes('delete')) {
      level = 'error';
    } else if (actionLower.includes('warn') || actionLower.includes('timeout') || actionLower.includes('retry')) {
      level = 'warning';
    } else if (actionLower.includes('debug') || actionLower.includes('trace')) {
      level = 'debug';
    }

    return {
      id: dbLog.id,
      timestamp: dbLog.timeStamp,
      message,
      level,
      source: dbLog.resource_type || 'system',
      user_id: dbLog.user_id || undefined,
      metadata: dbLog.details || undefined,
    };
  };

  /**
   * Search logs by message content
   */
  async searchLogs(query: string, limit: number = 50): Promise<LogEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('activity_log')
        .select('*')
        .or(`action.ilike.%${query}%,details.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        throw new Error(`Failed to search logs: ${error.message}`);
      }

      return (data || []).map(this.transformToLogEntry);
    } catch (error) {
      console.error('Error searching logs:', error);
      throw error;
    }
  }
}

export const logsService = new LogsService();