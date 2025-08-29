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

interface DocumentSearchResult {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  fileType: string;
  fileSize: string;
  uploadDate: string;
  tags?: string[];
}

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
  const [deepSearchData, setDeepSearchData] = useState([]);
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

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return (
          <svg
            className="h-6 w-6 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "docx":
      case "doc":
        return (
          <svg
            className="h-6 w-6 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "pptx":
      case "ppt":
        return (
          <svg
            className="h-6 w-6 text-orange-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="h-6 w-6 text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
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
      {searchQuery && (
        <div className="space-y-4">
          {loading ? (
            // Loading State
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="card animate-pulse p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-6 w-6 rounded bg-gray-300 dark:bg-gray-600"></div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="h-6 w-3/4 rounded bg-gray-300 dark:bg-gray-600"></div>
                          <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                        <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700"></div>
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
          ) : searchResults.length > 0 ? (
            // Results
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Search Results ({searchResults.length})
                </h2>
              </div>
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="card cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start gap-4">
                      {/* File Icon */}
                      <div className="mt-1 flex-shrink-0">
                        {getFileIcon(result.fileType)}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-1 text-lg font-medium text-gray-900 dark:text-gray-100">
                              {result.title}
                            </h3>
                            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
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
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                {result.fileType}
                              </span>
                              <span>•</span>
                              <span>{result.fileSize}</span>
                              <span>•</span>
                              <span>
                                {new Date(
                                  result.uploadDate,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                              {Math.round(result.relevanceScore * 100)}% match
                            </div>
                          </div>
                        </div>

                        {/* Content Preview */}
                        <p className="mt-2 line-clamp-2 text-gray-600 dark:text-gray-400">
                          {result.content}
                        </p>

                        {/* Tags */}
                        {result.tags && result.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {result.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            isNoResults && (
              // No Results
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                  No documents found
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Try adjusting your search terms or upload more documents
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* Initial State */}
      {!isSearching && (
        <div className="card py-16 text-center">
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

          {/* Feature highlights */}
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                PDF Documents
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Search through PDF files
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <svg
                  className="h-6 w-6 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Word Documents
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Find content in DOCX files
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                XLS Documents
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Search Excel files
              </p>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default DeepSearchPage;
