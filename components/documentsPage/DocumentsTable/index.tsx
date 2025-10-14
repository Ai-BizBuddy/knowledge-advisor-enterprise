import { getFileIcon } from '@/utils/documentsUtils';
import React from 'react';
// Interface that matches the expected document structure for the table

interface DocumentTableItem {
  name: string;
  size: string;
  type: string;
  date: string;
  status: string;
  uploadedBy: string;
  avatar: string;
  project: string[];
  source: string;
  uploadDate: string;
  chunk?: number;
  syncStatus?: string;
  lastUpdated?: string;
  disableSync?: boolean;
  error_message?: string; // Error message for error status tooltips
}

interface DocumentsTableProps {
  documents: DocumentTableItem[];
  selectedDocuments: number[];
  selectedDocument: number | null;
  isOpenSync?: boolean;
  startIndex: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  onSelectAll?: () => void;
  onDeleteDocument?: (index: number) => void;
  onEditDocument?: (index: number) => void;
  onSelectDocument?: (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  onDocumentClick?: (index: number) => void;
  onSyncDocument?: (index: number) => void;
  isAllSelected?: boolean;
  isIndeterminate?: boolean;
  syncingDocuments?: Set<number>;
}

const getStatusBadge = (status: string | null | undefined) => {
  if (!status) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }

  const statusConfig = {
    // Capitalized versions (Display format)
    Uploaded: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    Processing:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    Archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    Completed:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    OcrinProgress:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Synced: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'Not Synced':
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    Syncing:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',

    // Lowercase versions (Database format)
    uploaded: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    processing:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    completed:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    synced: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    not_synced: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    'not synced':
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    syncing:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',

    // Additional status variations
    'in-progress':
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    pending:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    success:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };

  return (
    statusConfig[status as keyof typeof statusConfig] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  );
};

const isErrorStatus = (status: string | null | undefined): boolean => {
  if (!status) return false;
  const lowerStatus = status.toLowerCase();
  return lowerStatus === 'error' || lowerStatus === 'failed';
};

const renderStatusBadge = (
  status: string | null | undefined,
  errorMessage?: string,
) => {
  const statusClasses = getStatusBadge(status);
  const isError = isErrorStatus(status);
  // Only show 'Unknown' if status is truly null/undefined/empty, not for valid status strings
  const displayStatus = status && status.trim() !== '' ? status : 'Unknown';

  if (isError && errorMessage) {
    return (
      <div className='group relative inline-flex'>
        <span
          className={`inline-flex cursor-help items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses}`}
        >
          {displayStatus}
          <svg
            className='ml-1 h-3 w-3'
            fill='currentColor'
            viewBox='0 0 20 20'
            aria-hidden='true'
          >
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z'
              clipRule='evenodd'
            />
          </svg>
        </span>

        {/* Tooltip */}
        <div className='pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 max-w-xs min-w-max -translate-x-1/2 transform rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 dark:bg-gray-700'>
          <div className='mb-1 font-medium'>Error Details:</div>
          <div>{errorMessage}</div>
          {/* Tooltip arrow */}
          <div className='absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 transform bg-gray-900 dark:bg-gray-700'></div>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses}`}
    >
      {displayStatus}
    </span>
  );
};

const truncateDocumentName = (name: string, maxLength: number = 35): string => {
  if (name.length <= maxLength) {
    return name;
  }
  return name.substring(0, maxLength) + '..';
};

const getSyncButton = (
  syncStatus: string = 'Not Synced',
  isLoading: boolean = false,
  onSync?: () => void,
  documentStatus?: string,
  disableSync?: boolean,
) => {
  // Hide sync button completely if status is 'ready'
  if (documentStatus === 'ready') {
    return null;
  }

  const getStatusConfig = () => {
    // Check document status first for new status handling
    switch (documentStatus) {
      case 'processing':
        return {
          color:
            'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
          icon: (
            <svg
              className='mr-1 h-4 w-4 animate-spin'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
          ),
          text: 'Processing...',
          disabled: true,
        };
      case 'archived':
        return {
          color:
            'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
          icon: (
            <svg
              className='mr-1 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 8l6 6M5 8l6-6m6 6l-6 6m-6-6h12'
              />
            </svg>
          ),
          text: 'Archived',
          disabled: true,
        };
    }

    // Fall back to original syncStatus logic
    switch (syncStatus) {
      case 'synced':
      case 'Synced':
        return {
          color:
            'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300',
          icon: (
            <svg
              className='mr-1 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          ),
          text: 'Synced',
          disabled: true,
        };
      case 'syncing':
      case 'Syncing':
        return {
          color:
            'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
          icon: (
            <svg
              className='mr-1 h-4 w-4 animate-spin'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
          ),
          text: 'Syncing...',
          disabled: true,
        };
      case 'error':
      case 'Error':
        return {
          color:
            'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300',
          icon: (
            <svg
              className='mr-1 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          ),
          text: 'Retry',
          disabled: false,
        };
      default:
        return {
          color:
            'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300',
          icon: (
            <svg
              className='mr-1 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
          ),
          text: 'Sync',
          disabled: false,
        };
    }
  };

  const config = getStatusConfig();
  const finalDisabled = config.disabled || isLoading || disableSync;
  const showLoading =
    isLoading ||
    documentStatus === 'processing' ||
    syncStatus === 'syncing' ||
    syncStatus === 'Syncing';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (onSync && !finalDisabled) {
          onSync();
        }
      }}
      disabled={finalDisabled}
      className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors ${config.color} ${
        finalDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
    >
      {showLoading ? (
        <svg
          className='mr-1 h-4 w-4 animate-spin'
          fill='none'
          viewBox='0 0 24 24'
        >
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          />
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          />
        </svg>
      ) : (
        config.icon
      )}
      {config.text}
    </button>
  );
};

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
                        onChange={(e) => onSelectDocument?.(pageIndex, e)}
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
                              {getSyncButton(
                                doc.syncStatus,
                                syncingDocuments.has(pageIndex),
                                () => onSyncDocument?.(pageIndex),
                                doc.status,
                                doc.disableSync,
                              )}
                              <button
                                className='inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditDocument?.(pageIndex);
                                }}
                                title='Edit document'
                                aria-label='Edit document'
                              >
                                <svg
                                  className='h-4 w-4'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                  aria-hidden='true'
                                >
                                  <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-1v-2h1v2zm0-4h-1V7h1v6zm5 0h-1v-6h1v6zm0 4h-1v-2h1v2z' />
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
                            {getSyncButton(
                              doc.syncStatus,
                              syncingDocuments.has(pageIndex),
                              () => onSyncDocument?.(pageIndex),
                              doc.status,
                              doc.disableSync,
                            )}
                          </td>
                        )}

                        {isOpenSync && (
                          <td className='px-3 py-4 text-right text-sm font-medium whitespace-nowrap sm:px-6'>
                            <button
                              className='mr-2 inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditDocument?.(pageIndex);
                              }}
                              title='Edit document'
                              aria-label='Edit document'
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
