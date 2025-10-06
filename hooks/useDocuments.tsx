'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import type {
  CreateDocumentInput,
  CreateDocumentsFromFilesInput,
  CreateMultipleDocumentsInput,
  Document,
  PaginationOptions,
  UpdateDocumentInput,
} from '@/interfaces/Project';
import DocumentService from '@/services/DocumentService';
import { createApiError } from '@/utils/errorHelpers';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface UseDocumentsOptions {
  knowledgeBaseId?: string;
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

  // Document Sync State
  syncingDocuments: Set<string>;
  syncLoading: boolean;
  syncError: string | null;

  // Tab counts
  tabCounts: {
    all: number;
    uploaded: number;
    processing: number;
    ready: number;
    error: number;
    archived: number;
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

  // Document Sync Operations
  syncDocument: (documentId: string) => Promise<void>;
  syncMultipleDocuments: (documentIds: string[]) => Promise<void>;
  isSyncing: (documentId: string) => boolean;
  clearSyncError: () => void;

  // Search and Filter
  // searchDocuments: (query: string) => Promise<void>;
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
 */
export function useDocuments(options: UseDocumentsOptions): UseDocumentsReturn {
  const { knowledgeBaseId, autoLoad = true } = options;
  const router = useRouter();
  const { getAccessToken } = useAuthContext();

  console.log('[useDocuments] Hook initialized with options:', {
    knowledgeBaseId,
    autoLoad,
  });

  // Create service instance using useMemo to prevent recreation
  const documentService = useMemo(() => {
    console.log('[useDocuments] Creating DocumentService instance');
    return new DocumentService();
  }, []);

  // State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentManagementState, setDocumentManagementState] = useState({
    filteredDocuments: [] as Document[],
    loading: false,
    error: null as string | null,
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    searchTerm: '',
    selectedStatus: 'all',
    selectedType: 'all',
  });

  // Document Sync State
  const [syncingDocuments, setSyncingDocuments] = useState<Set<string>>(
    new Set(),
  );
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Extract state properties for easier access
  const {
    filteredDocuments,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    searchTerm,
    selectedStatus,
    selectedType,
  } = documentManagementState;

  const addSyncingDocument = useCallback((documentId: string) => {
    setSyncingDocuments((prev) => {
      const newSet = new Set(prev);
      newSet.add(documentId);
      return newSet;
    });
  }, []);

  const removeSyncingDocument = useCallback((documentId: string) => {
    setSyncingDocuments((prev) => {
      const newSet = new Set(prev);
      newSet.delete(documentId);
      return newSet;
    });
  }, []);

  const isSyncing = useCallback((documentId: string): boolean => {
    return syncingDocuments.has(documentId);
  }, [syncingDocuments]);

  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  // Calculate pagination indices
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Calculate tab counts
  const tabCountsData = useMemo(() => {
    const counts = {
      all: totalItems,
      uploaded: Math.floor(totalItems * 0.2),
      processing: Math.floor(totalItems * 0.1),
      ready: Math.floor(totalItems * 0.5),
      error: Math.floor(totalItems * 0.1),
      archived: Math.floor(totalItems * 0.1),
    };
    console.log(
      '📊 [useDocuments.tabCountsData] Calculated tab counts:',
      counts,
    );
    return counts;
  }, [totalItems]);

  // Add a ref to prevent multiple simultaneous API calls
  const loadingRef = useRef(false);

  /**
   * Internal load function that uses current state
   */
  const loadDocumentsInternal = useCallback(
    async (
      pageToLoad: number,
      currentState: typeof documentManagementState,
    ) => {
      if (!knowledgeBaseId) {
        console.warn(
          '⚠️ [useDocuments.loadDocuments] No knowledge base ID provided',
        );
        return;
      }

      // Prevent multiple simultaneous calls
      if (loadingRef.current) {
        console.log('⏳ [useDocuments.loadDocuments] Already loading, skipping duplicate call');
        return;
      }


      try {
        console.log('🔄 [useDocuments.loadDocuments] Starting load process');
        loadingRef.current = true;

        const paginationOptions: PaginationOptions = {
          currentPage: pageToLoad,
          totalPages: 0,
          startIndex: (pageToLoad - 1) * currentState.itemsPerPage,
          endIndex:
            (pageToLoad - 1) * currentState.itemsPerPage +
            currentState.itemsPerPage -
            1,
          totalItems: 0,
        };

        const apiFilters = {
          status:
            currentState.selectedStatus !== 'all'
              ? currentState.selectedStatus
              : undefined,
          type:
            currentState.selectedType !== 'all'
              ? currentState.selectedType
              : undefined,
        };

        console.log('🌐 [useDocuments.loadDocuments] Making API call with:', {
          paginationOptions,
          apiFilters,
        });
        
        const result = await documentService.getDocumentsByKnowledgeBase(
          knowledgeBaseId,
          paginationOptions,
          apiFilters,
        );

        // if (!mountedRef.current) return;

        console.log(
          '✅ [useDocuments.loadDocuments] API call successful, received:',
          {
            dataLength: result.data.length,
            totalCount: result.count,
          },
        );

        setDocuments(result.data);
        setDocumentManagementState((prev) => ({
          ...prev,
          filteredDocuments: result.data,
          totalItems: result.count,
          totalPages: Math.ceil(result.count / prev.itemsPerPage),
          currentPage: pageToLoad,
          loading: false,
          error: null,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load documents';
        setDocumentManagementState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      } finally {
        loadingRef.current = false;
      }
    },
    [knowledgeBaseId, documentService],
  );

  /**
   * Public load documents function
   */
  const loadDocuments = useCallback(
    async (page?: number, forceRefresh = false) => {
      console.log('[useDocuments.loadDocuments] Called with:', {
        page,
        forceRefresh,
        knowledgeBaseId,
      });

      setDocumentManagementState((prev) => {
        const pageToLoad = page ?? prev.currentPage;

        // Call internal load with current state
        loadDocumentsInternal(pageToLoad, prev);

        return { ...prev, loading: true, error: null };
      });
    },
    [knowledgeBaseId, loadDocumentsInternal],
  );

  /**
   * Create a new document
   */
  const createDocument = useCallback(
    async (data: CreateDocumentInput): Promise<Document> => {
      console.log('📝 [useDocuments.createDocument] Called with data:', data);

      try {
        // setDocumentManagementState(prev => ({ ...prev, loading: true, error: null }));

        const newDocument = await documentService.createDocument(data);
        console.log(
          '✅ [useDocuments.createDocument] Document created successfully:',
          newDocument,
        );

        // Refresh the list
        await loadDocuments(1, true);

        return newDocument;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create document';
        setDocumentManagementState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
        throw err;
      }
    },
    [loadDocuments, documentService],
  );

  /**
   * Create multiple documents
   */
  const createMultipleDocuments = useCallback(
    async (data: CreateMultipleDocumentsInput): Promise<Document[]> => {
      console.log('📝📝 [useDocuments.createMultipleDocuments] Called');

      try {
        // setDocumentManagementState(prev => ({ ...prev, loading: true, error: null }));

        const newDocuments =
          await documentService.createMultipleDocuments(data);
        console.log(
          '✅ [useDocuments.createMultipleDocuments] Documents created:',
          newDocuments.length,
        );

        await loadDocuments(1, true);
        return newDocuments;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to create multiple documents';
        setDocumentManagementState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
        throw err;
      }
    },
    [loadDocuments, documentService],
  );

  /**
   * Create documents from files
   */
  const createDocumentsFromFiles = useCallback(
    async (data: CreateDocumentsFromFilesInput): Promise<Document[]> => {
      console.log('📁📝 [useDocuments.createDocumentsFromFiles] Called');

      try {
        const newDocuments =
          await documentService.createDocumentsFromFiles(data);
        console.log(
          '✅ [useDocuments.createDocumentsFromFiles] Documents created:',
          newDocuments.length,
        );

        await loadDocuments(1, true);
        return newDocuments;
      } catch (err) {
        console.error('❌ [useDocuments.createDocumentsFromFiles] Error:', err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to create documents from files';
        setDocumentManagementState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
        throw err;
      }
    },
    [loadDocuments, documentService],
  );

  /**
   * Update document
   */
  const updateDocument = useCallback(
    async (id: string, data: UpdateDocumentInput): Promise<Document> => {
      console.log('✏️ [useDocuments.updateDocument] Called with id:', id);

      try {
        // setDocumentManagementState(prev => ({ ...prev, loading: true, error: null }));

        const updatedDocument = await documentService.updateDocument(id, data);

        // Update local state
        // setDocuments(prev => prev.map(doc => doc.id === id ? updatedDocument : doc));
        // setDocumentManagementState(prev => ({
        //   ...prev,
        //   filteredDocuments: prev.filteredDocuments.map(doc =>
        //     doc.id === id ? updatedDocument : doc
        //   ),
        //   loading: false
        // }));

        return updatedDocument;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update document';
        setDocumentManagementState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
        throw err;
      }
    },
    [documentService],
  );

  /**
   * Delete document
   */
  const deleteDocument = useCallback(
    async (id: string): Promise<void> => {
      console.log('🗑️ [useDocuments.deleteDocument] Called with id:', id);

      try {
        // setDocumentManagementState(prev => ({ ...prev, loading: true, error: null }));

        await documentService.deleteDocument(id);
        console.log('✅ [useDocuments.deleteDocument] Document deleted');

        // Update local state
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
        setDocumentManagementState((prev) => ({
          ...prev,
          filteredDocuments: prev.filteredDocuments.filter(
            (doc) => doc.id !== id,
          ),
          totalItems: Math.max(0, prev.totalItems - 1),
          loading: false,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete document';
        console.error('❌ [useDocuments.deleteDocument] Error:', err);
        setDocumentManagementState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
        throw err;
      }
    },
    [documentService],
  );

  /**
   * Get document
   */
  const getDocument = useCallback(
    async (id: string): Promise<Document | null> => {
      console.log('📄 [useDocuments.getDocument] Called with id:', id);

      try {
        const result = await documentService.getDocument(id, knowledgeBaseId);
        console.log('✅ [useDocuments.getDocument] Document retrieved');
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get document';
        setDocumentManagementState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
        return null;
      }
    },
    [knowledgeBaseId, documentService],
  );

  /**
   * Batch update
   */
  const batchUpdate = useCallback(
    async (
      ids: string[],
      updates: Partial<UpdateDocumentInput>,
    ): Promise<Document[]> => {
      console.log('🔄📝 [useDocuments.batchUpdate] Called with ids:', ids);

      try {
        setDocumentManagementState(prev => ({ ...prev, loading: true, error: null }));

        const updatedDocuments: Document[] = [];
        for (const id of ids) {
          const updated = await documentService.updateDocument(id, updates);
          updatedDocuments.push(updated);
        }

        console.log('✅ [useDocuments.batchUpdate] Batch update completed');

        // Only refresh once at the end
        await loadDocuments(currentPage, true);

        return updatedDocuments;
      } catch (err) {
        setDocumentManagementState(prev => ({ 
          ...prev, 
          error: err instanceof Error ? err.message : 'Failed to batch update documents', 
          loading: false 
        }));
        throw err;
      }
    },
    [loadDocuments, documentService, currentPage],
  );

  /**
   * Batch delete
   */
  const batchDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      console.log('🗑️🗑️ [useDocuments.batchDelete] Called with ids:', ids);

      try {
        setDocumentManagementState(prev => ({ ...prev, loading: true, error: null }));

        for (const id of ids) {
          await documentService.deleteDocument(id);
        }

        console.log('✅ [useDocuments.batchDelete] Batch delete completed');

        // Only refresh once at the end
        await loadDocuments(currentPage, true);
      } catch (err) {
        console.error('❌ [useDocuments.batchDelete] Error:', err);
        setDocumentManagementState(prev => ({ 
          ...prev, 
          error: err instanceof Error ? err.message : 'Failed to batch delete documents', 
          loading: false 
        }));
        throw err;
      }
    },
    [loadDocuments, documentService, currentPage],
  );

  /**
   * Internal sync document function without auto-refresh
   */
  const syncDocumentInternal = useCallback(
    async (documentId: string): Promise<void> => {
      try {
        addSyncingDocument(documentId);

        const token = await getAccessToken();
        if (!token) {
          throw new Error('No access token available. Please log in again.');
        }

        const ingressUrl = `${process.env.NEXT_PUBLIC_INGRESS_SERVICE}/ingress`;
        console.log(`[DocumentSync] Calling ingress API: ${ingressUrl}`);

        const response = await fetch(ingressUrl, {
          method: 'POST',
          headers: {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            documentId: documentId,
          }),
        });

        if (!response.ok) {
          const error = await createApiError(
            response,
            'Failed to sync document',
          );
          throw error;
        }

        console.log(
          `[DocumentSync] Successfully synced document: ${documentId}`,
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to sync document';
        console.error(
          `[DocumentSync] Error syncing document ${documentId}:`,
          err,
        );
        setSyncError(errorMessage);
        throw err;
      } finally {
        removeSyncingDocument(documentId);
      }
    },
    [addSyncingDocument, removeSyncingDocument, getAccessToken],
  );

  /**
   * Sync document with minimal refresh
   */
  const syncDocument = useCallback(
    async (documentId: string): Promise<void> => {
      try {
        setSyncError(null);
        await syncDocumentInternal(documentId);
        
        // Only refresh if there are no other sync operations in progress
        if (syncingDocuments.size <= 1) { // <= 1 because current document is still in set
          console.log('[DocumentSync] Refreshing documents list after sync completion');
          await loadDocuments(currentPage, true);
        }
      } catch (err) {
        // Error already handled in syncDocumentInternal
        throw err;
      }
    },
    [syncDocumentInternal, loadDocuments, currentPage, syncingDocuments.size],
  );

  /**
   * Sync multiple documents
   */
  const syncMultipleDocuments = useCallback(
    async (documentIds: string[]): Promise<void> => {
      try {
        setSyncLoading(true);
        setSyncError(null);

        // Use internal sync function to avoid multiple refreshes
        const promises = documentIds.map((id) => syncDocumentInternal(id));
        const results = await Promise.allSettled(promises);
        
        // Check if any syncs failed
        const failedSyncs = results.filter(result => result.status === 'rejected');
        if (failedSyncs.length > 0) {
          console.warn(`[DocumentSync] ${failedSyncs.length} document(s) failed to sync`);
        }
        
        // Refresh documents list once after all sync operations complete
        console.log('[DocumentSync] Refreshing documents list after bulk sync completion');
        await loadDocuments(currentPage, true);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to sync documents';
        console.error('[DocumentSync] Error syncing multiple documents:', err);
        setSyncError(errorMessage);
        throw err;
      } finally {
        setSyncLoading(false);
      }
    },
    [syncDocumentInternal, loadDocuments, currentPage],
  );

  /**
   * Filter by status - only updates state
   */
  const filterByStatus = useCallback(
    async (status: string): Promise<Document[]> => {
      console.log('🔍 [useDocuments.filterByStatus] Setting status:', status);
      setDocumentManagementState((prev) => ({
        ...prev,
        selectedStatus: status,
        currentPage: 1,
      }));
      return [];
    },
    [],
  );

  /**
   * Filter by type - only updates state
   */
  const filterByType = useCallback(
    async (type: string): Promise<Document[]> => {
      console.log('🔍 [useDocuments.filterByType] Setting type:', type);
      setDocumentManagementState(prev => ({
        ...prev,
        selectedType: type,
        currentPage: 1
      }));
      return [];
    },
    [],
  );

  // Event handlers
  const handleStatusChange = useCallback(
    (status: string) => {
      console.log(
        '🎛️ [useDocuments.handleStatusChange] Called with status:',
        status,
      );
      filterByStatus(status);
    },
    [filterByStatus],
  );

  const handleTypeChange = useCallback(
    (type: string) => {
      console.log('🎛️ [useDocuments.handleTypeChange] Called with type:', type);
      filterByType(type);
    },
    [filterByType],
  );

  const handlePageChange = useCallback((page: number) => {
    console.log('📄 [useDocuments.handlePageChange] Called with page:', page);
    setDocumentManagementState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const handleDocumentClick = useCallback(
    (id: string) => {
      console.log('👆 [useDocuments.handleDocumentClick] Called with id:', id);
      router.push(`/knowledge-base/${knowledgeBaseId}/documents/${id}`);
    },
    [router, knowledgeBaseId],
  );

  const handleDocumentDelete = useCallback(
    async (id: string) => {
      console.log('🗑️ [useDocuments.handleDocumentDelete] Called with id:', id);
      if (confirm('Are you sure you want to delete this document?')) {
        console.log(
          '✅ [useDocuments.handleDocumentDelete] User confirmed deletion',
        );
        await deleteDocument(id);
      }
    },
    [deleteDocument],
  );

  const refresh = useCallback(async () => {
    console.log('🔄 [useDocuments.refresh] Called');
    await loadDocuments(currentPage, true);
  }, [loadDocuments, currentPage]);

  const clearError = useCallback(() => {
    console.log('🧹 [useDocuments.clearError] Called');
    setDocumentManagementState(prev => ({ ...prev, error: null }));
  }, []);

  const setSearchTermHandler = useCallback((term: string) => {
    console.log(
      '🔍 [useDocuments.setSearchTermHandler] Called with term:',
      term,
    );
    setDocumentManagementState(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const setItemsPerPageHandler = useCallback((items: number) => {
    console.log(
      '📄 [useDocuments.setItemsPerPageHandler] Called with items:',
      items,
    );
    setDocumentManagementState((prev) => ({
      ...prev,
      itemsPerPage: items,
      currentPage: 1,
    }));
  }, []);

  // Create a ref to track if we've made the initial load
  const hasInitialLoadRef = useRef(false);

  // Auto-load documents when knowledgeBaseId changes (only once)
  useEffect(() => {
    if (autoLoad && knowledgeBaseId && !hasInitialLoadRef.current) {
      console.log('🔄 [useDocuments.useEffect] Initial auto-loading documents for knowledgeBaseId:', knowledgeBaseId);
      hasInitialLoadRef.current = true;
      loadDocuments(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knowledgeBaseId, autoLoad]);

  // Reset initial load flag when knowledgeBaseId changes
  useEffect(() => {
    hasInitialLoadRef.current = false;
  }, [knowledgeBaseId]);

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

    // Document Sync State
    syncingDocuments,
    syncLoading,
    syncError,

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

    // Document Sync Operations
    syncDocument,
    syncMultipleDocuments,
    isSyncing,
    clearSyncError,

    // Search and Filter
    filterByStatus,
    filterByType,

    // Handlers
    handleStatusChange,
    handleTypeChange,
    handlePageChange,
    handleDocumentClick,
    handleDocumentDelete,
    setSearchTerm: setSearchTermHandler,
    setItemsPerPage: setItemsPerPageHandler,

    // Utility Functions
    refresh,
    clearError,
  };
}

export default useDocuments;
