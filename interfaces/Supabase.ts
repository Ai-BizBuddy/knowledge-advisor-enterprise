/**
 * Supabase Database Type Definitions
 *
 * These interfaces define the exact structure of data returned from Supabase
 * to replace any types with proper TypeScript definitions.
 */

// Raw Supabase User type (subset of what we use)
export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// Raw Supabase Project data (matches knowledge_base table)
export interface SupabaseProjectRow {
  id: string;
  name: string;
  description: string;
  status: number; // 1=Active, 2=Paused, 3=Draft
  owner: string;
  created_at: string;
  updated_at: string;
}

// Raw Supabase Document data (matches documents table)
export interface SupabaseDocumentRow {
  id: string;
  name: string;
  type: string;
  status: string;
  project_id: string;
  chunk_count: number;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
  path: string;
  url: string;
  rag_status: string | null;
  last_rag_sync: string | null;
  metadata: Record<string, unknown> | null;
}

// Document processing status from the ingestion API
export interface DocumentProcessingStatus {
  documentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  lastUpdated: string;
  estimatedCompletion?: string;
}

// Job monitoring callback function type
export interface JobProgressCallback {
  (status: DocumentProcessingStatus): void;
}

// Document update data for Supabase operations
export interface DocumentUpdateData {
  rag_status?: 'not_synced' | 'syncing' | 'synced' | 'error';
  last_rag_sync?: string;
  updated_at?: string;
  chunk_count?: number;
  status?: string;
}

// Project update data for Supabase operations
export interface ProjectUpdateData {
  name?: string;
  description?: string;
  status?: number;
  updated_at?: string;
}

// Upload options for document upload
export interface DocumentUploadOptions {
  metadata?: Record<string, unknown>;
  autoSync?: boolean;
  cacheControl?: string;
  upsert?: boolean;
}

// Upload result from Supabase storage
export interface SupabaseUploadResult {
  data: {
    path: string;
    id: string;
    fullPath: string;
  } | null;
  document: SupabaseDocumentRow;
  signedUrl?: string;
}

// Connection test result
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    url?: string;
    schema?: string;
    tablesAccessible?: boolean;
    authWorking?: boolean;
  };
}

// Authentication test result
export interface AuthTestResult {
  isAuthenticated: boolean;
  user?: SupabaseUser;
  error?: string;
}

// Error types for better error handling
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// API Response wrapper for consistent error handling
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Search and filter types
export interface DocumentFilter {
  projectId?: string;
  type?: string;
  status?: string;
  ragStatus?: string;
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProjectFilter {
  status?: number;
  owner?: string;
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}
