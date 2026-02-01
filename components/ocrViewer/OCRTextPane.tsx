'use client';

import type { OCRTextPaneProps } from './OCRViewer.types';

export const OCRTextPane: React.FC<OCRTextPaneProps> = ({
  content,
  metadata,
  images,
}) => {
  // Build frontmatter string
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
tokens: ${metadata.tokenCount}
---

`
    : '';

  const displayContent =
    content || 'Select a section to view extracted text...';
  const hasImages = images.length > 1; // More than just the main image

  return (
    <div
      className='flex flex-1 flex-col bg-white dark:bg-gray-800'
      style={{ maxWidth: '50%' }}
    >
      {/* Editor Toolbar */}
      <div className='flex h-12 items-center border-b border-gray-200 px-4 dark:border-gray-700'>
        <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
          Extracted Text
        </span>
      </div>

      {/* Editor Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <div
          className='min-h-full font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100'
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {metadata && (
            <span className='text-gray-400 dark:text-gray-500'>
              {frontmatter}
            </span>
          )}
          {displayContent}
        </div>

        {/* Contextual Headers */}
        {metadata && metadata.contextualHeaders.length > 0 && (
          <div className='mt-6 border-t border-gray-200 pt-6 dark:border-gray-700'>
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
          <div className='mt-6 border-t border-gray-200 pt-6 dark:border-gray-700'>
            <div className='mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
              Extracted Patches
            </div>
            <div className='space-y-4'>
              {images.slice(1).map((img, idx) => (
                <div key={img.id} className='space-y-1'>
                  <div className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                    Patch #{idx + 1} - {img.id}
                  </div>
                  <img
                    src={img.base64}
                    alt={`Patch ${idx + 1}`}
                    className='max-w-full rounded border border-gray-200 shadow-sm dark:border-gray-700'
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
