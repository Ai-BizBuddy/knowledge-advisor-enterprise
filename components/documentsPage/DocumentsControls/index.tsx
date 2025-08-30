import { useLoading } from '@/contexts/LoadingContext';
import { useSorting } from '@/hooks';
import Link from 'next/link';
import React from 'react';

interface DocumentsControlsProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string) => void;
  onSortOrderToggle: () => void;
}

export const DocumentsControls: React.FC<DocumentsControlsProps> = ({
  sortBy,
  sortOrder,
  onSortChange,
  onSortOrderToggle,
}) => {
  // Get available sort fields from the sorting service
  const { availableSortFields } = useSorting();
  const { setLoading } = useLoading();

  return (
    <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
      <div className='flex items-center gap-4'>
        {/* Sort Dropdown */}
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className='rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
          >
            {availableSortFields.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>

          {/* Sort Order Toggle Button */}
          <button
            onClick={onSortOrderToggle}
            className='flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            {sortOrder === 'asc' ? (
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
                  d='M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12'
                />
              </svg>
            ) : (
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
                  d='M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4'
                />
              </svg>
            )}
          </button>
        </div>

        {/* Sort Status Indicator */}
        <div className='hidden items-center gap-1 text-xs text-gray-500 sm:flex dark:text-gray-400'>
          <span>•</span>
          <span>
            Sorted by{' '}
            {availableSortFields.find((f) => f.value === sortBy)?.label ||
              sortBy}{' '}
            ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
          </span>
        </div>
      </div>

      {/* Additional Controls (for future features) */}
      <div className='flex items-center gap-2'>
        {/* Placeholder for future controls like view toggle, filters, etc. */}
        <Link href='/documents/deep-search'>
          <button
            className='btn-primary flex transform items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 font-medium text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none'
            onClick={() => setLoading(true)}
          >
            <svg
              className='h-5 w-5 flex-shrink-0'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
            <span className='text-sm font-medium'>Deep Search</span>
            <svg
              className='h-4 w-4 flex-shrink-0 opacity-75'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 7l5 5m0 0l-5 5m5-5H6'
              />
            </svg>
          </button>
        </Link>
      </div>
    </div>
  );
};
