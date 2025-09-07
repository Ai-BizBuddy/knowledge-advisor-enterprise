/**
 * Props interface for KnowledgeBaseCard component
 */
export interface KnowledgeBaseCardProps {
  title: string;
  detail: string;
  updated: string;
  isActive: boolean;
  onDelete?: () => void;
  onDetail: () => void;
}

/**
 * KnowledgeBaseCard component displays a knowledge base item with title, detail, and update time
 * Fully responsive design for mobile, tablet, and desktop
 */
export default function KnowledgeBaseCard({
  title,
  detail,
  updated,
  isActive,
  onDelete,
  onDetail,
}: KnowledgeBaseCardProps) {
  return (
    <div
      className='group mx-auto h-[180px] w-full max-w-sm transform cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 ease-in-out hover:shadow-md sm:w-full sm:max-w-none sm:p-6 dark:border-gray-700 dark:bg-gray-800'
      onClick={onDetail}
      role='button'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onDetail();
        }
      }}
    >
      {/* Header Section */}
      <div className='mb-4 flex items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-1 items-center gap-3'>
          {isActive ? (
            <div className='h-3 w-3 flex-shrink-0 rounded-full bg-green-400'></div>
          ) : (
            <div className='h-3 w-3 flex-shrink-0 rounded-full bg-red-400'></div>
          )}
          <h2 className='truncate text-lg font-bold text-gray-900 sm:text-xl dark:text-white'>
            {title}
          </h2>
        </div>

        {/* Delete Button - Hidden on mobile, shown on hover for desktop */}
        {onDelete && (
          <button
            className='flex-shrink-0 rounded-lg bg-red-50 p-2 text-red-500 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-red-100 sm:hidden sm:group-hover:block dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title='Delete Knowledge Base'
          >
            <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 24 24'>
              <path
                fillRule='evenodd'
                d='M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 4a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        )}
      </div>

      {/* Detail Section */}
      <div className='mb-4'>
        <p className='line-clamp-2 text-sm text-gray-600 sm:text-base dark:text-gray-300'>
          {detail}
        </p>
      </div>

      {/* Footer Section */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <svg
            className='h-4 w-4 flex-shrink-0 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <span className='truncate text-xs text-gray-500 sm:text-sm dark:text-gray-400'>
            {updated}
          </span>
        </div>

        {/* View Details Link - Hidden on mobile, shown on hover for desktop */}
        <div className='hidden items-center transition-opacity duration-300 sm:flex sm:opacity-0 sm:group-hover:opacity-100'>
          <span className='text-sm font-medium whitespace-nowrap text-blue-500 dark:text-blue-400'>
            View Details →
          </span>
        </div>

        {/* Mobile indicator */}
        <div className='sm:hidden'>
          <svg
            className='h-5 w-5 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M9 5l7 7-7 7'
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
