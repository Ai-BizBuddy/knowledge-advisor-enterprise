'use client';

import type { DocumentPageSummary } from '@/interfaces/DocumentPage';
import { DocumentPageService } from '@/services/DocumentPageService';
import { useCallback, useEffect, useRef, useState } from 'react';

const SIDEBAR_PAGE_SIZE = 25;

interface UseDocumentPagesMapOptions {
  /** When provided, all page summaries for this KB are pre-loaded on mount. */
  knowledgeBaseId?: string;
  /** When provided with knowledgeBaseId, only pages for this specific document are loaded. */
  documentId?: string;
}

interface DocPagination {
  currentPage: number;
  totalPages: number;
  total: number;
}

/**
 * Document-pages loader with per-document pagination (25 pages per batch).
 *
 * If `knowledgeBaseId` is supplied the hook bulk-loads the first batch of page
 * summaries for that knowledge base on mount. If `documentId` is also provided,
 * only pages for that specific document are loaded (25 pages per batch with pagination).
 * Individual documents can be paginated independently with `goToDocumentPage`.
 */
export function useDocumentPagesMap(options: UseDocumentPagesMapOptions = {}) {
  const { knowledgeBaseId, documentId } = options;

  const [pagesMap, setPagesMap] = useState<Map<string, DocumentPageSummary[]>>(
    new Map(),
  );
  /** Per-document pagination metadata */
  const [docPaginationMap, setDocPaginationMap] = useState<Map<string, DocPagination>>(
    new Map(),
  );
  const [loadingDocs, setLoadingDocs] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which documents have already been fetched so we don't re-fetch the first page
  const fetchedRef = useRef<Set<string>>(new Set());
  // Separately track docs fetched individually (with pagination) so bulk-loaded docs still get proper pagination on first expand
  const perDocFetchedRef = useRef<Set<string>>(new Set());
  // Prevent duplicate bulk loads
  const bulkLoadedRef = useRef(false);

  /** Bulk-load the first batch of page summaries for a knowledge base or specific document. */
  const loadAllPages = useCallback(async (kbId: string, docId?: string) => {
    if (bulkLoadedRef.current) return;
    bulkLoadedRef.current = true;

    setIsBulkLoading(true);
    setError(null);

    try {
      let res;
      if (docId) {
        // Load only pages for the specific document (includes pagination metadata)
        res = await DocumentPageService.getPageListByKnowledgeBaseIdAndDocumentId(kbId, docId, 1, SIDEBAR_PAGE_SIZE);
        if (res.success && res.data) {
          setPagesMap(res.data.pages);
          // Store pagination info for the document
          setDocPaginationMap(new Map(
            Array.from(res.data.pagination.entries()).map(([id, p]) => [
              id,
              { currentPage: p.currentPage, totalPages: p.totalPages, total: p.total },
            ])
          ));
          for (const id of res.data.pages.keys()) {
            fetchedRef.current.add(id);
          }
        }
      } else {
        // Load pages for all documents in KB (first 25 total)
        res = await DocumentPageService.getPageListByKnowledgeBaseId(kbId, 1, SIDEBAR_PAGE_SIZE);
        if (res.success && res.data) {
          setPagesMap(res.data);
          // Mark every fetched document so individual page-1 loads are skipped
          for (const id of res.data.keys()) {
            fetchedRef.current.add(id);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk-load pages');
    } finally {
      setIsBulkLoading(false);
    }
  }, []);

  // Auto-preload when knowledgeBaseId is provided
  useEffect(() => {
    if (knowledgeBaseId) {
      loadAllPages(knowledgeBaseId, documentId);
    }
  }, [knowledgeBaseId, documentId, loadAllPages]);

  /**
   * Fetch the lightweight paginated page list for a single document.
   * Pass `page` (1-based) to jump to a specific page of 25.
   */
  const loadPagesForDocument = useCallback(
    async (docId: string, page = 1, force = false) => {
      // Only skip if this document has been individually paginated before (not just bulk-loaded)
      if (!force && page === 1 && perDocFetchedRef.current.has(docId)) return;

      setLoadingDocs((prev) => new Set(prev).add(docId));
      setError(null);

      try {
        const res = await DocumentPageService.getPageListByDocumentId(docId, page, SIDEBAR_PAGE_SIZE);
        const pages = res.success && res.data ? res.data.pages : [];
        const total = res.success && res.data ? res.data.total : 0;
        const totalPages = res.success && res.data ? res.data.totalPages : 1;

        setPagesMap((prev) => {
          const next = new Map(prev);
          next.set(docId, pages);
          return next;
        });

        setDocPaginationMap((prev) => {
          const next = new Map(prev);
          next.set(docId, { currentPage: page, totalPages, total });
          return next;
        });

        if (page === 1) {
          fetchedRef.current.add(docId);
          perDocFetchedRef.current.add(docId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pages');
      } finally {
        setLoadingDocs((prev) => {
          const next = new Set(prev);
          next.delete(docId);
          return next;
        });
      }
    },
    [],
  );

  /** Navigate a document's page list to a different 25-item batch. */
  const goToDocumentPage = useCallback(
    (docId: string, page: number) => {
      loadPagesForDocument(docId, page, true);
    },
    [loadPagesForDocument],
  );

  /** Get current pagination state for a document, or null if not yet loaded. */
  const getDocPagination = useCallback(
    (docId: string): DocPagination | null => {
      return docPaginationMap.get(docId) ?? null;
    },
    [docPaginationMap],
  );

  /** Check whether a specific document is currently loading its pages. */
  const isDocumentLoading = useCallback(
    (docId: string) => loadingDocs.has(docId),
    [loadingDocs],
  );

  const isLoading = loadingDocs.size > 0 || isBulkLoading;

  /** Check if at least one fetched document has zero pages. */
  const hasMissingPages = Array.from(pagesMap.entries()).some(
    ([, pages]) => pages.length === 0,
  );

  /** Force-reload pages for all already-fetched documents (resets to page 1). */
  const reload = useCallback(async () => {
    if (knowledgeBaseId) {
      bulkLoadedRef.current = false;
      perDocFetchedRef.current = new Set();
      await loadAllPages(knowledgeBaseId, documentId);
      return;
    }
    const ids = Array.from(fetchedRef.current);
    perDocFetchedRef.current = new Set();
    await Promise.all(ids.map((id) => loadPagesForDocument(id, 1, true)));
  }, [knowledgeBaseId, documentId, loadAllPages, loadPagesForDocument]);

  return {
    pagesMap,
    isLoading,
    error,
    hasMissingPages,
    reload,
    loadPagesForDocument,
    isDocumentLoading,
    goToDocumentPage,
    getDocPagination,
  };
}
