import type { BBoxEntry } from './DocumentSection';

export interface DocumentPage {
  id: string;
  document_id: string;
  page_number: number;
  content: string;
  base64?: string;
  base64_image?: string;
  page_count: number;
  created_at: string;
  knowledge_base_id: string | null;
  /** Page-level bounding boxes from OCR (e.g. Mistral) — array of {image_id, bbox} entries or JSON string */
  bbox?: BBoxEntry[] | string | null;
}

/** Lightweight version without the heavy `content` column — used for sidebar lists. */
export interface DocumentPageSummary {
  id: string;
  document_id: string;
  page_number: number;
  page_count: number;
  created_at: string;
  knowledge_base_id: string | null;
}

/** Paginated result from getPageListByDocumentId. */
export interface DocumentPageListResult {
  pages: DocumentPageSummary[];
  total: number;
  totalPages: number;
  currentPage: number;
}

/** Paginated result from getPageListByKnowledgeBaseIdAndDocumentId. */
export interface DocumentPageMapResult {
  pages: Map<string, DocumentPageSummary[]>;
  /** Per-document pagination info keyed by document_id. */
  pagination: Map<string, { total: number; totalPages: number; currentPage: number }>;
}
