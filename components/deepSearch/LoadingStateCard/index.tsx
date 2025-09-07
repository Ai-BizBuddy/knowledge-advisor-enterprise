'use client';

interface LoadingStateCardProps {
  count?: number;
  className?: string;
}

export const LoadingStateCard = ({
  count = 3,
  className = '',
}: LoadingStateCardProps) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(count)].map((_, index) => (
        <div key={index} className='card animate-pulse p-4'>
          <div className='flex items-start gap-4'>
            {/* File Icon Skeleton */}
            <div className='mt-1 h-6 w-6 flex-shrink-0 rounded bg-gray-300 dark:bg-gray-600'></div>

            {/* Content Skeleton */}
            <div className='flex-1 space-y-3'>
              {/* Header Section */}
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1 space-y-2'>
                  {/* Title */}
                  <div className='h-6 w-3/4 rounded bg-gray-300 dark:bg-gray-600'></div>
                  {/* Metadata */}
                  <div className='h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700'></div>
                </div>
                {/* Relevance Score */}
                <div className='h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700'></div>
              </div>

              {/* Content Preview */}
              <div className='space-y-2'>
                <div className='h-4 rounded bg-gray-200 dark:bg-gray-700'></div>
                <div className='h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700'></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingStateCard;
