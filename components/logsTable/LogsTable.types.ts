/**
 * LogsTable Component Types
 *
 * Type definitions specific to the LogsTable component implementation
 */

import type { LogEntry, LogFilter } from '@/interfaces/LogsTable';

export interface LogsTableComponentProps {
  logs?: LogEntry[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  className?: string;
  pageSize?: number;
}

export interface LogsTableComponentState {
  currentPage: number;
  searchTerm: string;
  filter: LogFilter;
  sortBy: keyof LogEntry;
  sortOrder: 'asc' | 'desc';
}

export interface LogTableRowProps {
  log: LogEntry;
  index: number;
}

export interface LogLevelBadgeProps {
  level: 'info' | 'warning' | 'error' | 'debug';
}

export interface LogsTableHeaderProps {
  sortBy: keyof LogEntry;
  sortOrder: 'asc' | 'desc';
  onSort: (column: keyof LogEntry) => void;
}