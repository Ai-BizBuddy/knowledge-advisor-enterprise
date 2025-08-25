'use client';

import { motion } from 'framer-motion';
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
  message = 'Loading...',
  showMessage = true,
}) => {
  const getGridClassName = () => {
    switch (variant) {
      case 'list':
        return 'flex flex-col space-y-4';
      case 'compact':
        return 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4';
      default:
        return 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
    }
  };

  const getCardClassName = () => {
    switch (variant) {
      case 'list':
        return 'h-20 flex-row';
      case 'compact':
        return 'h-32 aspect-square';
      default:
        return 'h-48 aspect-[4/3]';
    }
  };

  const cards = Array.from({ length: count }, (_, index) => index);

  return (
    <div className={`${getGridClassName()} ${className}`}>
      {cards.map((index) => (
        <div
          key={index}
          className={`relative items-center overflow-hidden rounded-lg border border-gray-100 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800 ${getCardClassName()}`}
        >
          <div className='space-y-3 opacity-20'>
            <div className='h-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600'></div>
            <div className='h-4 w-3/4 animate-pulse rounded bg-gray-300 dark:bg-gray-600'></div>

            {variant !== 'compact' && (
              <>
                <div className='h-3 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
                <div className='h-3 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
                <div className='h-3 w-4/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
              </>
            )}

            <div className='pt-2'>
              <div className='h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
            </div>
          </div>

          <div
            role='status'
            className='absolute top-2/4 left-1/2 -translate-x-1/2 -translate-y-1/2'
          >
            <svg
              aria-hidden='true'
              className='h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600'
              viewBox='0 0 100 101'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
                fill='currentColor'
              />
              <path
                d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
                fill='currentFill'
              />
            </svg>
            <span className='sr-only'>{message}</span>
          </div>
        </div>
      ))}

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
      )}
    </div>
  );
};

export default LoadingCard;
