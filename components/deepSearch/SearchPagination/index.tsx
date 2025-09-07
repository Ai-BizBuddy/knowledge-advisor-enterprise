'use client';
import React, { useState } from 'react';

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  className?: string;
}

export const SearchPagination: React.FC<SearchPaginationProps> = ({
  currentPage,
  totalPages,
  totalResults,
  resultsPerPage,
  onPageChange,
  loading = false,
  className = '',
}) => {
  const [goToPage, setGoToPage] = useState('');

  const startIndex = (currentPage - 1) * resultsPerPage + 1;
  const endIndex = Math.min(currentPage * resultsPerPage, totalResults);

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          disabled={loading}
          className='rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        >
          1
        </button>,
      );
      if (startPage > 2) {
        pages.push(
          <span key='ellipsis1' className='px-2 text-gray-500'>
            ...
          </span>,
        );
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          disabled={loading}
          className={`rounded-lg px-3 py-2 text-sm transition-colors ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          {i}
        </button>,
      );
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key='ellipsis2' className='px-2 text-gray-500'>
            ...
          </span>,
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          disabled={loading}
          className='rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        >
          {totalPages}
        </button>,
      );
    }

    return pages;
  };

  const handleGoToPage = () => {
    const page = parseInt(goToPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setGoToPage('');
    }
  };

  if (totalPages <= 1 || totalResults === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      {/* Mobile Layout */}
      <div className='block sm:hidden'>
        <div className='mb-3 text-center text-sm text-gray-700 dark:text-gray-300'>
          <div className='font-medium'>
            {totalResults === 0
              ? 'No results'
              : `${startIndex}-${endIndex} of ${totalResults} results`}
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
            disabled={currentPage === totalPages || loading}
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
            {totalResults === 0 ? (
              'No results found'
            ) : (
              <>
                Showing <span className='font-medium'>{startIndex}</span> to{' '}
                <span className='font-medium'>{endIndex}</span> of{' '}
                <span className='font-medium'>{totalResults}</span> results
              </>
            )}
          </div>

          {/* Go to page input */}
          {totalPages > 5 && (
            <div className='flex items-center gap-2'>
              <label className='text-sm text-gray-700 dark:text-gray-300'>
                Go to page:
              </label>
              <div className='flex items-center gap-1'>
                <input
                  type='number'
                  min={1}
                  max={totalPages}
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleGoToPage();
                    }
                  }}
                  placeholder={`1-${totalPages}`}
                  className='w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
                />
                <button
                  onClick={handleGoToPage}
                  disabled={!goToPage || loading}
                  className='rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  Go
                </button>
              </div>
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

export default SearchPagination;
