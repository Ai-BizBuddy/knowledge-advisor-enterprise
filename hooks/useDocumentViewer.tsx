'use client';

/**
 * useDocumentViewer Hook - Manage document viewer modal state
 *
 * This hook handles opening and closing the document preview modal
 * for chat links and provides document data management
 */

import type { DeepSearchData } from '@/interfaces/DeepSearchTypes';
import { documentViewerService } from '@/services/DocumentViewerService';
import { useCallback, useState } from 'react';

export interface UseDocumentViewerReturn {
  isViewerOpen: boolean;
  viewerDocument: DeepSearchData | null;
  isLoading: boolean;
  error: string | null;
  openDocumentViewer: (url: string, pageNumber?: number) => Promise<void>;
  closeDocumentViewer: () => void;
}

export function useDocumentViewer(): UseDocumentViewerReturn {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerDocument, setViewerDocument] = useState<DeepSearchData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDocumentViewer = useCallback(async (url: string, pageNumber?: number) => {
    if (!documentViewerService.isDocumentLink(url)) {
      setError('Invalid document link');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const documentData = await documentViewerService.getDocumentForViewer(url, pageNumber);
      
      if (!documentData) {
        setError('Document not found');
        return;
      }

      setViewerDocument(documentData);
      setIsViewerOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
      setError(errorMessage);
      console.error('Error opening document viewer:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeDocumentViewer = useCallback(() => {
    setIsViewerOpen(false);
    setViewerDocument(null);
    setError(null);
  }, []);

  return {
    isViewerOpen,
    viewerDocument,
    isLoading,
    error,
    openDocumentViewer,
    closeDocumentViewer,
  };
}
