import { getFileIcon } from '@/utils/documentsUtils';
import React from 'react';
import type { DocumentsTableProps } from './DocumentsTable.types';
import { renderStatusBadge } from './StatusBadge';
import { SyncControl } from './SyncControl';
import { truncateDocumentName } from './utils';

export const DocumentsTable = React.memo<DocumentsTableProps>(
  ({
    documents,
    selectedDocuments,
    selectedDocument,
    startIndex,
    sortBy,
    sortOrder,
    onSort,
    onSelectAll,
    onSelectDocument,
    onDocumentClick,
    onDeleteDocument,
    onEditDocument,
    onOcrDocument,
    onPageViewDocument,
    onSyncDocument,
    isAllSelected,
    isIndeterminate,
    isOpenSync = true,
    syncingDocuments = new Set(),
  }) => {
    const getSortIcon = (column: string) => {
      if (sortBy !== column) return null;

      return (
        <svg
          className={`h-4 w-4 ${sortOrder === 'asc' ? '' : 'rotate-180'}`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 9l-7 7-7-7'
          />
        </svg>
      );
    };

    const SortableHeader = ({
      column,
      children,
    }: {
      column: string;
      children: React.ReactNode;
    }) => (
      <button
        onClick={() => onSort(column)}
        className='flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300'
      >
        {children}
        {getSortIcon(column)}
      </button>
    );

    return (
      <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800'>
        {/* Mobile Card Layout */}
        <div className='block lg:hidden'>
          <div className='divide-y divide-gray-200 dark:divide-gray-700'>
            {documents.map((doc, pageIndex) => {
              // startIndex from hook is 1-based, so convert to 0-based for calculation
              const actualIndex = startIndex - 1 + pageIndex;
              const isSelected = selectedDocuments.includes(actualIndex);
              const isCurrentDocument = selectedDocument === pageIndex;

              return (
                <div
                  key={actualIndex}
                  onClick={() => onDocumentClick?.(actualIndex)}
                  className={`cursor-pointer p-4 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    isCurrentDocument ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  } ${
                    isSelected
                      ? 'bg-blue-25 border-l-4 border-blue-500 dark:border-blue-400 dark:bg-blue-900/10'
                      : ''
                  }`}
                >
                  <div className='flex items-start space-x-3'>
                    {onSelectDocument && (
                      <input
                        type='checkbox'
                        className='mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        checked={isSelected}
                        onChange={(e) => onSelectDocument?.(actualIndex, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className='text-2xl'>{getFileIcon(doc.type)}</div>
                    <div className='min-w-0 flex-1'>
                      <div
                        className='text-sm font-medium text-gray-900 dark:text-white'
                        title={doc.name}
                      >
                        {truncateDocumentName(doc.name)}
                      </div>
                      <div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                        {doc.size} • {(doc.type || 'Unknown').toLowerCase()}
                      </div>
                      <div className='mt-2 flex items-center justify-between'>
                        <div className='text-xs text-gray-500 dark:text-gray-400'>
                          {doc.lastUpdated || doc.date}
                        </div>
                        <div className='flex items-center space-x-2'>
                          {isOpenSync && (
                            <>
                              {renderStatusBadge(doc.status, doc.error_message)}
                              <SyncControl
                                syncStatus={doc.syncStatus}
                                isLoading={syncingDocuments.has(pageIndex)}
                                onSync={() =>
                                  onSyncDocument?.(pageIndex)
                                }
                                documentStatus={doc.status}
                                disableSync={doc.disableSync}
                              />
                              <button
                                className='inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditDocument?.(pageIndex);
                                }}
                                title='Update tags'
                                aria-label='Update tags'
                              >
                                <svg
                                  className='h-4 w-4'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                  aria-hidden='true'
                                >
                                  <path
                                    stroke='currentColor'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth='2'
                                    d='M15.583 8.445h.01M10.86 19.71l-6.573-6.63a.993.993 0 0 1 0-1.4l7.329-7.394A.98.98 0 0 1 12.31 4l5.734.007A1.968 1.968 0 0 1 20 5.983v5.5a.992.992 0 0 1-.316.727l-7.44 7.5a.974.974 0 0 1-1.384.001Z'
                                  />
                                </svg>
                              </button>
                              <button
                                className='inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteDocument?.(pageIndex);
                                }}
                                title='Delete document'
                                aria-label='Delete document'
                              >
                                <svg
                                  className='h-4 w-4'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                  aria-hidden='true'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Table Layout */}
        <div className='hidden lg:block'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
              <thead className='bg-gray-50 dark:bg-gray-700'>
                <tr>
                  {onSelectDocument && (
                    <th className='w-8 px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                      <input
                        type='checkbox'
                        className='rounded border-gray-300'
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = !!isIndeterminate;
                        }}
                        onChange={onSelectAll}
                      />
                    </th>
                  )}
                  <th className='w-[45%] px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                    <SortableHeader column='name'>Name</SortableHeader>
                  </th>
                  <th className='w-[20%] px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                    <SortableHeader column='lastUpdated'>
                      Last Updated
                    </SortableHeader>
                  </th>
                  <th className='w-[10%] px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                    <SortableHeader column='status'>Status</SortableHeader>
                  </th>
                  <th className='w-[15%] px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                    <SortableHeader column='type'>Type</SortableHeader>
                  </th>
                  <th className='w-[5%] px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                    <SortableHeader column='chunk'>Chunk</SortableHeader>
                  </th>
                  {isOpenSync && (
                    <>
                      <th className='w-auto px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                        Sync
                      </th>
                      <th className='w-auto px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                        Actions
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800'>
                {documents.length > 0 &&
                  documents.map((doc, pageIndex) => {
                    // startIndex from hook is 1-based, so convert to 0-based for calculation
                    const actualIndex = startIndex - 1 + pageIndex;
                    const isSelected = selectedDocuments.includes(actualIndex);
                    const isCurrentDocument = selectedDocument === pageIndex;

                    return (
                      <tr
                        key={actualIndex}
                        onClick={() => onDocumentClick?.(actualIndex)}
                        className={`cursor-pointer transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isCurrentDocument
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : ''
                        } ${
                          isSelected
                            ? 'bg-blue-25 border-l-4 border-blue-500 dark:border-blue-400 dark:bg-blue-900/10'
                            : ''
                        }`}
                      >
                        {onSelectDocument && (
                          <td className='w-8 px-3 py-4 whitespace-nowrap sm:px-6'>
                            <input
                              type='checkbox'
                              className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                              checked={isSelected}
                              onChange={(e) => onSelectDocument(actualIndex, e)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        )}
                        <td className='w-[45%] px-3 py-4 sm:px-6'>
                          <div className='flex items-center'>
                            <div className='mr-3 text-xl sm:text-2xl'>
                              {getFileIcon(doc.type)}
                            </div>
                            <div className='min-w-0 flex-1'>
                              <div
                                className='text-sm font-medium text-gray-900 dark:text-white'
                                title={doc.name}
                              >
                                {truncateDocumentName(doc.name)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='w-[20%] px-3 py-4 text-sm whitespace-nowrap text-gray-500 sm:px-6 dark:text-gray-400'>
                          {doc.lastUpdated || doc.date}
                        </td>
                        <td className='w-[10%] px-3 py-4 whitespace-nowrap sm:px-6'>
                          {renderStatusBadge(doc.status, doc.error_message)}
                        </td>
                        <td className='w-[15%] px-3 py-4 text-sm whitespace-nowrap text-gray-500 sm:px-6 dark:text-gray-400'>
                          <span className='font-medium'>
                            {doc.type
                              ? doc.type.toLocaleLowerCase()
                              : 'Unknown Type'}{' '}
                            Document
                          </span>
                        </td>
                        <td className='w-[5%] px-3 py-4 text-sm whitespace-nowrap text-gray-900 sm:px-6 dark:text-white'>
                          {doc.chunk || 0}
                        </td>
                        {isOpenSync && (
                          <td className='px-3 py-4 whitespace-nowrap sm:px-6'>
                            <SyncControl
                              syncStatus={doc.syncStatus || ''}
                              isLoading={syncingDocuments.has(pageIndex)}
                              onSync={() =>
                                onSyncDocument?.(pageIndex)
                              }
                              documentStatus={doc.status}
                              disableSync={doc.disableSync}
                            />
                          </td>
                        )}

                        {isOpenSync && (
                          <td className='px-3 py-4 text-right text-sm font-medium whitespace-nowrap sm:px-6'>
                            <button
                              className='mr-2 inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                              onClick={(e) => {
                                e.stopPropagation();
                                onOcrDocument?.(pageIndex);
                              }}
                              title='View OCR Data'
                              aria-label='View OCR Data'
                            >
                              <svg
                                className='h-4 w-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                                aria-hidden='true'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                />
                              </svg>
                            </button>
                            <button
                              className='mr-2 inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400'
                              onClick={(e) => {
                                e.stopPropagation();
                                onPageViewDocument?.(pageIndex);
                              }}
                              title='Page Viewer'
                              aria-label='Page Viewer'
                            >
                              <svg
                                className='h-4 w-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                                aria-hidden='true'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                />
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                />
                              </svg>
                            </button>
                            <button
                              className='mr-2 inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditDocument?.(pageIndex);
                              }}
                              title='Update tags'
                              aria-label='Update tags'
                            >
                              <svg
                                className='h-4 w-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                                aria-hidden='true'
                              >
                                <path
                                  stroke='currentColor'
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth='2'
                                  d='M15.583 8.445h.01M10.86 19.71l-6.573-6.63a.993.993 0 0 1 0-1.4l7.329-7.394A.98.98 0 0 1 12.31 4l5.734.007A1.968 1.968 0 0 1 20 5.983v5.5a.992.992 0 0 1-.316.727l-7.44 7.5a.974.974 0 0 1-1.384.001Z'
                                />
                              </svg>
                            </button>
                            <button
                              className='inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteDocument?.(pageIndex);
                              }}
                              title='Delete document'
                              aria-label='Delete document'
                            >
                              <svg
                                className='h-4 w-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                                aria-hidden='true'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                />
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                {documents.length === 0 && (
                  <tr>
                    <td
                      colSpan={isOpenSync ? 8 : 6}
                      className='px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400'
                    >
                      No documents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  },
);

DocumentsTable.displayName = 'DocumentsTable';
