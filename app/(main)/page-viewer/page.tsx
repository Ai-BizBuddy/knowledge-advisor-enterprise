'use client';

import { DocumentPageViewer } from '@/components/documentPageViewer';
import { PageGuard } from '@/components/pageGuard';
import { PAGE_PERMISSIONS } from '@/constants';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PageViewerContent() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get('documentId') || '';
  const knowledgeBaseId = searchParams.get('kbId') || '';
  const page = Number(searchParams.get('page')) || 1;

  if (!documentId) {
    return (
      <div className='flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          Missing <code className='text-xs'>documentId</code> query parameter.
        </p>
      </div>
    );
  }

  return (
    <DocumentPageViewer
      documentId={documentId}
      knowledgeBaseId={knowledgeBaseId}
      initialPage={page}
    />
  );
}

function PageViewerLoading() {
  return (
    <div className='flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
      <div className='text-center'>
        <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent' />
        <p className='text-sm text-gray-500 dark:text-gray-400'>Loading Page Viewer...</p>
      </div>
    </div>
  );
}

export default function PageViewerPage() {
  return (
    <PageGuard requiredPermissions={PAGE_PERMISSIONS.DOCUMENTS}>
      <Suspense fallback={<PageViewerLoading />}>
        <PageViewerContent />
      </Suspense>
    </PageGuard>
  );
}
