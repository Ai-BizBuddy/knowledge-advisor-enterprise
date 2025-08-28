import React from "react";
import { SearchResult } from "../SearchResult";

interface SearchResultData {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  source: string;
  type: "document" | "knowledge_base" | "chat_history";
  timestamp: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface SearchResultsProps {
  results: SearchResultData[];
  loading?: boolean;
  onResultClick?: (result: SearchResultData) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading = false,
  onResultClick,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="card animate-pulse">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-5 w-5 rounded bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 rounded bg-gray-300 dark:bg-gray-600"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="card py-12 text-center">
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          No results found
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Try adjusting your search terms or filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Search Results ({results.length})
        </h2>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {results.map((result) => (
          <SearchResult
            key={result.id}
            result={result}
            onClick={() => onResultClick?.(result)}
          />
        ))}
      </div>
    </div>
  );
};
