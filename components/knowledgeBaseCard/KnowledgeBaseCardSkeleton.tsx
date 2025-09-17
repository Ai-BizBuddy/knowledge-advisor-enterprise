'use client';

import React from 'react';

interface KnowledgeBaseCardSkeletonProps {
  /**
   * Number of skeleton cards to render
   * @default 10
   */
  count?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * KnowledgeBaseCardSkeleton component
 * 
 * A skeleton loading component that matches the exact design and dimensions
 * of the KnowledgeBaseCard for a seamless loading experience.
 * Optimized for MacBook screens with smooth animations.
 */
export const KnowledgeBaseCardSkeleton: React.FC<KnowledgeBaseCardSkeletonProps> = ({
  count = 10,
  className = '',
}) => {
  const skeletonCards = Array.from({ length: count }, (_, index) => index);

  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 ${className}`}>
      {skeletonCards.map((index) => (
        <div
          key={index}
          className='group mx-auto h-[180px] w-full max-w-sm animate-pulse rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:w-full sm:max-w-none sm:p-6 dark:border-gray-700 dark:bg-gray-800'
        >
          {/* Header Section Skeleton */}
          <div className='mb-4 flex items-start justify-between gap-3'>
            <div className='flex min-w-0 flex-1 items-center gap-3'>
              {/* Status indicator skeleton */}
              <div className='h-3 w-3 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600'></div>
              
              {/* Title skeleton */}
              <div className='h-6 flex-1 rounded bg-gray-300 dark:bg-gray-600'></div>
            </div>

            {/* Delete button skeleton */}
            <div className='h-8 w-8 flex-shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700'></div>
          </div>

          {/* Detail Section Skeleton */}
          <div className='mb-4 space-y-2'>
            <div className='h-4 w-full rounded bg-gray-200 dark:bg-gray-700'></div>
            <div className='h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700'></div>
          </div>

          {/* Footer Section Skeleton */}
          <div className='flex items-center justify-between gap-2'>
            <div className='flex min-w-0 flex-1 items-center gap-2'>
              {/* Clock icon skeleton */}
              <div className='h-4 w-4 flex-shrink-0 rounded bg-gray-300 dark:bg-gray-600'></div>
              
              {/* Updated time skeleton */}
              <div className='h-3 w-20 rounded bg-gray-200 dark:bg-gray-700'></div>
            </div>

            {/* View details arrow skeleton */}
            <div className='h-4 w-4 rounded bg-gray-300 dark:bg-gray-600'></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KnowledgeBaseCardSkeleton;
