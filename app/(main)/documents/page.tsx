'use client';
import {
  BulkActions,
  DeleteConfirmModal,
  DocumentDetail,
  DocumentsControls,
  DocumentsHeader,
  DocumentsPagination,
  DocumentsSearch,
  DocumentsTable,
  NoDocuments,
  TableSkeleton,
  UploadDocument,
} from '@/components';
import { useLoading } from '@/contexts/LoadingContext';
import {
  useAllUserDocuments,
  useDocumentsManagement,
  useSorting,
} from '@/hooks';
import { Document } from '@/interfaces/Project';
import DocumentService from '@/services/DocumentService';
import { useEffect, useMemo, useState } from 'react';

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
}

// Adapter function to convert new Document interface to DocumentsTable-compatible format
const adaptDocumentToTableFormat = (doc: Document): DocumentTableItem => ({
  name: doc.name,
  size: doc.file_size
    ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
    : 'Unknown',
  type: doc.file_type,
  date: new Date(doc.created_at).toLocaleDateString(),
  rag_status: doc.rag_status || 'not_synced',
  status: doc.rag_status || '',
  uploadedBy: 'User', // This field doesn't exist in new interface
  avatar: '/avatars/default.png', // Default avatar
  project: [], // This field doesn't exist in new interface
  source: doc.rag_status || 'not_synced',
  uploadDate: new Date(doc.created_at).toLocaleDateString(),
  chunk: doc.chunk_count,
  syncStatus: doc.rag_status === 'synced' ? 'Synced' : 'Not Synced',
  lastUpdated: new Date(doc.updated_at).toLocaleDateString(),
});

