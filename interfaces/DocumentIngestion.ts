// Document Ingestion API interfaces based on Swagger specification

export interface DocumentSyncRequest {
  documentIds?: string[]; // UUID array
  syncAll: boolean;
}

export interface DocumentSyncResponse {
  success: boolean;
  message?: string;
  processedDocumentIds?: string[]; // UUID array
  jobId?: string;
}

export interface DocumentStatusResponse {
  documentId: string; // UUID
  status?: string;
  errorMessage?: string;
  progress: number; // int32
  lastUpdated: string; // date-time
}

// Additional interfaces for enhanced functionality
export interface JobStatusResponse {
  jobId: string;
  status: string;
  progress: number;
  startTime?: string;
  endTime?: string;
  errorMessage?: string;
  processedCount?: number;
  totalCount?: number;
}

export interface FailedJobsResponse {
  jobs: FailedJob[];
  total: number;
}

export interface FailedJob {
  jobId: string;
  documentId?: string;
  errorMessage: string;
  failedAt: string;
  retryCount: number;
  maxRetries: number;
}

export interface PendingDocumentsResponse {
  documents: PendingDocument[];
  total: number;
}

export interface PendingDocument {
  documentId: string;
  name: string;
  queuedAt: string;
  priority: number;
  estimatedProcessingTime?: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

// Error response interface
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// เนื้อหาหลัก + เมตาดาทั้งหมด
export interface DeepSearchRes {
  content: string;
  metadata: ChunkMetadata;
  similarity: number;
}

// เมตาดาตาตามที่เห็นในตัวอย่าง
export interface ChunkMetadata {
  chunk_index: number;
  chunk_total: number;
  document_id: string;
  file_name: string;
  knowledge_id: string;
  page: number;
  // หมายเหตุ: [[Prototype]] ในตัวอย่างเป็นอาร์ติแฟกต์จากคอนโซล ไม่ต้องใส่ใน type
}
