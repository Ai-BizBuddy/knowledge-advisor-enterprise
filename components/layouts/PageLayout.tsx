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
      <div className='p-4 sm:p-6 lg:p-7'>
        {/* Page Header */}
        <div className='section-spacing'>
          <div className='flex-responsive'>
            <div className='flex-1'>
              <h1 className='page-title mb-2'>{title}</h1>
              {subtitle && <p className='page-subtitle'>{subtitle}</p>}
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
