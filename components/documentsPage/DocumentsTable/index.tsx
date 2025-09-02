import { getFileIcon } from '@/utils/documentsUtils';
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
  onSelectAll: () => void;
  onDeleteDocument: (index: number) => void;
  onSelectDocument: (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  onDocumentClick: (index: number) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

const getStatusBadge = (status: string | null | undefined) => {
  if (!status) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }

  const statusConfig = {
    Completed:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    OcrinProgress:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    Synced: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'Not Synced':
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    Syncing:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    statusConfig[status as keyof typeof statusConfig] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  );
};

const getSyncButton = (syncStatus: string = 'Synced') => {
  const issynced = syncStatus === 'Synced';
  return (
    <button
      className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors ${
        issynced
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300'
      }`}
    >
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
          d='M12 4v16m8-8H4'
        />
      </svg>
      {syncStatus}
    </button>
  );
};

export const DocumentsTable: React.FC<DocumentsTableProps> = ({
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
  isAllSelected,
  isIndeterminate,
  isOpenSync = true,
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
                onClick={() => onDocumentClick(actualIndex)}
                className={`cursor-pointer p-4 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  isCurrentDocument ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                } ${
                  isSelected
                    ? 'bg-blue-25 border-l-4 border-blue-500 dark:border-blue-400 dark:bg-blue-900/10'
                    : ''
                }`}
              >
                <div className='flex items-start space-x-3'>
                  <input
                    type='checkbox'
                    className='mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                    checked={isSelected}
                    onChange={(e) => onSelectDocument(pageIndex, e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className='text-2xl'>{getFileIcon(doc.type)}</div>
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                      {doc.name}
                    </div>
                    <div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                      {doc.size} • {(doc.type || 'Unknown').toLowerCase()}
                    </div>
                    <div className='mt-2 flex items-center justify-between'>
                      <div className='text-xs text-gray-500 dark:text-gray-400'>
                        {doc.lastUpdated || doc.date}
                      </div>
                      {isOpenSync && (
                        <div className='flex items-center space-x-2'>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(doc.syncStatus || doc.status || 'Unknown')}`}
                          >
                            {doc.syncStatus || doc.status || 'Unknown'}
                          </span>
                          {getSyncButton(doc.syncStatus)}
                        </div>
                      )}
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
                <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                  <input
                    type='checkbox'
                    className='rounded border-gray-300'
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={onSelectAll}
                  />
                </th>
                <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                  <SortableHeader column='name'>Name</SortableHeader>
                </th>
                <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                  <SortableHeader column='type'>Type</SortableHeader>
                </th>
                <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                  <SortableHeader column='status'>Status</SortableHeader>
                </th>
                <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                  <SortableHeader column='chunk'>Chunk</SortableHeader>
                </th>
                <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                  <SortableHeader column='lastUpdated'>
                    Last Updated
                  </SortableHeader>
                </th>
                {isOpenSync && (
                  <>
                    <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                      Sync
                    </th>
                    <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                      {/* Actions column */}
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
                      onClick={() => onDocumentClick(actualIndex)}
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
                      <td className='px-3 py-4 whitespace-nowrap sm:px-6'>
                        <input
                          type='checkbox'
                          className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                          checked={isSelected}
                          onChange={(e) => onSelectDocument(pageIndex, e)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className='max-w-xs truncate px-3 py-4 sm:px-6'>
                        <div className='flex items-center'>
                          <div className='mr-3 text-xl sm:text-2xl'>
                            {getFileIcon(doc.type)}
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                              {doc.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-3 py-4 text-sm whitespace-nowrap text-gray-500 sm:px-6 dark:text-gray-400'>
                        <span className='font-medium'>
                          {doc.type
                            ? doc.type.toLocaleLowerCase()
                            : 'Unknown Type'}{' '}
                          Document
                        </span>
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap sm:px-6'>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(doc.status || 'Unknown')}`}
                        >
                          {doc.status || 'Unknown'}
                        </span>
                      </td>
                      <td className='px-3 py-4 text-sm whitespace-nowrap text-gray-900 sm:px-6 dark:text-white'>
                        {doc.chunk || 0}
                      </td>
                      <td className='px-3 py-4 text-sm whitespace-nowrap text-gray-500 sm:px-6 dark:text-gray-400'>
                        {doc.lastUpdated || doc.date}
                      </td>
                      {isOpenSync && (
                        <td className='px-3 py-4 whitespace-nowrap sm:px-6'>
                          {getSyncButton(doc.syncStatus)}
                        </td>
                      )}

                      {isOpenSync && (
                        <td className='px-3 py-4 text-right text-sm font-medium whitespace-nowrap sm:px-6'>
                          <button
                            className='cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDocument(pageIndex);
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              {documents.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
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
};
