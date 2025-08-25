import React from 'react';

export interface AppLoadingProps {
  variant?: 'default' | 'compact' | 'minimal';
  message?: string;
  className?: string;
}

/**
 * App Router Loading UI Component
 * Provides consistent loading states across all pages
 */
export const AppLoading: React.FC<AppLoadingProps> = ({
  variant = 'default',
  message = 'Loading...',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          container: 'flex h-32 w-full items-center justify-center',
          spinner: 'h-8 w-8',
          text: 'text-sm',
        };
      case 'minimal':
        return {
          container: 'flex h-16 w-full items-center justify-center',
          spinner: 'h-6 w-6',
          text: 'text-xs',
        };
      default:
        return {
          container: 'flex h-screen w-full items-center justify-center',
          spinner: 'h-12 w-12',
          text: 'text-base',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`${styles.container} ${className}`}>
      <div className='flex flex-col items-center space-y-4'>
        {/* Loading Spinner */}
        <div className='relative'>
          <svg
            className={`${styles.spinner} animate-spin text-indigo-600`}
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='2'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
        </div>

        {/* Loading Text */}
        <div className={`${styles.text} text-slate-600 dark:text-slate-400`}>
          {message}
        </div>

        {/* Loading Dots Animation */}
        <div className='flex space-x-1'>
          <div className='h-2 w-2 animate-bounce rounded-full bg-indigo-600 [animation-delay:-0.3s]'></div>
          <div className='h-2 w-2 animate-bounce rounded-full bg-indigo-600 [animation-delay:-0.15s]'></div>
          <div className='h-2 w-2 animate-bounce rounded-full bg-indigo-600'></div>
        </div>
      </div>
    </div>
  );
};

export default AppLoading;
