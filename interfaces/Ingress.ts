export type IngressPipeline = 'Full' | 'OcrOnly' | 'EmbeddingOnly' | 'ColPaliOnly';
export type IngressMode = 'Classic' | 'PerPage';

export interface IngressRequest {
  documentId: string;
  pipeline?: IngressPipeline;
  mode?: IngressMode;
}

export interface IngressMetadata {
  status?: string;
  page_count?: number;
  chunk_count?: number;
  [key: string]: unknown;
}

/** Response from PATCH /documents/sections/{sectionId} */
export interface SectionUpdateResponse {
  sectionId: string;
  content: string;
}

export interface IngressDeepSearchRequest {
  knowledge_base_ids: string[];
  query: string;
  limit?: number;
  min_score?: number;
}

/** Request body for POST /ingress/page — single-page reprocess or manual content update */
export interface PageReprocessRequest {
  document_id: string;
  page_number: number;
  /** New text content to store and re-embed. Pass `null` to force a fresh OCR scan instead. */
  content: string | null;
}

/** Response from POST /ingress/page */
export interface PageReprocessResponse {
  message: string;
  jobId: string;
  status: string;
  page: number;
  reprocessOcr: boolean;
}
