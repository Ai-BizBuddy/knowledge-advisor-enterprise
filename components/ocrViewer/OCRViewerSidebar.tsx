'use client';

import React, { memo, useCallback } from 'react';
import type {
    DocPagination,
    DocumentWithSectionsUI,
    OCRViewerSidebarProps,
    PageUI,
} from './OCRViewer.types';

// Inline SVG Icons
const ChevronRightIcon = () => (
  <svg
    className='h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    viewBox='0 0 24 24'
  >
    <polyline points='9 18 15 12 9 6' />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || 'h-4 w-4'}
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    viewBox='0 0 24 24'
  >
    <path d='M23 4v6h-6' />
    <path d='M20.49 15a9 9 0 1 1-2.12-9.36L23 10' />
  </svg>
);

const MenuIcon = () => (
  <svg
    className='h-4 w-4'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    viewBox='0 0 24 24'
  >
    <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
    <line x1='9' y1='3' x2='9' y2='21' />
  </svg>
);

const SyncIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || 'h-4 w-4'}
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    viewBox='0 0 24 24'
  >
    <path d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
  </svg>
);

// --- Memoized Child Components ---

interface SidebarHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  onToggle: () => void;
}

const SidebarHeader = memo(
  ({ isLoading, onRefresh, onToggle }: SidebarHeaderProps) => (
    <div className='flex h-12 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700'>
      <span className='text-sm font-semibold text-gray-900 dark:text-white'>
        Documents
      </span>
      <div className='flex items-center gap-1'>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className='rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
          title='Refresh'
        >
          <RefreshIcon
            className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
        <button
          onClick={onToggle}
          className='rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
          title='Toggle Sidebar'
        >
          <MenuIcon />
        </button>
      </div>
    </div>
  )
);
SidebarHeader.displayName = 'SidebarHeader';

interface SyncWarningProps {
  isSyncing: boolean;
  isLoading: boolean;
  onSync: () => void;
}

const SyncWarning = memo(({ isSyncing, isLoading, onSync }: SyncWarningProps) => (
  <div className='flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-800 dark:bg-amber-900/20'>
    <span className='text-xs text-amber-700 dark:text-amber-400'>
      Some documents have no pages
    </span>
    <button
      onClick={onSync}
      disabled={isSyncing || isLoading}
      className='flex items-center gap-1 rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50'
    >
      <SyncIcon className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing...' : 'Sync All'}
    </button>
  </div>
));
SyncWarning.displayName = 'SyncWarning';

interface PageItemProps {
  page: PageUI;
  isActive: boolean;
  onSelect: (id: string) => void;
}

/** Format a relative time string like "2h ago", "3d ago", etc. */
const formatRelativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const ImageIcon = () => (
  <svg
    className='h-3 w-3 shrink-0 text-emerald-500 dark:text-emerald-400'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    viewBox='0 0 24 24'
  >
    <rect x='3' y='3' width='18' height='18' rx='2' />
    <circle cx='8.5' cy='8.5' r='1.5' />
    <path d='m21 15-5-5L5 21' />
  </svg>
);

const PageItem = memo(({ page, isActive, onSelect }: PageItemProps) => {
  const handleClick = useCallback(() => {
    onSelect(page.id);
  }, [page.id, onSelect]);

  const timeLabel = page.createdAt ? formatRelativeTime(page.createdAt) : '';

  return (
    <button
      onClick={handleClick}
      title={page.createdAt ? `Synced ${timeLabel}` : undefined}
      className={`flex w-full items-center gap-1.5 px-4 py-1.5 pl-9 text-left text-xs transition-all ${
        isActive
          ? 'border-l-2 border-blue-500 bg-blue-50 pl-8.5 font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-300'
      }`}
    >
      {page.hasImage && <ImageIcon />}
      <span className='flex-1 truncate'>
        Page {page.pageNumber}{page.pageCount > 0 ? ` / ${page.pageCount}` : ''}
      </span>
      {timeLabel && (
        <span className='shrink-0 text-[10px] text-gray-400 dark:text-gray-500'>
          {timeLabel}
        </span>
      )}
    </button>
  );
});
PageItem.displayName = 'PageItem';

interface DocumentItemProps {
  doc: DocumentWithSectionsUI;
  isExpanded: boolean;
  isActive: boolean;
  currentSectionId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onPageSelect: (id: string) => void;
  onDocumentPageChange: (docId: string, page: number) => void;
  pagination: DocPagination | null;
}

