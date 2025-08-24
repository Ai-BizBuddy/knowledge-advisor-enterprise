"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import DocumentService from "@/services/DocumentService";
import type { Document, PaginationOptions } from "@/interfaces/Project";

// Debounce utility function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface UseAllUserDocumentsOptions {
  autoLoad?: boolean;
  itemsPerPage?: number;
}

export interface UseAllUserDocumentsReturn {
  // State
  documents: Document[];
  filteredDocuments: Document[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  itemsPerPage: number;
  searchTerm: string;
  selectedStatus: string;
  selectedType: string;

  // Tab counts
  tabCounts: {
    all: number;
    uploaded: number;
    processing: number;
    synced: number;
    error: number;
  };

  // CRUD Operations
  loadDocuments: (page?: number, forceRefresh?: boolean) => Promise<void>;
  getDocument: (id: string) => Promise<Document | null>;

  // Search and Filter
  searchDocuments: (query: string) => Promise<void>;
  filterByStatus: (status: string) => Promise<Document[]>;
  filterByType: (type: string) => Promise<Document[]>;

  // Handlers
  handleStatusChange: (status: string) => void;
  handleTypeChange: (type: string) => void;
  handlePageChange: (page: number) => void;
  handleDocumentClick: (id: string) => void;
  setSearchTerm: (term: string) => void;
  setItemsPerPage: (items: number) => void;

  // Utility Functions
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useAllUserDocuments(
  options: UseAllUserDocumentsOptions = {},
): UseAllUserDocumentsReturn {
  const { autoLoad = false, itemsPerPage: initialItemsPerPage = 10 } = options;

  // Service instance
  const documentService = useMemo(() => new DocumentService(), []);

  // Core state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Refs
  const loadingRef = useRef(false);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Computed values
  const startIndex = useMemo(
    () => (currentPage - 1) * itemsPerPage,
    [currentPage, itemsPerPage],
  );

  const endIndex = useMemo(
    () => startIndex + itemsPerPage - 1,
    [startIndex, itemsPerPage],
  );

  // Filter documents based on status and type
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (selectedStatus !== "all") {
      filtered = filtered.filter((doc) => {
        switch (selectedStatus) {
          case "uploaded":
            return doc.status === "uploaded" || doc.rag_status === "not_synced";
          case "processing":
            return doc.status === "processing" || doc.rag_status === "syncing";
          case "synced":
            return doc.rag_status === "synced";
          case "error":
            return doc.status === "error" || doc.rag_status === "error";
          default:
            return true;
        }
      });
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((doc) => doc.file_type === selectedType);
    }

    return filtered;
  }, [documents, selectedStatus, selectedType]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = {
      all: documents.length,
      uploaded: 0,
      processing: 0,
      synced: 0,
      error: 0,
    };

    documents.forEach((doc) => {
      if (doc.status === "uploaded" || doc.rag_status === "not_synced") {
        counts.uploaded++;
      }
      if (doc.status === "processing" || doc.rag_status === "syncing") {
        counts.processing++;
      }
      if (doc.rag_status === "synced") {
        counts.synced++;
      }
      if (doc.status === "error" || doc.rag_status === "error") {
        counts.error++;
      }
    });

    return counts;
  }, [documents]);

  /**
   * Load documents with pagination and filters
   */
  const loadDocuments = useCallback(
    async (page: number = currentPage, forceRefresh: boolean = false) => {
      // Prevent concurrent calls
      if (loadingRef.current && !forceRefresh) return;

      try {
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        const paginationOptions: PaginationOptions = {
          currentPage: page,
          totalPages: 0,
          startIndex: (page - 1) * itemsPerPage,
          endIndex: page * itemsPerPage - 1,
          totalItems: 0,
        };

        const filters = {
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          type: selectedType !== "all" ? selectedType : undefined,
          searchTerm: debouncedSearchTerm || undefined,
        };

        const result = await documentService.getAllUserDocuments(
          paginationOptions,
          filters,
        );

        setDocuments(result.data);
        setTotalItems(result.count);
        setTotalPages(Math.ceil(result.count / itemsPerPage));
        setCurrentPage(page);

        console.log(
          `[useAllUserDocuments] Loaded ${result.data.length} documents (Total: ${result.count})`,
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load documents";
        console.error("[useAllUserDocuments] Error loading documents:", err);
        setError(errorMessage);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [
      currentPage,
      itemsPerPage,
      selectedStatus,
      selectedType,
      debouncedSearchTerm,
      documentService,
    ],
  );

  /**
   * Search documents
   */
  const searchDocuments = useCallback(
    async (query: string) => {
      try {
        setLoading(true);
        setError(null);
        setSearchTerm(query);

        const paginationOptions: PaginationOptions = {
          currentPage: 1,
          totalPages: 0,
          startIndex: 0,
          endIndex: itemsPerPage - 1,
          totalItems: 0,
        };

        const result = await documentService.searchAllUserDocuments(
          query,
          paginationOptions,
        );

        setDocuments(result.data);
        setTotalItems(result.count);
        setTotalPages(Math.ceil(result.count / itemsPerPage));
        setCurrentPage(1);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to search documents";
        console.error("[useAllUserDocuments] Error searching documents:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage, documentService],
  );

  /**
   * Get a single document by ID
   */
  const getDocument = useCallback(
    async (id: string): Promise<Document | null> => {
      try {
        return await documentService.getUserDocument(id);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get document";
        console.error("[useAllUserDocuments] Error getting document:", err);
        setError(errorMessage);
        return null;
      }
    },
    [documentService],
  );

  /**
   * Filter documents by status
   */
  const filterByStatus = useCallback(
    async (status: string): Promise<Document[]> => {
      setSelectedStatus(status);
      await loadDocuments(1, true);
      return filteredDocuments;
    },
    [loadDocuments, filteredDocuments],
  );

  /**
   * Filter documents by type
   */
  const filterByType = useCallback(
    async (type: string): Promise<Document[]> => {
      setSelectedType(type);
      await loadDocuments(1, true);
      return filteredDocuments;
    },
    [loadDocuments, filteredDocuments],
  );

  // Event handlers
  const handleStatusChange = useCallback((status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  }, []);

  const handleTypeChange = useCallback((type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDocumentClick = useCallback((id: string) => {
    console.log("[useAllUserDocuments] Document clicked:", id);
    // This can be extended for navigation or state changes
  }, []);

  // Utility functions
  const refresh = useCallback(() => {
    return loadDocuments(currentPage, true);
  }, [loadDocuments, currentPage]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Effects
  useEffect(() => {
    if (autoLoad) {
      loadDocuments(1, true);
    }
  }, [autoLoad, loadDocuments]);

  // Reload when filters change
  useEffect(() => {
    if (
      debouncedSearchTerm !== "" ||
      selectedStatus !== "all" ||
      selectedType !== "all"
    ) {
      loadDocuments(1, true);
    }
  }, [debouncedSearchTerm, selectedStatus, selectedType, loadDocuments]);

  // Reload when itemsPerPage changes
  useEffect(() => {
    if (documents.length > 0) {
      loadDocuments(1, true);
    }
  }, [itemsPerPage, documents.length, loadDocuments]);

  return {
    // State
    documents,
    filteredDocuments,
    loading,
    error,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
    itemsPerPage,
    searchTerm,
    selectedStatus,
    selectedType,

    // Tab counts
    tabCounts,

    // CRUD Operations
    loadDocuments,
    getDocument,

    // Search and Filter
    searchDocuments,
    filterByStatus,
    filterByType,

    // Handlers
    handleStatusChange,
    handleTypeChange,
    handlePageChange,
    handleDocumentClick,
    setSearchTerm,
    setItemsPerPage,

    // Utility Functions
    refresh,
    clearError,
  };
}
