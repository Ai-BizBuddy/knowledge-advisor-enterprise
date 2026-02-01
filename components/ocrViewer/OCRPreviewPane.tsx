'use client';

import type { OCRPreviewPaneProps } from './OCRViewer.types';

// Inline SVG Icon
const DocumentIcon = () => (
  <svg
    className='mb-4 h-12 w-12 opacity-30'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.5'
    viewBox='0 0 24 24'
  >
    <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
    <polyline points='14 2 14 8 20 8' />
    <line x1='16' y1='13' x2='8' y2='13' />
    <line x1='16' y1='17' x2='8' y2='17' />
    <polyline points='10 9 9 9 8 9' />
  </svg>
);

export const OCRPreviewPane: React.FC<OCRPreviewPaneProps> = ({
  images,
  currentPage,
  isLoading,
  hasContent,
}) => {
  // Get the first image to display (main document image)
  const mainImage = images.length > 0 ? images[0] : null;

  return (
    <div className='relative flex flex-1 flex-col overflow-hidden border-r border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900'>
      {/* Preview Toolbar */}
      <div className='flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800'>
        <span className='text-xs text-gray-500 dark:text-gray-400'>
          Page{' '}
          <span className='font-medium text-gray-700 dark:text-gray-300'>
            {currentPage || '-'}
          </span>
        </span>
        <div className='flex items-center gap-2'>
          {/* Zoom controls placeholder */}
        </div>
      </div>

      {/* Canvas Container */}
      <div
        className='flex flex-1 items-start justify-center overflow-auto p-8'
        style={{
          backgroundImage:
            'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {isLoading ? (
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400'>
            Loading...
          </div>
        ) : !hasContent ? (
          <div className='flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400'>
            <DocumentIcon />
            <div className='text-sm'>
              Select a document section
              <br />
              to view content
            </div>
          </div>
        ) : (
          <div className='relative bg-white shadow-lg dark:bg-gray-800'>
            {mainImage ? (
              <img
                src={mainImage.base64}
                alt={`Page ${currentPage}`}
                className='block max-w-full'
                style={{ maxHeight: 'calc(100vh - 200px)' }}
              />
            ) : (
              <div className='flex h-96 w-72 items-center justify-center bg-gray-50 text-gray-400 dark:bg-gray-700 dark:text-gray-500'>
                No image available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