export default function DocumentsPage() {
  const { setLoading } = useLoading();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [optionBulkDelete, setOptionBulkDelete] = useState(false);
  const [documentToDelete, setDocumentToDelete] =
    useState<DocumentTableItem | null>(null);

  // Document service instance
  const [documentService] = useState(() => new DocumentService());

  // Use sorting hook for enhanced sorting functionality
  const {
    sortBy: sortField,
    sortOrder,
    handleSort: handleSortChange,
    handleSortOrderToggle,
    sortDocuments,
  } = useSorting({
    initialSortField: 'date',
    initialSortOrder: 'desc',
  });

  // User documents from hook - auto-load enabled for all user documents
  const {
    totalPages,
    startIndex,
    endIndex,
    currentPage,
    totalItems,
    itemsPerPage,
    loading,
    documents: rawDocuments,
    filteredDocuments: userFilteredDocuments,
    refresh,
    searchTerm,
    setSearchTerm,
    setItemsPerPage,
    handlePageChange,
  } = useAllUserDocuments({
    autoLoad: true,
  });

  // Sort the documents using the SortingService
  const documents = useMemo(() => {
    return sortDocuments(rawDocuments);
  }, [rawDocuments, sortDocuments]);

  // Wrapper function to handle string to SortField conversion
  const handleSortByString = (sortBy: string) => {
    handleSortChange(
      sortBy as
        | 'name'
        | 'date'
        | 'size'
        | 'type'
        | 'uploadedBy'
        | 'status'
        | 'chunk'
        | 'lastUpdated',
    );
  };

  // Create a wrapper for page change that also resets selected document
  const handlePageChangeWithReset = (page: number) => {
    setSelectedDocument(null); // Reset selected document when page changes
    setSelectedDocuments([]); // Reset selected documents when page changes
    handlePageChange(page);
  };

  const {
    // State
    selectedDocument,
    selectedDocuments,
    activeTab,

    // Handlers
    setSelectedDocument,
    setSelectedDocuments,
    handleClearSelection,
  } = useDocumentsManagement();

  // Create wrapper functions for selection that use correct startIndex (0-based)
  const handleSelectAllWithCorrectIndex = () => {
    const correctStartIndex = startIndex - 1; // Convert from 1-based to 0-based
    const currentPageIndices = documents.map(
      (_, index) => correctStartIndex + index,
    );

    if (
      selectedDocuments.length === currentPageIndices.length &&
      currentPageIndices.every((index) => selectedDocuments.includes(index))
    ) {
      const filteredSelection = selectedDocuments.filter(
        (index) => !currentPageIndices.includes(index),
      );
      setSelectedDocuments(filteredSelection);
    } else {
      const newSelection = [
        ...new Set([...selectedDocuments, ...currentPageIndices]),
      ];
      setSelectedDocuments(newSelection);
    }
  };

  const handleSelectDocumentWithCorrectIndex = (
    pageIndex: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.stopPropagation();
    const correctStartIndex = startIndex - 1; // Convert from 1-based to 0-based
    const actualIndex = correctStartIndex + pageIndex;

    if (selectedDocuments.includes(actualIndex)) {
      setSelectedDocuments(selectedDocuments.filter((i) => i !== actualIndex));
    } else {
      setSelectedDocuments([...selectedDocuments, actualIndex]);
    }
  };

  // Calculate selection states for current page
  const correctStartIndex = startIndex - 1; // Convert from 1-based to 0-based
  const currentPageIndices = documents.map(
    (_, index) => correctStartIndex + index,
  );
  const selectedInCurrentPage = selectedDocuments.filter((index) =>
    currentPageIndices.includes(index),
  );

  const isAllSelectedCorrected =
    currentPageIndices.length > 0 &&
    selectedInCurrentPage.length === currentPageIndices.length;
  const isIndeterminateCorrected =
    selectedInCurrentPage.length > 0 &&
    selectedInCurrentPage.length < currentPageIndices.length;

  // Handle document click for detail view
  const handleDocumentClick = (absoluteIndex: number) => {
    // Convert absolute index to page-relative index for display
    // Note: startIndex from hook is 1-based, absoluteIndex is 0-based
    const pageRelativeIndex = absoluteIndex - (startIndex - 1);
    setSelectedDocument(pageRelativeIndex);
  };

  const adaptedDocuments = documents.map((doc: Document) =>
    adaptDocumentToTableFormat(doc),
  );

  // Delete functions
  const handleSingleDocumentDelete = async (
    documentItem: DocumentTableItem,
  ) => {
    try {
      setLoading(true);
      // Find the original document by name to get the ID
      const originalDoc = documents.find(
        (doc) => doc.name === documentItem.name,
      );
      if (!originalDoc) {
        throw new Error('Document not found');
      }

      await documentService.deleteDocument(originalDoc.id);

      // Close modal and refresh data
      setIsDeleteModalOpen(false);
      setDocumentToDelete(null);

      // Refresh documents using hook's refresh function
      await refresh();
    } catch (error) {
      console.error('[DocumentsPage] Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDocumentDelete = async (selectedIndices: number[]) => {
    try {
      setLoading(true);

      // selectedIndices are absolute indices from the filteredDocuments
      // But we need to map them to the actual documents array
      const documentIds: string[] = [];
      selectedIndices.forEach((absoluteIndex) => {
        // Find the document from userFilteredDocuments
        const documentAtIndex = userFilteredDocuments[absoluteIndex];
        if (documentAtIndex?.id) {
          documentIds.push(documentAtIndex.id);
        }
      });

      if (documentIds.length === 0) {
        throw new Error('No valid documents selected for deletion');
      }

      // Delete each document
      for (const id of documentIds) {
        await documentService.deleteDocument(id);
      }

      // Clear selection and refresh
      handleClearSelection();

      // Refresh documents using hook's refresh function
      await refresh();
    } catch (error) {
      console.error('[DocumentsPage] Error deleting documents:', error);
      alert('Failed to delete documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Use loading from useAllUserDocuments instead of setting it manually
    setLoading(loading);
  }, [loading, setLoading]);

  // Reset selected document when search term changes
  useEffect(() => {
    setSelectedDocument(null);
    setSelectedDocuments([]); // Reset selected documents when search changes
  }, [searchTerm, setSelectedDocument, setSelectedDocuments]);

  return (
    <div className='min-h-screen'>
      {/* Main Container with consistent responsive padding */}
      <div className='p-4 sm:p-6 lg:p-8'>
        {/* Header Section - Responsive layout */}
        <div className='mb-6 sm:mb-8'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <DocumentsHeader />

            {/* Upload Button - Responsive sizing */}
            {/* <button
              onClick={() => setIsUploadModalOpen(true)}
              className='flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:w-auto'
            >
              <svg
                className='h-4 w-4 flex-shrink-0'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                />
              </svg>
              <span className="text-sm font-medium">Upload Documents</span>
            </button> */}
          </div>
        </div>

        {/* Controls Section */}
        <div className='mb-6'>
          <DocumentsControls
            sortBy={sortField}
            sortOrder={sortOrder}
            onSortChange={handleSortByString}
            onSortOrderToggle={handleSortOrderToggle}
          />
        </div>

        {/* Main Content Layout - Responsive grid */}
        <div className='grid grid-cols-1 gap-6 xl:grid-cols-4'>
          {/* Main Content Area */}
          <div className='space-y-6 xl:col-span-3'>
            {/* <DocumentsTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              documents={adaptedDocuments}
              onTabAction={handleTabAction}
              loading={loading}
            /> */}

            <DocumentsSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />

            <BulkActions
              selectedDocuments={selectedDocuments}
              totalPages={totalPages}
              onDelete={() => {
                setIsDeleteModalOpen(true);
                setOptionBulkDelete(true);
              }}
              onClear={handleClearSelection}
            />

            {/* Documents List or Empty State */}
            {totalItems === 0 ? (
              <div className='mt-8 flex justify-center'>
                <NoDocuments
                  activeTab={activeTab}
                  setOpenModal={setIsUploadModalOpen}
                />
              </div>
            ) : loading ? (
              <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800'>
                <TableSkeleton
                  rows={5}
                  columns={6}
                  showHeader={true}
                  showActions={true}
                  message='Loading documents...'
                />
              </div>
            ) : (
              <div className='space-y-6'>
                <DocumentsTable
                  documents={adaptedDocuments}
                  selectedDocuments={selectedDocuments}
                  selectedDocument={selectedDocument}
                  startIndex={startIndex}
                  onDeleteDocument={(dataIndex: number) => {
                    const document = adaptedDocuments[dataIndex];
                    console.log(
                      '[DocumentsPage] Delete document clicked:',
                      document,
                    );

                    setDocumentToDelete(document);
                    setIsDeleteModalOpen(true);
                  }}
                  sortBy={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSortByString}
                  onSelectAll={handleSelectAllWithCorrectIndex}
                  onSelectDocument={handleSelectDocumentWithCorrectIndex}
                  onDocumentClick={handleDocumentClick}
                  isAllSelected={isAllSelectedCorrected}
                  isIndeterminate={isIndeterminateCorrected}
                />

                <DocumentsPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalDocuments={totalItems}
                  itemsPerPage={itemsPerPage}
                  loading={loading}
                  onPageChange={handlePageChangeWithReset}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            )}
          </div>

          {/* Document Detail Panel - Responsive sidebar */}
          {selectedDocument !== null &&
            selectedDocument >= 0 &&
            selectedDocument < adaptedDocuments.length &&
            adaptedDocuments.length > 0 && (
              <div className='xl:col-span-1'>
                <div className='sticky top-4'>
                  <div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800'>
                    <DocumentDetail {...adaptedDocuments[selectedDocument]} />
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setOptionBulkDelete(false);
        }}
        onConfirm={async () => {
          if (documentToDelete) {
            console.log(
              '[DocumentsPage] Confirm delete document:',
              documentToDelete,
            );
            if (optionBulkDelete) {
              await handleBulkDocumentDelete(selectedDocuments);
            } else {
              await handleSingleDocumentDelete(documentToDelete);
            }

            setIsDeleteModalOpen(false);
            setOptionBulkDelete(false);
          }
        }}
      />

      {/* Upload Modal */}
      <UploadDocument
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
