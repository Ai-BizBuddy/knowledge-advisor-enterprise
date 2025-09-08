/**
 * Table Search Component
 *
 * Reusable search and filters component that goes above tables.
 */

import { Button, TextInput } from 'flowbite-react';
import React from 'react';

export interface TableSearchProps {
  searchValue?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  className?: string;
  onClickButton?: () => void;
  textButton?: string;
  children?: React.ReactNode; // For additional filters
}

export const TableSearch: React.FC<TableSearchProps> = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = true,
  className = '',
  onClickButton = () => {},
  textButton = '',
  children,
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        {/* Search Input */}
        {showSearch && onSearchChange && (
          <div className='w-full sm:w-80'>
            <TextInput
              type='text'
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className='w-full'
              icon={() => (
                <svg
                  className='h-4 w-4 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
              )}
            />
          </div>
        )}

        {/* Right side controls */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          {/* Additional filters (if provided) */}
          {children}

          {/* Page size selector */}
          {textButton && (
            <div className='flex w-full items-center justify-end'>
              <Button
                onClick={onClickButton}
                className='w-full bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:w-auto'
              >
                <svg
                  className='mr-2 h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4v16m8-8H4'
                  />
                </svg>
                <span className='block sm:hidden'>{textButton.split(' ')[0]}</span>
                <span className='hidden sm:block'>{textButton}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
