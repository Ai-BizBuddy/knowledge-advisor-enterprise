'use client';

import { useDocumentPageViewer } from '@/hooks/useDocumentPageViewer';
import { useCallback, useEffect, useState } from 'react';
import type { DocumentPageViewerProps } from './DocumentPageViewer.types';
import { PageContentPane } from './PageContentPane';
import { PageImagePane } from './PageImagePane';
import { PageNavigationBar } from './PageNavigationBar';

export const DocumentPageViewer: React.FC<DocumentPageViewerProps> = ({
  documentId,
  knowledgeBaseId,
  initialPage = 1,
}) => {
  const {
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
  } = useDocumentPageViewer({
    initialDocumentId: documentId,
    knowledgeBaseId,
    initialPage,
  });

  const [highlightedBBoxId, setHighlightedBBoxId] = useState<string | null>(null);

  // Load pages on mount
  useEffect(() => {
    if (documentId) {
      loadPages(documentId).then(() => {
        if (initialPage) selectPage(initialPage);
      });
    }
  }, [documentId, loadPages, selectPage, initialPage]);

  const handlePageChange = useCallback(
    (page: number) => {
      selectPage(page);
      setHighlightedBBoxId(null);
    },
    [selectPage],
  );

  const totalPages = currentPage?.page_count || pages.length || 0;
  const documentName = pages.length > 0 ? documentId : undefined;

  // Build image source
  const imageSrc =
    currentImageUrl ??
    (currentPage?.base64_image
      ? currentPage.base64_image.startsWith('data:image')
        ? currentPage.base64_image
        : `data:image/png;base64,${currentPage.base64_image}`
      : null);

  return (
    <div className='flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-gray-900'>
      {/* Navigation */}
      <PageNavigationBar
        currentPage={currentPageNumber || 1}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        documentName={documentName}
        isLoading={isLoading}
      />

      {/* Error banner */}
      {error && (
        <div className='border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'>
          {error}
        </div>
      )}

      {/* Main 2-pane layout */}
      <div className='flex flex-1 overflow-hidden'>
        <PageImagePane
          imageSrc={imageSrc}
          pageBBoxes={currentPageBBoxes}
          highlightedBBoxId={highlightedBBoxId}
          onBBoxHover={setHighlightedBBoxId}
          onBBoxSelect={(id) => setHighlightedBBoxId(id)}
          currentPage={currentPageNumber || 1}
          isLoading={isLoading}
        />
        <PageContentPane
          content={currentContent}
          onImageRefHover={setHighlightedBBoxId}
          pageNumber={currentPageNumber || 1}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
};
