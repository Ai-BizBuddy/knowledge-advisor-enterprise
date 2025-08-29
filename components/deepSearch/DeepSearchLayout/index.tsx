"use client";
import { LoadingStateCard } from "../LoadingStateCard";
import { DocumentCard } from "../DocumentCard";
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
            <DocumentCard
              key={result.id}
              id={result.id}
              title={result.title}
              content={result.content}
              //   relevanceScore={result.relevanceScore}
              fileType={result.fileType}
              fileSize={result.fileSize}
              uploadDate={result.uploadDate}
              //   tags={result.tags}
              knowledgeName={result.knowledgeName}
              onClick={onResultClick}
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
  if (!isSearching) {
    return (
      <>
        {" "}
        <DocumentCard
          id="as"
          title="Document Title"
          content="Document content goes here."
          //   relevanceScore={0.8}
          fileType="pdf"
          fileSize="1.2MB"
          uploadDate={new Date().toISOString()}
          //   tags={["tag1", "tag2"]}
          knowledgeName="Rak department Base"
        />
        <EmptyState type="initial" className={className} />
      </>
    );
  }

  // Default to empty div
  return <div className={className}></div>;
};

export default DeepSearchLayout;
