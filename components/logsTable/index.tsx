'use client';

/**
 * LogsTable Component
 *
 * A comprehensive logs table component with timestamp, message display and pagination
 * following the project's design patterns and TypeScript standards.
 */

import { Pagination } from '@/components/pagination';
import { TableSearch } from '@/components/tableSearch';
import type { LogEntry } from '@/interfaces/LogsTable';
import { Badge, Button, Card, Spinner, Table } from 'flowbite-react';
import { motion } from 'framer-motion';
import React, { useCallback, useMemo, useState } from 'react';
import type { LogsTableComponentProps } from './LogsTable.types';

// Sample data for demonstration
const sampleLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2025-01-09T10:30:00Z',
    message: 'User authentication successful',
    level: 'info',
    source: 'auth-service',
    user_id: 'user-123',
    created_at: '2025-01-09T10:30:00Z',
  },
  {
    id: '2',
    timestamp: '2025-01-09T10:28:15Z',
    message: 'Database connection timeout - retrying in 5 seconds',
    level: 'warning',
    source: 'database-service',
    created_at: '2025-01-09T10:28:15Z',
  },
  {
    id: '3',
    timestamp: '2025-01-09T10:25:30Z',
    message: 'Failed to process document upload - invalid file format',
    level: 'error',
    source: 'document-processor',
    user_id: 'user-456',
    created_at: '2025-01-09T10:25:30Z',
  },
  {
    id: '4',
    timestamp: '2025-01-09T10:22:45Z',
    message: 'Knowledge base indexing completed successfully',
    level: 'info',
    source: 'indexing-service',
    created_at: '2025-01-09T10:22:45Z',
  },
  {
    id: '5',
    timestamp: '2025-01-09T10:20:12Z',
    message: 'Debug: Cache miss for query "machine learning algorithms"',
    level: 'debug',
    source: 'search-service',
    created_at: '2025-01-09T10:20:12Z',
  },
  {
    id: '6',
    timestamp: '2025-01-09T10:18:30Z',
    message: 'New user registration: admin@example.com',
    level: 'info',
    source: 'user-service',
    user_id: 'user-789',
    created_at: '2025-01-09T10:18:30Z',
  },
  {
    id: '7',
    timestamp: '2025-01-09T10:15:45Z',
    message: 'Rate limit exceeded for IP 192.168.1.100',
    level: 'warning',
    source: 'api-gateway',
    created_at: '2025-01-09T10:15:45Z',
  },
  {
    id: '8',
    timestamp: '2025-01-09T10:12:20Z',
    message: 'Critical: Storage space below 5% - immediate action required',
    level: 'error',
    source: 'storage-monitor',
    created_at: '2025-01-09T10:12:20Z',
  },
];

// Helper function to format timestamp
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

// Main LogsTable component
export const LogsTable: React.FC<LogsTableComponentProps> = ({
  logs = sampleLogs,
  loading = false,
  error = null,
  onRefresh,
  className = '',
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof LogEntry>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = logs;

    // Apply search filter
    if (searchTerm) {
      filtered = logs.filter((log) =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply sorting
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
  }, [logs, searchTerm, sortBy, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedLogs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredAndSortedLogs.slice(
    startIndex,
    startIndex + pageSize,
  );

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  // Handle sort
  const handleSort = useCallback(
    (column: keyof LogEntry) => {
      if (sortBy === column) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy(column);
        setSortOrder('desc');
      }
      setCurrentPage(1); // Reset to first page when sorting
    },
    [sortBy, sortOrder],
  );

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Render sort icon
  const renderSortIcon = (column: keyof LogEntry) => {
    if (sortBy !== column) {
      return (
        <svg
          className='ml-1 h-3 w-3 opacity-50'
          fill='currentColor'
          viewBox='0 0 20 20'
        >
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
          {onRefresh && (
            <Button onClick={onRefresh} color='gray' size='sm'>
              Try Again
            </Button>
          )}
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
              System Logs
            </h3>
            <Badge color='info' size='sm'>
              {filteredAndSortedLogs.length} entries
            </Badge>
          </div>

          <div className='flex items-center gap-3'>
            <TableSearch
              searchValue={searchTerm}
              onSearchChange={handleSearch}
              searchPlaceholder='Search messages...'
              className='w-full sm:w-64'
            />
            {onRefresh && (
              <Button
                onClick={onRefresh}
                color='gray'
                size='sm'
                disabled={loading}
                className='shrink-0'
              >
                {loading ? (
                  <>
                    <Spinner size='sm' className='mr-2' />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg
                      className='mr-2 h-4 w-4'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z'
                        clipRule='evenodd'
                      />
                    </svg>
                    Refresh
                  </>
                )}
              </Button>
            )}
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
            <div className='overflow-x-auto border border-gray-200 rounded-lg dark:border-gray-700'>
              <Table hoverable>
                <thead className='bg-gray-50 dark:bg-gray-700'>
                  <tr>
                    <th 
                      scope='col'
                      className='cursor-pointer px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 w-1/6'
                      onClick={() => handleSort('timestamp')}
                    >
                      <div className='flex items-center'>
                        Timestamp
                        {renderSortIcon('timestamp')}
                      </div>
                    </th>
                    <th
                      scope='col'
                      className='cursor-pointer px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 w-5/6'
                      onClick={() => handleSort('message')}
                    >
                      <div className='flex items-center'>
                        Message
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
                              Clear search
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
                        className='bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600'
                      >
                        <td className='px-6 py-4 text-sm whitespace-nowrap'>
                          <div className='text-gray-900 dark:text-white'>
                            {formatTimestamp(log.timestamp)}
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
