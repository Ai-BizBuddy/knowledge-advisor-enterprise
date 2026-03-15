import type { PageBBoxEntry } from '@/utils/normalizeBBox';

export interface DocumentPageViewerProps {
  documentId: string;
  knowledgeBaseId: string;
  initialPage?: number;
}

export interface PageImagePaneProps {
  /** Base64 image data URI for the current page */
  imageSrc: string | null;
  /** Page-level bounding boxes from document_page.bbox */
  pageBBoxes: PageBBoxEntry[];
  /** Which bbox is highlighted (by image_id) — driven by external hover */
  highlightedBBoxId?: string | null;
  /** Fired when hovering over a bbox in the image */
  onBBoxHover?: (imageId: string | null) => void;
  /** Fired when clicking a bbox */
  onBBoxSelect?: (imageId: string) => void;
  /** Current page number for display */
  currentPage: number;
  /** Whether data is loading */
  isLoading?: boolean;
}

export interface PageContentPaneProps {
  /** OCR text content for the page */
  content: string;
  /** Fired when hovering over an image reference in text */
  onImageRefHover?: (imageId: string | null) => void;
  /** Page number */
  pageNumber: number;
  /** Total pages */
  totalPages: number;
}

export interface PageNavigationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  documentName?: string;
  isLoading?: boolean;
}
