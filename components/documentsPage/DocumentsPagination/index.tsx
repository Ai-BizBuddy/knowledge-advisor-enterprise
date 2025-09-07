'use client';

import React, { useState } from 'react';

interface DocumentsPaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalDocuments: number;
  itemsPerPage?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export const DocumentsPagination: React.FC<DocumentsPaginationProps> = ({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalDocuments,
  loading = false,
  onPageChange,
}) => {
  const [goToPage, setGoToPage] = useState('');
  const generatePageNumbers = () => {
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      // Show first page, last page, current page, and pages around current
      const showPage =
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1);

      if (!showPage) {
        // Show ellipsis
        if (i === currentPage - 2 || i === currentPage + 2) {
          pages.push(
            <span key={i} className='hidden px-2 text-gray-500 sm:inline'>
              ...
            </span>,
          );
        }
        continue;
      }

      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          disabled={loading}
          className={`rounded-lg px-2 py-1.5 text-sm transition-colors sm:px-3 sm:py-2 ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          {i}
        </button>,
      );
    }

    return pages;
  };

  if (totalPages <= 1 || totalDocuments === 0) {
    return null;
  }

  return (
    <div className='mt-6 rounded-lg border border-gray-200 bg-white p-3 sm:p-4 dark:border-gray-700 dark:bg-gray-800'>
      {/* Mobile Layout */}
      <div className='block sm:hidden'>
        <div className='mb-3 text-center text-sm text-gray-700 dark:text-gray-300'>
          <div className='font-medium'>
            {totalDocuments === 0
              ? 'No documents'
              : `${startIndex + 1}-${Math.min(endIndex + 1, totalDocuments)} of ${totalDocuments}`}
          </div>
          <div className='text-xs text-gray-500 dark:text-gray-400'>
            Page {currentPage} of {totalPages}
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className='flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          >
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
            <span className='xs:inline hidden'>Prev</span>
          </button>

          <div className='flex items-center gap-1'>
            {/* Show only current page and adjacent pages on mobile */}
            {currentPage > 1 && (
              <button
                onClick={() => onPageChange(1)}
                className='rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              >
                1
              </button>
            )}
            {currentPage > 2 && <span className='px-1 text-gray-500'>...</span>}
            <button
              className='rounded-lg bg-blue-600 px-2 py-1.5 text-sm text-white'
              disabled
            >
              {currentPage}
            </button>
            {currentPage < totalPages - 1 && (
              <span className='px-1 text-gray-500'>...</span>
            )}
            {currentPage < totalPages && (
              <button
                onClick={() => onPageChange(totalPages)}
                className='rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              >
                {totalPages}
              </button>
            )}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className='flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          >
            <span className='xs:inline hidden'>Next</span>
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5l7 7-7 7'
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className='hidden items-center justify-between sm:flex'>
        <div className='flex items-center gap-4'>
          <div className='text-sm text-gray-700 dark:text-gray-300'>
            {totalDocuments === 0 ? (
              'No documents found'
            ) : (
              <>
                Showing <span className='font-medium'>{startIndex + 1}</span> to{' '}
                <span className='font-medium'>
                  {Math.min(endIndex + 1, totalDocuments)}
                </span>{' '}
                of <span className='font-medium'>{totalDocuments}</span> results
              </>
            )}
          </div>

          {/* Go to page input */}
          {totalPages > 5 && (
            <div className='flex items-center gap-2'>
              <label className='text-sm text-gray-700 dark:text-gray-300'>
                Go to:
              </label>
              <input
                type='number'
                min={1}
                max={totalPages}
                value={goToPage}
                onChange={(e) => setGoToPage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const page = parseInt(goToPage);
                    if (page >= 1 && page <= totalPages) {
                      onPageChange(page);
                      setGoToPage('');
                    }
                  }
                }}
                placeholder={`1-${totalPages}`}
                className='w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              />
            </div>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className='flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          >
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
            <span className='hidden lg:inline'>Previous</span>
          </button>

          <div className='flex items-center gap-1'>{generatePageNumbers()}</div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className='flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          >
            <span className='hidden lg:inline'>Next</span>
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5l7 7-7 7'
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
