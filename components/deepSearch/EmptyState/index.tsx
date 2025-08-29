"use client";

interface EmptyStateProps {
  type?: "no-results" | "initial";
  searchQuery?: string;
  className?: string;
}

export const EmptyState = ({
  type = "initial",
  searchQuery = "",
  className = "",
}: EmptyStateProps) => {
  if (type === "no-results") {
    return (
      <div className={`card py-12 text-center ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          No documents found
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {searchQuery
            ? `No results found for "${searchQuery}". Try adjusting your search terms.`
            : "Try adjusting your search terms or upload more documents"}
        </p>
        <div className="mt-4 text-sm text-gray-400 dark:text-gray-500">
          <p>Search tips:</p>
          <ul className="mt-2 space-y-1">
            <li>• Use specific keywords related to your content</li>
            <li>• Try different variations of your search terms</li>
            <li>• Use broader terms if your search is too specific</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={`card py-16 text-center ${className}`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900">
        <svg
          className="h-8 w-8 text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <h3 className="mt-6 text-xl font-medium text-gray-900 dark:text-gray-100">
        Search Your Documents
      </h3>
      <p className="mx-auto mt-3 max-w-md text-gray-500 dark:text-gray-400">
        Use AI-powered search to find information across all your uploaded
        documents quickly and accurately
      </p>
      <div className="mt-6 text-sm text-gray-400 dark:text-gray-500">
        <p className="font-medium">Try searching for:</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800">
            &quot;AI guidelines&quot;
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800">
            &quot;implementation&quot;
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800">
            &quot;best practices&quot;
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
