'use client';

import { normalizeImageId } from '@/utils/normalizeBBox';
import Image from 'next/image';
import { useRef, useState, type MouseEvent } from 'react';
import type { OCRPreviewPaneProps } from './OCRViewer.types';

type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

const PAGE_BBOX_MIN_SIZE = 0.02;
const PAGE_BBOX_DRAG_PADDING_PX = 8;
/** Half-size of a draw.io-style handle as a percentage of the image dimension */
const HANDLE_HALF_PCT = 0.8;

const clampToUnit = (value: number) => Math.max(0, Math.min(1, value));

const getResizeCursor = (handle: ResizeHandle): string => {
  switch (handle) {
    case 'nw': case 'se': return 'nwse-resize';
    case 'ne': case 'sw': return 'nesw-resize';
    case 'n':  case 's':  return 'ns-resize';
    case 'e':  case 'w':  return 'ew-resize';
  }
};

/** 8 control points around a bbox: 4 corners + 4 edge midpoints (draw.io style) */
const getHandlePositions = (bbox: number[]): { handle: ResizeHandle; cx: number; cy: number }[] => {
  const [x1, y1, x2, y2] = bbox;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return [
    { handle: 'nw', cx: x1, cy: y1 },
    { handle: 'n',  cx: mx, cy: y1 },
    { handle: 'ne', cx: x2, cy: y1 },
    { handle: 'w',  cx: x1, cy: my },
    { handle: 'e',  cx: x2, cy: my },
    { handle: 'sw', cx: x1, cy: y2 },
    { handle: 's',  cx: mx, cy: y2 },
    { handle: 'se', cx: x2, cy: y2 },
  ];
};

/** Compute the new bbox after a resize drag for any of the 8 handles */
const computeResizedBBox = (
  handle: ResizeHandle,
  bbox: number[],
  pointerX: number,
  pointerY: number,
): number[] => {
  const [x1, y1, x2, y2] = bbox;
  const minS = PAGE_BBOX_MIN_SIZE;
  switch (handle) {
    case 'nw': return [Math.min(pointerX, x2 - minS), Math.min(pointerY, y2 - minS), x2, y2];
    case 'n':  return [x1, Math.min(pointerY, y2 - minS), x2, y2];
    case 'ne': return [x1, Math.min(pointerY, y2 - minS), Math.max(pointerX, x1 + minS), y2];
    case 'w':  return [Math.min(pointerX, x2 - minS), y1, x2, y2];
    case 'e':  return [x1, y1, Math.max(pointerX, x1 + minS), y2];
    case 'sw': return [Math.min(pointerX, x2 - minS), y1, x2, Math.max(pointerY, y1 + minS)];
    case 's':  return [x1, y1, x2, Math.max(pointerY, y1 + minS)];
    case 'se': return [x1, y1, Math.max(pointerX, x1 + minS), Math.max(pointerY, y1 + minS)];
  }
};

// Inline SVG Icon
const DocumentIcon = () => (
  <svg
    className='mb-4 h-12 w-12 opacity-30'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.5'
    viewBox='0 0 24 24'
  >
    <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
    <polyline points='14 2 14 8 20 8' />
    <line x1='16' y1='13' x2='8' y2='13' />
    <line x1='16' y1='17' x2='8' y2='17' />
    <polyline points='10 9 9 9 8 9' />
  </svg>
);

