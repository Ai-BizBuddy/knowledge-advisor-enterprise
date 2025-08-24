"use client";

import type {
  CreateDocumentInput,
  CreateDocumentsFromFilesInput,
  CreateMultipleDocumentsInput,
  Document,
  PaginationOptions,
  UpdateDocumentInput,
} from "@/interfaces/Project";
import DocumentService from "@/services/DocumentService";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

export interface UseDocumentsOptions {
  knowledgeBaseId: string;
  autoLoad?: boolean;
}

export interface UseDocumentsReturn {
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
  createDocument: (data: CreateDocumentInput) => Promise<Document>;
  createMultipleDocuments: (
    data: CreateMultipleDocumentsInput,
  ) => Promise<Document[]>;
  createDocumentsFromFiles: (
    data: CreateDocumentsFromFilesInput,
  ) => Promise<Document[]>;
  updateDocument: (id: string, data: UpdateDocumentInput) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  getDocument: (id: string) => Promise<Document | null>;

  // Batch Operations
  batchUpdate: (
    ids: string[],
    updates: Partial<UpdateDocumentInput>,
  ) => Promise<Document[]>;
  batchDelete: (ids: string[]) => Promise<void>;

  // Search and Filter
  searchDocuments: (query: string) => Promise<void>;
  filterByStatus: (status: string) => Promise<Document[]>;
  filterByType: (type: string) => Promise<Document[]>;

  // Handlers
  handleStatusChange: (status: string) => void;
  handleTypeChange: (type: string) => void;
  handlePageChange: (page: number) => void;
  handleDocumentClick: (id: string) => void;
  handleDocumentDelete: (id: string) => void;
  setSearchTerm: (term: string) => void;
  setItemsPerPage: (items: number) => void;

