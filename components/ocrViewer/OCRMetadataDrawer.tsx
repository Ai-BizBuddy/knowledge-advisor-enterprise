'use client';

import type { OCRMetadataDrawerProps } from './OCRViewer.types';

// Inline SVG Icon
const CloseIcon = () => (
  <svg
    className='h-4 w-4'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    viewBox='0 0 24 24'
  >
    <line x1='18' y1='6' x2='6' y2='18' />
    <line x1='6' y1='6' x2='18' y2='18' />
  </svg>
);

export const OCRMetadataDrawer: React.FC<OCRMetadataDrawerProps> = ({
  isOpen,
  metadata,
  onClose,
}) => {
  return (
    <div
      className={`absolute right-0 bottom-0 left-0 z-30 flex h-72 flex-col border-t border-gray-200 bg-white shadow-lg transition-transform duration-300 dark:border-gray-700 dark:bg-gray-800 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        boxShadow: isOpen ? '0 -4px 6px rgba(0, 0, 0, 0.05)' : 'none',
      }}
    >
      {/* Drawer Header */}
      <div className='flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700'>
        <span className='text-sm font-semibold text-gray-900 dark:text-white'>
          Raw Metadata
        </span>
        <button
          onClick={onClose}
          className='rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
        >
          <CloseIcon />
        </button>
      </div>

      {/* Drawer Content */}
      <div className='flex-1 overflow-auto p-4'>
        <pre
          className='text-xs text-gray-700 dark:text-gray-300'
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {metadata
            ? JSON.stringify(metadata, null, 2)
            : 'No metadata available'}
        </pre>
      </div>
    </div>
  );
};
