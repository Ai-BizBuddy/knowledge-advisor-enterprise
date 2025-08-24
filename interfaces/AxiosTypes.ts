// Axios-specific TypeScript interfaces to replace 'any' types

import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * Enhanced Axios request config with proper typing
 */
export interface TypedAxiosRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url?: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  baseURL?: string;
}

/**
 * Enhanced Axios response with proper typing
 */
export interface TypedAxiosResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: InternalAxiosRequestConfig;
}

/**
 * Enhanced Axios error with proper typing
 */
export interface TypedAxiosError<T = unknown> {
  config?: InternalAxiosRequestConfig;
  request?: unknown;
  response?: AxiosResponse<T>;
  isAxiosError: true;
  toJSON: () => object;
  message: string;
  name: string;
  stack?: string;
  code?: string;
}

/**
 * API Error Response structure
 */
export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
  message?: string;
}

/**
 * Upload progress callback type
 */
export type UploadProgressCallback = (progressEvent: {
  loaded: number;
  total?: number;
  progress?: number;
}) => void;

/**
 * Supabase query result types
 */
export interface SupabaseProjectRow {
  id: string;
  name: string;
  description: string;
  status: number;
  owner: string;
  created_at: string;
  updated_at: string;
  document_count?: number;
}

/**
 * Upload status callback type for file uploads
 */
export interface UploadStatus {
  loaded: number;
  total: number;
  percentage: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

/**
 * File upload update data type
 */
export interface FileUploadUpdateData {
  status?: string;
  path?: string;
  url?: string;
  file_size?: number;
  mime_type?: string;
  updated_at?: string;
}

/**
 * Document processing update data type
 */
export interface DocumentProcessingUpdateData {
  rag_status?: 'not_synced' | 'syncing' | 'synced' | 'error';
  last_rag_sync?: string;
  chunk_count?: number;
  status?: string;
  updated_at?: string;
}