  // Utility Functions
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for managing documents with CRUD operations and pagination
 * Similar to useKnowledgeBase but for documents within a knowledge base
 */
export function useDocuments(options: UseDocumentsOptions): UseDocumentsReturn {
  const { knowledgeBaseId, autoLoad = true } = options;
  const router = useRouter();

  // Create service instance using useMemo to prevent recreation
  const documentService = useMemo(() => new DocumentService(), []);

  // Use ref to track loading state for preventing redundant calls
  const loadingRef = useRef(false);

  // State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Calculate pagination indices
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Calculate tab counts (estimates for now - should be from API)
  const tabCountsData = useMemo(
    () => ({
      all: totalItems,
      uploaded: Math.floor(totalItems * 0.3),
      processing: Math.floor(totalItems * 0.1),
      synced: Math.floor(totalItems * 0.5),
      error: Math.floor(totalItems * 0.1),
    }),
    [totalItems],
  );

  /**
   * Load documents with pagination and filters
   */
  const loadDocuments = useCallback(
    async (page = 1, forceRefresh = false) => {
      if (!knowledgeBaseId) {
        console.warn("[useDocuments] No knowledge base ID provided");
        return;
      }

      // Prevent redundant calls when already loading (unless forced)
      if (loadingRef.current && !forceRefresh) {
        console.log("[useDocuments] Already loading, skipping call");
        return;
      }

      try {
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        const paginationOptions: PaginationOptions = {
          currentPage: page,
          totalPages: 0,
          startIndex: (page - 1) * itemsPerPage,
          endIndex: (page - 1) * itemsPerPage + itemsPerPage - 1,
          totalItems: 0,
        };

        const filters = {
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          type: selectedType !== "all" ? selectedType : undefined,
          searchTerm: debouncedSearchTerm.trim() || undefined,
        };

        const result = await documentService.getDocumentsByKnowledgeBase(
          knowledgeBaseId,
          paginationOptions,
          filters,
        );

        setDocuments(result.data);
        setFilteredDocuments(result.data);
        setTotalItems(result.count);
        setTotalPages(Math.ceil(result.count / itemsPerPage));
        setCurrentPage(page);

        console.log(
          `[useDocuments] Loaded ${result.data.length} documents (Total: ${result.count})`,
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load documents";
        console.error("[useDocuments] Error loading documents:", err);
        setError(errorMessage);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [
      knowledgeBaseId,
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
      if (!knowledgeBaseId) return;

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

        const result = await documentService.searchDocuments(
          knowledgeBaseId,
          query,
          paginationOptions,
        );

        setDocuments(result.data);
        setFilteredDocuments(result.data);
        setTotalItems(result.count);
        setTotalPages(Math.ceil(result.count / itemsPerPage));
        setCurrentPage(1);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to search documents";
        console.error("[useDocuments] Error searching documents:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [knowledgeBaseId, itemsPerPage, documentService],
  );

  /**
   * Create a new document
   */
  const createDocument = useCallback(
    async (data: CreateDocumentInput): Promise<Document> => {
      try {
        setLoading(true);
        setError(null);

        const newDocument = await documentService.createDocument(data);

        // Refresh the list to include the new document
        await loadDocuments(currentPage, true);

        return newDocument;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create document";
        console.error("[useDocuments] Error creating document:", err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadDocuments, currentPage, documentService],
  );

  /**
   * Create multiple documents in batch
   */
  const createMultipleDocuments = useCallback(
    async (data: CreateMultipleDocumentsInput): Promise<Document[]> => {
      try {
        setLoading(true);
        setError(null);

        const newDocuments =
          await documentService.createMultipleDocuments(data);

        // Refresh the list to include all new documents
        await loadDocuments(currentPage, true);

        return newDocuments;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create multiple documents";
        console.error("[useDocuments] Error creating multiple documents:", err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadDocuments, currentPage, documentService],
  );

  /**
   * Create multiple documents from File objects
   */
  const createDocumentsFromFiles = useCallback(
    async (data: CreateDocumentsFromFilesInput): Promise<Document[]> => {
      try {
        setLoading(true);
        setError(null);

        const newDocuments =
          await documentService.createDocumentsFromFiles(data);

        // Refresh the list to include all new documents
        await loadDocuments(currentPage, true);

        return newDocuments;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create documents from files";
        console.error(
          "[useDocuments] Error creating documents from files:",
          err,
        );
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadDocuments, currentPage, documentService],
  );

  /**
   * Update an existing document
   */
  const updateDocument = useCallback(
    async (id: string, data: UpdateDocumentInput): Promise<Document> => {
      try {
        setLoading(true);
        setError(null);

        const updatedDocument = await documentService.updateDocument(id, data);

        // Update the document in the current list
        setDocuments((prev) =>
          prev.map((doc) => (doc.id === id ? updatedDocument : doc)),
        );
        setFilteredDocuments((prev) =>
          prev.map((doc) => (doc.id === id ? updatedDocument : doc)),
        );

        return updatedDocument;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update document";
        console.error("[useDocuments] Error updating document:", err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [documentService],
  );

  /**
   * Delete a document
   */
  const deleteDocument = useCallback(
    async (id: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        await documentService.deleteDocument(id);

        // Remove the document from the current list
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
        setFilteredDocuments((prev) => prev.filter((doc) => doc.id !== id));
        setTotalItems((prev) => prev - 1);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete document";
        console.error("[useDocuments] Error deleting document:", err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [documentService],
  );

  /**
   * Get a specific document
   */
  const getDocument = useCallback(
    async (id: string): Promise<Document | null> => {
      try {
        return await documentService.getDocument(id, knowledgeBaseId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get document";
        console.error("[useDocuments] Error getting document:", err);
        setError(errorMessage);
        return null;
      }
    },
    [knowledgeBaseId, documentService],
  );

  /**
   * Batch update documents
   */
  const batchUpdate = useCallback(
    async (
      ids: string[],
      updates: Partial<UpdateDocumentInput>,
    ): Promise<Document[]> => {
      try {
        setLoading(true);
        setError(null);

        const updatedDocuments: Document[] = [];

        for (const id of ids) {
          const updated = await documentService.updateDocument(id, updates);
          updatedDocuments.push(updated);
        }

        // Refresh the list
        await loadDocuments(currentPage, true);

        return updatedDocuments;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to batch update documents";
        console.error("[useDocuments] Error batch updating documents:", err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadDocuments, currentPage, documentService],
  );

  /**
   * Batch delete documents
   */
  const batchDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        for (const id of ids) {
          await documentService.deleteDocument(id);
        }

        // Refresh the list
        await loadDocuments(currentPage, true);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to batch delete documents";
        console.error("[useDocuments] Error batch deleting documents:", err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadDocuments, currentPage, documentService],
  );

  /**
   * Filter by status
   */
  const filterByStatus = useCallback(
    async (status: string): Promise<Document[]> => {
      setSelectedStatus(status);
      setCurrentPage(1);
      // Don't call loadDocuments here - useEffect will handle it automatically
      return documents; // Return current documents, the effect will update them
    },
    [documents],
  );

  /**
   * Filter by type
   */
  const filterByType = useCallback(
    async (type: string): Promise<Document[]> => {
      setSelectedType(type);
      setCurrentPage(1);
      // Don't call loadDocuments here - useEffect will handle it automatically
      return documents; // Return current documents, the effect will update them
    },
    [documents],
  );

  // Event handlers
  const handleStatusChange = useCallback(
    (status: string) => {
      filterByStatus(status);
    },
    [filterByStatus],
  );

  const handleTypeChange = useCallback(
    (type: string) => {
      filterByType(type);
    },
    [filterByType],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      loadDocuments(page);
    },
    [loadDocuments],
  );

  const handleDocumentClick = useCallback(
    (id: string) => {
      router.push(`/knowledge-base/${knowledgeBaseId}/documents/${id}`);
    },
    [router, knowledgeBaseId],
  );

  const handleDocumentDelete = useCallback(
    async (id: string) => {
      if (confirm("Are you sure you want to delete this document?")) {
        await deleteDocument(id);
      }
    },
    [deleteDocument],
  );

  const refresh = useCallback(async () => {
    await loadDocuments(currentPage, true);
  }, [loadDocuments, currentPage]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load on mount and when filters/pagination change
  useEffect(() => {
    if (autoLoad && knowledgeBaseId) {
      loadDocuments(1, true);
    }
  }, [
    knowledgeBaseId,
    autoLoad,
    selectedStatus,
    selectedType,
    debouncedSearchTerm, // Use debounced search term
    itemsPerPage,
    loadDocuments,
  ]);

  return {
    // State
    documents,
    filteredDocuments,
    loading,
    error,
    currentPage,
    totalPages,
    startIndex: startIndex + 1, // Convert to 1-based for display
    endIndex,
    totalItems,
    itemsPerPage,
    searchTerm,
    selectedStatus,
    selectedType,

    // Tab counts
    tabCounts: tabCountsData,

    // CRUD Operations
    loadDocuments,
    createDocument,
    createMultipleDocuments,
    createDocumentsFromFiles,
    updateDocument,
    deleteDocument,
    getDocument,

    // Batch Operations
    batchUpdate,
    batchDelete,

    // Search and Filter
    searchDocuments,
    filterByStatus,
    filterByType,

    // Handlers
    handleStatusChange,
    handleTypeChange,
    handlePageChange,
    handleDocumentClick,
    handleDocumentDelete,
    setSearchTerm,
    setItemsPerPage,

    // Utility Functions
    refresh,
    clearError,
  };
}

export default useDocuments;
