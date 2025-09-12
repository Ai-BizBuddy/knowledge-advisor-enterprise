'use client';

import {
  DocumentDeleteModal,
  DocumentsPagination,
  DocumentsSearch,
  DocumentsTable,
  TableSkeleton,
  UploadDocument
} from '@/components';
import { useToast } from '@/components/toast';
import { Document } from '@/interfaces/Project';
import DocumentService from '@/services/DocumentService';
import React from 'react';

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
}

// Helper function to map rag_status to user-friendly display status
const mapRagStatusToDisplayStatus = (ragStatus: string | null | undefined): string => {
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
const adaptDocumentToTableFormat = (doc: Document): DocumentTableItem => ({
  name: doc.metadata?.originalFileName as string || doc.name, // Use original filename from metadata if available
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
});

interface DocumentListProps {
  // Document data and state
  documents: Document[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  searchTerm: string;
  totalItems: number;
  
  // Document state
  documentState: {
    selectedDocumentIndex: number;
    selectedDocuments: number[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  
  // Sync state
  syncingDocuments: Set<string>;
  
  // Upload modal state
  isUploadModalOpen: boolean;
  
  // Delete modal state
  isDeleteModalOpen: boolean;
  documentToDelete: DocumentTableItem | null;
  isDeleting: boolean;
  
  // Event handlers
  onPageChange: (page: number) => void;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
  onSetDocumentState: React.Dispatch<React.SetStateAction<{
    selectedDocumentIndex: number;
    selectedDocuments: number[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }>>;
  onSetUploadModalOpen: (open: boolean) => void;
  onSetDeleteModalOpen: (open: boolean) => void;
  onSetDocumentToDelete: (doc: DocumentTableItem | null) => void;
  onSetDeleting: (deleting: boolean) => void;
  onDocumentSync: (pageIndex: number) => Promise<void>;
  onBulkSync: () => Promise<void>;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  loading,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  searchTerm,
  totalItems,
  documentState,
  syncingDocuments,
  isUploadModalOpen,
  isDeleteModalOpen,
  documentToDelete,
  isDeleting,
  onPageChange,
  onSearchChange,
  onRefresh,
  onSetDocumentState,
  onSetUploadModalOpen,
  onSetDeleteModalOpen,
  onSetDocumentToDelete,
  onSetDeleting,
  onDocumentSync,
  onBulkSync,
}) => {
  const { showToast } = useToast();

  // Transform documents to DocumentsTable-compatible format
  // Add a flag to disable sync button based on document status
  const adaptedDocuments = React.useMemo(() => {
    return documents.map((doc) => {
      const tableDoc = adaptDocumentToTableFormat(doc);
      // Disable sync if status is 'ready', 'processing', 'archived', or rag_status is 'synced'
      tableDoc.disableSync = (
        doc.status === 'ready' || 
        doc.status === 'processing' || 
        doc.status === 'archived' || 
        doc.rag_status === 'synced'
      );
      return tableDoc;
    });
  }, [documents]);

  const zeroBasedStartIndex = React.useMemo(() => startIndex - 1, [startIndex]);
  
  const currentPageSelectedCount = React.useMemo(() => 
    documentState.selectedDocuments.filter(
      (index) => index >= zeroBasedStartIndex && index < zeroBasedStartIndex + documents.length,
    ).length,
    [documentState.selectedDocuments, zeroBasedStartIndex, documents.length]
  );

  const isAllSelected = React.useMemo(() =>
    currentPageSelectedCount === documents.length && documents.length > 0,
    [currentPageSelectedCount, documents.length]
  );
  
  const isIndeterminate = React.useMemo(() =>
    currentPageSelectedCount > 0 && currentPageSelectedCount < documents.length,
    [currentPageSelectedCount, documents.length]
  );

  const handleSelectDocument = React.useCallback((pageIndex: number) => {
    const actualIndex = zeroBasedStartIndex + pageIndex;
    onSetDocumentState(prev => ({
      ...prev,
      selectedDocuments: prev.selectedDocuments.includes(actualIndex)
        ? prev.selectedDocuments.filter((i) => i !== actualIndex)
        : [...prev.selectedDocuments, actualIndex]
    }));
  }, [zeroBasedStartIndex, onSetDocumentState]);

  // Handle select all documents (แก้ไขให้ select เฉพาะในหน้าปัจจุบัน)
  const handleSelectAll = React.useCallback(() => {
    const currentIsAllSelected = currentPageSelectedCount === documents.length && documents.length > 0;
    if (currentIsAllSelected) {
      onSetDocumentState(prev => ({ ...prev, selectedDocuments: [] }));
    } else {
      // สร้าง actualIndex array สำหรับหน้าปัจจุบัน
      const currentPageIndices = documents.map(
        (_, pageIndex) => zeroBasedStartIndex + pageIndex,
      );
      onSetDocumentState(prev => ({ ...prev, selectedDocuments: currentPageIndices }));
    }
  }, [currentPageSelectedCount, documents, zeroBasedStartIndex, onSetDocumentState]);

  // Clear selection เมื่อเปลี่ยนหน้า
  const handlePageChangeWithClearSelection = React.useCallback((page: number) => {
    onSetDocumentState(prev => ({ ...prev, selectedDocuments: [] })); // Clear selection เมื่อเปลี่ยนหน้า
    onPageChange(page);
  }, [onPageChange, onSetDocumentState]);

  // Handle clear selection
  const handleClearSelection = React.useCallback(() => {
    onSetDocumentState(prev => ({ ...prev, selectedDocuments: [] }));
  }, [onSetDocumentState]);

  // Handle sort
  const handleSort = React.useCallback((column: string) => {
    if (documentState.sortBy === column) {
      onSetDocumentState(prev => ({ 
        ...prev, 
        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
      }));
    } else {
      onSetDocumentState(prev => ({ 
        ...prev, 
        sortBy: column, 
        sortOrder: 'asc' 
      }));
    }
  }, [documentState.sortBy, onSetDocumentState]);

  // Handle document click
  const handleDocumentTableClick = React.useCallback((index: number) => {
    onSetDocumentState(prev => ({ ...prev, selectedDocumentIndex: index }));
    // You can add navigation logic here if needed
    // const documentId = documents[index]?.id;
    // if (documentId) {
    //   router.push(`/knowledge-base/${id}/documents/${documentId}`);
    // }
  }, [onSetDocumentState]);

  // Handle single document deletion
  const handleDocumentDelete = React.useCallback(
    async (pageIndex: number) => {
      try {
        const document = documents[pageIndex];
        if (!document?.id) {
          console.error('[DocumentList] No document ID found for deletion');
          showToast('Error: No document ID found for deletion', 'error');
          return;
        }

        console.log(`[DocumentList] Opening delete modal for document: ${document.name} (${document.id})`);
        
        // Set the document to delete and open modal
        const documentItem = adaptDocumentToTableFormat(document);
        onSetDocumentToDelete(documentItem);
        onSetDeleteModalOpen(true);
      } catch (err) {
        console.error('[DocumentList] Error preparing document deletion:', err);
        showToast('Error preparing document deletion', 'error');
      }
    },
    [documents, showToast, onSetDocumentToDelete, onSetDeleteModalOpen],
  );

  // Confirm and execute document deletion
  const handleConfirmDelete = React.useCallback(
    async () => {
      if (!documentToDelete) {
        console.error('[DocumentList] No document selected for deletion');
        return;
      }

      try {
        onSetDeleting(true);
        
        // Find the original document by matching the original filename from metadata
        const originalDoc = documents.find(
          (doc) => doc.metadata?.originalFileName === documentToDelete.name,
        );
        
        if (!originalDoc?.id) {
          throw new Error('Document not found');
        }

        console.log(`[DocumentList] Deleting document: ${documentToDelete.name} (${originalDoc.id})`);
        
        // Create an instance of DocumentService and delete the document
        const documentService = new DocumentService();
        await documentService.deleteDocument(originalDoc.id);

        console.log(`[DocumentList] Successfully deleted document: ${documentToDelete.name}`);
        showToast(`Document "${documentToDelete.name}" deleted successfully`, 'success', 4000);

        // Close modal and reset state
        onSetDeleteModalOpen(false);
        onSetDocumentToDelete(null);

        // Refresh documents list
        onRefresh();
      } catch (err) {
        console.error('[DocumentList] Delete error:', err);
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to delete document. Please try again.';
        showToast(errorMessage, 'error', 5000);
      } finally {
        onSetDeleting(false);
      }
    },
    [documentToDelete, documents, showToast, onRefresh, onSetDeleteModalOpen, onSetDocumentToDelete, onSetDeleting],
  );

  // Handle modal close
  const handleCloseDeleteModal = React.useCallback(() => {
    if (!isDeleting) {
      onSetDeleteModalOpen(false);
      onSetDocumentToDelete(null);
    }
  }, [isDeleting, onSetDeleteModalOpen, onSetDocumentToDelete]);

  // Convert syncingDocuments Set<string> to Set<number> for table display
  const syncingDocumentIndices = React.useMemo(() => {
    const indices = new Set<number>();
    documents.forEach((doc, index) => {
      if (syncingDocuments.has(doc.id)) {
        indices.add(index);
      }
    });
    return indices;
  }, [documents, syncingDocuments]);

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* Search and Actions Bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        {/* Search Section */}
        <div className='flex-1 sm:max-w-md'>
          <DocumentsSearch
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
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
              <button 
                onClick={onBulkSync}
                disabled={loading || syncingDocuments.size > 0}
                className='flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed sm:px-4'
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
                <span className='hidden sm:inline'>Sync Selected ({currentPageSelectedCount})</span>
                <span className='sm:hidden'>Sync ({currentPageSelectedCount})</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (!isUploadModalOpen) {
                onSetUploadModalOpen(true);
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
            // message='Loading documents...'
          />
        ) : (
          <DocumentsTable
            documents={adaptedDocuments}
            selectedDocuments={documentState.selectedDocuments}
            selectedDocument={documentState.selectedDocumentIndex}
            startIndex={startIndex}
            sortBy={documentState.sortBy}
            sortOrder={documentState.sortOrder}
            onSort={handleSort}
            onSelectAll={handleSelectAll}
            onSelectDocument={handleSelectDocument}
            onDocumentClick={handleDocumentTableClick}
            onDeleteDocument={handleDocumentDelete}
            onSyncDocument={onDocumentSync}
            syncingDocuments={syncingDocumentIndices}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            isOpenSync={true}
            // Pass disableSync flag for each document
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
      {isUploadModalOpen && (
        <UploadDocument
          isOpen={isUploadModalOpen}
          onClose={() => {
            onSetUploadModalOpen(false);
            // Refresh documents list to show newly uploaded files
            onRefresh();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DocumentDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        documentName={documentToDelete?.name}
        loading={isDeleting}
      />
    </div>
  );
};

export default DocumentList;
