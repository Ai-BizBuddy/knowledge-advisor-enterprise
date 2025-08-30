'use client';
import React, { useState } from 'react';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (searchConfig: AdvancedSearchConfig) => void;
}

interface AdvancedSearchConfig {
  query: string;
  dateRange: {
    start?: string;
    end?: string;
  };
  contentTypes: string[];
  sources: string[];
  relevanceThreshold: number;
  includeMetadata: boolean;
}

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
}) => {
  const [config, setConfig] = useState<AdvancedSearchConfig>({
    query: '',
    dateRange: {},
    contentTypes: [],
    sources: [],
    relevanceThreshold: 0.5,
    includeMetadata: false,
  });

  const contentTypes = [
    { id: 'pdf', label: 'PDF Documents' },
    { id: 'docx', label: 'Word Documents' },
    { id: 'txt', label: 'Text Files' },
    { id: 'md', label: 'Markdown Files' },
  ];

  const sources = [
    { id: 'uploaded_docs', label: 'Uploaded Documents' },
    { id: 'knowledge_bases', label: 'Knowledge Bases' },
    { id: 'chat_history', label: 'Chat History' },
    { id: 'external_apis', label: 'External APIs' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-screen items-center justify-center p-4'>
        {/* Backdrop */}
        <div
          className='bg-opacity-50 fixed inset-0 bg-black transition-opacity'
          onClick={onClose}
        />

        {/* Modal */}
        <div className='relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
              Advanced Search
            </h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            >
              <svg
                className='h-6 w-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className='space-y-6 p-6'>
            {/* Search Query */}
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Search Query
              </label>
              <input
                type='text'
                value={config.query}
                onChange={(e) =>
                  setConfig({ ...config, query: e.target.value })
                }
                placeholder='Enter your search terms...'
                className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
              />
            </div>

            {/* Date Range */}
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Date Range
              </label>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='mb-1 block text-xs text-gray-500 dark:text-gray-400'>
                    From
                  </label>
                  <input
                    type='date'
                    value={config.dateRange.start || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        dateRange: {
                          ...config.dateRange,
                          start: e.target.value,
                        },
                      })
                    }
                    className='w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  />
                </div>
                <div>
                  <label className='mb-1 block text-xs text-gray-500 dark:text-gray-400'>
                    To
                  </label>
                  <input
                    type='date'
                    value={config.dateRange.end || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        dateRange: { ...config.dateRange, end: e.target.value },
                      })
                    }
                    className='w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  />
                </div>
              </div>
            </div>

            {/* Content Types */}
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Content Types
              </label>
              <div className='grid grid-cols-2 gap-2'>
                {contentTypes.map((type) => (
                  <label key={type.id} className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={config.contentTypes.includes(type.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConfig({
                            ...config,
                            contentTypes: [...config.contentTypes, type.id],
                          });
                        } else {
                          setConfig({
                            ...config,
                            contentTypes: config.contentTypes.filter(
                              (id) => id !== type.id,
                            ),
                          });
                        }
                      }}
                      className='mr-2'
                    />
                    <span className='text-sm text-gray-700 dark:text-gray-300'>
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sources */}
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Sources
              </label>
              <div className='grid grid-cols-2 gap-2'>
                {sources.map((source) => (
                  <label key={source.id} className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={config.sources.includes(source.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConfig({
                            ...config,
                            sources: [...config.sources, source.id],
                          });
                        } else {
                          setConfig({
                            ...config,
                            sources: config.sources.filter(
                              (id) => id !== source.id,
                            ),
                          });
                        }
                      }}
                      className='mr-2'
                    />
                    <span className='text-sm text-gray-700 dark:text-gray-300'>
                      {source.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Relevance Threshold */}
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Minimum Relevance Score:{' '}
                {Math.round(config.relevanceThreshold * 100)}%
              </label>
              <input
                type='range'
                min='0'
                max='1'
                step='0.1'
                value={config.relevanceThreshold}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    relevanceThreshold: parseFloat(e.target.value),
                  })
                }
                className='w-full'
              />
            </div>

            {/* Include Metadata */}
            <div>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={config.includeMetadata}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      includeMetadata: e.target.checked,
                    })
                  }
                  className='mr-2'
                />
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                  Include document metadata in search
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className='flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700'>
              <button
                type='button'
                onClick={onClose}
                className='rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
