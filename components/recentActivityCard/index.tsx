'use client';
import { IRecentActivityCardProps } from '@/interfaces/RecentActivityCard';
import { Button, Card } from 'flowbite-react';
import { useEffect, useState } from 'react';

export default function RecentActivityCard({
  activities,
  loading = false,
  error = null,
  onRetry,
}: IRecentActivityCardProps) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const renderSkeletonLoader = () => (
    <ul className='space-y-0 divide-y divide-gray-200 dark:divide-gray-800'>
      {Array.from({ length: 5 }, (_, index) => (
        <li 
          key={index} 
          className='flex items-start gap-3 py-3 first:pt-0 last:pb-0 sm:py-4'
        >
          <div className='flex-shrink-0'>
            <div className='mt-0.5 h-5 w-5 animate-pulse rounded-full bg-gray-300 sm:h-6 sm:w-6 dark:bg-gray-600'></div>
          </div>
          <div className='min-w-0 flex-1 animate-pulse'>
            <div className='mb-1 h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600'></div>
            <div className='mb-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700'></div>
            <div className='h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700'></div>
          </div>
        </li>
      ))}
    </ul>
  );

  const renderErrorState = () => (
    <div className='flex flex-col items-center justify-center py-8 text-center'>
      <div className='mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/30'>
        <svg
          className='h-6 w-6 text-red-600 dark:text-red-400'
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
      </div>
      <p className='mb-2 text-sm font-medium text-gray-900 dark:text-white'>
        Failed to load recent activity
      </p>
      <p className='mb-4 text-xs text-gray-600 dark:text-gray-400'>
        {error || 'Something went wrong. Please try again.'}
      </p>
      {onRetry && (
        <div>
          <Button
            size='sm'
            color='gray'
            onClick={onRetry}
            className='text-xs'
          >
            <svg
              className='mr-2 h-3 w-3'
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
            Try Again
          </Button>
        </div>
      )}
    </div>
  );

  const renderEmptyState = () => (
    <div className='flex flex-col items-center justify-center py-8 text-center'>
      <div className='mb-4 rounded-full bg-gray-100 p-3 dark:bg-gray-800'>
        <svg
          className='h-6 w-6 text-gray-400'
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
      </div>
      <p className='text-sm font-medium text-gray-900 dark:text-white'>
        No recent activity
      </p>
      <p className='text-xs text-gray-600 dark:text-gray-400'>
        Activity will appear here as you use the system
      </p>
    </div>
  );

  const renderActivityList = () => (
    <ul className='space-y-0 divide-y divide-gray-200 dark:divide-gray-800'>
      {activities.map((activity, index) => (
        <li
          key={`${activity.title}-${index}`}
          className='flex items-start gap-3 py-3 first:pt-0 last:pb-0 sm:py-4'
        >
          <div className='flex-shrink-0'>
            <svg
              className='mt-0.5 h-5 w-5 text-blue-500 sm:h-6 sm:w-6'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                fillRule='evenodd'
                d='M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='min-w-0 flex-1'>
            <p className='mb-1 text-sm font-medium text-gray-900 sm:text-base dark:text-white'>
              {activity.title}
            </p>
            {activity.description && (
              <p className='mb-2 line-clamp-2 text-xs text-gray-600 sm:text-sm dark:text-gray-300'>
                {activity.description}
              </p>
            )}
            {/* Only render timestamp after hydration to avoid SSR mismatch */}
            {hydrated && (
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                {activity.timestamp}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <Card className='h-full border-gray-200 xl:w-full dark:border-gray-700 dark:bg-gray-800'>
      <div className='p-2 sm:p-4'>
        <div className='mb-10'>
          <div className='flex items-center justify-between'>
            <h5 className='mb-4 text-lg font-bold text-gray-900 sm:text-xl dark:text-white'>
              Recent Activity
            </h5>
            {loading && (
              <div className='flex items-center space-x-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent'></div>
                <span className='text-xs text-gray-500 dark:text-gray-400'>Loading...</span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          renderSkeletonLoader()
        ) : error ? (
          renderErrorState()
        ) : activities.length === 0 ? (
          renderEmptyState()
        ) : (
          renderActivityList()
        )}
      </div>
    </Card>
  );
}
