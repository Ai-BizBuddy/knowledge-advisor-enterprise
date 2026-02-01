/**
 * Document Section Types for OCR Viewer
 * 
 * These interfaces match the knowledge.document_section table schema
 * and the metadata JSON structure from Mistral OCR processing.
 */

// OCR Image embedded in metadata
export interface OCRImage {
  id: string;
  base64: string;
}

// Document Section Metadata from Mistral OCR processing
export interface DocumentSectionMetadata {
  page: number;
  images: OCRImage[];
  article: string | null;
  chapter: string | null;
  kb_name: string;
  section: string | null;
  file_name: string;
  char_count: number;
  subsection: string | null;
  chunk_index: number;
  chunk_total: number;
  document_id: string;
  token_count: number;
  content_type: 'paragraph' | 'table' | 'list' | 'heading' | 'image' | 'code' | string;
  end_position: number;
  context_prefix: string | null;
  start_position: number;
  custom_metadata: Record<string, unknown>;
  cross_references: string[];
  paragraph_number: number;
  knowledge_base_id: string;
  contextual_headers: string[];
  embedding_call_number: number;
}

// Document Section from database
export interface DocumentSection {
  id: string;
  content: string;
  embedding: number[] | null;
  metadata: DocumentSectionMetadata | null;
  knowledge_id: string | null;
}

// Grouped document sections by page
export interface DocumentPageGroup {
  page: number;
  sections: DocumentSection[];
}

// Document with its sections for sidebar display
export interface DocumentWithSections {
  id: string;
  name: string;
  file_type: string;
  status: string;
  sections: DocumentSection[];
  pageCount: number;
}

// OCR Viewer state
export interface OCRViewerState {
  documents: DocumentWithSections[];
  currentSection: DocumentSection | null;
  currentDocumentId: string | null;
  expandedDocuments: Set<string>;
  isLoading: boolean;
  error: string | null;
}

// OCR Viewer query params
export interface OCRViewerParams {
  documentId?: string;
  sectionId?: string;
}
