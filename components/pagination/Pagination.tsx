/**
 * Pagination Component
 *
 * Reusable pagination controls for tables (navigation only).
 * For search functionality, use TableSearch component separately.
 */

import React from 'react';
import type { PaginationControls } from '@/interfaces/Pagination';

export interface PaginationProps extends PaginationControls {
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  total,
  onPageChange,
  className = '',
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }

    // Remove duplicates
    return rangeWithDots.filter((item, index, arr) => {
      if (index === 0) return true;
      return item !== arr[index - 1];
    });
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`${className}`}>
      {/* Desktop Layout: 3-column layout */}
      <div className='hidden items-center justify-between md:flex'>
        {/* Left: Results Info */}
        <div className='text-sm text-gray-700 dark:text-gray-300'>
          Showing <span className='font-medium'>{startItem}</span> to{' '}
          <span className='font-medium'>{endItem}</span> of{' '}
          <span className='font-medium'>{total}</span> results
        </div>

        {/* Center: Page Info */}
        <div className='text-sm text-gray-500 dark:text-gray-400'>
          Page {currentPage} of {totalPages}
        </div>

        {/* Right: Navigation Controls */}
        {totalPages > 1 && (
          <div className='flex items-center space-x-1'>
            {/* Previous Button */}
            <button
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className='flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
            >
              <svg
                className='mr-1 h-4 w-4'
                aria-hidden='true'
                fill='currentColor'
                viewBox='0 0 20 20'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
              Previous
            </button>

            {/* Page Numbers */}
            {visiblePages.map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className='flex items-center justify-center border border-gray-300 bg-white px-3 py-2 text-sm leading-tight text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'>
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    className={`flex items-center justify-center rounded-lg border px-3 py-2 text-sm leading-tight transition-colors ${
                      currentPage === page
                        ? 'border-blue-500 bg-blue-600 text-white hover:bg-blue-700'
                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}

            {/* Next Button */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className='flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
            >
              Next
              <svg
                className='ml-1 h-4 w-4'
                aria-hidden='true'
                fill='currentColor'
                viewBox='0 0 20 20'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Layout: Stacked */}
      <div className='flex flex-col space-y-3 md:hidden'>
        {/* Results Info and Page Info */}
        <div className='flex items-center justify-between text-sm'>
          <div className='text-gray-700 dark:text-gray-300'>
            <span className='font-medium'>
              {startItem}-{endItem}
            </span>{' '}
            of <span className='font-medium'>{total}</span>
          </div>
          <div className='text-gray-500 dark:text-gray-400'>
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {/* Navigation Controls */}
        {totalPages > 1 && (
          <div className='flex items-center justify-between'>
            {/* Previous Button */}
            <button
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className='flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
            >
              <svg
                className='mr-1 h-4 w-4'
                aria-hidden='true'
                fill='currentColor'
                viewBox='0 0 20 20'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
              Previous
            </button>

            {/* Page Numbers - Show only current and adjacent pages on mobile */}
            <div className='flex items-center space-x-1'>
              {visiblePages
                .filter((page) => {
                  if (page === '...') return false;
                  const pageNum = page as number;
                  return (
                    Math.abs(pageNum - currentPage) <= 1 ||
                    pageNum === 1 ||
                    pageNum === totalPages
                  );
                })
                .map((page, index) => (
                  <button
                    key={index}
                    onClick={() => onPageChange(page as number)}
                    className={`flex items-center justify-center rounded-lg border px-3 py-2 text-sm leading-tight transition-colors ${
                      currentPage === page
                        ? 'border-blue-500 bg-blue-600 text-white hover:bg-blue-700'
                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
            </div>

            {/* Next Button */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className='flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
            >
              Next
              <svg
                className='ml-1 h-4 w-4'
                aria-hidden='true'
                fill='currentColor'
                viewBox='0 0 20 20'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
