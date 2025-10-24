'use client';

import { useDocuments } from '@/hooks';
import { DeepSearchData } from '@/interfaces/DeepSearchTypes';
import type { Document as ProjectDocument } from '@/interfaces/Project';
import { DocumentService } from '@/services';
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  DocumentPreview,
  MiniDocumentPreview,
} from './deepSearch';
import DocumentDeleteModal from './documentDeleteModal';
import {
  DocumentsPagination,
  DocumentsSearch,
  DocumentsTable,
} from './documentsPage';
import { TableSkeleton } from './LoadingCard';
import { useToast } from './toast';
import UpdateDocumentModal from './updateDocument/UpdateDocumentModal';
import UploadDocument from './uploadDocuments';

// Interface that matches what DocumentsTable expects (temporarily for compatibility)
interface DocumentTableItem {
  name: string;
  size: string;
  type: string;
  date: string;
  rag_status?: string;
  status: string;
  uploadedBy: string;
  avatar: string;
  project: string[];
  source: string;
  uploadDate: string;
  chunk?: number;
  syncStatus?: string;
  lastUpdated?: string;
  disableSync?: boolean;
  error_message?: string; // Error message for error status tooltips
}

// Helper function to map rag_status to user-friendly display status
const mapRagStatusToDisplayStatus = (
  ragStatus: string | null | undefined,
): string => {
  switch (ragStatus) {
    case 'synced':
      return 'Synced';
    case 'syncing':
      return 'Syncing';
    case 'error':
      return 'Error';
    case 'not_synced':
    case null:
    case undefined:
    default:
      return 'Not Synced';
  }
};

// Adapter function to convert new Document interface to DocumentsTable-compatible format
const adaptDocumentToTableFormat = (doc: ProjectDocument): DocumentTableItem => ({
  name: (doc.metadata?.originalFileName as string) || doc.name, // Use original filename from metadata if available
  size: doc.file_size
    ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
    : 'Unknown',
  type: doc.file_type,
  date: new Date(doc.created_at).toLocaleDateString(),
  rag_status: doc.rag_status || 'not_synced',
  status: doc.status || '',
  uploadedBy: 'User', // This field doesn't exist in new interface
  avatar: '/avatars/default.png', // Default avatar
  project: [], // This field doesn't exist in new interface
  source: doc.rag_status || 'not_synced',
  uploadDate: new Date(doc.created_at).toLocaleDateString(),
  chunk: doc.chunk_count,
  syncStatus: mapRagStatusToDisplayStatus(doc.rag_status),
  lastUpdated: new Date(doc.updated_at).toLocaleDateString(),
  error_message:
    (doc?.error_message as string) ||
    (doc.status === 'error'
      ? 'An error occurred while processing this document'
      : undefined),
});

// Adapter function to convert Document to DeepSearchData format for preview components
const adaptDocumentToPreviewFormat = (doc: ProjectDocument): DeepSearchData => ({
  id: doc.id.toString(),
  name: (doc.metadata?.originalFileName as string) || doc.name,
  content: doc.content || '',
  fileType: doc.file_type,
  fileSize: doc.file_size
    ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
    : 'Unknown',
  uploadDate: new Date(doc.created_at).toLocaleDateString(),
  knowledgeName: doc.knowledge_base_id || 'Documents',
  fileUrl: doc.url,
});

interface DocumentListProps {
  knowledgeBaseId: string;
  isActive: boolean; // Only load data when this tab is active
}

