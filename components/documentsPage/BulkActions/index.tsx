interface BulkActionsProps {
  selectedDocuments: number[];
  totalPages: number;
  onDelete: () => void;
  onClear: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedDocuments,
  totalPages,
  onDelete,
  onClear,
}) => {
  if (selectedDocuments.length === 0) {
    return;
    // (
    //   <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
    //     <span>💡 Tip: Use </span>
    //     <kbd className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
    //       Ctrl+A
    //     </kbd>
    //     <span> to select all documents</span>
    //   </div>
    // );
  }

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {selectedDocuments.length} document
          {selectedDocuments.length !== 1 ? "s" : ""} selected
          {totalPages > 1 && selectedDocuments.length > 0 && (
            <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
              (across all pages)
            </span>
          )}
        </span>
        <span className="text-xs text-blue-600 dark:text-blue-400">
          (Press Escape to clear)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-600 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete
        </button>
        <button
          onClick={onClear}
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
