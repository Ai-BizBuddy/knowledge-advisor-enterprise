/**
 * Example usage of the new DocumentService without knowledgeBaseId
 * This demonstrates how to use the getAllUserDocuments method
 */

"use client";

import React, { useState, useEffect } from "react";
import DocumentService from "@/services/DocumentService";
import { useAllUserDocuments } from "@/hooks/useAllUserDocuments";
import type { Document, PaginationOptions } from "@/interfaces/Project";

export default function DocumentServiceExample() {
  const [directDocuments, setDirectDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Using the new hook
  const {
    documents: hookDocuments,
    loading: hookLoading,
    totalItems,
    totalPages,
    currentPage,
    searchDocuments,
    setSearchTerm,
    searchTerm,
  } = useAllUserDocuments({
    autoLoad: true,
    itemsPerPage: 5,
  });

  // Direct service usage example
  const loadDocumentsDirectly = async () => {
    setLoading(true);
    setError(null);

    try {
      const documentService = new DocumentService();

      const paginationOptions: PaginationOptions = {
        currentPage: 1,
        totalPages: 0,
        startIndex: 0,
        endIndex: 4, // Get first 5 documents
        totalItems: 0,
      };

      const result = await documentService.getAllUserDocuments(
        paginationOptions,
        {
          status: "all",
          searchTerm: "",
          type: "all",
        },
      );

      setDirectDocuments(result.data);
      console.log("Direct service call result:", result);
    } catch (err) {
      console.error("Error loading documents directly:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocumentsDirectly();
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        DocumentService Example - No Knowledge Base ID Required
      </h1>

      {/* Direct Service Usage */}
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Direct Service Usage</h2>
        <button
          onClick={loadDocumentsDirectly}
          disabled={loading}
          className="mb-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
        >
          {loading ? "Loading..." : "Reload Documents (Direct Service)"}
        </button>

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            Error: {error}
          </div>
        )}

        <div className="rounded bg-gray-100 p-4">
          <h3 className="mb-2 font-semibold">
            Documents from direct service call ({directDocuments.length}):
          </h3>
          {directDocuments.length > 0 ? (
            <ul className="space-y-2">
              {directDocuments.map((doc) => (
                <li key={doc.id} className="rounded bg-white p-3 shadow">
                  <div className="font-medium">{doc.name}</div>
                  <div className="text-sm text-gray-600">
                    Type: {doc.file_type} | Status: {doc.status} | RAG Status:{" "}
                    {doc.rag_status}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No documents found</p>
          )}
        </div>
      </div>

      {/* Hook Usage */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold">
          Hook Usage (useAllUserDocuments)
        </h2>

        {/* Search functionality */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md rounded border border-gray-300 px-3 py-2"
          />
          <button
            onClick={() => searchDocuments(searchTerm)}
            className="ml-2 rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700"
          >
            Search
          </button>
        </div>

        {/* Pagination info */}
        <div className="mb-4 text-sm text-gray-600">
          Page {currentPage} of {totalPages} | Total: {totalItems} documents
        </div>

        <div className="rounded bg-gray-100 p-4">
          <h3 className="mb-2 font-semibold">
            Documents from hook ({hookDocuments.length}):
            {hookLoading && (
              <span className="ml-2 text-blue-600">Loading...</span>
            )}
          </h3>
          {hookDocuments.length > 0 ? (
            <ul className="space-y-2">
              {hookDocuments.map((doc) => (
                <li key={doc.id} className="rounded bg-white p-3 shadow">
                  <div className="font-medium">{doc.name}</div>
                  <div className="text-sm text-gray-600">
                    Type: {doc.file_type} | Status: {doc.status} | RAG Status:{" "}
                    {doc.rag_status}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(doc.created_at).toLocaleDateString()} |
                    Chunks: {doc.chunk_count || 0}
                  </div>
                  {doc.file_size && (
                    <div className="text-xs text-gray-500">
                      Size: {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No documents found</p>
          )}
        </div>
      </div>

      {/* Service Methods Documentation */}
      <div className="mt-8 rounded bg-blue-50 p-4">
        <h3 className="mb-2 text-lg font-semibold">
          Available New Service Methods:
        </h3>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>
            <code>getAllUserDocuments(paginationOptions, filters)</code> - Get
            all documents for current user
          </li>
          <li>
            <code>searchAllUserDocuments(query, paginationOptions)</code> -
            Search across all user documents
          </li>
          <li>
            <code>getUserDocument(documentId)</code> - Get single document by ID
            (with user ownership check)
          </li>
        </ul>
        <p className="mt-2 text-sm text-gray-600">
          These methods automatically filter documents by the authenticated user
          and don&apos;t require a knowledgeBaseId.
        </p>
      </div>
    </div>
  );
}
