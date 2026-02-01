'use client';

import { useDocumentSectionViewer } from '@/hooks/useDocumentSectionViewer';
import type { DocumentSectionMetadata } from '@/interfaces/DocumentSection';
import { useCallback, useMemo, useState } from 'react';
import { OCRMetadataDrawer } from './OCRMetadataDrawer';
import { OCRPreviewPane } from './OCRPreviewPane';
import { OCRTextPane } from './OCRTextPane';
import type {
    DocumentWithSectionsUI,
    OCRImageUI,
    OCRMetadataUI,
    OCRViewerProps,
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

export const OCRViewer: React.FC<OCRViewerProps> = ({
  initialDocumentId,
  initialSectionId,
  knowledgeBaseId,
}) => {
  const {
    documents,
    currentSection,
    currentDocumentId,
    expandedDocuments,
    isLoading,
    error,
    loadDocuments,
    selectSection,
    toggleDocumentExpanded,
    currentMetadata,
    currentImages,
    currentPage,
    currentDocumentName,
  } = useDocumentSectionViewer({
    initialDocumentId,
    initialSectionId,
    knowledgeBaseId,
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);

  // Transform documents for UI
  const documentsUI: DocumentWithSectionsUI[] = useMemo(() => {
    return documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      file_type: doc.file_type,
      status: doc.status,
      pageCount: doc.pageCount,
      sections: doc.sections.map((section): SectionUI => {
        const meta = section.metadata as DocumentSectionMetadata | null;
        return {
          id: section.id,
          page: meta?.page || 1,
          chunkIndex: meta?.chunk_index || 0,
          contentPreview: section.content.substring(0, 100),
        };
      }),
    }));
  }, [documents]);

  // Transform images for UI
  const imagesUI: OCRImageUI[] = useMemo(() => {
    return currentImages.map((img) => ({
      id: img.id,
      base64: img.base64,
    }));
  }, [currentImages]);

  // Transform metadata for UI
  const metadataUI: OCRMetadataUI | null = useMemo(() => {
    if (!currentMetadata || !currentSection) return null;
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
    };
  }, [currentMetadata, currentSection]);

  // Handlers
  const handleSectionSelect = useCallback(
    (sectionId: string) => {
      selectSection(sectionId);

      // Update URL without navigation
      const url = new URL(window.location.href);
      url.searchParams.set('sectionId', sectionId);
      window.history.pushState({}, '', url.toString());
    },
    [selectSection],
  );

  const handleDocumentToggle = useCallback(
    (documentId: string) => {
      toggleDocumentExpanded(documentId);
    },
    [toggleDocumentExpanded],
  );

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleMetadata = useCallback(() => {
    setIsMetadataOpen((prev) => !prev);
  }, []);

  // Build document title
  const documentTitle = currentDocumentName
    ? `${currentDocumentName}${currentPage ? ` / Page ${currentPage}` : ''}`
    : '';

  return (
    <div className='flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-gray-900'>
      {/* Top Header Bar */}
      <header className='flex h-12 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800'>
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
        {/* Sidebar */}
        <OCRViewerSidebar
          documents={documentsUI}
          expandedDocuments={expandedDocuments}
          currentSectionId={currentSection?.id || null}
          currentDocumentId={currentDocumentId}
          isLoading={isLoading}
          onDocumentToggle={handleDocumentToggle}
          onSectionSelect={handleSectionSelect}
          onRefresh={loadDocuments}
          onSidebarToggle={toggleSidebar}
          isCollapsed={isSidebarCollapsed}
        />

        {/* Preview Pane */}
        <OCRPreviewPane
          images={imagesUI}
          currentPage={currentPage}
          isLoading={isLoading}
          hasContent={!!currentSection}
        />

        {/* Text Pane */}
        <OCRTextPane
          content={currentSection?.content || ''}
          metadata={metadataUI}
          images={imagesUI}
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
