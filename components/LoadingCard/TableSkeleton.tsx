'use client';

import React from 'react';

export interface TableSkeletonProps {
  /**
   * Number of skeleton rows to render
   * @default 5
   */
  rows?: number;

  /**
   * Number of skeleton columns to render
   * @default 6
   */
  columns?: number;

  /**
   * Show table header skeleton
   * @default true
   */
  showHeader?: boolean;

  /**
   * Show action buttons skeleton (checkbox, actions)
   * @default true
   */
  showActions?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * TableSkeleton Component
 *
 * Displays skeleton loading for table data with responsive design.
 * Used when loading document tables, user tables, etc.
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 6,
  showHeader = true,
  showActions = true,
  className = '',
}) => {
  const skeletonRows = Array.from({ length: rows }, (_, index) => index);
  const skeletonColumns = Array.from({ length: columns }, (_, index) => index);

  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      {/* Mobile Card Layout Skeleton */}
      <div className='block lg:hidden'>
        <div className='divide-y divide-gray-200 dark:divide-gray-700'>
          {skeletonRows.map((rowIndex) => (
            <div key={rowIndex} className='animate-pulse p-4'>
              <div className='flex items-start space-x-3'>
                {showActions && (
                  <div className='mt-1 h-4 w-4 rounded bg-gray-300 dark:bg-gray-600'></div>
                )}
                <div className='flex-1 space-y-3'>
                  <div className='flex items-center space-x-3'>
                    <div className='h-6 w-6 rounded bg-gray-300 dark:bg-gray-600'></div>
                    <div className='h-4 w-1/2 rounded bg-gray-300 dark:bg-gray-600'></div>
                  </div>
                  <div className='space-y-2'>
                    <div className='h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700'></div>
                    <div className='h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700'></div>
                    <div className='h-3 w-1/5 rounded bg-gray-200 dark:bg-gray-700'></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Table Layout Skeleton */}
      <div className='hidden lg:block'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
            {showHeader && (
              <thead className='bg-gray-50 dark:bg-gray-700'>
                <tr>
                  {showActions && (
                    <th className='px-3 py-3 sm:px-6'>
                      <div className='h-4 w-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600'></div>
                    </th>
                  )}
                  {skeletonColumns.map((colIndex) => (
                    <th key={colIndex} className='px-3 py-3 sm:px-6'>
                      <div className='h-4 w-16 animate-pulse rounded bg-gray-300 dark:bg-gray-600'></div>
                    </th>
                  ))}
                  {showActions && (
                    <th className='px-3 py-3 sm:px-6'>
                      <div className='h-4 w-12 animate-pulse rounded bg-gray-300 dark:bg-gray-600'></div>
                    </th>
                  )}
                </tr>
              </thead>
            )}
            <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800'>
              {skeletonRows.map((rowIndex) => (
                <tr key={rowIndex} className='animate-pulse'>
                  {showActions && (
                    <td className='px-3 py-4 sm:px-6'>
                      <div className='h-4 w-4 rounded bg-gray-300 dark:bg-gray-600'></div>
                    </td>
                  )}
                  {skeletonColumns.map((colIndex) => (
                    <td key={colIndex} className='px-3 py-4 sm:px-6'>
                      {colIndex === 0 ? (
                        // First column with icon and text (like file name)
                        <div className='flex items-center space-x-3'>
                          <div className='h-6 w-6 rounded bg-gray-300 dark:bg-gray-600'></div>
                          <div className='space-y-2'>
                            <div className='h-4 w-32 rounded bg-gray-300 dark:bg-gray-600'></div>
                            <div className='h-3 w-24 rounded bg-gray-200 dark:bg-gray-700'></div>
                          </div>
                        </div>
                      ) : colIndex === 2 ? (
                        // Status badge column
                        <div className='inline-flex items-center rounded-full px-2.5 py-0.5'>
                          <div className='h-4 w-16 rounded bg-gray-300 dark:bg-gray-600'></div>
                        </div>
                      ) : (
                        // Regular text columns
                        <div className='h-4 w-20 rounded bg-gray-300 dark:bg-gray-600'></div>
                      )}
                    </td>
                  ))}
                  {showActions && (
                    <td className='px-3 py-4 sm:px-6'>
                      <div className='h-4 w-12 rounded bg-gray-300 dark:bg-gray-600'></div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TableSkeleton;
