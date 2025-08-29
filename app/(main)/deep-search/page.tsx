"use client";
import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layouts";
import { useLoading } from "@/contexts/LoadingContext";
import { DeepSearchResult, DeepSearchService } from "@/services/DeepSearch";
import { knowledgeBaseService } from "@/services";
import {
  useAllUserDocuments,
  useDocuments,
  useDocumentsManagement,
  useKnowledgeBase,
} from "@/hooks";
import { useDeepSearch } from "@/hooks/useDeepSarch";
import { DeepSearchRes } from "@/interfaces/DocumentIngestion";
import {
  DocumentSearchResult,
  DeepSearchData,
} from "@/interfaces/DeepSearchTypes";
import { DeepSearchLayout } from "@/components/deepSearch";

const DeepSearchPage = () => {
  const { setLoading } = useLoading();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "name">(
    "relevance",
  );
  const [deepSearchData, setDeepSearchData] = useState<DeepSearchData[]>([]);
  const [isNoResults, setIsNoResults] = useState(false);
  const [loading, setLoadingState] = useState(false);

  const { getKnowledgeBaseIDs, getKnowledgeBaseByIDs } = useKnowledgeBase();
  const { executeSearch } = useDeepSearch();
  const { getDocumentById } = useAllUserDocuments();

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoadingState(true);
    setIsSearching(true);
    try {
      console.log("Searching for:", searchQuery);
      const kbId = await getKnowledgeBaseIDs().then((ids) => ids);
      const results: DeepSearchRes[] = await executeSearch({
        query: searchQuery,
        // knowledge_ids: kbId,
      });

      if (!results || results.length === 0) {
        console.log("No results found");
        return;
      }

      const documentIds = await Promise.all(
        results.map(async (res: DeepSearchRes) => res.metadata.document_id),
      );
      const KBIds = await Promise.all(
        results.map(async (res: DeepSearchRes) => res.metadata.knowledge_id),
      );
      const docRes = await getDocumentById(documentIds);
      const kbRes = await getKnowledgeBaseByIDs(KBIds);

      console.log("Raw search results:", docRes);
      console.log("Knowledge Base results:", kbRes);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
      setLoadingState(false);
    }
  };

  const handleResultClick = (result: DocumentSearchResult) => {
    console.log("Document clicked:", result);
    // In real implementation, this would open the document or navigate to document detail
  };

  return (
    <PageLayout
      title="Deep Search"
      subtitle="Search through your documents with AI-powered intelligence"
    >
      {/* Search Section */}
      <div className="card mb-6">
        <div className="space-y-4 p-4">
          {/* Main Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <svg
                className="h-5 w-5 text-gray-400"
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
            <input
              type="text"
              value={searchQuery}
              disabled={isSearching}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search through documents... (e.g., 'AI guidelines', 'implementation', 'best practices')"
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pr-20 pl-12 text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="absolute inset-y-0 right-0 flex items-center rounded-r-lg bg-blue-600 px-4 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSearching ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Search"
              )}
            </button>
          </div>

          {/* Search Options */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Upload Date</option>
                <option value="name">File Name</option>
              </select>
            </div>
            {searchQuery && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Searching in documents only
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Results */}
      <DeepSearchLayout
        searchQuery={searchQuery}
        searchResults={searchResults}
        loading={loading}
        isSearching={isSearching}
        isNoResults={isNoResults}
        onResultClick={handleResultClick}
      />
    </PageLayout>
  );
};

export default DeepSearchPage;
