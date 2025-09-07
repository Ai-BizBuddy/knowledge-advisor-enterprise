import React from 'react';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  source: string;
  type: 'document' | 'knowledge_base' | 'chat_history';
  timestamp: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface SearchResultProps {
  result: SearchResult;
  onClick?: () => void;
}

export const SearchResult: React.FC<SearchResultProps> = ({
  result,
  onClick,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return (
          <svg
            className='h-5 w-5 text-blue-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
        );
      case 'knowledge_base':
        return (
          <svg
            className='h-5 w-5 text-green-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
            />
          </svg>
        );
      case 'chat_history':
        return (
          <svg
            className='h-5 w-5 text-purple-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className='card cursor-pointer transition-shadow hover:shadow-md'
      onClick={onClick}
    >
      <div className='flex items-start gap-4'>
        {/* Type Icon */}
        <div className='mt-1 flex-shrink-0'>{getTypeIcon(result.type)}</div>

        {/* Content */}
        <div className='min-w-0 flex-1'>
          {/* Header */}
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0 flex-1'>
              <h3 className='line-clamp-1 text-lg font-medium text-gray-900 dark:text-gray-100'>
                {result.title}
              </h3>
              <div className='mt-1 flex items-center gap-2'>
                <span className='text-sm text-gray-500 dark:text-gray-400'>
                  {result.source}
                </span>
                <span className='text-gray-300 dark:text-gray-600'>•</span>
                <span className='text-sm text-gray-500 dark:text-gray-400'>
                  {new Date(result.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200'>
                {Math.round(result.relevanceScore * 100)}% match
              </div>
            </div>
          </div>

          {/* Content Preview */}
          <p className='mt-2 line-clamp-2 text-gray-600 dark:text-gray-400'>
            {result.content}
          </p>

          {/* Tags */}
          {result.tags && result.tags.length > 0 && (
            <div className='mt-3 flex flex-wrap gap-2'>
              {result.tags.map((tag) => (
                <span
                  key={tag}
                  className='rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
