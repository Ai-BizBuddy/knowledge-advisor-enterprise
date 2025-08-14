/**
 * Pagination Component
 *
 * Reusable pagination controls for tables with search and page size selection.
 */

import React from "react";
import { Button, Select, TextInput } from "flowbite-react";
import { PAGE_SIZE_OPTIONS } from "@/interfaces/Pagination";
import type { PaginationControls } from "@/interfaces/Pagination";

export interface PaginationProps extends PaginationControls {
  searchValue?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showPageSizeSelector?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  showPageSizeSelector = true,
  className = "",
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }

    // Remove duplicates
    return rangeWithDots.filter((item, index, arr) => {
      if (index === 0) return true;
      return item !== arr[index - 1];
    });
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Page Size Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {showSearch && onSearchChange && (
          <div className="w-full sm:w-80">
            <TextInput
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Show
            </span>
            <Select
              value={pageSize.toString()}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
              className="w-20"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size.toString()}>
                  {size}
                </option>
              ))}
            </Select>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              entries
            </span>
          </div>
        )}
      </div>

      {/* Pagination Info and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Info */}
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing <span className="font-medium">{startItem}</span> to{" "}
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{total}</span> results
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-1">
            {/* Previous Button */}
            <Button
              size="sm"
              color="gray"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-3 py-2"
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
            </Button>

            {/* Page Numbers */}
            {visiblePages.map((page, index) => (
              <React.Fragment key={index}>
                {page === "..." ? (
                  <span className="px-3 py-2 text-gray-500">...</span>
                ) : (
                  <Button
                    size="sm"
                    color={currentPage === page ? "blue" : "gray"}
                    onClick={() => onPageChange(page as number)}
                    className="px-3 py-2"
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}

            {/* Next Button */}
            <Button
              size="sm"
              color="gray"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-3 py-2"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
