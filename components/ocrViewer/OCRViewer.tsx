'use client';

import { useToast } from '@/components/toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDocumentPageViewer } from '@/hooks/useDocumentPageViewer';
import { useDocumentPagesMap } from '@/hooks/useDocumentPagesMap';
import { useDocumentSectionViewer } from '@/hooks/useDocumentSectionViewer';
import type { DocumentSectionMetadata } from '@/interfaces/DocumentSection';
import {
  adminBackfillAll,
  backfillPageImages,
  reprocessPage,
} from '@/services/IngressService';
import { normalizeBBox } from '@/utils/normalizeBBox';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { OCRMetadataDrawer } from './OCRMetadataDrawer';
import { OCRPreviewPane } from './OCRPreviewPane';
import { OCRTextPane } from './OCRTextPane';
import type {
  DocumentWithSectionsUI,
  OCRImageUI,
  OCRMetadataUI,
  OCRViewerProps,
  PageUI,
  SectionUI,
} from './OCRViewer.types';
import { OCRViewerSidebar } from './OCRViewerSidebar';

// Inline SVG Icon
const MenuIcon = () => (
  <svg
    className='h-5 w-5'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    viewBox='0 0 24 24'
  >
    <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
    <line x1='9' y1='3' x2='9' y2='21' />
  </svg>
);

const SyncIcon = ({ isSyncing }: { isSyncing: boolean }) => (
  <svg
    className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    viewBox='0 0 24 24'
  >
    <path d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
  </svg>
);

