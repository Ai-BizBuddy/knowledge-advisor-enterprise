export interface OCRViewerSidebarProps {
  documents: DocumentWithSectionsUI[];
  expandedDocuments: Set<string>;
  currentSectionId: string | null;
  currentDocumentId: string | null;
  isLoading: boolean;
  onDocumentToggle: (documentId: string) => void;
  onSectionSelect: (sectionId: string) => void;
  onRefresh: () => void;
  onSidebarToggle: () => void;
  isCollapsed: boolean;
}

export interface DocumentWithSectionsUI {
  id: string;
  name: string;
  file_type: string;
  status: string;
  sections: SectionUI[];
  pageCount: number;
}

export interface SectionUI {
  id: string;
  page: number;
  chunkIndex: number;
  contentPreview: string;
}

export interface OCRPreviewPaneProps {
  images: OCRImageUI[];
  currentPage: number;
  isLoading: boolean;
  hasContent: boolean;
}

export interface OCRImageUI {
  id: string;
  base64: string;
}

export interface OCRTextPaneProps {
  content: string;
  metadata: OCRMetadataUI | null;
  images: OCRImageUI[];
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
}

export interface OCRMetadataDrawerProps {
  isOpen: boolean;
  metadata: Record<string, unknown> | null;
  onClose: () => void;
}

export interface OCRViewerProps {
  initialDocumentId?: string;
  initialSectionId?: string;
  knowledgeBaseId?: string;
}
