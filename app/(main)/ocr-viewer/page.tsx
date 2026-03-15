'use client';

import { OCRViewer } from '@/components/ocrViewer';
import { PageGuard } from '@/components/pageGuard';
import { PAGE_PERMISSIONS } from '@/constants';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OCRViewerContent() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get('documentId') || undefined;
  const sectionId = searchParams.get('sectionId') || undefined;
  const knowledgeBaseId = searchParams.get('kbId') || ''; // Enforce string for updated OCRViewerProps

  return (
    <OCRViewer
      initialDocumentId={documentId}
      initialSectionId={sectionId}
      knowledgeBaseId={knowledgeBaseId}
    />
  );
}

function OCRViewerLoading() {
  return (
    <div className='flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
      <div className='text-center'>
        <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent'></div>
        <p className='text-sm text-gray-500 dark:text-gray-400'>Loading OCR Viewer...</p>
      </div>
    </div>
  );
}

export default function OCRViewerPage() {
  return (
    <PageGuard requiredPermissions={PAGE_PERMISSIONS.DOCUMENTS}>
      <Suspense fallback={<OCRViewerLoading />}>
        <OCRViewerContent />
      </Suspense>
    </PageGuard>
  );
}
