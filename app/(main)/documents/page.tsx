'use client';
import { useEffect, useState } from 'react';
import { DocumentDetail, NoDocuments, UploadDocument } from '@/components';
import { useLoading } from '@/contexts/LoadingContext';
import { useDocumentsManagement } from '@/hooks';
import {
  DocumentsHeader,
  DocumentsControls,
  DocumentsTabs,
  DocumentsSearch,
  BulkActions,
  DocumentsTable,
  DocumentsPagination,
} from '@/components';

export default function DocumentsPage() {
  const { setLoading } = useLoading();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const {
    // State
    selectedDocument,
    selectedDocuments,
    searchTerm,
    activeTab,
    sortBy,
    sortOrder,
    loading,

    // Data
    documents,
    filteredDocuments,
    paginatedDocuments,
    totalPages,
    startIndex,
    endIndex,

    // Selection states
    isAllSelected,
    isIndeterminate,

    // Handlers
    setSelectedDocument,
    setSearchTerm,
    handleSort,
    handleSortOrderToggle,
    handlePageChange,
    handleTabChange,
    handleTabAction,
    handleSelectAll,
    handleSelectDocument,
    handleDeleteDocuments,
    handleClearSelection,
  } = useDocumentsManagement();

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  return (
    <div className='min-h-screen'>
      {/* Main Container with consistent responsive padding */}
      <div className='p-4 sm:p-6 lg:p-8'>
        {/* Header Section - Responsive layout */}
        <div className='mb-6 sm:mb-8'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <DocumentsHeader />

            {/* Upload Button - Responsive sizing */}
            <button
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
              <span className='text-sm font-medium'>Upload Documents</span>
            </button>
          </div>
        </div>

        {/* Controls Section */}
        <div className='mb-6'>
          <DocumentsControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSort}
            onSortOrderToggle={handleSortOrderToggle}
          />
        </div>

        {/* Main Content Layout - Responsive grid */}
        <div className='grid grid-cols-1 gap-6 xl:grid-cols-4'>
          {/* Main Content Area */}
          <div className='space-y-6 xl:col-span-3'>
            <DocumentsTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              documents={documents}
              onTabAction={handleTabAction}
              loading={loading}
            />

            <DocumentsSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />

            <BulkActions
              selectedDocuments={selectedDocuments}
              totalPages={totalPages}
              onDelete={handleDeleteDocuments}
              onClear={handleClearSelection}
            />

            {/* Documents List or Empty State */}
            {filteredDocuments.length === 0 ? (
              <div className='mt-8 flex justify-center'>
                <NoDocuments
                  activeTab={activeTab}
                  setOpenModal={setIsUploadModalOpen}
                />
              </div>
            ) : (
              <div className='space-y-6'>
                <DocumentsTable
                  documents={paginatedDocuments}
                  selectedDocuments={selectedDocuments}
                  selectedDocument={selectedDocument}
                  startIndex={startIndex}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  onSelectAll={handleSelectAll}
                  onSelectDocument={handleSelectDocument}
                  onDocumentClick={setSelectedDocument}
                  isAllSelected={isAllSelected}
                  isIndeterminate={isIndeterminate}
                />

                <DocumentsPagination
                  currentPage={Math.floor(startIndex / 10) + 1}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalDocuments={filteredDocuments.length}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>

          {/* Document Detail Panel - Responsive sidebar */}
          {selectedDocument !== null && filteredDocuments.length > 0 && (
            <div className='xl:col-span-1'>
              <div className='sticky top-4'>
                <div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800'>
                  {filteredDocuments[selectedDocument] && (
                    <DocumentDetail {...filteredDocuments[selectedDocument]} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadDocument
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
