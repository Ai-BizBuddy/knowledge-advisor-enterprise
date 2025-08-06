/**
 * Fetch API TypeScript interfaces to replace Axios types
 * Following the project's strict TypeScript standards
 */

/**
 * Enhanced fetch request configuration
 */
export interface TypedFetchConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: string | FormData | URLSearchParams;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Enhanced fetch response with proper typing
 */
export interface TypedFetchResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  url: string;
  ok: boolean;
}

/**
 * Enhanced fetch error with proper typing
 */
export interface TypedFetchError {
  message: string;
  name: string;
  stack?: string;
  code?: string;
  status?: number;
  statusText?: string;
  url?: string;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
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
 * Service response wrapper for consistent error handling
 */
export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
  status?: number;
}

/**
 * Base API client configuration
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Request interceptor function type
 */
export type RequestInterceptor = (config: TypedFetchConfig & { url: string }) => TypedFetchConfig & { url: string };

/**
 * Response interceptor function type
 */
export type ResponseInterceptor<T = unknown> = (response: TypedFetchResponse<T>) => TypedFetchResponse<T>;

/**
 * Error interceptor function type
 */
export type ErrorInterceptor = (error: TypedFetchError) => TypedFetchError | never;

/**
 * Base fetch client with interceptors and error handling
 */
export interface FetchClient {
  get<T = unknown>(url: string, config?: TypedFetchConfig): Promise<TypedFetchResponse<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: TypedFetchConfig): Promise<TypedFetchResponse<T>>;
  put<T = unknown>(url: string, data?: unknown, config?: TypedFetchConfig): Promise<TypedFetchResponse<T>>;
  delete<T = unknown>(url: string, config?: TypedFetchConfig): Promise<TypedFetchResponse<T>>;
  patch<T = unknown>(url: string, data?: unknown, config?: TypedFetchConfig): Promise<TypedFetchResponse<T>>;
}
