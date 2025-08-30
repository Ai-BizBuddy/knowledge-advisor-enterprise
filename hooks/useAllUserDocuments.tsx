'use client';

import type { Document, PaginationOptions } from '@/interfaces/Project';
import DocumentService from '@/services/DocumentService';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

  getDocumentById: (id: string[]) => Promise<Document | null>;

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Refs
  const loadingRef = useRef(false);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Calculate pagination indices
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Filter documents based on status and type
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((doc) => {
        switch (selectedStatus) {
          case 'uploaded':
            return doc.status === 'uploaded' || doc.rag_status === 'not_synced';
          case 'processing':
            return doc.status === 'processing' || doc.rag_status === 'syncing';
          case 'synced':
            return doc.rag_status === 'synced';
          case 'error':
            return doc.status === 'error' || doc.rag_status === 'error';
          default:
            return true;
        }
      });
    }

    if (selectedType !== 'all') {
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
      if (doc.status === 'uploaded' || doc.rag_status === 'not_synced') {
        counts.uploaded++;
      }
      if (doc.status === 'processing' || doc.rag_status === 'syncing') {
        counts.processing++;
      }
      if (doc.rag_status === 'synced') {
        counts.synced++;
      }
      if (doc.status === 'error' || doc.rag_status === 'error') {
        counts.error++;
      }
    });

    return counts;
  }, [documents]);

  /**
   * Load documents with pagination and filters
   */
  const loadDocuments = useCallback(
    async (page = 1, forceRefresh = false) => {
      // Prevent redundant calls when already loading (unless forced)
      if (loadingRef.current && !forceRefresh) {
        console.log('[useAllUserDocuments] Already loading, skipping call');
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
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          type: selectedType !== 'all' ? selectedType : undefined,
          searchTerm: debouncedSearchTerm.trim() || undefined,
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
          err instanceof Error ? err.message : 'Failed to load documents';
        console.error('[useAllUserDocuments] Error loading documents:', err);
        setError(errorMessage);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [
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
          err instanceof Error ? err.message : 'Failed to search documents';
        console.error('[useAllUserDocuments] Error searching documents:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage, documentService],
  );

  const getDocumentById = useCallback(
    async (id: string[]) => {
      try {
        const documents = await documentService.getDocumentById(id);
        // Return the first document if array is not empty, else null
        if (Array.isArray(documents) && documents.length > 0) {
          return documents[0];
        }
        return null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get document';
        console.error('[useAllUserDocuments] Error getting document:', err);
        setError(errorMessage);
        return null;
      }
    },
    [documentService],
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
          err instanceof Error ? err.message : 'Failed to get document';
        console.error('[useAllUserDocuments] Error getting document:', err);
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
      setCurrentPage(1);
      // Don't call loadDocuments here - useEffect will handle it automatically
      return filteredDocuments; // Return current documents, the effect will update them
    },
    [filteredDocuments],
  );

  /**
   * Filter documents by type
   */
  const filterByType = useCallback(
    async (type: string): Promise<Document[]> => {
      setSelectedType(type);
      setCurrentPage(1);
      // Don't call loadDocuments here - useEffect will handle it automatically
      return filteredDocuments; // Return current documents, the effect will update them
    },
    [filteredDocuments],
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

  const handleDocumentClick = useCallback((id: string) => {
    console.log('[useAllUserDocuments] Document clicked:', id);
    // This can be extended for navigation or state changes
  }, []);

  //   const handleDeleteDocument = useCallback((id: string) => {
  //     console.log('[useAllUserDocuments] Document delete clicked:', id);
  //     setDocumentToDelete(id);
  //     setIsDeleteModalOpen(true);
  //   }, []);

  // Utility functions
  const refresh = useCallback(() => {
    return loadDocuments(currentPage, true);
  }, [loadDocuments, currentPage]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load on mount and when filters/pagination change
  useEffect(() => {
    if (autoLoad) {
      loadDocuments(1, true);
    }
  }, [
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
    startIndex: startIndex + 1,
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
    getDocumentById,

    // Utility Functions
    refresh,
    clearError,
  };
}
