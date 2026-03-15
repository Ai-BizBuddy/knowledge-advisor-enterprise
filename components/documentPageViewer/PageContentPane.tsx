'use client';

import { useCallback, useMemo } from 'react';
import type { PageContentPaneProps } from './DocumentPageViewer.types';

/** Extract image references from markdown content — matches `![alt](image_id)` syntax.
 *  Includes any internal reference (not a URL). Covers: image_*, img-*, figure_*, etc. */
function extractImageRefs(text: string): { id: string }[] {
  const refs: { id: string }[] = [];
  const seen = new Set<string>();
  const mdImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = mdImageRegex.exec(text)) !== null) {
    const imageId = match[1];
    // Skip URLs and data URIs — only keep internal image references
    if (!imageId.startsWith('http') && !imageId.startsWith('data:') && !seen.has(imageId)) {
      seen.add(imageId);
      refs.push({ id: imageId });
    }
  }
  return refs;
}

export const PageContentPane: React.FC<PageContentPaneProps> = ({
  content,
  onImageRefHover,
  pageNumber,
  totalPages,
}) => {
  const imageRefs = useMemo(() => extractImageRefs(content), [content]);

  const handleMouseEnter = useCallback(
    (imageId: string) => onImageRefHover?.(imageId),
    [onImageRefHover],
  );
  const handleMouseLeave = useCallback(
    () => onImageRefHover?.(null),
    [onImageRefHover],
  );

  return (
    <div className='flex w-[40%] flex-col border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
      {/* Header */}
      <div className='flex h-10 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700'>
        <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>
          OCR Text — Page {pageNumber} of {totalPages}
        </span>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {/* Image ref badges */}
        {imageRefs.length > 0 && (
          <div className='flex flex-wrap gap-2 border-b border-gray-200 bg-green-50 px-4 py-2 dark:border-gray-700 dark:bg-green-900/20'>
            <span className='mr-1 self-center text-xs font-medium text-gray-500 dark:text-gray-400'>
              Images:
            </span>
            {imageRefs.map((ref) => (
              <span
                key={ref.id}
                className='inline-flex cursor-pointer items-center rounded-full border border-green-300 bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800 transition-all hover:bg-green-200 hover:border-green-400 hover:shadow-sm dark:border-green-700 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-800/60'
                onMouseEnter={() => handleMouseEnter(ref.id)}
                onMouseLeave={handleMouseLeave}
              >
                <svg className='mr-1 h-3 w-3' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                  <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                  <circle cx='8.5' cy='8.5' r='1.5' />
                  <polyline points='21 15 16 10 5 21' />
                </svg>
                {ref.id}
              </span>
            ))}
          </div>
        )}

        {/* Text content (read-only) */}
        <pre
          className='whitespace-pre-wrap p-6 font-mono text-sm leading-relaxed text-gray-900 dark:text-gray-100'
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {content || 'No text content for this page.'}
        </pre>
      </div>
    </div>
  );
};
