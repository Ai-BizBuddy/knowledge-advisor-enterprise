import React from "react";
import { useSorting } from "@/hooks";

interface DocumentsControlsProps {
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string) => void;
  onSortOrderToggle: () => void;
}

export const DocumentsControls: React.FC<DocumentsControlsProps> = ({
  sortBy,
  sortOrder,
  onSortChange,
  onSortOrderToggle,
}) => {
  // Get available sort fields from the sorting service
  const { availableSortFields } = useSorting();

  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            {availableSortFields.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>

          {/* Sort Order Toggle Button */}
          <button
            onClick={onSortOrderToggle}
            className="flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
          >
            {sortOrder === "asc" ? (
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
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
            ) : (
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
                  d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Sort Status Indicator */}
        <div className="hidden items-center gap-1 text-xs text-gray-500 sm:flex dark:text-gray-400">
          <span>•</span>
          <span>
            Sorted by{" "}
            {availableSortFields.find((f) => f.value === sortBy)?.label ||
              sortBy}{" "}
            ({sortOrder === "asc" ? "A-Z" : "Z-A"})
          </span>
        </div>
      </div>

      {/* Additional Controls (for future features) */}
      <div className="flex items-center gap-2">
        {/* Placeholder for future controls like view toggle, filters, etc. */}
        <div className="hidden items-center gap-2 text-xs text-gray-500 lg:flex dark:text-gray-400">
          <span>Advanced sorting</span>
        </div>
      </div>
    </div>
  );
};
