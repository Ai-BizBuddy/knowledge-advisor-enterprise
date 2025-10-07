/**
 * Props interface for KnowledgeBaseCard component
 */
interface KnowledgeBaseCardProps {
  title: string;
  detail: string;
  updated: string;
  isActive: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
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
  onEdit,
  onDetail,
}: KnowledgeBaseCardProps) {
  return (
    <div className='knowledge-base-card group mx-auto w-full transform rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] sm:p-5 lg:p-6 dark:border-gray-700 dark:bg-gray-800 dark:hover:shadow-2xl'>
      {/* Header Section */}
      <div className='mb-4 flex items-start justify-between gap-3 lg:mb-5'>
        <div 
          className='flex min-w-0 flex-1 items-center gap-3 cursor-pointer'
          onClick={onDetail}
          role='button'
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onDetail();
            }
          }}
        >
          {isActive ? (
            <div className='h-3 w-3 flex-shrink-0 rounded-full bg-green-400 shadow-sm'></div>
          ) : (
            <div className='h-3 w-3 flex-shrink-0 rounded-full bg-red-400 shadow-sm'></div>
          )}
          <h2 className='truncate text-base font-bold text-gray-900 sm:text-lg lg:text-xl dark:text-white'>
            {title}
          </h2>
        </div>

        {/* Action Buttons - Edit and Delete */}
        <div className='flex items-center gap-2 flex-shrink-0'>
          {/* Edit Button */}
          {onEdit && (
            <button
              className='rounded-lg bg-blue-50 p-2 text-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 dark:focus:ring-blue-800/50'
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title='Edit Knowledge Base'
            >
              <svg className='h-4 w-4 lg:h-5 lg:w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                />
              </svg>
            </button>
          )}

          {/* Delete Button */}
          {onDelete && (
            <button
              className='rounded-lg bg-red-50 p-2 text-red-500 focus:ring-2 focus:ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 dark:focus:ring-red-800/50'
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title='Delete Knowledge Base'
            >
              <svg className='h-4 w-4 lg:h-5 lg:w-5' fill='currentColor' viewBox='0 0 24 24'>
                <path
                  fillRule='evenodd'
                  d='M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 4a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Detail Section */}
      <div 
        className='mb-4 flex-1 lg:mb-5 cursor-pointer'
        onClick={onDetail}
        role='button'
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onDetail();
          }
        }}
      >
        <p className='line-clamp-3 text-sm text-gray-600 leading-relaxed sm:text-sm lg:line-clamp-2 lg:text-base dark:text-gray-300'>
          {detail}
        </p>
      </div>

      {/* Footer Section */}
      <div className='mt-auto flex items-center justify-between gap-2'>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <svg
            className='h-4 w-4 flex-shrink-0 text-gray-400 lg:h-5 lg:w-5'
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
          <span className='truncate text-xs text-gray-500 sm:text-sm lg:text-sm dark:text-gray-400'>
            {updated}
          </span>
        </div>

        {/* Desktop hover indicator */}
        <div className='hidden opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block' onClick={onDetail}>
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

        {/* Mobile indicator */}
        <div className='sm:hidden' onClick={onDetail}>
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
