// Enhanced type definitions for Supabase operations to replace 'any' types

import { createClient } from '@/utils/supabase/client';
import type { SupabaseProjectRow } from '@/interfaces/AxiosTypes';

/**
 * Type for Supabase client with proper table access
 */
export type TypedSupabaseClient = ReturnType<typeof createClient>;

/**
 * Generic Supabase query result type
 */
export interface SupabaseQueryResult<T> {
  data: T[] | null;
  error: {
    message: string;
    code?: string;
  } | null;
  count?: number | null;
}

/**
 * Supabase count query result
 */
export interface SupabaseCountResult {
  count: number | null;
  error: {
    message: string;
    code?: string;
  } | null;
}

/**
 * Enhanced project row type with computed fields
 */
export interface EnhancedProjectRow extends SupabaseProjectRow {
  lastSync?: string;
  queries?: number;
  accuracy?: number;
}

/**
 * File upload progress event type
 */
export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload event handler type
 */
export type UploadProgressHandler = (progress: FileUploadProgress) => void;

/**
 * Supabase error response type
 */
export interface SupabaseError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Document metadata type for uploads
 */
export interface DocumentMetadata {
  originalName?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  fileType?: string;
  processingNotes?: string;
  [key: string]: unknown;
}

/**
 * Knowledge base document row from Supabase
 */
export interface SupabaseDocumentRow {
  id: string;
  name: string;
  url: string;
  project_id: string;
  file_size?: number;
  mime_type?: string;
  status?: string;
  rag_status?: "not_synced" | "syncing" | "synced" | "error";
  chunk_count?: number;
  last_rag_sync?: string;
  created_at: string;
  updated_at: string;
  knowledge_base?: {
    name: string;
    id: string;
  };
}

/**
 * Document with joined knowledge base information
 */
export interface DocumentWithProject {
  id: string;
  name: string;
  type?: string;
  status?: string;
  project_id: string;
  chunk_count?: number;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
  path?: string;
  url?: string;
  rag_status?: "not_synced" | "syncing" | "synced" | "error";
  last_rag_sync?: string;
  metadata?: Record<string, unknown>;
  knowledge_base?: Array<{
    name: string;
    owner: string;
  }>;
}

/**
 * Typed Supabase client operations
 */
export interface TypedSupabaseTable {
  from(table: string): {
    select: (columns?: string, options?: { count?: 'exact'; head?: boolean }) => Promise<SupabaseQueryResult<unknown>>;
    insert: (data: Record<string, unknown>) => Promise<SupabaseQueryResult<unknown>>;
    update: (data: Record<string, unknown>) => Promise<SupabaseQueryResult<unknown>>;
    delete: () => Promise<SupabaseQueryResult<unknown>>;
    eq: (column: string, value: unknown) => TypedSupabaseTable;
    in: (column: string, values: unknown[]) => TypedSupabaseTable;
    or: (query: string) => TypedSupabaseTable;
    order: (column: string, options?: { ascending?: boolean }) => TypedSupabaseTable;
    range: (from: number, to: number) => TypedSupabaseTable;
  };
}

/**
 * Progress callback type for job monitoring
 */
export interface JobProgress {
  progress?: number;
  status?: string;
  message?: string;
}

/**
 * Type for progress callback function
 */
export type ProgressCallback = (status: JobProgress) => void;
