'use client';
/**
 * useDocumentSearch Hook
 *
 * Custom React hook for document search functionality using Langflow AI and Supabase
 */

import type { Document } from '@/interfaces/Project';
import { DocumentStatus } from '@/interfaces/Project';
import type { DocumentSearchResult } from '@/services/DocumentSearchService';
import {
  getDocumentSearchAnalytics,
  searchDocuments,
  searchDocumentsInProjects
} from '@/services/Project/supabase';
import { useCallback, useState } from 'react';

// Helper function to convert search result item to Document format
const convertSearchResultToDocument = (searchResult: {
  id: string;
  title: string;
  documentType: string;
  projectId: string;
  lastModified: string;
  metadata?: Record<string, unknown>;
}): Document => {
  return {
    id: searchResult.id,
    name: searchResult.title,
    file_type: searchResult.documentType,
    status: DocumentStatus.READY,
    knowledge_base_id: searchResult.projectId,
    chunk_count: 0,
    file_size: 0,
    mime_type: '',
    updated_at: searchResult.lastModified,
    created_at: searchResult.lastModified,
    path: '',
    url: '',
    rag_status: 'synced' as const,
    last_rag_sync: searchResult.lastModified,
    uploaded_by: '', // Default empty string for search results
    metadata: searchResult.metadata,
  };
};

interface UseDocumentSearchState {
  isSearching: boolean;
  searchResults: DocumentSearchResult | null;
  searchError: string | null;
  searchHistory: SearchHistoryItem[];
  analytics: SearchAnalytics | null;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
  projectId?: string;
  sessionId?: string;
}

interface SearchAnalytics {
  searchTime: number;
  langflowResponseTime: number;
  supabaseQueryTime: number;
  totalDocumentsScanned: number;
  totalDocumentsReturned: number;
}

interface UseDocumentSearchOptions {
  enableHistory?: boolean;
  enableAnalytics?: boolean;
  maxHistoryItems?: number;
}

/**
 * Custom hook for document search functionality
 */
export function useDocumentSearch(options: UseDocumentSearchOptions = {}) {
  const {
    enableHistory = true,
    enableAnalytics = false,
    maxHistoryItems = 50,
  } = options;

  const [state, setState] = useState<UseDocumentSearchState>({
    isSearching: false,
    searchResults: null,
    searchError: null,
    searchHistory: [],
    analytics: null,
  });

  /**
   * Add item to search history
   */
  const addToHistory = useCallback(
    (
      query: string,
      resultCount: number,
      projectId?: string,
      sessionId?: string,
    ) => {
      if (!enableHistory) return;

      const historyItem: SearchHistoryItem = {
        id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        query,
        timestamp: new Date().toISOString(),
        resultCount,
        projectId,
        sessionId,
      };

      setState((prev) => ({
        ...prev,
        searchHistory: [historyItem, ...prev.searchHistory].slice(
          0,
          maxHistoryItems,
        ),
      }));
    },
    [enableHistory, maxHistoryItems],
  );

  /**
   * Search documents globally or within a specific project
   */
  const search = useCallback(
    async (
      query: string,
      projectId?: string,
    ): Promise<DocumentSearchResult> => {
      if (!query.trim()) {
        const emptyResult: DocumentSearchResult = {
          success: false,
          documents: [],
          documentIds: [],
          totalFound: 0,
          searchQuery: query,
          error: 'Search query cannot be empty',
        };
        return emptyResult;
      }

      setState((prev) => ({
        ...prev,
        isSearching: true,
        searchError: null,
        analytics: null,
      }));

      try {
        // Perform the search
        const result = await searchDocuments(query, projectId);

        // Get analytics if enabled
        let analytics: SearchAnalytics | null = null;
        if (enableAnalytics) {
          try {
            analytics = await getDocumentSearchAnalytics(query, projectId);
          } catch (analyticsError) {
                      }
        }

        setState((prev) => ({
          ...prev,
          isSearching: false,
          searchResults: result,
          searchError: result.success ? null : result.error || 'Search failed',
          analytics,
        }));

        // Add to history if successful
        if (result.success) {
          addToHistory(query, result.totalFound, projectId, result.sessionId);
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred';

        setState((prev) => ({
          ...prev,
          isSearching: false,
          searchError: errorMessage,
          searchResults: null,
        }));

        return {
          success: false,
          documents: [],
          documentIds: [],
          totalFound: 0,
          searchQuery: query,
          error: errorMessage,
        };
      }
    },
    [enableAnalytics, addToHistory],
  );

  /**
   * Search documents within a specific project
   */
  const searchInProject = useCallback(
    async (query: string, projectId: string): Promise<DocumentSearchResult> => {
      return search(query, projectId);
    },
    [search],
  );

  /**
   * Search documents across multiple projects
   */
  const searchInProjects = useCallback(
    async (
      query: string,
      projectIds: string[],
    ): Promise<DocumentSearchResult> => {
      if (!query.trim()) {
        const emptyResult: DocumentSearchResult = {
          success: false,
          documents: [],
          documentIds: [],
          totalFound: 0,
          searchQuery: query,
          error: 'Search query cannot be empty',
        };
        return emptyResult;
      }

      setState((prev) => ({
        ...prev,
        isSearching: true,
        searchError: null,
        analytics: null,
      }));

      try {
        const result = await searchDocumentsInProjects(query, projectIds);

        setState((prev) => ({
          ...prev,
          isSearching: false,
          searchResults: result,
          searchError: result.success ? null : result.error || 'Search failed',
        }));

        // Add to history if successful
        if (result.success) {
          addToHistory(query, result.totalFound, undefined, result.sessionId);
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred';

        setState((prev) => ({
          ...prev,
          isSearching: false,
          searchError: errorMessage,
          searchResults: null,
        }));

        return {
          success: false,
          documents: [],
          documentIds: [],
          totalFound: 0,
          searchQuery: query,
          error: errorMessage,
        };
      }
    },
    [addToHistory],
  );

  /**
   * Clear search results and error state
   */
  const clearSearch = useCallback(() => {
    setState((prev) => ({
      ...prev,
      searchResults: null,
      searchError: null,
      analytics: null,
    }));
  }, []);

  /**
   * Clear search history
   */
  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      searchHistory: [],
    }));
  }, []);

  /**
   * Remove specific item from search history
   */
  const removeFromHistory = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      searchHistory: prev.searchHistory.filter((item) => item.id !== id),
    }));
  }, []);

  /**
   * Get documents from current search results
   */
  const getDocuments = useCallback((): Document[] => {
    return (
      state.searchResults?.documents.map(convertSearchResultToDocument) || []
    );
  }, [state.searchResults]);

  /**
   * Get search statistics
   */
  const getSearchStats = useCallback(() => {
    const { searchHistory, searchResults } = state;

    return {
      totalSearches: searchHistory.length,
      averageResultCount:
        searchHistory.length > 0
          ? searchHistory.reduce((sum, item) => sum + item.resultCount, 0) /
            searchHistory.length
          : 0,
      lastSearchTime: searchHistory[0]?.timestamp,
      currentResultCount: searchResults?.totalFound || 0,
      currentSessionId: searchResults?.sessionId,
    };
  }, [state]);

  return {
    // State
    isSearching: state.isSearching,
    searchResults: state.searchResults,
    searchError: state.searchError,
    searchHistory: state.searchHistory,
    analytics: state.analytics,

    // Actions
    search,
    searchInProject,
    searchInProjects,
    clearSearch,
    clearHistory,
    removeFromHistory,

    // Getters
    getDocuments,
    getSearchStats,
  };
}

export default useDocumentSearch;