export const OCRPreviewPane: React.FC<OCRPreviewPaneProps> = ({
  images,
  currentPage,
  isLoading,
  sections,
  selectedSectionId,
  onSectionSelect,
  onBBoxCreate,
  hasContent,
  pendingBBox,
  onSaveBBox,
  isSavingBBox,
  onClearBBox,
  pageBBoxes,
  highlightedBBoxId,
  onPageBBoxHover,
  onPageBBoxSelect,
  pendingPageBBoxEdit,
  onPageBBoxMove,
  onSavePageBBoxEdit,
  isSavingPageBBox,
  onClearPageBBoxEdit,
}) => {
  // State for image handling and drawing
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDims, setImageDims] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [drawCurrent, setDrawCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [localHoveredBBoxId, setLocalHoveredBBoxId] = useState<string | null>(
    null,
  );
  const [isDraggingPendingBBox, setIsDraggingPendingBBox] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isHoveringPendingBBox, setIsHoveringPendingBBox] = useState(false);
  const [isDraggingPageBBox, setIsDraggingPageBBox] = useState(false);
  const [pageBBoxDragOffset, setPageBBoxDragOffset] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isHoveringPendingPageBBox, setIsHoveringPendingPageBBox] =
    useState(false);
  const [pageBBoxResizeHandle, setPageBBoxResizeHandle] =
    useState<ResizeHandle | null>(null);
  const [sectionBBoxResizeHandle, setSectionBBoxResizeHandle] =
    useState<ResizeHandle | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);

  /** Normalize a bbox to 0-1 range using imageDims. Returns as-is if already normalized. */
  const toNormBBox = (bbox: number[]): number[] | null => {
    if (bbox.every((v) => v <= 1.01)) return bbox;
    if (!imageDims) return null;
    return [
      bbox[0] / imageDims.width,
      bbox[1] / imageDims.height,
      bbox[2] / imageDims.width,
      bbox[3] / imageDims.height,
    ];
  };

  const beginPageBBoxDrag = (clientX: number, clientY: number) => {
    if (!pendingPageBBoxEdit || !imageRef.current) return;
    const nb = toNormBBox(pendingPageBBoxEdit.bbox);
    if (!nb) return;

    const imageRect = imageRef.current.getBoundingClientRect();
    const coords = {
      x: clientX - imageRect.left,
      y: clientY - imageRect.top,
    };
    const cw = imageRef.current.clientWidth;
    const ch = imageRef.current.clientHeight;

    setPageBBoxDragOffset({
      x: coords.x - nb[0] * cw,
      y: coords.y - nb[1] * ch,
    });
    setIsDraggingPageBBox(true);
    setIsHoveringPendingPageBBox(false);
  };

  // Get the first image to display (main document image)
  // Use explicit base64 images only
  const imageSrc = images.length > 0 ? images[0].base64 : null;

  // Handle image load to capture dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageDims({ width: naturalWidth, height: naturalHeight });
    setImageLoaded(true);
  };

  // Helper to get coordinates relative to the image
  const getRelativeCoordinates = (e: MouseEvent) => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  // Returns true if pixel point (px, py) — relative to displayed image — is inside pendingBBox
  const isInsidePendingBBox = (px: number, py: number): boolean => {
    if (!pendingBBox || !imageRef.current) return false;
    const cw = imageRef.current.clientWidth;
    const ch = imageRef.current.clientHeight;
    return (
      px >= pendingBBox[0] * cw &&
      px <= pendingBBox[2] * cw &&
      py >= pendingBBox[1] * ch &&
      py <= pendingBBox[3] * ch
    );
  };

  // Returns true if pixel point is inside the pending page-level bbox being edited
  const isInsidePendingPageBBox = (px: number, py: number): boolean => {
    if (!pendingPageBBoxEdit || !imageRef.current) return false;
    const nb = toNormBBox(pendingPageBBoxEdit.bbox);
    if (!nb) return false;
    const cw = imageRef.current.clientWidth;
    const ch = imageRef.current.clientHeight;
    const left = nb[0] * cw;
    const right = nb[2] * cw;
    const top = nb[1] * ch;
    const bottom = nb[3] * ch;

    return (
      px >= left - PAGE_BBOX_DRAG_PADDING_PX &&
      px <= right + PAGE_BBOX_DRAG_PADDING_PX &&
      py >= top - PAGE_BBOX_DRAG_PADDING_PX &&
      py <= bottom + PAGE_BBOX_DRAG_PADDING_PX
    );
  };

  // Mouse event handlers for drawing
  const handleMouseDown = (e: MouseEvent) => {
    if (!imageLoaded) return;
    const coords = getRelativeCoordinates(e);
    if (!coords) return;

    // If pendingPageBBoxEdit exists and click is inside it → drag the page bbox
    if (
      pendingPageBBoxEdit &&
      isInsidePendingPageBBox(coords.x, coords.y) &&
      imageRef.current
    ) {
      beginPageBBoxDrag(e.clientX, e.clientY);
      return;
    }

    // If pendingBBox exists and the click lands inside it → enter drag mode
    if (
      pendingBBox &&
      isInsidePendingBBox(coords.x, coords.y) &&
      imageRef.current
    ) {
      const cw = imageRef.current.clientWidth;
      const ch = imageRef.current.clientHeight;
      setDragOffset({
        x: coords.x - pendingBBox[0] * cw,
        y: coords.y - pendingBBox[1] * ch,
      });
      setIsDraggingPendingBBox(true);
      setIsHoveringPendingBBox(false);
      return;
    }

    // Otherwise enter draw mode
    if (!isDrawingMode) return;
    setDrawStart(coords);
    setDrawCurrent(coords);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const coords = getRelativeCoordinates(e);
    if (!coords) return;

    // Update hover state for section bbox cursor feedback
    if (pendingBBox && !isDraggingPendingBBox && !isDraggingPageBBox) {
      setIsHoveringPendingBBox(isInsidePendingBBox(coords.x, coords.y));
    }

    // Update hover state for page bbox cursor feedback
    if (pendingPageBBoxEdit && !isDraggingPageBBox && !isDraggingPendingBBox) {
      setIsHoveringPendingPageBBox(isInsidePendingPageBBox(coords.x, coords.y));
    }

    if (pageBBoxResizeHandle && pendingPageBBoxEdit && imageRef.current) {
      const nb = toNormBBox(pendingPageBBoxEdit.bbox);
      if (!nb) return;
      const pointerX = clampToUnit(coords.x / imageRef.current.clientWidth);
      const pointerY = clampToUnit(coords.y / imageRef.current.clientHeight);
      onPageBBoxMove?.(pendingPageBBoxEdit.imageId, computeResizedBBox(
        pageBBoxResizeHandle, nb, pointerX, pointerY,
      ));
      return;
    }

    // Resizing section-level pending bbox
    if (sectionBBoxResizeHandle && pendingBBox && imageRef.current) {
      const pointerX = clampToUnit(coords.x / imageRef.current.clientWidth);
      const pointerY = clampToUnit(coords.y / imageRef.current.clientHeight);
      onBBoxCreate?.(computeResizedBBox(sectionBBoxResizeHandle, pendingBBox, pointerX, pointerY));
      return;
    }

    // Dragging page-level bbox
    if (
      isDraggingPageBBox &&
      pageBBoxDragOffset &&
      pendingPageBBoxEdit &&
      imageRef.current
    ) {
      const cw = imageRef.current.clientWidth;
      const ch = imageRef.current.clientHeight;
      const { imageId } = pendingPageBBoxEdit;
      const nb = toNormBBox(pendingPageBBoxEdit.bbox);
      if (!nb) return;
      const bboxW = nb[2] - nb[0];
      const bboxH = nb[3] - nb[1];
      const newX1 = Math.max(
        0,
        Math.min(1 - bboxW, (coords.x - pageBBoxDragOffset.x) / cw),
      );
      const newY1 = Math.max(
        0,
        Math.min(1 - bboxH, (coords.y - pageBBoxDragOffset.y) / ch),
      );
      onPageBBoxMove?.(imageId, [newX1, newY1, newX1 + bboxW, newY1 + bboxH]);
      return;
    }

    // Dragging pendingBBox to a new position
    if (
      isDraggingPendingBBox &&
      dragOffset &&
      pendingBBox &&
      imageRef.current
    ) {
      const cw = imageRef.current.clientWidth;
      const ch = imageRef.current.clientHeight;
      const bboxW = pendingBBox[2] - pendingBBox[0];
      const bboxH = pendingBBox[3] - pendingBBox[1];
      const newX1 = Math.max(
        0,
        Math.min(1 - bboxW, (coords.x - dragOffset.x) / cw),
      );
      const newY1 = Math.max(
        0,
        Math.min(1 - bboxH, (coords.y - dragOffset.y) / ch),
      );
      onBBoxCreate?.([newX1, newY1, newX1 + bboxW, newY1 + bboxH]);
      return;
    }

    // Draw mode tracking
    if (!isDrawingMode || !drawStart) return;
    setDrawCurrent(coords);
  };

  const handleMouseUp = () => {
    if (sectionBBoxResizeHandle) {
      setSectionBBoxResizeHandle(null);
      return;
    }

    if (pageBBoxResizeHandle) {
      setPageBBoxResizeHandle(null);
      return;
    }

    // Stop dragging page bbox if active
    if (isDraggingPageBBox) {
      setIsDraggingPageBBox(false);
      setPageBBoxDragOffset(null);
      return;
    }

    // Stop dragging section bbox if active
    if (isDraggingPendingBBox) {
      setIsDraggingPendingBBox(false);
      setDragOffset(null);
      return;
    }

    if (!isDrawingMode || !drawStart || !drawCurrent || !imageRef.current)
      return;

    // Calculate final bbox
    const xMin = Math.min(drawStart.x, drawCurrent.x);
    const yMin = Math.min(drawStart.y, drawCurrent.y);
    const width = Math.abs(drawCurrent.x - drawStart.x);
    const height = Math.abs(drawCurrent.y - drawStart.y);

    // Only proceed if box is large enough (> 5px)
    if (width > 5 && height > 5) {
      // Normalize to [x1, y1, x2, y2] in 0-1 range against the displayed image size.
      // ClientRect coords are relative to displayed size, so dividing gives 0-1 normalised values.
      const currentWidth = imageRef.current.clientWidth;
      const currentHeight = imageRef.current.clientHeight;

      const normalizedBBox = [
        xMin / currentWidth, // x1
        yMin / currentHeight, // y1
        (xMin + width) / currentWidth, // x2
        (yMin + height) / currentHeight, // y2
      ];

      if (onBBoxCreate) {
        onBBoxCreate(normalizedBBox);
      }
    }

    setDrawStart(null);
    setDrawCurrent(null);
  };

  // Calculate temp box for drawing display
  const getTempBBox = () => {
    if (!drawStart || !drawCurrent || !imageRef.current) return null;

    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const w = Math.abs(drawCurrent.x - drawStart.x);
    const h = Math.abs(drawCurrent.y - drawStart.y);

    const currentWidth = imageRef.current.clientWidth;
    const currentHeight = imageRef.current.clientHeight;

    return {
      x: `${(x / currentWidth) * 100}%`,
      y: `${(y / currentHeight) * 100}%`,
      w: `${(w / currentWidth) * 100}%`,
      h: `${(h / currentHeight) * 100}%`,
    };
  };

  // Render a bounding box (section-level or pendingBBox).
  // Canonical format: [x1, y1, x2, y2] — width = x2 - x1, height = y2 - y1.
  const renderBBox = (bbox: number[], id: string, isSelected: boolean) => {
    if (!bbox || bbox.length < 4) return null;

    // Determine if bbox is normalized (0-1) or absolute pixels
    const isNormalized = bbox.every((val) => val <= 1.01);

    let x: string, y: string, w: string, h: string;

    if (isNormalized) {
      x = `${bbox[0] * 100}%`;
      y = `${bbox[1] * 100}%`;
      w = `${(bbox[2] - bbox[0]) * 100}%`;
      h = `${(bbox[3] - bbox[1]) * 100}%`;
    } else {
      // Absolute pixel coords — need natural dimensions to convert to %.
      // If image hasn't loaded yet, defer rendering (handled by onLoad callback).
      if (!imageDims) return null;
      x = `${(bbox[0] / imageDims.width) * 100}%`;
      y = `${(bbox[1] / imageDims.height) * 100}%`;
      w = `${((bbox[2] - bbox[0]) / imageDims.width) * 100}%`;
      h = `${((bbox[3] - bbox[1]) / imageDims.height) * 100}%`;
    }

    return (
      <rect
        key={id}
        x={x}
        y={y}
        width={w}
        height={h}
        stroke={isSelected ? 'red' : 'blue'}
        strokeWidth={isSelected ? 3 : 2}
        fill={isSelected ? 'rgba(255, 255, 0, 0.2)' : 'transparent'}
        vectorEffect='non-scaling-stroke'
        className='cursor-pointer transition-all hover:stroke-yellow-400'
        onClick={(e) => {
          e.stopPropagation();
          if (isSelected && onBBoxCreate) {
            // Second click on already-selected bbox → load as pendingBBox for dragging
            onBBoxCreate(bbox);
          } else {
            onSectionSelect(id);
          }
        }}
      />
    );
  };

  const svgCursor = pageBBoxResizeHandle
    ? getResizeCursor(pageBBoxResizeHandle)
    : sectionBBoxResizeHandle
      ? getResizeCursor(sectionBBoxResizeHandle)
      : isDraggingPendingBBox || isDraggingPageBBox
        ? 'grabbing'
        : isHoveringPendingBBox || isHoveringPendingPageBBox
          ? 'grab'
          : isDrawingMode
            ? 'crosshair'
            : 'default';

  return (
    <div className='relative flex flex-1 flex-col overflow-hidden border-r border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900'>
      {/* Preview Toolbar */}
      <div className='flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-4'>
          <span className='text-xs text-gray-500 dark:text-gray-400'>
            Page{' '}
            <span className='font-medium text-gray-700 dark:text-gray-300'>
              {currentPage || '-'}
            </span>
          </span>
        </div>

        <div className='flex items-center gap-2'>
          {/* Pending page bbox actions */}
          {pendingPageBBoxEdit && (
            <>
              <span className='text-xs text-purple-500 dark:text-purple-400'>
                Editing:{' '}
                <span className='font-mono font-medium'>
                  {pendingPageBBoxEdit.imageId}
                </span>
              </span>
              <button
                title='Discard page bbox edit'
                onClick={onClearPageBBoxEdit}
                disabled={isSavingPageBBox}
                className='rounded bg-transparent px-3 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
              >
                Cancel
              </button>
              <button
                title='Save page bbox new position to database'
                onClick={onSavePageBBoxEdit}
                disabled={isSavingPageBBox || !onSavePageBBoxEdit}
                className='flex items-center gap-1 rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {isSavingPageBBox ? (
                  <>
                    <svg
                      className='h-3 w-3 animate-spin'
                      viewBox='0 0 24 24'
                      fill='none'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z'
                      />
                    </svg>
                    Saving…
                  </>
                ) : (
                  'Save Page BBox'
                )}
              </button>
            </>
          )}

          {/* Pending section bbox actions */}
          {pendingBBox && (
            <>
              <button
                title='Discard drawn bbox'
                onClick={onClearBBox}
                disabled={isSavingBBox}
                className='rounded bg-transparent px-3 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
              >
                Clear
              </button>
              <button
                title={
                  onSaveBBox
                    ? 'Save drawn bbox to this section'
                    : 'Select a section to save BBox'
                }
                onClick={onSaveBBox}
                disabled={isSavingBBox || !onSaveBBox}
                className='flex items-center gap-1 rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {isSavingBBox ? (
                  <>
                    <svg
                      className='h-3 w-3 animate-spin'
                      viewBox='0 0 24 24'
                      fill='none'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z'
                      />
                    </svg>
                    Saving…
                  </>
                ) : (
                  'Save BBox'
                )}
              </button>
            </>
          )}

          {/* Draw Mode Toggle */}
          <button
            title='Toggle Draw Mode'
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              isDrawingMode
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {isDrawingMode ? 'Drawing On' : 'Draw Mode'}
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        className='flex flex-1 items-start justify-center overflow-auto p-8'
        style={{
          backgroundImage:
            'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        // Using a ref here to handle scroll if needed later, but mainly for structure
        ref={useRef<HTMLDivElement>(null)}
      >
        {isLoading ? (
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400'>
            Loading...
          </div>
        ) : !hasContent ? (
          <div className='flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400'>
            <DocumentIcon />
            <div className='text-sm'>
              Select a document section
              <br />
              to view content
            </div>
          </div>
        ) : (
          <div className='relative inline-block bg-white shadow-lg dark:bg-gray-800'>
            {imageSrc ? (
              <Image
                ref={imageRef}
                src={imageSrc}
                alt={`Page ${currentPage}`}
                width={0}
                height={0}
                sizes='100vw'
                unoptimized
                className='block max-w-full select-none'
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxHeight: 'calc(100vh - 200px)',
                }}
                onLoad={handleImageLoad}
                draggable={false}
              />
            ) : (
              <div className='flex h-96 w-72 items-center justify-center bg-gray-50 text-gray-400 dark:bg-gray-700 dark:text-gray-500'>
                No image available
              </div>
            )}

            {/* SVG Overlay */}
            {imageLoaded && (
              <svg
                className='pointer-events-auto absolute inset-0 h-full w-full'
                style={{ zIndex: 10, cursor: svgCursor }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Page-level bboxes from document_page.bbox (green, rendered first so sections overlay) */}
                {pageBBoxes &&
                  pageBBoxes.map((entry) => {
                    const { bbox, isNormalized, image_id } = entry;
                    const normalizedId = normalizeImageId(image_id);
                    const isHighlighted =
                      (highlightedBBoxId != null &&
                        normalizeImageId(highlightedBBoxId) === normalizedId) ||
                      localHoveredBBoxId === image_id;
                    // Skip the one that's currently being edited — it's rendered separately below
                    if (
                      pendingPageBBoxEdit &&
                      pendingPageBBoxEdit.imageId === image_id
                    )
                      return null;

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
                          fill={
                            isHighlighted
                              ? 'rgba(34, 197, 94, 0.2)'
                              : 'rgba(34, 197, 94, 0.08)'
                          }
                          vectorEffect='non-scaling-stroke'
                          className='cursor-pointer transition-all'
                          onMouseEnter={() => {
                            setLocalHoveredBBoxId(image_id);
                            onPageBBoxHover?.(image_id);
                          }}
                          onMouseLeave={() => {
                            setLocalHoveredBBoxId(null);
                            onPageBBoxHover?.(null);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPageBBoxSelect?.(image_id);
                          }}
                        />
                        {/* Label */}
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
                          style={{
                            textShadow:
                              '0 0 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.7)',
                          }}
                        >
                          {image_id}
                        </text>
                      </g>
                    );
                  })}

                {/* Render existing sections */}
                {sections.map(
                  (section) =>
                    section.bbox &&
                    section.bbox.length >= 4 &&
                    renderBBox(
                      section.bbox,
                      section.id,
                      section.id === selectedSectionId,
                    ),
                )}

                {/* Render saved pending bbox (orange dashed — drawn but not yet persisted) */}
                {pendingBBox &&
                  pendingBBox.length >= 4 &&
                  (() => {
                    const isNorm = pendingBBox.every((v) => v <= 1.01);
                    // Canonical format: [x1, y1, x2, y2] — width = x2 - x1
                    const px = isNorm
                      ? `${pendingBBox[0] * 100}%`
                      : imageDims
                        ? `${(pendingBBox[0] / imageDims.width) * 100}%`
                        : '0%';
                    const py = isNorm
                      ? `${pendingBBox[1] * 100}%`
                      : imageDims
                        ? `${(pendingBBox[1] / imageDims.height) * 100}%`
                        : '0%';
                    const pw = isNorm
                      ? `${(pendingBBox[2] - pendingBBox[0]) * 100}%`
                      : imageDims
                        ? `${((pendingBBox[2] - pendingBBox[0]) / imageDims.width) * 100}%`
                        : '0%';
                    const ph = isNorm
                      ? `${(pendingBBox[3] - pendingBBox[1]) * 100}%`
                      : imageDims
                        ? `${((pendingBBox[3] - pendingBBox[1]) / imageDims.height) * 100}%`
                        : '0%';
                    return (
                      <g key='pending-section-bbox'>
                        <rect
                          x={px}
                          y={py}
                          width={pw}
                          height={ph}
                          stroke='#2563eb'
                          strokeWidth='1.5'
                          fill='rgba(37, 99, 235, 0.08)'
                          vectorEffect='non-scaling-stroke'
                          style={{
                            cursor: isHoveringPendingBBox ? 'grab' : 'default',
                          }}
                        />
                        {isNorm &&
                          getHandlePositions(pendingBBox).map(({ handle, cx, cy }) => (
                            <rect
                              key={`section-handle-${handle}`}
                              x={`${cx * 100 - HANDLE_HALF_PCT}%`}
                              y={`${cy * 100 - HANDLE_HALF_PCT}%`}
                              width={`${HANDLE_HALF_PCT * 2}%`}
                              height={`${HANDLE_HALF_PCT * 2}%`}
                              fill='#2563eb'
                              stroke='white'
                              strokeWidth='1.5'
                              vectorEffect='non-scaling-stroke'
                              style={{ cursor: getResizeCursor(handle) }}
                              onMouseDown={(event) => {
                                event.stopPropagation();
                                setSectionBBoxResizeHandle(handle);
                                setIsHoveringPendingBBox(false);
                              }}
                              onClick={(event) => event.stopPropagation()}
                            />
                          ))}
                      </g>
                    );
                  })()}

                {/* Pending page-level bbox edit (purple dashed — drag to reposition, then save) */}
                {pendingPageBBoxEdit &&
                  pendingPageBBoxEdit.bbox.length >= 4 &&
                  (() => {
                    const { bbox, imageId } = pendingPageBBoxEdit;
                    const nb = toNormBBox(bbox);
                    const isNorm = bbox.every((v) => v <= 1.01);
                    const ex = isNorm
                      ? `${bbox[0] * 100}%`
                      : imageDims
                        ? `${(bbox[0] / imageDims.width) * 100}%`
                        : '0%';
                    const ey = isNorm
                      ? `${bbox[1] * 100}%`
                      : imageDims
                        ? `${(bbox[1] / imageDims.height) * 100}%`
                        : '0%';
                    const ew = isNorm
                      ? `${(bbox[2] - bbox[0]) * 100}%`
                      : imageDims
                        ? `${((bbox[2] - bbox[0]) / imageDims.width) * 100}%`
                        : '0%';
                    const eh = isNorm
                      ? `${(bbox[3] - bbox[1]) * 100}%`
                      : imageDims
                        ? `${((bbox[3] - bbox[1]) / imageDims.height) * 100}%`
                        : '0%';
                    return (
                      <g key={`pending-page-bbox-${imageId}`}>
                        <rect
                          x={ex}
                          y={ey}
                          width={ew}
                          height={eh}
                          stroke='#a855f7'
                          strokeWidth='1.5'
                          fill='rgba(168, 85, 247, 0.08)'
                          vectorEffect='non-scaling-stroke'
                          style={{
                            cursor: isHoveringPendingPageBBox
                              ? 'grab'
                              : 'default',
                          }}
                          onMouseDown={(event) => {
                            event.stopPropagation();
                            beginPageBBoxDrag(event.clientX, event.clientY);
                          }}
                          onClick={(event) => event.stopPropagation()}
                        />
                        {nb &&
                          getHandlePositions(nb).map(({ handle, cx, cy }) => (
                            <rect
                              key={`${imageId}-handle-${handle}`}
                              x={`${cx * 100 - HANDLE_HALF_PCT}%`}
                              y={`${cy * 100 - HANDLE_HALF_PCT}%`}
                              width={`${HANDLE_HALF_PCT * 2}%`}
                              height={`${HANDLE_HALF_PCT * 2}%`}
                              fill='#a855f7'
                              stroke='white'
                              strokeWidth='1.5'
                              vectorEffect='non-scaling-stroke'
                              data-resize-handle={handle}
                              style={{ cursor: getResizeCursor(handle) }}
                              onMouseDown={(event) => {
                                event.stopPropagation();
                                setPageBBoxResizeHandle(handle);
                                setIsHoveringPendingPageBBox(false);
                              }}
                              onClick={(event) => event.stopPropagation()}
                            />
                          ))}
                        <text
                          x={ex}
                          y={ey}
                          dx='4'
                          dy='-4'
                          fill='#a855f7'
                          fontSize='11'
                          fontFamily='monospace'
                          fontWeight='700'
                          pointerEvents='none'
                          style={{
                            textShadow: '0 0 3px rgba(255,255,255,0.9)',
                          }}
                        >
                          {imageId} ✎
                        </text>
                      </g>
                    );
                  })()}

                {/* Render drawing temp box */}
                {isDrawingMode &&
                  drawStart &&
                  drawCurrent &&
                  (() => {
                    const temp = getTempBBox();
                    if (!temp) return null;
                    return (
                      <rect
                        x={temp.x}
                        y={temp.y}
                        width={temp.w}
                        height={temp.h}
                        stroke='red'
                        strokeDasharray='4'
                        strokeWidth='2'
                        fill='rgba(255, 0, 0, 0.1)'
                        pointerEvents='none'
                      />
                    );
                  })()}
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
