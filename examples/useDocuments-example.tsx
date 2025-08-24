/**
 * Example Usage of useDocuments Hook
 *
 * This file demonstrates how to use the useDocuments hook for managing
 * documents within a knowledge base with full CRUD operations and pagination.
 */

"use client";

import { useDocuments } from "@/hooks";
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "@/interfaces/Project";

interface DocumentsPageProps {
  knowledgeBaseId: string;
}

/**
 * Example Documents Page Component
 * Shows how to integrate useDocuments hook with a React component
 */
export default function DocumentsPage({ knowledgeBaseId }: DocumentsPageProps) {
  const {
    // State
    documents,
    loading,
    error,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
    searchTerm,
    selectedStatus,
    selectedType,
    tabCounts,

    // CRUD Operations
    createDocument,
    updateDocument,
    deleteDocument,
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
    handleDocumentDelete,
    setSearchTerm,
    setItemsPerPage,

    // Utility Functions
    refresh,
    clearError,
  } = useDocuments({ knowledgeBaseId });

  // Example: Create a new document
  const handleCreateDocument = async () => {
    try {
      const newDocumentData: CreateDocumentInput = {
        name: "New Document",
        type: "pdf",
        knowledge_base_id: knowledgeBaseId,
        path: "/documents/new-document.pdf",
        url: "https://example.com/documents/new-document.pdf",
        file_size: 1024000,
        mime_type: "application/pdf",
        status: "uploaded",
      };

      await createDocument(newDocumentData);
      console.log("Document created successfully!");
    } catch (error) {
      console.error("Failed to create document:", error);
    }
  };

  // Example: Update a document
  const handleUpdateDocument = async (documentId: string) => {
    try {
      const updateData: UpdateDocumentInput = {
        status: "synced",
        rag_status: "synced",
        last_rag_sync: new Date().toISOString(),
      };

      await updateDocument(documentId, updateData);
      console.log("Document updated successfully!");
    } catch (error) {
      console.error("Failed to update document:", error);
    }
  };

  // Example: Search documents
  const handleSearch = (query: string) => {
    setSearchTerm(query);
    searchDocuments(query);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading documents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4">
              <button
                onClick={clearError}
                className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800"
              >
                Clear Error
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documents</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleCreateDocument}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Create Document
          </button>
          <button
            onClick={refresh}
            className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2"
        />
        <select
          value={selectedStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="all">All Statuses</option>
          <option value="uploaded">Uploaded</option>
          <option value="processing">Processing</option>
          <option value="synced">Synced</option>
          <option value="error">Error</option>
        </select>
        <select
          value={selectedType}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="all">All Types</option>
          <option value="pdf">PDF</option>
          <option value="docx">Word</option>
          <option value="txt">Text</option>
        </select>
      </div>

      {/* Tab Counts */}
      <div className="flex space-x-6">
        <div className="text-sm text-gray-600">All: {tabCounts.all}</div>
        <div className="text-sm text-gray-600">
          Uploaded: {tabCounts.uploaded}
        </div>
        <div className="text-sm text-gray-600">
          Processing: {tabCounts.processing}
        </div>
        <div className="text-sm text-gray-600">Synced: {tabCounts.synced}</div>
        <div className="text-sm text-gray-600">Error: {tabCounts.error}</div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No documents found.
          </div>
        ) : (
          documents.map((document) => (
            <div
              key={document.id}
              className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{document.name}</h3>
                  <p className="text-sm text-gray-600">
                    Type: {document.file_type}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {document.status}
                  </p>
                  <p className="text-sm text-gray-600">
                    RAG Status: {document.rag_status || "not_synced"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Chunks: {document.chunk_count}
                  </p>
                  <p className="text-sm text-gray-600">
                    Created:{" "}
                    {new Date(document.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDocumentClick(document.id)}
                    className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-800 hover:bg-blue-200"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleUpdateDocument(document.id)}
                    className="rounded bg-green-100 px-3 py-1 text-sm text-green-800 hover:bg-green-200"
                  >
                    Sync
                  </button>
                  <button
                    onClick={() => handleDocumentDelete(document.id)}
                    className="rounded bg-red-100 px-3 py-1 text-sm text-red-800 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex} to {endIndex} of {totalItems} documents
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Items per page selector */}
      <div className="flex justify-end">
        <select
          value={10}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>
    </div>
  );
}

/**
 * Usage Examples:
 *
 * 1. Basic Usage:
 *    const documentsHook = useDocuments({ knowledgeBaseId: "kb-123" });
 *
 * 2. With Auto-load Disabled:
 *    const documentsHook = useDocuments({
 *      knowledgeBaseId: "kb-123",
 *      autoLoad: false
 *    });
 *
 * 3. Create Document:
 *    await documentsHook.createDocument({
 *      name: "My Document",
 *      type: "pdf",
 *      project_id: "kb-123",
 *      path: "/path/to/file",
 *      url: "https://example.com/file"
 *    });
 *
 * 4. Update Document:
 *    await documentsHook.updateDocument("doc-123", {
 *      status: "synced",
 *      rag_status: "synced"
 *    });
 *
 * 5. Search Documents:
 *    await documentsHook.searchDocuments("query");
 *
 * 6. Filter by Status:
 *    await documentsHook.filterByStatus("synced");
 *
 * 7. Batch Operations:
 *    await documentsHook.batchUpdate(["doc-1", "doc-2"], { status: "synced" });
 *    await documentsHook.batchDelete(["doc-1", "doc-2"]);
 */
