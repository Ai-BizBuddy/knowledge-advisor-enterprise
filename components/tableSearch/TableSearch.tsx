/**
 * Table Search Component
 *
 * Reusable search and filters component that goes above tables.
 */

import React from "react";
import { Select, TextInput } from "flowbite-react";
import { PAGE_SIZE_OPTIONS } from "@/interfaces/Pagination";

export interface TableSearchProps {
  searchValue?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showPageSizeSelector?: boolean;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
  children?: React.ReactNode; // For additional filters
}

export const TableSearch: React.FC<TableSearchProps> = ({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  showPageSizeSelector = true,
  pageSize = 10,
  onPageSizeChange,
  className = "",
  children,
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        {showSearch && onSearchChange && (
          <div className="w-full sm:w-80">
            <TextInput
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
              icon={() => (
                <svg
                  className="h-4 w-4 text-gray-400"
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
              )}
            />
          </div>
        )}

        {/* Right side controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Additional filters (if provided) */}
          {children}

          {/* Page size selector */}
          {showPageSizeSelector && onPageSizeChange && (
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
      </div>
    </div>
  );
};
