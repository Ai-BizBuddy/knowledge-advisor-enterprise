'use client';

import type { DocumentPage } from '@/interfaces/DocumentPage';
import type { BBoxEntry } from '@/interfaces/DocumentSection';
import { DocumentPageService } from '@/services/DocumentPageService';
import { normalizePageBBox, type PageBBoxEntry } from '@/utils/normalizeBBox';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseDocumentPageViewerProps {
  initialDocumentId: string | null;
  knowledgeBaseId: string;
  initialPage?: number;
}

export const useDocumentPageViewer = ({
  initialDocumentId,
  knowledgeBaseId,
  initialPage = 0,
}: UseDocumentPageViewerProps) => {
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [currentPageNumber, setCurrentPageNumber] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which document is currently loaded to skip redundant fetches
  const loadedDocIdRef = useRef<string | null>(null);
  // Monotonic counter to discard stale async responses
  const requestIdRef = useRef(0);

  const loadPages = useCallback(async (documentId: string, force = false) => {
    // Skip fetch if pages for this document are already loaded
    if (!force && loadedDocIdRef.current === documentId) return;

    const thisRequest = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const response = await DocumentPageService.getPagesByDocumentId(documentId);
      // Discard result if a newer request was issued while we were fetching
      if (thisRequest !== requestIdRef.current) return;
      if (response.success && response.data) {
        setPages(response.data);
        loadedDocIdRef.current = documentId;
      } else {
        setError(response.error || 'Failed to load pages');
      }
    } catch (err) {
      if (thisRequest !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (thisRequest === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Reset pages when document changes (lazy — caller triggers loadPages explicitly)
  useEffect(() => {
    if (!initialDocumentId) {
      setPages([]);
      setCurrentPageNumber(0);
      loadedDocIdRef.current = null;
    }
  }, [initialDocumentId]);

  const selectPage = useCallback((pageNumber: number) => {
    setCurrentPageNumber(pageNumber);
  }, []);

  const updatePageContent = useCallback(
    async (pageId: string, content: string) => {
      const response = await DocumentPageService.updatePageContent(pageId, content);
      if (response.success) {
        // Update local state in-place to avoid full refetch
        setPages((prev) =>
          prev.map((p) => (p.id === pageId ? { ...p, content } : p))
        );
      } else {
        throw new Error(response.error || 'Failed to update page content');
      }
    },
    []
  );

  const updatePageBBox = useCallback(
    async (pageId: string, bbox: BBoxEntry[]) => {
      const response = await DocumentPageService.updatePageBBox(pageId, bbox);
      if (response.success) {
        setPages((prev) =>
          prev.map((p) => (p.id === pageId ? { ...p, bbox } : p))
        );
      } else {
        throw new Error(response.error || 'Failed to update page bbox');
      }
    },
    []
  );

  const currentPage = pages.find((p) => p.page_number === currentPageNumber);
  const currentContent = currentPage?.content || '';

  const base64Image = currentPage?.base64_image ?? null;
  const currentImageUrl =
    initialDocumentId && base64Image
      ? base64Image.startsWith('data:image')
        ? base64Image
        : `data:image/png;base64,${base64Image}`
      : null;

  /** Parsed page-level bboxes from the document_page.bbox column. */
  const currentPageBBoxes: PageBBoxEntry[] = useMemo(
    () => normalizePageBBox(currentPage?.bbox),
    [currentPage?.bbox],
  );

  return {
    pages,
    currentPageNumber,
    currentPage,
    currentContent,
    currentImageUrl,
    currentPageBBoxes,
    isLoading,
    error,
    loadPages,
    selectPage,
    updatePageContent,
    updatePageBBox,
  };
};
