// Project interface for Supabase - matches knowledge_base table schema
export interface Project {
  id: string; // UUID in Supabase
  name: string;
  description: string;
  document_count?: number; // Computed field
  status: 1 | 2; // 1=Active, 2=Paused, 3=Draft (smallint in DB)
  owner: string; // UUID foreign key to auth.users
  is_active: boolean; // Boolean for active status
  created_at: string;
  updated_at?: string;
  // Display properties for UI
  lastSync?: string;
  queries?: number;
  accuracy?: number;
}

// Status enum for better type safety
export enum ProjectStatus {
  ACTIVE = 1,
  INACTIVE = 2,
}

// Helper type for status display
export type ProjectStatusDisplay = "Active" | "Inactive";

// Create project input interface
export interface CreateProjectInput {
  name: string;
  description: string;
  status: ProjectStatus;
  visibility: 'public' | 'private' | 'department' | 'custom'; // 1=Public, 2=Private (optional, defaults to 2)
}

// Update project input interface
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

// Document interface for Supabase
export interface Document {
  id: string; // UUID in Supabase
  name: string;
  file_type: string; // File type (pdf, docx, txt, etc.)
  status: string; // Upload status (Uploaded, Processing, Error, etc.)
  knowledge_base_id: string; // UUID foreign key
  chunk_count: number;
  file_size?: number; // File size in bytes
  mime_type?: string; // MIME type of the file
  updated_at: string;
  created_at: string;
  path: string; // Storage file path
  url: string; // Signed URL or public URL
  rag_status?: "not_synced" | "syncing" | "synced" | "error";
  last_rag_sync?: string;
  metadata?: Record<string, unknown>; // Additional metadata about the document
}

// Extended interface for Knowledge Base detail page
export interface KnowledgeBase extends Project {
  queries?: number;
  accuracy?: number;
  lastSync?: string;
  storageSize?: string;
}

// Additional interfaces for enhanced functionality

// Document creation input interface
export interface CreateDocumentInput {
  name: string;
  type: string;
  knowledge_base_id: string;
  status?: string;
  file_size?: number;
  mime_type?: string;
  path: string;
  url: string;
  metadata?: Record<string, unknown>;
}

// Multiple documents creation input interface
export interface CreateMultipleDocumentsInput {
  knowledge_base_id: string;
  documents: Omit<CreateDocumentInput, 'knowledge_base_id'>[];
}

// Enhanced interface for file-based document creation
export interface CreateDocumentsFromFilesInput {
  knowledge_base_id: string;
  files: File[];
  metadata?: Record<string, unknown>;
}

// Document update input interface
export interface UpdateDocumentInput {
  name?: string;
  status?: string;
  chunk_count?: number;
  rag_status?: "not_synced" | "syncing" | "synced" | "error";
  last_rag_sync?: string;
  metadata?: Record<string, unknown>;
}

// Knowledge base analytics interface
export interface ProjectAnalytics {
  totalDocuments: number;
  totalSyncedDocuments: number;
  totalSize: number;
  recentActivity: number;
  averageChunkCount: number;
  syncSuccessRate: number;
  mostRecentSync: string;
}

// Pagination interface
export interface PaginationOptions {
  currentPage: number;
  totalPages: number;
  startIndex: number; // Optional for manual pagination
  endIndex: number; // Optional for manual pagination
  totalItems: number; // Optional for manual pagination
}

// Paginated response interface
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Search filters interface
export interface ProjectFilters {
  status?: ProjectStatus[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  hasDocuments?: boolean;
}

// Batch operation result interface
export interface BatchOperationResult {
  success: boolean;
  processedCount: number;
  totalCount: number;
  errors?: string[];
}

// RAG sync options interface
export interface RAGSyncOptions {
  force?: boolean; // Force sync even if already synced
  priority?: 'low' | 'normal' | 'high';
  retryCount?: number;
}

// Document upload options interface
export interface DocumentUploadOptions {
  generateThumbnail?: boolean;
  extractText?: boolean;
  autoSync?: boolean; // Automatically sync to RAG after upload
  metadata?: Record<string, unknown>;
}

// Document Processing API interfaces (KbIngestion.Api)
export interface DocumentSyncRequest {
  documentIds?: string[]; // Array of UUIDs
  syncAll: boolean;
}

export interface DocumentSyncResponse {
  success: boolean;
  message?: string;
  processedDocumentIds?: string[]; // Array of UUIDs
  jobId?: string;
}

export interface DocumentStatusResponse {
  documentId: string; // UUID
  status?: string;
  errorMessage?: string;
  progress: number; // 0-100
  lastUpdated: string; // ISO date string
}

export interface JobStatusResponse {
  jobId: string;
  status: string;
  progress?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// Response interfaces for document processing API
export interface PendingDocumentsResponse {
  documents: PendingDocument[];
  total: number;
}

export interface FailedJobsResponse {
  jobs: FailedJob[];
  total: number;
}

export interface PendingDocument {
  id: string;
  documentId: string;
  name: string;
  status: string;
  queuedAt: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface FailedJob {
  id: string;
  jobId: string;
  documentId?: string;
  errorMessage: string;
  failedAt: string;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  maxRetries: number;
}

// Document processing service configuration
export interface DocumentProcessingConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
}
