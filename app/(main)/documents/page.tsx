"use client";
import { useEffect, useState } from "react";
import { DocumentDetail, NoDocuments, UploadDocument } from "@/components";
import { useLoading } from "@/contexts/LoadingContext";
import { useDocumentsManagement } from "@/hooks";
import {
  DocumentsHeader,
  DocumentsControls,
  DocumentsTabs,
  DocumentsSearch,
  BulkActions,
  DocumentsTable,
  DocumentsPagination,
} from "@/components";

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
    <div className="min-h-screen rounded-lg bg-gray-100 dark:bg-gray-900">
      <div className="p-4">
        <div className="mb-6 flex items-center justify-between">
          <DocumentsHeader />

          {/* Upload Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-sm font-medium">Upload Documents</span>
          </button>
        </div>

        <DocumentsControls
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSort}
          onSortOrderToggle={handleSortOrderToggle}
        />

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
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

            {/* Show NoDocuments when no documents exist or filtered documents is empty */}
            {filteredDocuments.length === 0 ? (
              <div className="mt-8 flex justify-center">
                <NoDocuments
                  activeTab={activeTab}
                  setOpenModal={setIsUploadModalOpen}
                />
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Document Detail Panel */}
          {selectedDocument !== null && filteredDocuments.length > 0 && (
            <div className="w-80 flex-shrink-0">
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                {filteredDocuments[selectedDocument] && (
                  <DocumentDetail {...filteredDocuments[selectedDocument]} />
                )}
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
