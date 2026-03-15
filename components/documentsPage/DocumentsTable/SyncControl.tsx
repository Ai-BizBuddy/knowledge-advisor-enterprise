import React from 'react';
import type { SyncControlProps } from './DocumentsTable.types';

export const SyncControl: React.FC<SyncControlProps> = ({
  syncStatus = 'Not Synced',
  isLoading = false,
  onSync,
  documentStatus,
  disableSync,
}) => {
  // Hide sync button completely if status is 'ready'
  if (documentStatus === 'ready') {
    return null;
  }

  const getStatusConfig = () => {
    // Check document status first for new status handling
    switch (documentStatus) {
      case 'processing':
        return {
          color:
            'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
          icon: (
            <svg
              className='mr-1 h-4 w-4 animate-spin'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
          ),
          text: 'Processing...',
          disabled: true,
        };
      case 'queued':
        return {
          color:
            'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
          icon: (
            <svg
              className='mr-1 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          ),
          text: 'Queued',
          disabled: true,
        };
      case 'archived':
        return {
          color:
            'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
          icon: (
            <svg
              className='mr-1 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 8l6 6M5 8l6-6m6 6l-6 6m-6-6h12'
              />
            </svg>
          ),
          text: 'Archived',
          disabled: true,
        };
    }

    // Fall back to original syncStatus logic
    switch (syncStatus) {
      case 'synced':
      case 'Synced':
        return {
          color:
            'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300',
          icon: (
            <svg
              className='mr-1 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          ),
          text: 'Synced',
          disabled: true,
        };
      case 'syncing':
      case 'Syncing':
        return {
          color:
            'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
          icon: (
            <svg
              className='mr-1 h-4 w-4 animate-spin'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
          ),
          text: 'Syncing...',
          disabled: true,
        };
      case 'error':
      case 'Error':
        return {
          color:
            'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300',
          icon: (
            <svg
              className='mr-1 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          ),
          text: 'Retry',
          disabled: false,
        };
      default:
        return {
          color:
            'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300',
          icon: (
            <svg
              className='mr-1 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
          ),
          text: 'Sync',
          disabled: false,
        };
    }
  };

  const config = getStatusConfig();
  const finalDisabled = config.disabled || isLoading || disableSync;
  const showLoading =
    isLoading ||
    documentStatus === 'processing' ||
    syncStatus === 'syncing' ||
    syncStatus === 'Syncing';

  // If sync is disabled or running, render just the button (no dropdown)
  if (finalDisabled) {
    return (
      <button
        disabled={true}
        className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors ${config.color} cursor-not-allowed opacity-60`}
      >
        {showLoading ? (
          <svg
            className='mr-1 h-4 w-4 animate-spin'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
        ) : (
          config.icon
        )}
        {config.text}
      </button>
    );
  }

  // Single Sync button
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSync?.();
      }}
      className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors ${config.color}`}
    >
      {config.icon}
      {config.text}
    </button>
  );
};
