'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { createApiError } from '@/utils/errorHelpers';
import { useCallback, useState } from 'react';

export interface UseDocumentSyncReturn {
  // State
  syncingDocuments: Set<string>;
  loading: boolean;
  error: string | null;

  // Actions
  syncDocument: (documentId: string) => Promise<void>;
  syncMultipleDocuments: (documentIds: string[]) => Promise<void>;
  isSyncing: (documentId: string) => boolean;
  clearError: () => void;
}

/**
 * Custom hook for managing document sync operations to RAG system
 */
export function useDocumentSync(): UseDocumentSyncReturn {
  const [syncingDocuments, setSyncingDocuments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken } = useAuthContext();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isSyncing = useCallback(
    (documentId: string) => {
      return syncingDocuments.has(documentId);
    },
    [syncingDocuments],
  );

  const addSyncingDocument = useCallback((documentId: string) => {
    setSyncingDocuments((prev) => new Set(prev).add(documentId));
  }, []);

  const removeSyncingDocument = useCallback((documentId: string) => {
    setSyncingDocuments((prev) => {
      const newSet = new Set(prev);
      newSet.delete(documentId);
      return newSet;
    });
  }, []);

  /**
   * Sync a single document to RAG system using only the ingress API
   */
  const syncDocument = useCallback(
    async (documentId: string): Promise<void> => {
      try {
        setError(null);
        addSyncingDocument(documentId);

        // Get access token for authorization
        const token = await getAccessToken();
        if (!token) {
          throw new Error('No access token available. Please log in again.');
        }

        // Call the ingestion API to sync the document
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
          const error = await createApiError(response, 'Failed to sync document');
          throw error;
        }

        console.log(`[DocumentSync] Successfully called ingress API for document: ${documentId}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to sync document';
        console.error(`[DocumentSync] Error syncing document ${documentId}:`, err);
        
        setError(errorMessage);
        throw err;
      } finally {
        removeSyncingDocument(documentId);
      }
    },
    [addSyncingDocument, removeSyncingDocument, getAccessToken],
  );

  /**
   * Sync multiple documents to RAG system
   */
  const syncMultipleDocuments = useCallback(
    async (documentIds: string[]): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const promises = documentIds.map((id) => syncDocument(id));
        await Promise.allSettled(promises);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to sync documents';
        console.error('[DocumentSync] Error syncing multiple documents:', err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [syncDocument],
  );

  return {
    // State
    syncingDocuments,
    loading,
    error,

    // Actions
    syncDocument,
    syncMultipleDocuments,
    isSyncing,
    clearError,
  };
}

export default useDocumentSync;
