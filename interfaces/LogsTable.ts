/**
 * Log entry interfaces for the logs table component
 */

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level?: 'info' | 'warning' | 'error' | 'debug';
  source?: string;
  action: string;
  table_name: string;
  user_id?: string;
  user_full_name?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface LogFilter {
  level?: 'info' | 'warning' | 'error' | 'debug';
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface LogsTableProps {
  logs?: LogEntry[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  className?: string;
  pageSize?: number;
  showFilters?: boolean;
  onFilterChange?: (filter: LogFilter) => void;
}

export interface LogsTableState {
  currentPage: number;
  searchTerm: string;
  filter: LogFilter;
  sortBy: 'timestamp' | 'level' | 'source';
  sortOrder: 'asc' | 'desc';
}