export const OCRViewer: React.FC<OCRViewerProps> = ({
  initialDocumentId,
  initialSectionId,
  knowledgeBaseId,
}) => {
  const { showToast } = useToast();
  const { session } = useAuthContext();
  const {
    documents,
    currentSection,
    currentDocumentId,
    expandedDocuments,
    isLoading,
    error,
    loadDocuments,
    selectSection,
    selectDocument,
    toggleDocumentExpanded,
    updateSectionContent,
    updateSectionBBox,
    currentMetadata,
    currentImages,
    currentDocumentName,
    clearCurrentSection,
  } = useDocumentSectionViewer({
    initialDocumentId,
    initialSectionId,
    knowledgeBaseId,
    documentId: initialDocumentId,
  });

  const {
    pages,
    currentPageNumber: currentViewerPageNumber,
    currentPage: currentPageData,
    currentImageUrl: pageImageUrl,
    currentPageBBoxes,
    isLoading: isPageLoading,
    selectPage,
    loadPages,
    updatePageContent,
    updatePageBBox,
  } = useDocumentPageViewer({
    initialDocumentId: currentDocumentId,
    knowledgeBaseId,
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingBBox, setPendingBBox] = useState<number[] | null>(null);
  const [isSavingBBox, setIsSavingBBox] = useState(false);
  /** Image-id of the page-level bbox currently highlighted (from text hover or preview hover) */
  const [highlightedBBoxId, setHighlightedBBoxId] = useState<string | null>(null);
  /** Page-level bbox currently selected for edit/drag */
  const [pendingPageBBoxEdit, setPendingPageBBoxEdit] = useState<{ imageId: string; bbox: number[] } | null>(null);
  const [isSavingPageBBox, setIsSavingPageBBox] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  // Clear any pending (unsaved) bbox whenever the active section changes
  useEffect(() => {
    setPendingBBox(null);
  }, [currentSection?.id]);

  // Clear page bbox edit when the current page changes
  useEffect(() => {
    setPendingPageBBoxEdit(null);
  }, [currentViewerPageNumber]);

  // When a section is selected, auto-load page viewer data so the full page image is available
  const currentSectionPageNum = currentSection
    ? Number((currentSection.metadata as DocumentSectionMetadata)?.page) || 0
    : 0;
  useEffect(() => {
    if (!currentSection || !currentDocumentId || !currentSectionPageNum) return;
    selectPage(currentSectionPageNum);
    loadPages(currentDocumentId);
  }, [currentSection, currentDocumentId, currentSectionPageNum, loadPages, selectPage]);

  const {
    pagesMap,
    reload: reloadPagesMap,
    loadPagesForDocument,
    isDocumentLoading,
    goToDocumentPage,
    getDocPagination,
  } = useDocumentPagesMap({ knowledgeBaseId, documentId: initialDocumentId });

  // Transform documents for UI — pages are loaded lazily per document
  const documentsUI: DocumentWithSectionsUI[] = useMemo(() => {
    return documents.map((doc) => {
      const docPages = pagesMap.get(doc.id) || [];

      return {
        id: doc.id,
        name: doc.name,
        file_type: doc.file_type,
        status: doc.status,
        pageCount: doc.pageCount,
        isLoadingPages: isDocumentLoading(doc.id),
        pages: docPages.map(
          (p): PageUI => ({
            id: p.id,
            pageNumber: p.page_number,
            hasImage: true, // row existence in document_page implies content
            contentPreview: '',
            pageCount: p.page_count,
            createdAt: p.created_at,
            documentId: p.document_id,
            knowledgeBaseId: p.knowledge_base_id,
          }),
        ),
        sections: doc.sections.map((section): SectionUI => {
          const meta = section.metadata as DocumentSectionMetadata | null;
          // Read bbox from localStorage first (reliable fallback vs server trigger that resets metadata)
          let localBBox: number[] | null = null;
          if (typeof window !== 'undefined') {
            try {
              const stored = localStorage.getItem(`section_bbox_${section.id}`);
              if (stored) localBBox = JSON.parse(stored) as number[];
            } catch {
              // ignore parse errors
            }
          }
          return {
            id: section.id,
            page: Number(meta?.page) || 1,
            chunkIndex: meta?.chunk_index || 0,
            contentPreview: section.content.substring(0, 100),
            // Priority: localStorage → custom_metadata.user_bbox → metadata.bbox (normalize from DB format)
            bbox: localBBox ?? (meta?.custom_metadata?.user_bbox as number[] | undefined) ?? normalizeBBox(meta?.bbox),
          };
        }),
      };
    });
  }, [documents, pagesMap, isDocumentLoading]);

  // Transform images for UI — ensure base64 strings have proper data URI prefix
  const imagesUI: OCRImageUI[] = useMemo(() => {
    return currentImages.map((img) => ({
      id: img.id,
      base64: img.base64.startsWith('data:image')
        ? img.base64
        : `data:image/jpeg;base64,${img.base64}`,
    }));
  }, [currentImages]);

  // Transform metadata for UI
  const metadataUI: OCRMetadataUI | null = useMemo(() => {
    if (!currentMetadata || !currentSection) return null;

    // Same priority as documentsUI bbox: localStorage → custom_metadata.user_bbox → metadata.bbox
    let localBBox: number[] | null = null;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`section_bbox_${currentSection.id}`);
        if (stored) localBBox = JSON.parse(stored) as number[];
      } catch {
        // ignore parse errors
      }
    }
    const sectionMeta = currentSection.metadata as DocumentSectionMetadata | null;
    const bbox: number[] | null =
      localBBox ??
      (sectionMeta?.custom_metadata?.user_bbox as number[] | undefined) ??
      normalizeBBox(sectionMeta?.bbox);

    return {
      id: currentSection.id,
      documentId: currentMetadata.document_id,
      page: currentMetadata.page,
      chunkIndex: currentMetadata.chunk_index,
      chunkTotal: currentMetadata.chunk_total,
      fileName: currentMetadata.file_name,
      kbName: currentMetadata.kb_name,
      contentType: currentMetadata.content_type,
      charCount: currentMetadata.char_count,
      tokenCount: currentMetadata.token_count,
      contextualHeaders: currentMetadata.contextual_headers || [],
      bbox,
    };
  }, [currentMetadata, currentSection]);

  // Handlers
  const handleItemSelect = useCallback(
    (itemId: string) => {
      // Look up in lightweight page summaries from pagesMap
      for (const [docId, docPages] of pagesMap.entries()) {
        const matchedPage = docPages.find((p) => p.id === itemId);
        if (matchedPage) {
          if (docId !== currentDocumentId) {
            selectDocument(docId);
          }
          clearCurrentSection();
          // Set page immediately so UI updates, then load full page data in background
          selectPage(matchedPage.page_number);
          loadPages(docId);
          return;
        }
      }

      // Fallback: try the current document's pages hook (full data)
      const page = pages.find((p) => p.id === itemId);
      if (page) {
        clearCurrentSection();
        selectPage(page.page_number);
      } else {
        // Fallback for sections
        selectSection(itemId);
        const url = new URL(window.location.href);
        url.searchParams.set('sectionId', itemId);
        window.history.pushState({}, '', url.toString());
      }
    },
    [pagesMap, pages, loadPages, selectPage, selectSection, clearCurrentSection, currentDocumentId, selectDocument],
  );
  
  const handleDocumentToggle = useCallback(
    (documentId: string) => {
      // Toggle expand/collapse
      toggleDocumentExpanded(documentId);
      // Lazy-load the lightweight page list for this document (no-op if already cached)
      loadPagesForDocument(documentId);
    },
    [toggleDocumentExpanded, loadPagesForDocument],
  );

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleMetadata = useCallback(() => {
    setIsMetadataOpen((prev) => !prev);
  }, []);

  const handleTextUpdate = useCallback(
    async (newContent: string) => {
      if (currentSection?.id) {
        await updateSectionContent(currentSection.id, newContent, session?.access_token);
      }
    },
    [currentSection, updateSectionContent, session?.access_token],
  );

  const handlePageTextUpdate = useCallback(
    async (newContent: string) => {
      if (currentPageData?.id) {
        await updatePageContent(currentPageData.id, newContent);
      }
    },
    [currentPageData, updatePageContent],
  );

  /** Load a page-level bbox into edit mode when the user clicks it */
  const handlePageBBoxSelect = useCallback(
    (imageId: string) => {
      // Toggle off if the same bbox is clicked again
      if (pendingPageBBoxEdit?.imageId === imageId) {
        setPendingPageBBoxEdit(null);
        return;
      }
      const entry = currentPageBBoxes.find((e) => e.image_id === imageId);
      if (entry) {
        setPendingPageBBoxEdit({ imageId, bbox: [...entry.bbox] });
      }
    },
    [currentPageBBoxes, pendingPageBBoxEdit],
  );

  /** Update the position of the page-level bbox being edited (called while dragging) */
  const handlePageBBoxMove = useCallback((imageId: string, bbox: number[]) => {
    setPendingPageBBoxEdit({ imageId, bbox });
  }, []);

  /** Persist the edited page-level bbox back to the database */
  const handleSavePageBBoxEdit = useCallback(async () => {
    if (!pendingPageBBoxEdit || !currentPageData?.id) return;
    setIsSavingPageBBox(true);
    try {
      // Build the updated full bbox array: replace the entry for this imageId
      const updatedBBoxes = currentPageBBoxes.map((entry) =>
        entry.image_id === pendingPageBBoxEdit.imageId
          ? { image_id: entry.image_id, bbox: pendingPageBBoxEdit.bbox }
          : { image_id: entry.image_id, bbox: entry.bbox }
      );
      await updatePageBBox(currentPageData.id, updatedBBoxes);
      setPendingPageBBoxEdit(null);
      showToast('Page bbox saved successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save page bbox', 'error');
    } finally {
      setIsSavingPageBBox(false);
    }
  }, [pendingPageBBoxEdit, currentPageData, currentPageBBoxes, updatePageBBox, showToast]);

  const handleClearPageBBoxEdit = useCallback(() => {
    setPendingPageBBoxEdit(null);
  }, []);

  /** Reprocess the current page via the ingress service.
   *  - forceOcr: true  → POST /ingress/page with content: null (triggers fresh OCR)
   *  - forceOcr: false → POST /ingress/page with current content (re-generate embeddings) */
  const handlePageReprocess = useCallback(
    async ({ forceOcr, content }: { forceOcr: boolean; content: string }) => {
      if (!session?.access_token) {
        showToast('Authentication token missing.', 'error');
        return;
      }
      if (!currentDocumentId || !currentViewerPageNumber) {
        showToast('No page selected.', 'warning');
        return;
      }
      setIsReprocessing(true);
      try {
        const res = await reprocessPage(session.access_token, {
          document_id: currentDocumentId,
          page_number: currentViewerPageNumber,
          content: forceOcr ? null : content,
        });
        if (res.success) {
          showToast(
            forceOcr
              ? 'OCR re-scan queued. Check Hangfire for progress.'
              : 'Embedding update queued. Check Hangfire for progress.',
            'success',
          );
        } else {
          showToast(res.error || 'Failed to queue page reprocess', 'error');
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Network error during reprocess', 'error');
      } finally {
        setIsReprocessing(false);
      }
    },
    [session, currentDocumentId, currentViewerPageNumber, showToast],
  );

  const handleSaveBBox = useCallback(async () => {
    if (!pendingBBox) return;
    setIsSavingBBox(true);
    try {
      if (currentSection?.id) {
        // Save to section
        const { persisted } = await updateSectionBBox(currentSection.id, pendingBBox);
        setPendingBBox(null);
        if (persisted) {
          showToast('BBox saved successfully', 'success');
        } else {
          showToast('BBox saved locally — database sync may be pending', 'info');
        }
      } else if (currentPageData?.id) {
        // No section selected — save directly to document_page bbox array
        const newEntry = {
          image_id: `drawn_${Date.now()}`,
          bbox: pendingBBox,
        };
        const updatedBBoxes = [
          ...currentPageBBoxes.map((e) => ({ image_id: e.image_id, bbox: e.bbox })),
          newEntry,
        ];
        await updatePageBBox(currentPageData.id, updatedBBoxes);
        setPendingBBox(null);
        showToast('BBox saved to page successfully', 'success');
      } else {
        showToast('No page or section selected to save the BBox.', 'warning');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save BBox', 'error');
    } finally {
      setIsSavingBBox(false);
    }
  }, [pendingBBox, currentSection, currentPageData, currentPageBBoxes, updateSectionBBox, updatePageBBox, showToast]);

  const handleClearBBox = useCallback(() => {
    setPendingBBox(null);
  }, []);

  /** Single sync function — syncs current document if selected, otherwise all documents */
  const handleSync = useCallback(async () => {
    if (!session?.access_token) {
      showToast('Authentication token missing.', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      if (currentDocumentId) {
        const res = await backfillPageImages(session.access_token, currentDocumentId);
        if (res.success) {
          showToast('Page sync started. Please wait...', 'success');
          setTimeout(() => reloadPagesMap(), 2000);
        } else {
          showToast(res.error || 'Failed to sync pages', 'error');
        }
      } else {
        const res = await adminBackfillAll(session.access_token);
        if (res.success) {
          showToast('Backfill started for all documents.', 'success');
          setTimeout(() => reloadPagesMap(), 3000);
        } else {
          showToast(res.error || 'Failed to start backfill', 'error');
        }
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Network error during sync', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [session, showToast, currentDocumentId, reloadPagesMap]);

  // Build metadata from page data for OCRTextPane frontmatter display
  const pageMetadataUI: OCRMetadataUI | null = useMemo(() => {
    if (!currentPageData) return null;
    return {
      id: currentPageData.id,
      documentId: currentPageData.document_id,
      page: currentPageData.page_number,
      chunkIndex: 0,
      chunkTotal: currentPageData.page_count,
      fileName: currentDocumentName || '',
      kbName: knowledgeBaseId,
      contentType: 'page',
      charCount: currentPageData.content?.length || 0,
      tokenCount: 0,
      contextualHeaders: [],
    };
  }, [currentPageData, currentDocumentName, knowledgeBaseId]);

  const currentDetails = useMemo(() => {
    // Helper to get page image data URL from the dedicated base64_image column
    const getPageImageDataUrl = () => {
      const img = currentPageData?.base64_image ?? null;
      if (!img) return '';
      return img.startsWith('data:image') ? img : `data:image/png;base64,${img}`;
    };

    const pageDataUrl = getPageImageDataUrl();
    const pageImages: OCRImageUI[] = pageDataUrl
      ? [{ id: 'page-content-base64', base64: pageDataUrl }]
      : [];

    // Mode 1: Section Perspective (Priority if a section is selected)
    if (currentSection) {
      // Prefer full page image over section crops for the preview overlay
      const displayImages = pageImages.length > 0 ? pageImages : imagesUI;

      return {
        content: currentSection.content, // Always use selected section's own content for editing
        imageUrl: pageImageUrl,
        metadata: metadataUI,
        images: displayImages,
        page: Number(currentSection.metadata?.page) || 1,
        hasContent: true,
        isMultiChunk: false, // Always allow editing when a specific section is selected
      };
    }

    // Mode 2: Page Perspective — only when a page has been explicitly selected
    // Guard: currentViewerPageNumber 0 means nothing selected yet
    if (!currentViewerPageNumber) {
      return {
        content: '',
        imageUrl: null,
        metadata: null,
        images: [],
        page: 0,
        hasContent: false,
        isMultiChunk: false,
      };
    }

    // Even if no specific section is selected, try to find text content for this page from sections
    const currentDoc = documents.find((d) => d.id === currentDocumentId);
    
    let pageContentFromSections = '';
    const pageSections = currentDoc?.sections
      .filter((s) => {
        const meta = s.metadata as DocumentSectionMetadata | null;
        // Handle potential type mismatch (string vs number) for page
        const metaPage = Number(meta?.page);
        return metaPage === Number(currentViewerPageNumber);
      })
      .sort((a, b) => {
        const idxA = (a.metadata as DocumentSectionMetadata)?.chunk_index ?? 0;
        const idxB = (b.metadata as DocumentSectionMetadata)?.chunk_index ?? 0;
        return idxA - idxB;
      });

    if (pageSections && pageSections.length > 0) {
      pageContentFromSections = pageSections.map((s) => s.content).join('\n\n');
    }
    
    // For single section found in page view, we could potentially allow editing via specialized handler,
    // but for now treat >1 as multi-chunk to prevent generic page update overwriting valuable section data.
    const isMultiAttr = pageSections ? pageSections.length > 1 : false;

    const pageContent = pageContentFromSections || currentPageData?.content || '';

    return {
      content: pageContent,
      imageUrl: pageImageUrl,
      metadata: pageMetadataUI,
      images: pageImages,
      page: currentViewerPageNumber,
      hasContent: !!currentPageData || pageContent.length > 0,
      isMultiChunk: isMultiAttr
    };
  }, [
    pageImageUrl, 
    pageMetadataUI, 
    currentViewerPageNumber, 
    currentPageData,
    currentSection, 
    metadataUI,     
    imagesUI,
    documents,       
    currentDocumentId 
  ]);

  const activeId = currentSection?.id || currentPageData?.id || null;

  // Auto-select the section when a page with exactly 1 section is viewed (no section currently selected)
  useEffect(() => {
    if (currentSection || !currentViewerPageNumber || !currentDocumentId) return;
    const currentDoc = documents.find((d) => d.id === currentDocumentId);
    if (!currentDoc) return;
    const pageSections = currentDoc.sections.filter((s) => {
      const meta = s.metadata as DocumentSectionMetadata | null;
      return Number(meta?.page) === Number(currentViewerPageNumber);
    });
    if (pageSections.length === 1) {
      selectSection(pageSections[0].id);
    }
  }, [currentSection, currentViewerPageNumber, currentDocumentId, documents, selectSection]);


  const handlePageSelect = useCallback((pageId: string) => {
    for (const doc of documentsUI) {
      const page = doc.pages?.find(p => p.id === pageId);
      if (page) {
        if (doc.id !== currentDocumentId) {
          selectDocument(doc.id);
        }
        clearCurrentSection();
        // Set page immediately so UI updates, then load full page data in background
        selectPage(page.pageNumber);
        loadPages(doc.id);
        return;
      }
    }
  }, [documentsUI, loadPages, selectPage, clearCurrentSection, currentDocumentId, selectDocument]);

  // Build document title
  const documentTitle = currentDocumentName
    ? `${currentDocumentName}${currentDetails.page ? ` / Page ${currentDetails.page}` : ''}`
    : '';

  return (
    <div className='flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-gray-900'>
      {/* Top Header Bar */}
      <header className='flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2'>
          {isSidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className='mr-2 rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
              title='Toggle Sidebar'
            >
              <MenuIcon />
            </button>
          )}
          <span className='text-sm font-semibold text-gray-900 dark:text-white'>
            OCR Studio
          </span>
          {documentTitle && (
            <span className='ml-3 max-w-xs truncate border-l border-gray-200 pl-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400'>
              {documentTitle}
            </span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className='flex items-center gap-1.5 rounded border border-transparent px-2 py-1 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
            title={currentDocumentId ? 'Sync pages for current document' : 'Sync all documents'}
          >
            <SyncIcon isSyncing={isSyncing} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
          <button
            onClick={toggleMetadata}
            className='rounded border border-transparent px-2 py-1 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
          >
            Metadata
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className='border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'>
          {error}
        </div>
      )}

      {/* Main Workspace */}
      <div className='relative flex flex-1 overflow-hidden'>
        {/* Sidebar Container */}
        <div className={`flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isSidebarCollapsed ? 'w-0 overflow-hidden border-none' : 'w-64'}`}>
            <OCRViewerSidebar
              documents={documentsUI}
              expandedDocuments={expandedDocuments}
              currentSectionId={activeId}
              currentDocumentId={currentDocumentId}
              isLoading={isLoading || isPageLoading}
              onDocumentToggle={handleDocumentToggle}
              onDocumentSelect={selectDocument}
              onSectionSelect={handleItemSelect}
              onRefresh={() => { loadDocuments(); reloadPagesMap(); }}
              onSidebarToggle={toggleSidebar}
              isCollapsed={false}
              onPageSelect={handlePageSelect}
              onDocumentPageChange={goToDocumentPage}
              getDocPagination={getDocPagination}
            />
        </div>

        {/* Restore sidebar toggle button if collapsed (since it lives inside sidebar typically) */}
        {isSidebarCollapsed && (
             <button
              onClick={toggleSidebar}
              className='absolute top-4 left-4 z-10 rounded p-2 bg-white shadow-md text-gray-500 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              title='Open Sidebar'
            >
              <MenuIcon />
            </button>
        )}

        {/* Preview Pane */}
        <OCRPreviewPane
          images={currentDetails.images}
          currentPage={currentDetails.page}
          isLoading={isLoading || isPageLoading}
          sections={(documentsUI.find((d) => d.id === currentDocumentId)?.sections || []).filter(
            (s) => Number(s.page) === Number(currentDetails.page)
          )}
          selectedSectionId={activeId}
          onSectionSelect={handleItemSelect}
          hasContent={currentDetails.hasContent}
          onBBoxCreate={(bbox) => setPendingBBox(bbox)}
          pendingBBox={pendingBBox}
          onSaveBBox={handleSaveBBox}
          isSavingBBox={isSavingBBox}
          onClearBBox={handleClearBBox}
          pageBBoxes={currentPageBBoxes}
          highlightedBBoxId={highlightedBBoxId}
          onPageBBoxHover={setHighlightedBBoxId}
          onPageBBoxSelect={handlePageBBoxSelect}
          pendingPageBBoxEdit={pendingPageBBoxEdit}
          onPageBBoxMove={handlePageBBoxMove}
          onSavePageBBoxEdit={handleSavePageBBoxEdit}
          isSavingPageBBox={isSavingPageBBox}
          onClearPageBBoxEdit={handleClearPageBBoxEdit}
        />

        {/* Text Pane */}
        <OCRTextPane
          content={currentDetails.content}
          metadata={currentDetails.metadata}
          images={currentDetails.images}
          onUpdate={
            currentDetails.isMultiChunk
              ? undefined // Editing disabled for multi-chunk view to prevent overwrite
              : currentSection
                ? handleTextUpdate
                : handlePageTextUpdate
          }
          onImageRefHover={setHighlightedBBoxId}
          onPageReprocess={currentPageData && !currentSection ? handlePageReprocess : undefined}
          isReprocessing={isReprocessing}
        />

        {/* Metadata Drawer */}
        <OCRMetadataDrawer
          isOpen={isMetadataOpen}
          metadata={currentSection?.metadata as Record<string, unknown> | null}
          onClose={() => setIsMetadataOpen(false)}
        />
      </div>
    </div>
  );
};
