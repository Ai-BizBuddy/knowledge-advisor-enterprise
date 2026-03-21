'use client';

import { normalizeImageId } from '@/utils/normalizeBBox';
import Image from 'next/image';
import { useRef, useState } from 'react';
import type { PageImagePaneProps } from './DocumentPageViewer.types';

export const PageImagePane: React.FC<PageImagePaneProps> = ({
  imageSrc,
  pageBBoxes,
  highlightedBBoxId,
  onBBoxHover,
  onBBoxSelect,
  currentPage,
  isLoading,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);
  const [localHoveredId, setLocalHoveredId] = useState<string | null>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageDims({ width: naturalWidth, height: naturalHeight });
    setImageLoaded(true);
  };

  return (
    <div className='relative flex flex-1 flex-col overflow-hidden bg-gray-100 dark:bg-gray-900'>
      {/* Toolbar */}
      <div className='flex h-10 items-center border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800'>
        <span className='text-xs text-gray-500 dark:text-gray-400'>
          Page{' '}
          <span className='font-medium text-gray-700 dark:text-gray-300'>
            {currentPage || '-'}
          </span>
        </span>
        {pageBBoxes.length > 0 && (
          <span className='ml-3 text-xs text-green-600 dark:text-green-400'>
            {pageBBoxes.length} image bbox{pageBBoxes.length > 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {/* Image area */}
      <div
        className='flex flex-1 items-start justify-center overflow-auto p-6'
        style={{
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {isLoading ? (
          <div className='flex items-center justify-center text-sm text-gray-500 dark:text-gray-400'>
            <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
            Loading page...
          </div>
        ) : !imageSrc ? (
          <div className='flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500'>
            <svg className='mb-3 h-10 w-10 opacity-30' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
              <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
              <polyline points='14 2 14 8 20 8' />
            </svg>
            <span className='text-sm'>No page image available</span>
          </div>
        ) : (
          <div className='relative inline-block bg-white shadow-lg dark:bg-gray-800'>
            <Image
              ref={imageRef}
              src={imageSrc}
              alt={`Page ${currentPage}`}
              width={imageDims?.width ?? 1}
              height={imageDims?.height ?? 1}
              sizes='100vw'
              unoptimized
              className='block max-w-full select-none'
              style={{ width: 'auto', height: 'auto', maxHeight: 'calc(100vh - 180px)' }}
              onLoad={handleImageLoad}
              draggable={false}
            />

            {/* SVG Bbox overlay */}
            {imageLoaded && pageBBoxes.length > 0 && (
              <svg
                className='pointer-events-auto absolute inset-0 h-full w-full'
                style={{ zIndex: 10 }}
              >
                {pageBBoxes.map((entry) => {
                  const { bbox, isNormalized, image_id } = entry;
                  const normalizedId = normalizeImageId(image_id);
                  const isHighlighted = (highlightedBBoxId != null && normalizeImageId(highlightedBBoxId) === normalizedId) || localHoveredId === image_id;

                  let x: string, y: string, w: string, h: string;
                  if (isNormalized) {
                    x = `${bbox[0] * 100}%`;
                    y = `${bbox[1] * 100}%`;
                    w = `${(bbox[2] - bbox[0]) * 100}%`;
                    h = `${(bbox[3] - bbox[1]) * 100}%`;
                  } else {
                    // Absolute pixel coords — defer until image natural dimensions are known
                    if (!imageDims) return null;
                    x = `${(bbox[0] / imageDims.width) * 100}%`;
                    y = `${(bbox[1] / imageDims.height) * 100}%`;
                    w = `${((bbox[2] - bbox[0]) / imageDims.width) * 100}%`;
                    h = `${((bbox[3] - bbox[1]) / imageDims.height) * 100}%`;
                  }

                  if (process.env.NODE_ENV === 'development') {
                    console.debug('[BBox PageImagePane]', { image_id, bbox, isNormalized, x, y, w, h });
                  }

                  return (
                    <g key={`page-bbox-${image_id}`}>
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        stroke={isHighlighted ? '#22c55e' : '#16a34a'}
                        strokeWidth={isHighlighted ? 3 : 2}
                        strokeDasharray={isHighlighted ? 'none' : '6 3'}
                        fill={isHighlighted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.08)'}
                        vectorEffect='non-scaling-stroke'
                        className='cursor-pointer transition-all'
                        onMouseEnter={() => {
                          setLocalHoveredId(image_id);
                          onBBoxHover?.(image_id);
                        }}
                        onMouseLeave={() => {
                          setLocalHoveredId(null);
                          onBBoxHover?.(null);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBBoxSelect?.(image_id);
                        }}
                      />
                      <text
                        x={x}
                        y={y}
                        dx='4'
                        dy='-4'
                        fill={isHighlighted ? '#15803d' : '#16a34a'}
                        fontSize='11'
                        fontFamily='monospace'
                        fontWeight={isHighlighted ? '700' : '500'}
                        pointerEvents='none'
                        style={{ textShadow: '0 0 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.7)' }}
                      >
                        {image_id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
