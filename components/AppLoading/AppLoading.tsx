import { Spinner } from 'flowbite-react';
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
          container: 'flex h-64 w-full items-center justify-center',
          spinner: 'h-12 w-12',
          text: 'text-base',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`${styles.container} ${className} bg-white-900 dark:bg-slate-800`}>
      <div className='flex flex-col items-center space-y-4'>
        {/* Loading Spinner */}
        <Spinner className={styles.spinner} />
        {/* Loading Text */}
        <div className={`${styles.text} text-slate-600 dark:text-slate-400`}>
          {message}
        </div>
      </div>
    </div>
  );
};

export default AppLoading;
