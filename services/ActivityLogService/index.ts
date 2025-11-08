/**
 * Activity Log Service
 *
 * Read-only service for fetching activity logs with user profile information
 * from the knowledge.activity_log_with_profiles view
 */

import { createClientTable } from '@/utils/supabase/client';

export interface ActivityLogWithProfile {
  id: string;
  table_name: string | null;
  record_id: string | null;
  action: string;
  user_id: string | null;
  user_full_name: string | null;
  user_avatar_url: string | null;
  timestamp: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  knowledge_base_id: string | null;
  department_id: string | null;
  metadata: Record<string, unknown> | null;
}

export interface GetActivityLogsOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'timestamp';
  ascending?: boolean;
  knowledgeBaseId?: string;
  userId?: string;
  action?: string;
  tableName?: string;
}

export interface ActivityLogsResult {
  data: ActivityLogWithProfile[];
  total: number;
}

export class ActivityLogService {
  private supabase = createClientTable();

  /**
   * Get total count of activity logs
   */
  async getActivityLogsCount(
    options: Omit<GetActivityLogsOptions, 'limit' | 'offset' | 'orderBy' | 'ascending'> = {},
  ): Promise<number> {
    try {
      const { knowledgeBaseId, userId, action, tableName } = options;

      let query = this.supabase
        .from('activity_log_with_profiles')
        .select('*', { count: 'exact', head: true });

      // Apply filters if provided
      if (knowledgeBaseId) {
        query = query.eq('knowledge_base_id', knowledgeBaseId);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count activity logs: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Error counting activity logs:', error);
      throw error;
    }
  }

  /**
   * Fetch activity logs with user profile information
   * This is a read-only operation on the activity_log_with_profiles view
   */
  async getActivityLogs(
    options: GetActivityLogsOptions = {},
  ): Promise<ActivityLogsResult> {
    try {
      const {
        limit = 10,
        offset = 0,
        orderBy = 'timestamp',
        ascending = false,
        knowledgeBaseId,
        userId,
        action,
        tableName,
      } = options;

      let query = this.supabase
        .from('activity_log_with_profiles')
        .select('*')
        .order(orderBy, { ascending });

      // Apply filters if provided
      if (knowledgeBaseId) {
        query = query.eq('knowledge_base_id', knowledgeBaseId);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      // Apply pagination
      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch activity logs: ${error.message}`);
      }

      // Get total count
      const total = await this.getActivityLogsCount({
        knowledgeBaseId,
        userId,
        action,
        tableName,
      });

      return {
        data: data || [],
        total,
      };
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  }

  /**
   * Get recent activity logs (default last 10)
   */
  async getRecentActivities(limit: number = 10): Promise<ActivityLogsResult> {
    return this.getActivityLogs({ limit, ascending: false });
  }

  /**
   * Get activity logs for a specific knowledge base
   */
  async getKnowledgeBaseActivities(
    knowledgeBaseId: string,
    limit: number = 10,
  ): Promise<ActivityLogsResult> {
    return this.getActivityLogs({ knowledgeBaseId, limit, ascending: false });
  }

  /**
   * Get activity logs for a specific user
   */
  async getUserActivities(
    userId: string,
    limit: number = 10,
  ): Promise<ActivityLogsResult> {
    return this.getActivityLogs({ userId, limit, ascending: false });
  }

  /**
   * Search activity logs by action type
   */
  async searchByAction(
    action: string,
    limit: number = 10,
  ): Promise<ActivityLogsResult> {
    return this.getActivityLogs({ action, limit, ascending: false });
  }

  /**
   * Search activity logs by table name
   */
  async searchByTable(
    tableName: string,
    limit: number = 10,
  ): Promise<ActivityLogsResult> {
    return this.getActivityLogs({ tableName, limit, ascending: false });
  }

  /**
   * Format activity message for display
   */
  formatActivityMessage(log: ActivityLogWithProfile): string {
    const userName = log.user_full_name || 'System';
    const tableName = log.table_name || 'resource';
    const action = log.action;

    const oldDataStr = log.old_data?.name as string | undefined;
    const newDataStr = log.new_data?.name as string | undefined;

    // Special handling for document status changes
    if (tableName === 'document' && action === 'UPDATE') {
      const changedFields = log.changed_fields || [];
      
      // Check if status field was changed
      if (changedFields.includes('status')) {
        const oldStatus = log.old_data?.status as string | undefined;
        const newStatus = log.new_data?.status as string | undefined;
        const documentName = newDataStr || oldDataStr || 'Document';
        
        if (oldStatus && newStatus) {
          return `${documentName} status changed from ${oldStatus} to ${newStatus}`;
        }
      }
      
      // Check for other important document field changes
      if (changedFields.includes('chunk_count')) {
        const documentName = newDataStr || oldDataStr || 'Document';
        const chunkCount = log.new_data?.chunk_count;
        return `${documentName} processed into ${chunkCount} chunk${Number(chunkCount) !== 1 ? 's' : ''}`;
      }

      if (changedFields.includes('last_rag_sync')) {
        const documentName = newDataStr || oldDataStr || 'Document';
        return `${documentName} synchronized to RAG system`;
      }
    }

    switch (action) {
      case 'INSERT':
        return `${userName} created new entry in ${tableName}${newDataStr ? `: ${newDataStr}` : ''}`;
      case 'UPDATE':
        return `${userName} updated entry in ${tableName}${newDataStr ? `: ${newDataStr}` : oldDataStr ? `: ${oldDataStr}` : ''}`;
      case 'DELETE':
        return `${userName} deleted entry from ${tableName}${oldDataStr ? `: ${oldDataStr}` : ''}`;
      default:
        return `${userName} performed ${action} on ${tableName}`;
    }
  }

  /**
   * Get activity status based on action type and context
   */
  getActivityStatus(
    action: string,
    tableName?: string | null,
    changedFields?: string[] | null,
    newData?: Record<string, unknown> | null,
  ): 'success' | 'error' | 'info' | 'warning' {
    // Special handling for document status changes
    if (tableName === 'document' && action === 'UPDATE' && changedFields?.includes('status')) {
      const status = newData?.status as string | undefined;
      switch (status) {
        case 'ready':
          return 'success';
        case 'processing':
          return 'info';
        case 'error':
        case 'failed':
          return 'error';
        case 'uploaded':
          return 'info';
        default:
          return 'info';
      }
    }

    switch (action.toUpperCase()) {
      case 'INSERT':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'warning';
      case 'ERROR':
        return 'error';
      default:
        return 'info';
    }
  }

  /**
   * Map activity log to activity type
   */
  getActivityType(
    tableName: string | null,
    action: string,
    changedFields?: string[] | null,
  ): 'upload' | 'query' | 'knowledgebase' | 'processing' | 'error' {
    if (action === 'ERROR') {
      return 'error';
    }

    // Handle document table with more granularity
    if (tableName === 'document') {
      if (action === 'INSERT') {
        return 'upload';
      }
      if (action === 'UPDATE' && changedFields?.includes('status')) {
        return 'processing';
      }
      return 'upload';
    }

    switch (tableName) {
      case 'documents':
        return 'upload';
      case 'chat_history':
      case 'queries':
        return 'query';
      case 'knowledge_bases':
      case 'knowledge_base':
        return 'knowledgebase';
      case 'document_processing':
        return 'processing';
      default:
        return 'processing';
    }
  }
}

export const activityLogService = new ActivityLogService();
