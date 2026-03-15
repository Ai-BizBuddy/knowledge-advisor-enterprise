import type { PageBBoxEntry } from '@/utils/normalizeBBox';

export interface DocPagination {
  currentPage: number;
  totalPages: number;
  total: number;
}

export interface OCRViewerSidebarProps {
  documents: DocumentWithSectionsUI[];
  expandedDocuments: Set<string>;
  currentSectionId: string | null;
  currentDocumentId: string | null;
  isLoading: boolean;
  onDocumentToggle: (documentId: string) => void;
  onDocumentSelect: (documentId: string) => void;
  onSectionSelect: (sectionId: string) => void;
  onRefresh: () => void;
  onSidebarToggle: () => void;
  isCollapsed: boolean;
  onPageSelect: (pageId: string) => void;
  currentPageId?: string | null;
  onDocumentPageChange: (docId: string, page: number) => void;
  getDocPagination: (docId: string) => DocPagination | null;
}

export interface DocumentWithSectionsUI {
  id: string;
  name: string;
  file_type: string;
  status: string;
  sections: SectionUI[];
  pages?: PageUI[];
  pageCount: number;
  /** True while the page list for this document is being fetched lazily. */
  isLoadingPages?: boolean;
}

export interface PageUI {
  id: string;
  pageNumber: number;
  hasImage: boolean;
  contentPreview?: string;
  /** Total pages reported by the document_page row. */
  pageCount: number;
  /** ISO timestamp of when this page was synced / created. */
  createdAt: string;
  /** Parent document id. */
  documentId: string;
  /** Knowledge base this page belongs to. */
  knowledgeBaseId: string | null;
}

export interface SectionUI {
  id: string;
  page: number;
  chunkIndex: number;
  contentPreview: string;
  bbox?: number[] | null;
}

export interface OCRPreviewPaneProps {
  images: OCRImageUI[];
  currentPage: number;
  isLoading: boolean;
  sections: SectionUI[];
  selectedSectionId: string | null;
  onSectionSelect: (sectionId: string) => void;
  onBBoxCreate?: (bbox: number[]) => void;
  hasContent: boolean;
  /** Bbox drawn but not yet saved — shown as an orange dashed overlay */
  pendingBBox?: number[] | null;
  /** Called when the user clicks Save BBox */
  onSaveBBox?: () => Promise<void>;
  /** Whether a save is in-flight */
  isSavingBBox?: boolean;
  /** Called when the user discards the pending bbox */
  onClearBBox?: () => void;
  /** Page-level bounding boxes from document_page.bbox column */
  pageBBoxes?: PageBBoxEntry[];
  /** Which page-level bbox is currently highlighted (by image_id) */
  highlightedBBoxId?: string | null;
  /** Fired when user hovers over a page-level bbox */
  onPageBBoxHover?: (imageId: string | null) => void;
  /** Fired when user clicks a page-level bbox */
  onPageBBoxSelect?: (imageId: string) => void;
  /** Page-level bbox currently selected for editing. */
  pendingPageBBoxEdit?: { imageId: string; bbox: number[] } | null;
  /** Called when the pending page-level bbox geometry changes via drag or resize. */
  onPageBBoxMove?: (imageId: string, bbox: number[]) => void;
  /** Called when the user saves the page-level bbox edit */
  onSavePageBBoxEdit?: () => Promise<void>;
  /** Whether a page bbox save is in-flight */
  isSavingPageBBox?: boolean;
  /** Called when the user discards the page-level bbox edit */
  onClearPageBBoxEdit?: () => void;
}

export interface OCRImageUI {
  id: string;
  base64: string;
}

export interface OCRTextPaneProps {
  content: string;
  metadata: OCRMetadataUI | null;
  images: OCRImageUI[];
  onUpdate?: (content: string) => Promise<void>;
  /** Fired when user hovers over an image reference in the OCR text (e.g. image_1_logo) */
  onImageRefHover?: (imageId: string | null) => void;
  /** Called when user wants to trigger page reprocessing via the ingress service */
  onPageReprocess?: (opts: {
    forceOcr: boolean;
    content: string;
  }) => Promise<void>;
  /** Whether a page reprocess job is currently in-flight */
  isReprocessing?: boolean;
}

export interface OCRMetadataUI {
  id: string;
  documentId: string;
  page: number;
  chunkIndex: number;
  chunkTotal: number;
  fileName: string;
  kbName: string;
  contentType: string;
  charCount: number;
  tokenCount: number;
  contextualHeaders: string[];
  bbox?: number[] | null;
}

export interface OCRMetadataDrawerProps {
  isOpen: boolean;
  metadata: Record<string, unknown> | null;
  onClose: () => void;
}

export interface OCRViewerProps {
  initialDocumentId?: string;
  initialSectionId?: string;
  knowledgeBaseId: string;
}
