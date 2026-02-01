'use client';

import type { OCRViewerSidebarProps } from './OCRViewer.types';

// Inline SVG Icons
const ChevronRightIcon = () => (
  <svg
    className='h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    viewBox='0 0 24 24'
  >
    <polyline points='9 18 15 12 9 6' />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || 'h-4 w-4'}
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    viewBox='0 0 24 24'
  >
    <path d='M23 4v6h-6' />
    <path d='M20.49 15a9 9 0 1 1-2.12-9.36L23 10' />
  </svg>
);

const MenuIcon = () => (
  <svg
    className='h-4 w-4'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    viewBox='0 0 24 24'
  >
    <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
    <line x1='9' y1='3' x2='9' y2='21' />
  </svg>
);

export const OCRViewerSidebar: React.FC<OCRViewerSidebarProps> = ({
  documents,
  expandedDocuments,
  currentSectionId,
  currentDocumentId,
  isLoading,
  onDocumentToggle,
  onSectionSelect,
  onRefresh,
  onSidebarToggle,
  isCollapsed,
}) => {
  if (isCollapsed) {
    return null;
  }

  return (
    <div className='flex h-full w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-800'>
      {/* Sidebar Header */}
      <div className='flex h-12 flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700'>
        <span className='text-sm font-semibold text-gray-900 dark:text-white'>
          Documents
        </span>
        <div className='flex items-center gap-1'>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className='rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
            title='Refresh'
          >
            <RefreshIcon
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={onSidebarToggle}
            className='rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
            title='Toggle Sidebar'
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {/* Sidebar Content */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading && documents.length === 0 ? (
          <div className='p-4 text-center text-xs text-gray-500 dark:text-gray-400'>
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className='p-4 text-center text-xs text-gray-500 dark:text-gray-400'>
            No documents found.
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className='border-b border-transparent'>
              {/* Document Header */}
              <button
                onClick={() => onDocumentToggle(doc.id)}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  currentDocumentId === doc.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                <span
                  className={`transition-transform duration-200 ${
                    expandedDocuments.has(doc.id) ? 'rotate-90' : ''
                  }`}
                >
                  <ChevronRightIcon />
                </span>
                <span className='truncate' title={doc.name}>
                  {doc.name}
                </span>
              </button>

              {/* Section List */}
              {expandedDocuments.has(doc.id) && (
                <div className='bg-gray-50 pb-1 dark:bg-gray-900/50'>
                  {doc.sections.length === 0 ? (
                    <div className='px-4 py-2 pl-9 text-xs text-gray-400 dark:text-gray-500'>
                      No sections available.
                    </div>
                  ) : (
                    doc.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => onSectionSelect(section.id)}
                        className={`block w-full px-4 py-1.5 pl-9 text-left text-xs transition-all ${
                          currentSectionId === section.id
                            ? 'border-l-2 border-blue-500 bg-blue-50 pl-[34px] font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-300'
                        }`}
                      >
                        Page {section.page}
                        {section.chunkIndex > 0 &&
                          ` · Chunk ${section.chunkIndex + 1}`}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
