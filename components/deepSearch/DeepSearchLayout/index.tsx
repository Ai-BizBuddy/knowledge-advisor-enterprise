"use client";
import { LoadingStateCard } from "../LoadingStateCard";
import { DocumentCardWithPreview } from "../DocumentCardWithPreview";
import { EmptyState } from "../EmptyState";
import { DocumentSearchResult } from "@/interfaces/DeepSearchTypes";

interface DeepSearchLayoutProps {
  searchQuery: string;
  searchResults: DocumentSearchResult[];
  loading: boolean;
  isSearching: boolean;
  isNoResults: boolean;
  onResultClick: (result: DocumentSearchResult) => void;
  className?: string;
}

export const DeepSearchLayout = ({
  searchQuery,
  searchResults,
  loading,
  isSearching,
  isNoResults,
  onResultClick,
  className = "",
}: DeepSearchLayoutProps) => {
  // Show loading state while searching
  if (loading) {
    return <LoadingStateCard count={3} className={className} />;
  }

  // Show results if we have them
  if (searchResults.length > 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Search Results ({searchResults.length})
          </h2>
        </div>
        <div className="flex flex-col space-y-4">
          {searchResults.map((result) => (
            <DocumentCardWithPreview
              key={result.id}
              document={result}
              onClick={onResultClick}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      </div>
    );
  }

  // Show no results state if we searched but found nothing
  if (searchQuery && isNoResults) {
    return (
      <EmptyState
        type="no-results"
        searchQuery={searchQuery}
        className={className}
      />
    );
  }

  // Show initial state when no search has been performed
  if (searchQuery || !searchQuery) {
    return <EmptyState type="initial" className={className} />;
  }

  // Default to empty div
  return <div className={className}></div>;
};

export default DeepSearchLayout;