const DocumentListComponent: FC<DocumentListProps> = ({
  knowledgeBaseId,
  isActive,
}) => {
  const { showToast } = useToast();

  // Document state managed internally
  const [documentState, setDocumentState] = useState({
    selectedDocumentIndex: 0,
    selectedDocuments: [] as number[],
  });

  // Modal states managed internally
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] =
    useState<DocumentTableItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  
  // Preview modal states
  const [isMiniPreviewOpen, setIsMiniPreviewOpen] = useState(false);
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);
  const [isFullScale, setIsFullScale] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DeepSearchData | null>(null);
  
  // Use the new useDocuments hook with integrated sync functionality
  // Only load data when this tab is active
  const {
    // State
    documents,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    searchTerm,
    totalItems,
    loading,
    // Sorting state (server-side)
    sortBy,
    sortOrder,

    // Sync state
    syncingDocuments,
    syncError,

    // Handlers
    handlePageChange,
    setSearchTerm,
    refresh,

    // Sync functions
    syncDocument,
    syncMultipleDocuments,
    clearSyncError,
    updateDocument,
    // Sorting handlers
    handleSort: hookHandleSort,
    createDocumentsFromFiles,
  } = useDocuments({
    knowledgeBaseId: isActive ? knowledgeBaseId : undefined, // Only provide knowledgeBaseId when active
    autoLoad: isActive, // Only auto-load when active
  });

  useEffect(() => {
    if (syncError) {
      showToast(syncError, 'error', 5000);
      clearSyncError();
    }
  }, [syncError, clearSyncError, showToast]);

  // Transform documents to DocumentsTable-compatible format
  // Add a flag to disable sync button based on document status
  const adaptedDocuments = useMemo(() => {
    return documents.map((doc) => {
      const tableDoc = adaptDocumentToTableFormat(doc);
      // Disable sync if status is 'ready', 'processing', 'archived', or rag_status is 'synced'
      tableDoc.disableSync =
        doc.status === 'ready' ||
        doc.status === 'processing' ||
        doc.status === 'archived' ||
        doc.rag_status === 'synced';
      return tableDoc;
    });
  }, [documents]);

  const zeroBasedStartIndex = useMemo(() => startIndex - 1, [startIndex]);
  const { selectedDocuments } = documentState;

  const currentPageSelectedCount = useMemo(
    () =>
      documentState.selectedDocuments.length,
    [documentState.selectedDocuments],
  );

  const isAllSelected = useMemo(
    () => currentPageSelectedCount === documents.length && documents.length > 0,
    [currentPageSelectedCount, documents.length],
  );

  const isIndeterminate = useMemo(
    () =>
      currentPageSelectedCount > 0 &&
      currentPageSelectedCount < documents.length,
    [currentPageSelectedCount, documents.length],
  );

  // Handle single document sync
  const handleDocumentSync = useCallback(
    async (pageIndex: number) => {
      try {
        // Convert page index back to actual array index
        const arrayIndex = pageIndex - zeroBasedStartIndex;
        const document = documents[arrayIndex];

        if (!document) {
          console.error('[DocumentList] Document not found for sync');
          showToast('Error: Document not found for sync', 'error');
          return;
        }

        console.log(
          `[DocumentList] Syncing document: ${document.name} (ID: ${document.id})`,
        );
        showToast(`Syncing document: ${document.name}...`, 'info', 3000);

        await syncDocument(document.id);

        console.log(
          `[DocumentList] Successfully synced document: ${document.name}`,
        );
        showToast(
          `Successfully synced document: ${document.name}`,
          'success',
          4000,
        );
      } catch (err) {
        console.error('[DocumentList] Single document sync error:', err);
        // Error is already handled by useDocuments hook and will show via syncError effect
      }
    },
    [documents, syncDocument, showToast, zeroBasedStartIndex],
  );

  // Handle bulk sync for selected documents
  const handleBulkSync = useCallback(async () => {
    try {
      if (selectedDocuments.length === 0) {
        console.warn('[DocumentList] No documents selected for sync');
        showToast('Please select documents to sync', 'warning', 3000);
        return;
      }

      const selectedDocumentIds = selectedDocuments
        .map((index) => {
          // Convert selected index back to actual array index
          const arrayIndex = index - zeroBasedStartIndex;
          return documents[arrayIndex]?.id;
        })
        .filter(Boolean);

      if (selectedDocumentIds.length === 0) {
        showToast('No valid documents selected for sync', 'warning', 3000);
        return;
      }

      console.log(
        `[DocumentList] Bulk syncing ${selectedDocumentIds.length} documents`,
      );
      showToast(
        `Starting bulk sync for ${selectedDocumentIds.length} documents...`,
        'info',
        3000,
      );

      await syncMultipleDocuments(selectedDocumentIds);

      // Clear selection after successful API calls
      setDocumentState((prev) => ({ ...prev, selectedDocuments: [] }));

      console.log(
        `[DocumentList] Successfully submitted ${selectedDocumentIds.length} documents for sync`,
      );
      showToast(
        `Successfully submitted ${selectedDocumentIds.length} documents for sync`,
        'success',
        4000,
      );
    } catch (err) {
      console.error('[DocumentList] Bulk sync error:', err);
      // Error is already handled by useDocuments hook and will show via syncError effect
    }
  }, [
    selectedDocuments,
    zeroBasedStartIndex,
    documents,
    syncMultipleDocuments,
    showToast,
  ]);

  const handleSelectDocument = useCallback(
    (pageIndex: number) => {
      console.log(`[DocumentList] Toggling selection for document at page index: ${pageIndex}`);
      setDocumentState((prev) => ({
        ...prev,
        selectedDocuments: prev.selectedDocuments.includes(pageIndex)
          ? prev.selectedDocuments.filter((i) => i !== pageIndex)
          : [...prev.selectedDocuments, pageIndex],
      }));
    },
    [],
  );

  // Handle select all documents (แก้ไขให้ select เฉพาะในหน้าปัจจุบัน)
  const handleSelectAll = useCallback(() => {
    const currentIsAllSelected =
      currentPageSelectedCount === documents.length && documents.length > 0;
    if (currentIsAllSelected) {
      setDocumentState((prev) => ({ ...prev, selectedDocuments: [] }));
    } else {
      // สร้าง actualIndex array สำหรับหน้าปัจจุบัน
      const currentPageIndices = documents.map(
        (_, pageIndex) => zeroBasedStartIndex + pageIndex,
      );
      setDocumentState((prev) => ({
        ...prev,
        selectedDocuments: currentPageIndices,
      }));
    }
  }, [currentPageSelectedCount, documents, zeroBasedStartIndex]);

  // Clear selection เมื่อเปลี่ยนหน้า
  const handlePageChangeWithClearSelection = useCallback(
    (page: number) => {
      setDocumentState((prev) => ({ ...prev, selectedDocuments: [] }));
      handlePageChange(page);
    },
    [handlePageChange],
  );

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setDocumentState((prev) => ({ ...prev, selectedDocuments: [] }));
  }, []);

  // Map UI columns to backend fields and delegate sorting to hook
  const uiToBackendMap = useMemo(
    () => ({
      name: 'name',
      lastUpdated: 'updated_at',
      status: 'status',
      type: 'file_type',
      chunk: 'chunk_count',
    } as const),
    [],
  );

  const backendToUiMap = useMemo(
    () => ({
      name: 'name',
      updated_at: 'lastUpdated',
      created_at: 'lastUpdated',
      status: 'status',
      file_type: 'type',
      chunk_count: 'chunk',
    } as const),
    [],
  );

  const onSortHeader = useCallback(
    (column: string) => {
      const key = column as keyof typeof uiToBackendMap;
      if (!uiToBackendMap[key]) return;
      const backendField = uiToBackendMap[key];
      hookHandleSort(backendField);
    },
    [hookHandleSort, uiToBackendMap],
  );

  // Handle open Update modal
  const handleDocumentEdit = useCallback(
    (pageIndex: number) => {
      // Convert page index back to actual array index
      const arrayIndex = pageIndex;
      const doc = documents[arrayIndex];
      if (!doc) {
        showToast('Error: Document not found for edit', 'error');
        return;
      }
      setEditingDocumentId(doc.id);
      setIsUpdateModalOpen(true);
    },
    [documents, showToast],
  );

  // Handle single document deletion
  const handleDocumentDelete = useCallback(
    async (pageIndex: number) => {
      try {
        const document = documents[pageIndex];
        if (!document?.id) {
          console.error('[DocumentList] Document not found for deletion');
          showToast('Error: Document not found for deletion', 'error');
          return;
        }

        console.log(
          `[DocumentList] Opening delete modal for document: ${document.name} (${document.id})`,
        );

        // Set the document to delete and open modal
        const documentItem = adaptDocumentToTableFormat(document);
        setDocumentToDelete(documentItem);
        setIsDeleteModalOpen(true);
      } catch (err) {
        console.error('[DocumentList] Error preparing document deletion:', err);
        showToast('Error preparing document deletion', 'error');
      }
    },
    [documents, showToast],
  );

  // Confirm and execute document deletion
  const handleConfirmDelete = useCallback(async () => {
    if (!documentToDelete) {
      console.error('[DocumentList] No document selected for deletion');
      return;
    }

    try {
      setIsDeleting(true);

      // Find the original document by matching the original filename from metadata
      const originalDoc = documents.find(
        (doc) => doc.metadata?.originalFileName === documentToDelete.name,
      );

      if (!originalDoc?.id) {
        throw new Error('Document not found');
      }

      console.log(
        `[DocumentList] Deleting document: ${documentToDelete.name} (${originalDoc.id})`,
      );

      // Create an instance of DocumentService and delete the document
      const documentService = new DocumentService();
      await documentService.deleteDocument(originalDoc.id);

      console.log(
        `[DocumentList] Successfully deleted document: ${documentToDelete.name}`,
      );
      showToast(
        `Document "${documentToDelete.name}" deleted successfully`,
        'success',
        4000,
      );

      // Close modal and reset state
      setIsDeleteModalOpen(false);
      setDocumentToDelete(null);

      // Refresh documents list
      refresh();
    } catch (err) {
      console.error('[DocumentList] Delete error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to delete document. Please try again.';
      showToast(errorMessage, 'error', 5000);
    } finally {
      setIsDeleting(false);
    }
  }, [documentToDelete, documents, showToast, refresh]);

  // Handle modal close
  const handleCloseDeleteModal = useCallback(() => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
      setDocumentToDelete(null);
    }
  }, [isDeleting]);

  // Convert syncingDocuments Set<string> to Set<number> for table display
  const syncingDocumentIndices = useMemo(() => {
    const indices = new Set<number>();
    documents.forEach((doc, index) => {
      if (syncingDocuments.has(doc.id)) {
        indices.add(index);
      }
    });
    return indices;
  }, [documents, syncingDocuments]);

  // Handle document click for preview
  const handleDocumentClick = useCallback(
    (absoluteIndex: number) => {
      // Convert absoluteIndex (which includes startIndex offset) to actual array index
      const arrayIndex = absoluteIndex - (startIndex - 1);
      const document = documents[arrayIndex];
      if (document) {
        const previewData = adaptDocumentToPreviewFormat(document);
        setPreviewDocument(previewData);
        setIsMiniPreviewOpen(true);
      }
    },
    [documents, startIndex],
  );

  // Preview handlers
  const handleExpandToFullScale = useCallback(() => {
    setIsMiniPreviewOpen(false);
    setIsFullPreviewOpen(true);
    setIsFullScale(true);
  }, []);

  const handleToggleFullScale = useCallback(() => {
    setIsFullScale((prev) => !prev);
  }, []);

  const handleCloseMiniPreview = useCallback(() => {
    setIsMiniPreviewOpen(false);
    setPreviewDocument(null);
  }, []);

  const handleCloseFullPreview = useCallback(() => {
    setIsFullPreviewOpen(false);
    setIsFullScale(false);
    setPreviewDocument(null);
  }, []);

  // Only render content when the tab is active
  if (!isActive) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-gray-500 dark:text-gray-400'>
          Documents will load when you select this tab.
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* Search and Actions Bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        {/* Search Section */}
        <div className='flex-1 sm:max-w-md'>
          <DocumentsSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Actions Section */}
        <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
          {documentState.selectedDocuments.length > 0 && (
            <>
              <span className='text-sm font-medium text-blue-600 dark:text-blue-400'>
                {currentPageSelectedCount} of {documents.length} selected
                (current page)
              </span>
              <button
                onClick={handleClearSelection}
                className='rounded-lg p-2 text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none dark:text-blue-400 dark:hover:bg-blue-900/20'
                aria-label='Clear selection'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={2}
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M18 6L6 18M6 6l12 12'
                  />
                </svg>
              </button>
              {/* Bulk delete button removed */}
              <button
                onClick={handleBulkSync}
                disabled={loading || syncingDocuments.size > 0}
                className='flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:px-4'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={2}
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
                  />
                </svg>
                <span className='hidden sm:inline'>
                  Sync Selected ({currentPageSelectedCount})
                </span>
                <span className='sm:hidden'>
                  Sync ({currentPageSelectedCount})
                </span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (!isUploadModalOpen) {
                setIsUploadModalOpen(true);
              }
            }}
            disabled={isUploadModalOpen}
            className='flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:px-4'
          >
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 4v16m8-8H4'
              />
            </svg>
            <span className='hidden sm:inline'>Upload Documents</span>
            <span className='sm:hidden'>Upload</span>
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
        {loading ? (
          <TableSkeleton
            rows={5}
            columns={6}
            showHeader={true}
            showActions={true}
          />
        ) : (
          <DocumentsTable
            documents={adaptedDocuments}
            selectedDocuments={documentState.selectedDocuments}
            selectedDocument={documentState.selectedDocumentIndex}
            startIndex={startIndex}
            sortBy={backendToUiMap[sortBy as keyof typeof backendToUiMap]}
            sortOrder={sortOrder}
            onSort={onSortHeader}
            onSelectAll={handleSelectAll}
            onSelectDocument={handleSelectDocument}
            onDeleteDocument={handleDocumentDelete}
            onEditDocument={handleDocumentEdit}
            onSyncDocument={handleDocumentSync}
            onDocumentClick={handleDocumentClick}
            syncingDocuments={syncingDocumentIndices}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            isOpenSync={true}
          />
        )}
      </div>

      {/* Pagination */}
      {documents.length > 0 && (
        <div>
          <DocumentsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            totalDocuments={totalItems}
            onPageChange={handlePageChangeWithClearSelection}
          />
        </div>
      )}

      {/* Upload Modal */}
      <UploadDocument
        isOpen={isUploadModalOpen}
        loading={loading}
        createDocumentsFromFiles={createDocumentsFromFiles}
        onClose={() => {
          setIsUploadModalOpen(false);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DocumentDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        documentName={documentToDelete?.name}
        loading={isDeleting}
      />

      {/* Update Document Modal */}
      <UpdateDocumentModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        knowledgeBaseId={knowledgeBaseId}
        documentId={editingDocumentId}
        onUpdate={updateDocument}
        onSuccess={async () => {
          await refresh();
        }}
      />

      {/* Preview Modals */}
      {previewDocument && (
        <>
          <MiniDocumentPreview
            document={previewDocument}
            isOpen={isMiniPreviewOpen}
            onClose={handleCloseMiniPreview}
            onExpandToFullScale={handleExpandToFullScale}
          />
          <DocumentPreview
            document={previewDocument}
            isOpen={isFullPreviewOpen}
            onClose={handleCloseFullPreview}
            isFullScale={isFullScale}
            onToggleFullScale={handleToggleFullScale}
          />
        </>
      )}
    </div>
  );
};

export const DocumentList = memo(DocumentListComponent);

export default DocumentList;
