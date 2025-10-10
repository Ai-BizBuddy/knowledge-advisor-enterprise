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
  const [sortBy, setSortBy] = useState<keyof LogEntry>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('All');

  // Tab list for CRUD filtering
  const tabList = ['All', 'Create', 'Update', 'Delete'];

  // Use the logs hook to fetch real data
  const {
    logs,
    loading: hookLoading,
    error: hookError,
    refreshLogs,
    searchLogs,
  } = useLogs({
    // limit: 999, // Fetch more data for pagination
    autoRefresh: false,
    // refreshInterval: 300000, // Refresh every 5 minutes
  });

  // Combine external and hook states
  const loading = externalLoading || hookLoading;
  const error = externalError || hookError;

  // Handle search when tab changes
  React.useEffect(() => {
    if (activeTab !== 'All') {
      const actionMap: Record<string, string[]> = {
        Create: ['INSERT'],
        Update: ['UPDATE'],
        Delete: ['DELETE'],
      };
      
      const allowedActions = actionMap[activeTab] || [];
      searchLogs(allowedActions.join(' '));
    } else {
      // Reset search when "All" tab is selected
      searchLogs('');
    }
  }, [activeTab, searchLogs]);

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    const filtered = [...logs];

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

  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
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
        {/* Header with tabs - Mobile Optimized */}
        <div className='mb-4 flex flex-col gap-4'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Activity Logs
              </h3>
              <Badge color='info' size='sm' className='self-start'>
                {filteredAndSortedLogs.length} entries
              </Badge>
            </div>
            
            {/* Mobile Sort Controls */}
            <div className='sm:hidden flex items-center gap-2'>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as [keyof LogEntry, 'asc' | 'desc'];
                  setSortBy(field);
                  setSortOrder(order);
                  setCurrentPage(1);
                }}
                className='text-xs bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
              >
                <option value='timestamp-desc'>Latest First</option>
                <option value='timestamp-asc'>Oldest First</option>
                <option value='action-asc'>Action A-Z</option>
                <option value='action-desc'>Action Z-A</option>
                <option value='table_name-asc'>Resource A-Z</option>
                <option value='table_name-desc'>Resource Z-A</option>
              </select>
            </div>
          </div>

          {/* Tab Navigation - Settings Style with Mobile Support */}
          <div className='border-b border-gray-200 dark:border-gray-700'>
            <nav className='-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto'>
              {tabList.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`py-2 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className='flex justify-center py-8'>
            <Spinner size='lg' />
          </div>
        )}

        {/* Table - Desktop View */}
        {!loading && (
          <>
            {/* Desktop Table View */}
            <div className='hidden sm:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
              <Table hoverable>
                <thead>
                  <tr>
                    <th
                      scope='col'
                      className='w-[10%] cursor-pointer px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700'
                      onClick={() => handleSort('timestamp')}
                    >
                      <div className='flex items-center'>
                        timestamp
                        {renderSortIcon('timestamp')}
                      </div>
                    </th>
                    <th
                      scope='col'
                      className='w-[10%] cursor-pointer px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700'
                      onClick={() => handleSort('action')}
                    >
                      <div className='flex items-center'>
                        action
                        {renderSortIcon('action')}
                      </div>
                    </th>
                    <th
                      scope='col'
                      className='w-[15%] cursor-pointer px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700'
                      onClick={() => handleSort('table_name')}
                    >
                      <div className='flex items-center'>
                        resource
                        {renderSortIcon('table_name')}
                      </div>
                    </th>
                    <th
                      scope='col'
                      className='w-[65%] cursor-pointer px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                      <td colSpan={4} className='px-6 py-4'>
                        <div className='py-8 text-center'>
                          <div className='mb-2 text-gray-500 dark:text-gray-400'>
                            {activeTab !== 'All'
                              ? `No ${activeTab.toLowerCase()} logs found`
                              : 'No logs available'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs
                      .map((log, index) => (
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
                            <span
                              className={`break-words ${log.action === 'INSERT' ? 'text-green-500' : log.action === 'UPDATE' ? 'text-blue-500' : 'text-red-500'}`}
                            >
                              {log.action === 'SOFT_DELETE'
                                ? 'DELETE'
                                : log.action}
                            </span>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='max-w-md text-sm text-gray-900 dark:text-white'>
                            <span
                              className='break-words'
                            >
                              {log.table_name.replace(/_/g, ' ')}
                            </span>
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

            {/* Mobile Card View */}
            <div className='block sm:hidden space-y-3'>
              {paginatedLogs.length === 0 ? (
                <div className='py-8 text-center'>
                  <div className='mb-2 text-gray-500 dark:text-gray-400'>
                    {activeTab !== 'All'
                      ? `No ${activeTab.toLowerCase()} logs found`
                      : 'No logs available'}
                  </div>
                </div>
              ) : (
                paginatedLogs
                  .sort((a, b) => a.timestamp < b.timestamp ? 1 : -1)
                  .map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm'
                  >
                    <div className='flex flex-col space-y-2'>
                      {/* Header: Action and Timestamp */}
                      <div className='flex justify-between items-start'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.action === 'INSERT' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                              : log.action === 'UPDATE' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}
                        >
                          {log.action === 'SOFT_DELETE' ? 'DELETE' : log.action}
                        </span>
                        <span className='text-xs text-gray-500 dark:text-gray-400'>
                          {log.timestamp}
                        </span>
                      </div>
                      
                      {/* Resource */}
                      <div className='flex items-center space-x-2'>
                        <span className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
                          Resource:
                        </span>
                        <span className='text-sm text-gray-900 dark:text-white'>
                          {log.table_name.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      {/* Message */}
                      <div className=''>
                        <span className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1'>
                          Message:
                        </span>
                        <p className='text-sm text-gray-900 dark:text-white break-words'>
                          {log.message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
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
