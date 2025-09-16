import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Consistent page layout component with responsive design
 * Provides standardized spacing, typography, and responsive behavior
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`page-container ${className}`}>
      <div className='p-4 sm:p-6 lg:p-8'>
        {/* Page Header */}
        <div className='space-y-3 pb-6 '>
          <div className='flex-responsive'>
            <div className='flex-1'>
              <h1 className=' text-2xl font-bold text-gray-900 dark:text-white'>
                {title}
              </h1>
              {subtitle && (
                <p className='text-sm text-gray-500 sm:text-base dark:text-gray-400'>
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className='flex-shrink-0'>{action}</div>}
          </div>
        </div>

        {/* Page Content */}
        <div className='element-spacing'>{children}</div>
      </div>
    </div>
  );
};

export default PageLayout;
