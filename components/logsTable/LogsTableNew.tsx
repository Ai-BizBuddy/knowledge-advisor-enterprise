'use client';

/**
 * LogsTable Component
 *
 * A comprehensive logs table component with timestamp, message display and pagination
 * following the project's design patterns and TypeScript standards.
 * 
 * Features:
 * - Real-time data from activity_logs table
 * - Thai datetime formatting
 * - Search functionality
 * - Pagination
 * - Auto-refresh
 */

import { Pagination } from '@/components/pagination';
import { TableSearch } from '@/components/tableSearch';
import { useLogs } from '@/hooks/useLogs';
import type { LogEntry } from '@/interfaces/LogsTable';
import { Badge, Button, Card, Spinner, Table } from 'flowbite-react';
import { motion } from 'framer-motion';
import React, { useCallback, useMemo, useState } from 'react';
import type { LogsTableComponentProps } from './LogsTable.types';

// Main LogsTable component
export const LogsTable: React.FC<LogsTableComponentProps> = ({
  loading: externalLoading = false,
  error: externalError = null,
  onRefresh,
  className = '',
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof LogEntry>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Use the logs hook to fetch real data
  const {
    logs,
    loading: hookLoading,
    error: hookError,
    refreshLogs,
    searchLogs,
  } = useLogs({
    limit: 100, // Fetch more data for pagination
    autoRefresh: true,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  // Combine external and hook states
  const loading = externalLoading || hookLoading;
  const error = externalError || hookError;

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    const filtered = logs;

    // Apply sorting (timestamp is already formatted as Thai)
    filtered.sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [logs, sortBy, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedLogs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredAndSortedLogs.slice(
    startIndex,
    startIndex + pageSize,
  );

  // Handle search with debounce
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      setCurrentPage(1); // Reset to first page when searching
      
      // Use the hook's search function
      searchLogs(term);
    },
    [searchLogs],
  );

  // Handle sort
  const handleSort = useCallback((column: keyof LogEntry) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  }, [sortBy, sortOrder]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshLogs();
    if (onRefresh) {
      onRefresh();
    }
  }, [refreshLogs, onRefresh]);

  // Render sort icon
  const renderSortIcon = (column: keyof LogEntry) => {
    if (sortBy !== column) {
      return (
        <svg className='ml-1 h-3 w-3 opacity-50' fill='currentColor' viewBox='0 0 20 20'>
          <path d='M5 12l5-5 5 5H5z' />
        </svg>
      );
    }
    return (
      <svg
        className={`ml-1 h-3 w-3 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
        fill='currentColor'
        viewBox='0 0 20 20'
      >
        <path d='M5 12l5-5 5 5H5z' />
      </svg>
    );
  };

  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <div className='py-8 text-center'>
          <div className='mb-4 text-red-600 dark:text-red-400'>
            Error loading logs: {error}
          </div>
          <Button onClick={handleRefresh} color='gray' size='sm'>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full ${className}`}
    >
      <Card>
        {/* Header with search and refresh */}
        <div className='mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Activity Logs
            </h3>
            <Badge color='info' size='sm'>
              {filteredAndSortedLogs.length} entries
            </Badge>
          </div>

          <div className='flex items-center gap-3'>
            <TableSearch
              searchValue={searchTerm}
              onSearchChange={handleSearch}
              searchPlaceholder='Search message...'
              className='w-full sm:w-64'
            />
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className='flex justify-center py-8'>
            <Spinner size='lg' />
          </div>
        )}

        {/* Table */}
        {!loading && (
          <>
            <div className='overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
              <Table hoverable>
                <thead>
                  <tr>
                    <th
                      scope='col'
                      className='w-1/6 cursor-pointer px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700'
                      onClick={() => handleSort('timestamp')}
                    >
                      <div className='flex items-center'>
                        timestamp
                        {renderSortIcon('timestamp')}
                      </div>
                    </th>
                    <th
                      scope='col'
                      className='w-5/6 cursor-pointer px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700'
                      onClick={() => handleSort('message')}
                    >
                      <div className='flex items-center'>
                        message
                        {renderSortIcon('message')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={2} className='px-6 py-4'>
                        <div className='py-8 text-center'>
                          <div className='mb-2 text-gray-500 dark:text-gray-400'>
                            {searchTerm
                              ? 'No logs found matching your search'
                              : 'No logs available'}
                          </div>
                          {searchTerm && (
                            <Button
                              onClick={() => handleSearch('')}
                              color='gray'
                              size='xs'
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log, index) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className='border-b border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
                      >
                        <td className='px-6 py-4 text-sm whitespace-nowrap'>
                          <div className='text-gray-900 dark:text-white'>
                            {log.timestamp}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='max-w-md text-sm text-gray-900 dark:text-white'>
                            <span className='break-words'>{log.message}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-4'>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  total={filteredAndSortedLogs.length}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </motion.div>
  );
};

// Export as default for backward compatibility
export default LogsTable;