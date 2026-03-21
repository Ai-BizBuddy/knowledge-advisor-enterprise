'use client';

import type { PageNavigationBarProps } from './DocumentPageViewer.types';

export const PageNavigationBar: React.FC<PageNavigationBarProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  documentName,
  isLoading,
}) => {
  return (
    <div className='flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800'>
      {/* Left: title */}
      <div className='flex items-center gap-2'>
        <span className='text-sm font-semibold text-gray-900 dark:text-white'>
          Page Viewer
        </span>
        {documentName && (
          <span className='ml-2 max-w-xs truncate border-l border-gray-200 pl-2 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400'>
            {documentName}
          </span>
        )}
      </div>

      {/* Center: navigation */}
      <div className='flex items-center gap-2'>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          className='rounded px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700'
        >
          <svg className='h-4 w-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
            <polyline points='15 18 9 12 15 6' />
          </svg>
        </button>

        <div className='flex items-center gap-1'>
          <select
            value={currentPage}
            onChange={(e) => onPageChange(Number(e.target.value))}
            disabled={isLoading}
            className='rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                Page {p}
              </option>
            ))}
          </select>
          <span className='text-xs text-gray-400 dark:text-gray-500'>
            of {totalPages}
          </span>
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          className='rounded px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700'
        >
          <svg className='h-4 w-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
            <polyline points='9 18 15 12 9 6' />
          </svg>
        </button>
      </div>

      {/* Right: loading indicator */}
      <div className='w-20 text-right'>
        {isLoading && (
          <div className='inline-flex items-center gap-1 text-xs text-gray-400'>
            <div className='h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
            Loading
          </div>
        )}
      </div>
    </div>
  );
};
