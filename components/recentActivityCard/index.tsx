'use client';
import { Pagination } from '@/components/pagination';
import { IRecentActivityCardProps } from '@/interfaces/RecentActivityCard';
import { Button, Card } from 'flowbite-react';
import { useEffect, useState } from 'react';

export default function RecentActivityCard({
  activities,
  loading = false,
  error = null,
  onRetry,
  pagination,
  showPagination = false,
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
          <Button size='sm' color='gray' onClick={onRetry} className='text-xs'>
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

  const getActivityIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    
    // === DOCUMENT STATUS CHANGES ===
    if (lowerTitle.includes('document') && lowerTitle.includes('status changed')) {
      if (lowerTitle.includes('to ready')) {
        return (
          <svg className='mt-0.5 h-5 w-5 text-green-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
        );
      }
      if (lowerTitle.includes('to queued')) {
        return (
          <svg className='mt-0.5 h-5 w-5 text-indigo-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
        );
      }
      if (lowerTitle.includes('to processing')) {
        return (
          <svg className='mt-0.5 h-5 w-5 text-yellow-500 sm:h-6 sm:w-6 animate-spin' fill='none' viewBox='0 0 24 24'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
          </svg>
        );
      }
      if (lowerTitle.includes('to uploaded')) {
        return (
          <svg className='mt-0.5 h-5 w-5 text-blue-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
          </svg>
        );
      }
      if (lowerTitle.includes('to error') || lowerTitle.includes('to failed')) {
        return (
          <svg className='mt-0.5 h-5 w-5 text-red-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
        );
      }
      if (lowerTitle.includes('to archived')) {
        return (
          <svg className='mt-0.5 h-5 w-5 text-gray-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' />
          </svg>
        );
      }
    }
    
    // === DOCUMENT OPERATIONS ===
    if (lowerTitle.includes('document uploaded')) {
      return (
        <svg className='mt-0.5 h-5 w-5 text-blue-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
        </svg>
      );
    }
    
    if (lowerTitle.includes('document') && lowerTitle.includes('deleted')) {
      return (
        <svg className='mt-0.5 h-5 w-5 text-red-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
        </svg>
      );
    }
    
    // Document processing
    if (lowerTitle.includes('processed into') || lowerTitle.includes('chunk')) {
      return (
        <svg className='mt-0.5 h-5 w-5 text-purple-500 sm:h-6 sm:w-6' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M3 5h8v6H3V5zm10 0h8v6h-8V5zM3 13h8v6H3v-6zm10 0h8v6h-8v-6z' />
        </svg>
      );
    }
    
    // === RAG SYNC ===
    if (lowerTitle.includes('synchronized') || lowerTitle.includes('syncing')) {
      return (
        <svg className='mt-0.5 h-5 w-5 text-cyan-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
        </svg>
      );
    }
    
    if (lowerTitle.includes('sync failed')) {
      return (
        <svg className='mt-0.5 h-5 w-5 text-red-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' />
        </svg>
      );
    }
    
    // === KNOWLEDGE BASE OPERATIONS ===
    if (lowerTitle.includes('knowledge base') && lowerTitle.includes('visibility changed')) {
      if (lowerTitle.includes('to public')) {
        return (
          <svg className='mt-0.5 h-5 w-5 text-green-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
        );
      }
      if (lowerTitle.includes('to department')) {
        return (
          <svg className='mt-0.5 h-5 w-5 text-blue-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
          </svg>
        );
      }
      if (lowerTitle.includes('to private')) {
        return (
          <svg className='mt-0.5 h-5 w-5 text-purple-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
          </svg>
        );
      }
    }
    
    if (lowerTitle.includes('knowledge base created')) {
      return (
        <svg className='mt-0.5 h-5 w-5 text-green-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
        </svg>
      );
    }
    
    if (lowerTitle.includes('knowledge base') && lowerTitle.includes('deleted')) {
      return (
        <svg className='mt-0.5 h-5 w-5 text-red-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
        </svg>
      );
    }
    
    if (lowerTitle.includes('knowledge base') && lowerTitle.includes('updated')) {
      return (
        <svg className='mt-0.5 h-5 w-5 text-blue-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
        </svg>
      );
    }
    
    // === USER OPERATIONS ===
    if (lowerTitle.includes('user') && lowerTitle.includes('status changed')) {
      if (lowerTitle.includes('to active')) {
        return (
          <svg className='mt-0.5 h-5 w-5 text-green-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
        );
      }
      if (lowerTitle.includes('to suspended')) {
        return (
          <svg className='mt-0.5 h-5 w-5 text-red-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' />
          </svg>
        );
      }
      if (lowerTitle.includes('to inactive')) {
        return (
          <svg className='mt-0.5 h-5 w-5 text-gray-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' />
          </svg>
        );
      }
      if (lowerTitle.includes('to pending')) {
        return (
          <svg className='mt-0.5 h-5 w-5 text-yellow-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
        );
      }
    }
    
    if (lowerTitle.includes('user') && lowerTitle.includes('registered')) {
      return (
        <svg className='mt-0.5 h-5 w-5 text-green-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' />
        </svg>
      );
    }
    
    if (lowerTitle.includes('user') && lowerTitle.includes('updated')) {
      return (
        <svg className='mt-0.5 h-5 w-5 text-blue-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
        </svg>
      );
    }
    
    // === DEFAULT ICON ===
    return (
      <svg className='mt-0.5 h-5 w-5 text-blue-500 sm:h-6 sm:w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
    );
  };

  const renderActivityList = () => (
    <ul className='space-y-0 divide-y divide-gray-200 dark:divide-gray-800'>
      {activities.map((activity, index) => (
        <li
          key={`${activity.title}-${index}`}
          className='flex items-start gap-3 py-3 first:pt-0 last:pb-0 sm:py-4'
        >
          <div className='flex-shrink-0'>
            {getActivityIcon(activity.title)}
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
          </div>
        </div>

        {loading
          ? renderSkeletonLoader()
          : error
            ? renderErrorState()
            : activities.length === 0
              ? renderEmptyState()
              : renderActivityList()}

        {/* Pagination Controls */}
        {showPagination && pagination && pagination.totalPages > 1 && !loading && !error && (
          <div className='mt-6 border-t border-gray-200 pt-4 dark:border-gray-700'>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onPageChange={pagination.onPageChange}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
