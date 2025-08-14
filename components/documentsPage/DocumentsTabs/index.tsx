import { getTabCounts } from "@/utils/documentsUtils";
import { Document } from "@/data/documentsData";

interface DocumentsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  documents: Document[];
  onTabAction: (action: string) => void;
  loading: boolean;
}

export const DocumentsTabs: React.FC<DocumentsTabsProps> = ({
  activeTab,
  onTabChange,
  documents,
  onTabAction,
  loading,
}) => {
  const tabs = ["All", "Processed", "Processing", "Failed"];
  const tabCounts = getTabCounts(documents);

  const getStatusIndicator = (tab: string) => {
    switch (tab) {
      case "Processing":
        return (
          <div className="absolute top-0 right-0 h-2 w-2 animate-pulse rounded-full bg-yellow-400"></div>
        );
      case "Failed":
        return (
          <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></div>
        );
      case "Processed":
        return (
          <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500"></div>
        );
      default:
        return null;
    }
  };

  const getTabAction = (tab: string) => {
    switch (tab) {
      case "Failed":
        return (
          <button
            onClick={() => onTabAction("retry_failed")}
            disabled={loading}
            className="ml-4 flex items-center gap-1 rounded-md bg-yellow-500 px-2 py-1 text-xs text-white hover:bg-yellow-600 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
            ) : (
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            Retry All
          </button>
        );
      case "Processing":
        return (
          <div className="ml-4 flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
            <div className="h-3 w-3 animate-spin rounded-full border border-yellow-600 border-t-transparent dark:border-yellow-400"></div>
            Processing...
          </div>
        );
      case "Processed":
        return (
          <div className="ml-4 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Ready
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mb-4 border-b border-gray-300 dark:border-gray-700">
      {/* Mobile Layout */}
      <div className="block sm:hidden">
        <div className="mb-3 flex items-center justify-between">
          <select
            value={activeTab}
            onChange={(e) => onTabChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {tabs.map((tab) => (
              <option key={tab} value={tab}>
                {tab} ({tabCounts[tab as keyof typeof tabCounts]})
              </option>
            ))}
          </select>
          <div className="ml-3 flex items-center gap-2">
            {activeTab === "All" ||
            activeTab === "Processed" ||
            activeTab === "Processing" ? (
              <button
                onClick={() => onTabAction("refresh")}
                disabled={loading}
                className="flex items-center justify-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            ) : null}
            {activeTab === "Failed" && (
              <button
                onClick={() => onTabAction("retry_failed")}
                disabled={loading}
                className="flex items-center gap-1 rounded-md bg-yellow-500 px-3 py-2 text-xs text-white hover:bg-yellow-600 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
                ) : (
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
                <span className="xs:inline hidden">Retry</span>
              </button>
            )}
          </div>
        </div>
        {/* Mobile Status Indicator */}
        <div className="mb-3 flex items-center justify-center">
          {activeTab === "Processing" && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <div className="h-3 w-3 animate-spin rounded-full border border-yellow-600 border-t-transparent dark:border-yellow-400"></div>
              Processing...
            </div>
          )}
          {activeTab === "Processed" && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Ready
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden items-center justify-between sm:flex">
        <nav className="-mb-px flex space-x-4 lg:space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`relative border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <span className="flex items-center gap-1 lg:gap-2">
                <span className="text-xs lg:text-sm">{tab}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-semibold lg:px-2 ${
                    activeTab === tab
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {tabCounts[tab as keyof typeof tabCounts]}
                </span>
              </span>
              {getStatusIndicator(tab)}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {activeTab === "All" ||
          activeTab === "Processed" ||
          activeTab === "Processing" ? (
            <button
              onClick={() => onTabAction("refresh")}
              disabled={loading}
              className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg
                className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden lg:inline">Refresh</span>
            </button>
          ) : null}
          {getTabAction(activeTab)}
        </div>
      </div>
    </div>
  );
};