const DocumentItem = memo(
  ({
    doc,
    isExpanded,
    isActive,
    currentSectionId,
    onToggle,
    onSelect,
    onPageSelect,
    onDocumentPageChange,
    pagination,
  }: DocumentItemProps) => {
    const handleToggle = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(doc.id);
      },
      [doc.id, onToggle]
    );

    const handleSelect = useCallback(() => {
      onSelect(doc.id);
    }, [doc.id, onSelect]);

    const pagesList = doc.pages || [];
    const hasPages = pagesList.length > 0;
    const isLoadingPages = doc.isLoadingPages ?? false;
    // Use pageCount from the document level (available before pages are lazy-loaded)
    const displayPageCount = doc.pageCount > 0 ? doc.pageCount : pagesList.length;
    const allPagesHaveImages = hasPages && pagesList.every((p) => p.hasImage);

    return (
      <div className='border-b border-transparent'>
        {/* Document Header */}
        <div
          className={`flex w-full items-center gap-1 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
            isActive
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          <button
            onClick={handleToggle}
            className='p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
          >
            <span
              className={`block transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            >
              <ChevronRightIcon />
            </span>
          </button>
          <button
            onClick={handleSelect}
            className='flex-1 truncate text-left'
            title={doc.name}
          >
            {doc.name}
          </button>
          <span className='ml-auto flex items-center gap-1'>
            {hasPages && (
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  allPagesHaveImages
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
                title={allPagesHaveImages ? 'All pages synced' : 'Some pages missing images'}
              />
            )}
            {displayPageCount > 0 && (
              <span className='text-[10px] text-gray-400 dark:text-gray-500'>
                {displayPageCount}p
              </span>
            )}
          </span>
        </div>

        {/* Page List — shown when expanded */}
        {isExpanded && (
          <div className='bg-gray-50 pb-1 dark:bg-gray-900/50'>
            {isLoadingPages ? (
              <div className='flex items-center gap-2 px-4 py-3 pl-9'>
                <RefreshIcon className='h-3 w-3 animate-spin text-gray-400 dark:text-gray-500' />
                <span className='text-xs text-gray-400 dark:text-gray-500'>
                  Loading pages…
                </span>
              </div>
            ) : !hasPages ? (
              <div className='flex items-center justify-between px-4 py-2 pl-9'>
                <span className='text-xs text-gray-400 dark:text-gray-500'>
                  No pages synced yet.
                </span>
              </div>
            ) : (
              (doc.pages || []).map((page) => (
                <PageItem
                  key={page.id}
                  page={page}
                  isActive={currentSectionId === page.id}
                  onSelect={onPageSelect}
                />
              ))
            )}

            {/* Page-map — compact numbered-batch grid */}
            {pagination && pagination.totalPages > 1 && (() => {
              const { currentPage, totalPages, total } = pagination;
              const MAX_CHIPS = 20;
              let chips: (number | null)[];
              if (totalPages <= MAX_CHIPS) {
                chips = Array.from({ length: totalPages }, (_, i) => i + 1);
              } else {
                const set = new Set<number>(
                  [
                    1, 2,
                    currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2,
                    totalPages - 1, totalPages,
                  ].filter((n) => n >= 1 && n <= totalPages)
                );
                const sorted = Array.from(set).sort((a, b) => a - b);
                chips = [];
                for (let i = 0; i < sorted.length; i++) {
                  if (i > 0 && sorted[i] - sorted[i - 1] > 1) chips.push(null);
                  chips.push(sorted[i]);
                }
              }
              const startLabel = (currentPage - 1) * 10 + 1;
              const endLabel = Math.min(currentPage * 10, total);
              return (
                <div className='border-t border-gray-200 px-3 py-2 dark:border-gray-700'>
                  <div className='flex flex-wrap gap-1'>
                    {chips.map((batch, idx) =>
                      batch === null ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className='flex min-w-4.5 items-end justify-center pb-0.5 text-[10px] text-gray-400 dark:text-gray-500'
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={batch}
                          disabled={isLoadingPages}
                          onClick={() => onDocumentPageChange(doc.id, batch)}
                          title={`Pages ${(batch - 1) * 10 + 1}–${Math.min(batch * 10, total)}`}
                          className={`min-w-5.5 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors disabled:opacity-50 ${
                            currentPage === batch
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-blue-900/40 dark:hover:text-blue-300'
                          }`}
                        >
                          {batch}
                        </button>
                      )
                    )}
                  </div>
                  <div className='mt-1 text-[9px] text-gray-400 dark:text-gray-500'>
                    pg {startLabel}–{endLabel} of {total}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }
);
DocumentItem.displayName = 'DocumentItem';

export const OCRViewerSidebar: React.FC<OCRViewerSidebarProps> = (props) => {
  const {
    documents,
    expandedDocuments,
    currentSectionId,
    currentDocumentId,
    isLoading,
    onDocumentToggle,
    onDocumentSelect,
    onRefresh,
    onSidebarToggle,
    isCollapsed,
    onPageSelect,
    onDocumentPageChange,
    getDocPagination,
  } = props;

  if (isCollapsed) {
    return null;
  }

  return (
    <div className='flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-800'>
      <SidebarHeader
        isLoading={isLoading}
        onRefresh={onRefresh}
        onToggle={onSidebarToggle}
      />

      {/* Sidebar Content */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading && documents.length === 0 ? (
          <div className='p-4 text-center text-xs text-gray-500 dark:text-gray-400'>
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className='p-4 text-center text-xs text-gray-500 dark:text-gray-400'>
            No documents found.
          </div>
        ) : (
          documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              doc={doc}
              isExpanded={expandedDocuments.has(doc.id)}
              isActive={currentDocumentId === doc.id}
              currentSectionId={currentSectionId}
              onToggle={onDocumentToggle}
              onSelect={onDocumentSelect}
              onPageSelect={onPageSelect}
              onDocumentPageChange={onDocumentPageChange}
              pagination={getDocPagination(doc.id)}
            />
          ))
        )}
      </div>

    </div>
  );
};