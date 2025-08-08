interface DocumentsPaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalDocuments: number;
  onPageChange: (page: number) => void;
}

export const DocumentsPagination: React.FC<DocumentsPaginationProps> = ({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalDocuments,
  onPageChange,
}) => {
  const generatePageNumbers = () => {
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      // Show first page, last page, current page, and pages around current
      const showPage =
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1);

      if (!showPage) {
        // Show ellipsis
        if (i === currentPage - 2 || i === currentPage + 2) {
          pages.push(
            <span key={i} className="px-2 text-gray-500">
              ...
            </span>,
          );
        }
        continue;
      }

      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`rounded-lg px-3 py-2 text-sm transition-colors ${
            currentPage === i
              ? "bg-blue-600 text-white"
              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          {i}
        </button>,
      );
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
          <span className="font-medium">
            {Math.min(endIndex, totalDocuments)}
          </span>{" "}
          of <span className="font-medium">{totalDocuments}</span> results
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Page {currentPage} of {totalPages}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>

        <div className="flex items-center gap-1">{generatePageNumbers()}</div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Next
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
