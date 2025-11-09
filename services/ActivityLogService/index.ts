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
   * Format status name for display
   */
  private formatStatusName(status: string): string {
    const statusMap: Record<string, string> = {
      // Document statuses
      uploaded: 'Uploaded',
      queued: 'Queued',
      processing: 'Processing',
      ready: 'Ready',
      error: 'Error',
      archived: 'Archived',
      
      // User statuses
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      pending: 'Pending',
      
      // Knowledge Base visibility
      public: 'Public',
      department: 'Department',
      private: 'Private',
      custom: 'Custom',
    };

    return statusMap[status.toLowerCase()] || status;
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
    const changedFields = log.changed_fields || [];

    // DOCUMENT TABLE - Status and processing updates
    if (tableName === 'document' && action === 'UPDATE') {
      const documentName = newDataStr || oldDataStr || 'Document';
      
      // Document status changes (uploaded, queued, processing, ready, error, archived)
      if (changedFields.includes('status')) {
        const oldStatus = log.old_data?.status as string | undefined;
        const newStatus = log.new_data?.status as string | undefined;
        
        if (oldStatus && newStatus) {
          return `Document "${documentName}" status changed from ${this.formatStatusName(oldStatus)} to ${this.formatStatusName(newStatus)}`;
        }
      }
      
      // RAG sync status changes
      if (changedFields.includes('rag_status')) {
        const newRagStatus = log.new_data?.rag_status as string | undefined;
        
        if (newRagStatus === 'synced') {
          return `Document "${documentName}" synchronized to RAG system`;
        }
        if (newRagStatus === 'syncing') {
          return `Document "${documentName}" syncing to RAG system`;
        }
        if (newRagStatus === 'error') {
          return `Document "${documentName}" RAG sync failed`;
        }
      }
      
      // Chunk processing completion
      if (changedFields.includes('chunk_count')) {
        const chunkCount = log.new_data?.chunk_count;
        return `Document "${documentName}" processed into ${chunkCount} chunk${Number(chunkCount) !== 1 ? 's' : ''}`;
      }

      // Generic document update
      return `Document "${documentName}" updated by ${userName}`;
    }

    // DOCUMENT TABLE - Creation
    if (tableName === 'document' && action === 'INSERT') {
      const documentName = newDataStr || 'Document';
      return `Document "${documentName}" uploaded by ${userName}`;
    }

    // DOCUMENT TABLE - Deletion
    if (tableName === 'document' && action === 'DELETE') {
      const documentName = oldDataStr || 'Document';
      return `Document "${documentName}" deleted by ${userName}`;
    }

    // KNOWLEDGE BASE TABLE - Status and visibility updates
    if ((tableName === 'knowledge_base' || tableName === 'knowledge_bases') && action === 'UPDATE') {
      const kbName = newDataStr || oldDataStr || 'Knowledge Base';
      
      // Visibility changes (public, department, private, custom)
      if (changedFields.includes('visibility')) {
        const oldVisibility = log.old_data?.visibility as string | undefined;
        const newVisibility = log.new_data?.visibility as string | undefined;
        
        if (oldVisibility && newVisibility) {
          return `Knowledge Base "${kbName}" visibility changed from ${this.formatStatusName(oldVisibility)} to ${this.formatStatusName(newVisibility)}`;
        }
      }
      
      // Status changes
      if (changedFields.includes('status')) {
        const oldStatus = log.old_data?.status as string | undefined;
        const newStatus = log.new_data?.status as string | undefined;
        
        if (oldStatus && newStatus) {
          return `Knowledge Base "${kbName}" status changed from ${this.formatStatusName(oldStatus)} to ${this.formatStatusName(newStatus)}`;
        }
      }

      // Content updates (name, description, etc.)
      if (changedFields.includes('name')) {
        const oldName = log.old_data?.name as string | undefined;
        return `Knowledge Base renamed from "${oldName}" to "${newDataStr}"`;
      }

      if (changedFields.includes('description')) {
        return `Knowledge Base "${kbName}" description updated`;
      }

      // Generic KB update
      return `Knowledge Base "${kbName}" updated by ${userName}`;
    }

    // KNOWLEDGE BASE TABLE - Creation
    if ((tableName === 'knowledge_base' || tableName === 'knowledge_bases') && action === 'INSERT') {
      const kbName = newDataStr || 'Knowledge Base';
      return `Knowledge Base "${kbName}" created by ${userName}`;
    }

    // KNOWLEDGE BASE TABLE - Deletion
    if ((tableName === 'knowledge_base' || tableName === 'knowledge_bases') && action === 'DELETE') {
      const kbName = oldDataStr || 'Knowledge Base';
      return `Knowledge Base "${kbName}" deleted by ${userName}`;
    }

    // USER/PROFILE TABLE - Status updates
    if ((tableName === 'users' || tableName === 'profiles') && action === 'UPDATE') {
      const targetUserName = newDataStr || oldDataStr || log.new_data?.email as string || 'User';
      
      // User status changes (active, inactive, suspended, pending)
      if (changedFields.includes('status')) {
        const oldStatus = log.old_data?.status as string | undefined;
        const newStatus = log.new_data?.status as string | undefined;
        
        if (oldStatus && newStatus) {
          return `User "${targetUserName}" status changed from ${this.formatStatusName(oldStatus)} to ${this.formatStatusName(newStatus)}`;
        }
      }

      // Profile updates
      if (changedFields.includes('full_name')) {
        return `User "${targetUserName}" updated their profile`;
      }

      // Generic user update
      return `User "${targetUserName}" updated by ${userName}`;
    }

    // USER/PROFILE TABLE - Creation
    if ((tableName === 'users' || tableName === 'profiles') && action === 'INSERT') {
      const targetUserName = newDataStr || log.new_data?.email as string || 'User';
      return `New user "${targetUserName}" registered`;
    }

    // FALLBACK - Generic messages for other tables/actions
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
