'use client';

import { useToast } from '@/components/toast';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OCRTextPaneProps } from './OCRViewer.types';

/** Extract image references from markdown content — matches `![alt](image_id)` syntax.
 *  Includes any internal reference (not a URL). Covers: image_*, img-*, figure_*, etc. */
function extractImageRefs(text: string): { id: string; start: number; end: number }[] {
  const refs: { id: string; start: number; end: number }[] = [];
  const seen = new Set<string>();
  const mdImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = mdImageRegex.exec(text)) !== null) {
    const imageId = match[1];
    // Skip URLs and data URIs — only keep internal image references
    if (!imageId.startsWith('http') && !imageId.startsWith('data:') && !seen.has(imageId)) {
      seen.add(imageId);
      refs.push({ id: imageId, start: match.index, end: match.index + match[0].length });
    }
  }
  return refs;
}

export const OCRTextPane: React.FC<OCRTextPaneProps> = ({
  content,
  metadata,
  images,
  onUpdate,
  onImageRefHover,
  onPageReprocess,
  isReprocessing,
}) => {
  const { showToast } = useToast();
  const [localContent, setLocalContent] = useState(content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalContent(content || '');
    setIsDirty(false);
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(localContent);
      setIsDirty(false);
      showToast('Section content updated successfully.', 'success');
    } catch (error) {
      console.error('Failed to save extracted text:', error);
      showToast('Failed to save changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Format bbox with units: percentage for normalized (0-1), px for absolute.
  // bbox is canonical [x1, y1, x2, y2]; width and height are derived as x2-x1 and y2-y1.
  const formatBBox = (bbox: number[]): string => {
    const [x1, y1, x2, y2] = bbox;
    const isNorm = bbox.every((v) => v <= 1.01);
    if (isNorm) {
      return `x=${(x1 * 100).toFixed(2)}% y=${(y1 * 100).toFixed(2)}% w=${((x2 - x1) * 100).toFixed(2)}% h=${((y2 - y1) * 100).toFixed(2)}%`;
    }
    return `x=${Math.round(x1)}px y=${Math.round(y1)}px w=${Math.round(x2 - x1)}px h=${Math.round(y2 - y1)}px`;
  };

  const bboxLine =
    metadata?.bbox && metadata.bbox.length >= 4
      ? `\nbbox: ${formatBBox(metadata.bbox)}`
      : '';

  const frontmatter = metadata
    ? `---
id: ${metadata.id}
document_id: ${metadata.documentId}
page: ${metadata.page}
chunk: ${metadata.chunkIndex + 1} / ${metadata.chunkTotal}
file: ${metadata.fileName}
knowledge_base: ${metadata.kbName}
content_type: ${metadata.contentType}
chars: ${metadata.charCount}
tokens: ${metadata.tokenCount}${bboxLine}
---

`
    : '';

  const hasImages = images.length > 1; // More than just the main image

  /** Detected image references in content for hover-linking to page bboxes. */
  const imageRefs = useMemo(() => extractImageRefs(localContent), [localContent]);

  const handleImageRefMouseEnter = useCallback(
    (imageId: string) => onImageRefHover?.(imageId),
    [onImageRefHover],
  );
  const handleImageRefMouseLeave = useCallback(
    () => onImageRefHover?.(null),
    [onImageRefHover],
  );

  return (
    <div
      className='flex flex-1 flex-col bg-white dark:bg-gray-800'
      style={{ maxWidth: '50%' }}
    >
      {/* Editor Toolbar */}
      <div className='flex h-12 justify-between items-center border-b border-gray-200 px-4 dark:border-gray-700'>
        <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
          Extracted Text
        </span>
        <div className='flex items-center gap-2'>
          {onUpdate && isDirty && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className='rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50'
            >
              {isSaving ? 'Saving...' : 'Update Extracted Text'}
            </button>
          )}
          {onPageReprocess && (
            <>
              <button
                onClick={() => onPageReprocess({ forceOcr: false, content: localContent })}
                disabled={isReprocessing}
                title='Save current text and re-generate vector embeddings via ingress'
                className='rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1'
              >
                {isReprocessing ? (
                  <>
                    <svg className='h-3 w-3 animate-spin' viewBox='0 0 24 24' fill='none'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z' />
                    </svg>
                    Processing…
                  </>
                ) : (
                  'Update Embeddings'
                )}
              </button>
              <button
                onClick={() => onPageReprocess({ forceOcr: true, content: localContent })}
                disabled={isReprocessing}
                title='Force a fresh OCR scan for this page and re-generate embeddings'
                className='rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50'
              >
                Force Re-OCR
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className='flex-1 overflow-y-auto p-0'>
        
        {/* Frontmatter display (read-only) */}
        {metadata && (
          <div className='bg-gray-50 p-4 border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700'>
            <pre className='font-mono text-xs text-gray-400 whitespace-pre-wrap dark:text-gray-500'>
              {frontmatter}
            </pre>
          </div>
        )}

        {/* Image reference badges — hover to highlight corresponding bbox on page image */}
        {imageRefs.length > 0 && (
          <div className='flex flex-wrap gap-2 border-b border-gray-200 bg-green-50 px-4 py-2 dark:border-gray-700 dark:bg-green-900/20'>
            <span className='text-xs font-medium text-gray-500 dark:text-gray-400 self-center mr-1'>
              Images:
            </span>
            {imageRefs.map((ref) => (
              <span
                key={ref.id}
                className='inline-flex items-center rounded-full border border-green-300 bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800 cursor-pointer transition-all hover:bg-green-200 hover:border-green-400 hover:shadow-sm dark:border-green-700 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-800/60'
                onMouseEnter={() => handleImageRefMouseEnter(ref.id)}
                onMouseLeave={handleImageRefMouseLeave}
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

        {/* Info banner for multi-section pages where ingress editing is available */}
        {!onUpdate && onPageReprocess && localContent.length > 0 && (
          <div className='flex items-center gap-2 border-b border-blue-200 bg-blue-50 px-4 py-2 dark:border-blue-800 dark:bg-blue-900/20'>
            <svg className='h-3.5 w-3.5 shrink-0 text-blue-500' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            <span className='text-xs text-blue-700 dark:text-blue-400'>
              Multi-section page — edit content and click &quot;Update Embeddings&quot; to send to ingress
            </span>
          </div>
        )}

        {/* Read-only banner when no update path is available */}
        {!onUpdate && !onPageReprocess && localContent.length > 0 && (
          <div className='flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-800 dark:bg-amber-900/20'>
            <svg className='h-3.5 w-3.5 shrink-0 text-amber-500' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
              <path d='M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' />
            </svg>
            <span className='text-xs text-amber-700 dark:text-amber-400'>
              Multi-section page — select a single section chunk to enable editing
            </span>
          </div>
        )}

        <textarea
            className={`h-full w-full resize-none p-6 font-mono text-sm leading-relaxed outline-none min-h-125 ${
              !onUpdate && !onPageReprocess
                ? 'bg-gray-50 text-gray-500 cursor-default dark:bg-gray-900/50 dark:text-gray-400'
                : 'bg-transparent text-gray-900 dark:text-gray-100'
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            value={localContent}
            onChange={handleChange}
            readOnly={!onUpdate && !onPageReprocess}
            placeholder='Select a section to view extracted text...'
        />

        {/* Contextual Headers */}
        {metadata && metadata.contextualHeaders.length > 0 && (
          <div className='mt-6 border-t border-gray-200 pt-6 dark:border-gray-700 px-6 pb-6'>
            <div className='mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
              Context Headers
            </div>
            <div className='flex flex-wrap gap-2'>
              {metadata.contextualHeaders.map((header, idx) => (
                <span
                  key={idx}
                  className='rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                >
                  {header}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Extracted Patches / Additional Images */}
        {hasImages && (
          <div className='mt-6 border-t border-gray-200 pt-6 dark:border-gray-700 px-6 pb-6'>
            <div className='mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
              Extracted Patches
            </div>
            <div className='space-y-4'>
              {images.slice(1).map((img, idx) => (
                <div key={img.id} className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <div className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                      Patch #{idx + 1} - {img.id}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(img.base64);
                        showToast('Base64 copied to clipboard', 'success');
                      }}
                      className='text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
                    >
                      Copy Base64
                    </button>
                  </div>
                  <Image
                    src={img.base64}
                    alt={`Patch ${idx + 1}`}
                    width={0}
                    height={0}
                    sizes='100vw'
                    style={{ width: '100%', height: 'auto' }}
                    className='rounded border border-gray-200 shadow-sm dark:border-gray-700'
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
