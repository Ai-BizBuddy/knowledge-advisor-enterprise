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
    // Validate input
    if (!url || typeof url !== 'string') {
      console.error('[useDocumentViewer] Invalid URL provided:', url);
      setError('Invalid document URL provided');
      return;
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      console.error('[useDocumentViewer] Empty URL after trimming');
      setError('Document URL is empty');
      return;
    }

    // Check if it's a valid document link
    if (!documentViewerService.isDocumentLink(trimmedUrl)) {
      console.error('[useDocumentViewer] URL is not a valid document link:', trimmedUrl);
      setError(`Invalid document link format: ${trimmedUrl.substring(0, 50)}...`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useDocumentViewer] Opening document:', { url: trimmedUrl, pageNumber });
      const documentData = await documentViewerService.getDocumentForViewer(trimmedUrl, pageNumber);
      
      if (!documentData) {
        console.error('[useDocumentViewer] Document not found for URL:', trimmedUrl);
        setError('Document not found or access denied');
        return;
      }

      console.log('[useDocumentViewer] Document loaded successfully:', documentData.name);
      setViewerDocument(documentData);
      setIsViewerOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
      setError(errorMessage);
      console.error('[useDocumentViewer] Error opening document viewer:', {
        url: trimmedUrl,
        error: err,
        message: errorMessage,
      });
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
