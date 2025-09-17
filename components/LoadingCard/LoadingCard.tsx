'use client';

import React from 'react';
import type { LoadingCardProps } from './LoadingCard.types';

/**
 * LoadingCard Component
 *
 * Displays skeleton loading cards based on Flowbite's spinner with card pattern.
 * Used when loading lists of items like knowledge bases, documents, etc.
 */
export const LoadingCard: React.FC<LoadingCardProps> = ({
  count = 6,
  variant = 'grid',
  className = '',
}) => {
  const getGridClassName = () => {
    switch (variant) {
      case 'list':
        return 'flex flex-col space-y-4';
      case 'compact':
        return 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4';
      default:
        return 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5';
    }
  };

  const getCardClassName = () => {
    switch (variant) {
      case 'list':
        return 'h-20 flex-row';
      case 'compact':
        return 'h-32 aspect-square';
      default:
        // Match the exact height of KnowledgeBaseCard (200px mobile, 220px desktop)
        return 'h-[200px] lg:h-[220px]';
    }
  };

  const cards = Array.from({ length: count }, (_, index) => index);

  return (
    <div className={`${getGridClassName()} ${className}`}>
      {cards.map((index) => (
        <div
          key={index}
          className={`relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all sm:p-6 dark:border-gray-700 dark:bg-gray-800 ${getCardClassName()}`}
        >
          {/* Enhanced skeleton content that matches actual card structure */}
          <div className='h-full animate-pulse'>
            {/* Header Section Skeleton - matches KnowledgeBaseCard header */}
            <div className='mb-4 flex items-start justify-between gap-3'>
              <div className='flex min-w-0 flex-1 items-center gap-3'>
                {/* Status indicator skeleton */}
                <div className='h-3 w-3 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600'></div>

                {/* Title skeleton */}
                <div className='h-5 flex-1 rounded bg-gray-300 sm:h-6 dark:bg-gray-600'></div>
              </div>

              {/* Delete button skeleton - only show for grid variant */}
              {variant === 'grid' && (
                <div className='h-8 w-8 flex-shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700'></div>
              )}
            </div>

            {/* Detail Section Skeleton - only for grid variant */}
            {variant === 'grid' && (
              <div className='mb-4 space-y-2'>
                <div className='h-4 w-full rounded bg-gray-200 dark:bg-gray-700'></div>
                <div className='h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700'></div>
              </div>
            )}

            {/* Compact variant content */}
            {variant === 'compact' && (
              <div className='space-y-2'>
                <div className='h-3 w-full rounded bg-gray-200 dark:bg-gray-700'></div>
                <div className='h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700'></div>
              </div>
            )}

            {/* List variant content */}
            {variant === 'list' && (
              <div className='flex items-center space-x-4'>
                <div className='h-12 w-12 rounded bg-gray-300 dark:bg-gray-600'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700'></div>
                  <div className='h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700'></div>
                </div>
              </div>
            )}

            {/* Footer Section Skeleton - for grid variant */}
            {variant === 'grid' && (
              <div className='absolute right-4 bottom-4 left-4 flex items-center justify-between gap-2 sm:right-6 sm:bottom-6 sm:left-6'>
                <div className='flex min-w-0 flex-1 items-center gap-2'>
                  {/* Clock icon skeleton */}
                  <div className='h-4 w-4 flex-shrink-0 rounded bg-gray-300 dark:bg-gray-600'></div>

                  {/* Updated time skeleton */}
                  <div className='h-3 w-20 rounded bg-gray-200 dark:bg-gray-700'></div>
                </div>

                {/* View details arrow skeleton */}
                <div className='h-4 w-4 rounded bg-gray-300 dark:bg-gray-600'></div>
              </div>
            )}

            {/* Footer for other variants */}
            {variant !== 'grid' && (
              <div className='pt-2'>
                <div className='h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700'></div>
              </div>
            )}
          </div>
        </div>
      ))}
{/* 
      {showMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`col-span-full flex items-center justify-center py-8 text-center ${variant === 'list' ? 'mt-4' : ''}`}
        >
          <div className='flex flex-col items-center space-y-2'>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              {message}
            </p>
            <div className='flex space-x-1'>
              <div className='h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]'></div>
              <div className='h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s]'></div>
              <div className='h-2 w-2 animate-bounce rounded-full bg-blue-600'></div>
            </div>
          </div>
        </motion.div>
      )} */}
    </div>
  );
};

export default LoadingCard;
