import React from 'react';
import type { PageHeaderProps } from './PageHeader.types';

/**
 * Reusable page header component with consistent styling
 * Provides standardized typography and responsive behavior for page titles
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`space-y-3 pb-3 ${className}`}>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex-1'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            {title}
          </h1>
          {subtitle && (
            <p className='mt-2 text-sm font-medium text-gray-600 sm:text-base dark:text-gray-400'>
              {subtitle}
            </p>
          )}
        </div>
        
        {action && (
          <div className='flex-shrink-0'>
            {action}
          </div>
        )}
      </div>
    </div>
  );
};
