// Statistics API response interfaces

/**
 * Main dashboard statistics response from GET /api/statistics/dashboard
 */
export interface DashboardStatistics {
  totalKnowledgeBases: number;
  activeDocuments: number;
  totalQueries: number;
  avgResponseTimeMs: number;
  avgResponseTime: string;
  lastUpdated: string;
}

/**
 * Individual statistic response structure
 */
export interface IndividualStatistic {
  value: number | string;
  lastUpdated: string;
  metadata?: Record<string, unknown>;
}

/**
 * All statistics response from GET /api/statistics
 */
export interface AllStatistics {
  totalKnowledgeBases: IndividualStatistic;
  activeDocuments: IndividualStatistic;
  totalQueries: IndividualStatistic;
  avgResponseTimeMs: IndividualStatistic;
}

/**
 * Query activity request payload for POST /api/statistics/query-activity
 */
export interface QueryActivityRequest {
  projectId: string;
  queryText: string;
  responseTimeMs: number;
  status: 'completed' | 'failed' | 'timeout';
}

/**
 * Manual statistic update request for PUT operations
 */
export interface ManualStatisticUpdate {
  value: number | string;
  metadata?: {
    manually_updated?: boolean;
    reason?: string;
    updated_by?: string;
    [key: string]: unknown;
  };
}

/**
 * Statistics API error response
 */
export interface StatisticsError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}
