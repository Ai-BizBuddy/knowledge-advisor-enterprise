'use client';

import { Document, DocumentStatus } from '@/interfaces/Project';
import { documentService, knowledgeBaseService } from '@/services';
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
}

export interface UseRecentActivityReturn {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useRecentActivity = (
  options: UseRecentActivityOptions = {},
): UseRecentActivityReturn => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { limit = 10, } = options;

  // Use ref to store the latest limit value to avoid stale closures
  const limitRef = useRef(limit);
  useEffect(() => {
    limitRef.current = limit;
  }, [limit]);

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
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  }, []);

  // Load recent activities - stable reference with no dependencies
  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all documents (which have timestamps we can use for activity)
      let documents: Document[] = [];
      try {
        documents = await documentService.getAllDocuments();
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Failed to load documents',
        );
        throw error;
      }

      // Process documents into activity items
      const documentActivities: ActivityItem[] = await Promise.all(
        documents.map(async (doc) => {
          // Determine activity type based on document status
          let activityType: 'upload' | 'processing' | 'error';
          let status: 'success' | 'error' | 'info';

          if (
            doc.status === DocumentStatus.READY ||
            doc.status === DocumentStatus.UPLOADED
          ) {
            activityType = 'upload';
            status = 'success';
          } else if (doc.status === DocumentStatus.PROCESSING) {
            activityType = 'processing';
            status = 'info';
          } else if (doc.status === DocumentStatus.ERROR) {
            activityType = 'error';
            status = 'error';
          } else {
            activityType = 'upload';
            status = 'info';
          }

          const projectName = await knowledgeBaseService.getProject(
            doc.knowledge_base_id,
          );

          // Create message based on activity type
          let message = '';
          if (activityType === 'upload') {
            message = `Document "${doc.name}" uploaded to ${projectName?.name}`;
          } else if (activityType === 'processing') {
            message = `Processing document "${doc.name}" in ${projectName?.name}`;
          } else {
            message = `Error processing document "${doc.name}" in ${projectName?.name}`;
          }

          return {
            id: `doc-${doc.id}`,
            type: activityType,
            message,
            time: formatRelativeTime(doc.updated_at || doc.created_at),
            status,
            projectId: doc.knowledge_base_id,
            documentId: doc.id,
          };
        }),
      );

      // Combine all activities
      const allActivities = [...documentActivities];

      // Sort by time (most recent first)
      allActivities.sort((a, b) => {
        // Extract time information from strings like "2 hours ago"
        const getTimeValue = (timeStr: string) => {
          if (timeStr === 'Just now') return 0;

          const match = timeStr.match(/(\d+)\s+(minute|hour|day)s?\s+ago/);
          if (!match) return Number.MAX_SAFE_INTEGER;

          const [, value, unit] = match;
          const numValue = parseInt(value, 10);

          if (unit === 'minute') return numValue;
          if (unit === 'hour') return numValue * 60; // Convert hours to minutes
          return numValue * 60 * 24; // Convert days to minutes
        };

        return getTimeValue(a.time) - getTimeValue(b.time);
      });

      // Apply limit
      const limitedActivities = allActivities.slice(0, limitRef.current);
      setActivities(limitedActivities);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to load recent activity';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [formatRelativeTime]); // Stable dependency

  // Load on mount and when limit changes
  useEffect(() => {
    loadActivities();
  }, [loadActivities, limit]);

  return {
    activities,
    loading,
    error,
    refresh: loadActivities,
  };
};

export default useRecentActivity;
