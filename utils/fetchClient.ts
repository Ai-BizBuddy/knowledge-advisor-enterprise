/**
 * Enhanced Fetch Client - Base API Client
 *
 * Following the project's strict TypeScript standards
 */

import type {
  ApiClientConfig,
  ErrorInterceptor,
  FetchClient,
  RequestInterceptor,
  ResponseInterceptor,
  TypedFetchConfig,
  TypedFetchError,
  TypedFetchResponse,
} from '@/interfaces/FetchTypes';

/**
 * Base fetch client class with interceptors and error handling
 */
class BaseFetchClient implements FetchClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private retryAttempts: number;
  private retryDelay: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...config.defaultHeaders,
    };
    this.retryAttempts = config.retryAttempts || 0;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor<T = unknown>(
    interceptor: ResponseInterceptor<T>,
  ): void {
    this.responseInterceptors.push(interceptor as ResponseInterceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Create AbortController with timeout
   */
  private createAbortController(timeout?: number): AbortController {
    const controller = new AbortController();
    const timeoutMs = timeout || this.timeout;

    setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    return controller;
  }

  /**
   * Apply request interceptors
   */
  private applyRequestInterceptors(
    config: TypedFetchConfig & { url: string },
  ): TypedFetchConfig & { url: string } {
    return this.requestInterceptors.reduce(
      (acc, interceptor) => interceptor(acc),
      config,
    );
  }
  /**
   * Apply response interceptors
   */
  private applyResponseInterceptors<T>(
    response: TypedFetchResponse<T>,
  ): TypedFetchResponse<T> {
    return this.responseInterceptors.reduce(
      (acc, interceptor) => interceptor(acc) as TypedFetchResponse<T>,
      response,
    );
  }
  /**
   * Apply error interceptors
   */
  private applyErrorInterceptors(error: TypedFetchError): TypedFetchError {
    return this.errorInterceptors.reduce((acc, interceptor) => {
      try {
        return interceptor(acc);
      } catch {
        return acc; // Return original error if interceptor throws
      }
    }, error);
  }

  /**
   * Handle fetch errors and convert to consistent format
   */
  private handleFetchError(error: unknown, url: string): TypedFetchError {
    const fetchError: TypedFetchError = {
      message: 'An unknown error occurred',
      name: 'FetchError',
      url,
    };

    if (error instanceof Error) {
      fetchError.message = error.message;
      fetchError.name = error.name;
      fetchError.stack = error.stack;

      // Check for specific error types
      if (error.name === 'AbortError') {
        fetchError.isTimeoutError = true;
        fetchError.message = `Request timeout after ${this.timeout}ms`;
      } else if (error.message.includes('fetch')) {
        fetchError.isNetworkError = true;
        fetchError.message = 'Network error - please check your connection';
      }
    }

    return this.applyErrorInterceptors(fetchError);
  }

  /**
   * Parse response data based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    } else if (contentType.includes('text/')) {
      return (await response.text()) as T;
    } else {
      return (await response.blob()) as T;
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    url: string,
    config: TypedFetchConfig = {},
  ): Promise<TypedFetchResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    let requestConfig: TypedFetchConfig & { url: string } = {
      method: 'GET',
      headers: { 
        ...this.defaultHeaders,
        ...config.headers, // Merge custom headers after defaults
      },
      ...config,
      url: fullUrl,
    };

    // Apply request interceptors
    requestConfig = this.applyRequestInterceptors(requestConfig);

    const controller = this.createAbortController(config.timeout);
    
    // Create a proper Headers object to ensure Content-Type is preserved
    const headersObj = new Headers();
    if (requestConfig.headers) {
      Object.entries(requestConfig.headers).forEach(([key, value]) => {
        if (value) {
          headersObj.set(key, value);
        }
      });
    }
    
    const fetchConfig: RequestInit = {
      method: requestConfig.method,
      headers: headersObj,
      body: requestConfig.body,
      signal: config.signal || controller.signal,
    };

    let lastError: TypedFetchError | undefined;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(requestConfig.url, fetchConfig); // Handle HTTP errors
        if (!response.ok) {
          await this.parseResponse(response); // Parse to consume response body
          const httpError: TypedFetchError = {
            message: `HTTP ${response.status}: ${response.statusText}`,
            name: 'HTTPError',
            status: response.status,
            statusText: response.statusText,
            url: requestConfig.url,
          };
          throw httpError;
        }

        const data = await this.parseResponse<T>(response);

        const typedResponse: TypedFetchResponse<T> = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          url: response.url,
          ok: response.ok,
        };

        return this.applyResponseInterceptors(typedResponse);
      } catch (error) {
        lastError = this.handleFetchError(error, requestConfig.url);

        // Don't retry on certain errors
        if (
          lastError.status === 401 ||
          lastError.status === 403 ||
          lastError.status === 404
        ) {
          break;
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.retryAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * (attempt + 1)),
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    url: string,
    config?: TypedFetchConfig,
  ): Promise<TypedFetchResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: TypedFetchConfig,
  ): Promise<TypedFetchResponse<T>> {
    const body = data ? JSON.stringify(data) : undefined;
    return this.makeRequest<T>(url, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: TypedFetchConfig,
  ): Promise<TypedFetchResponse<T>> {
    const body = data ? JSON.stringify(data) : undefined;
    return this.makeRequest<T>(url, { ...config, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    url: string,
    config?: TypedFetchConfig,
  ): Promise<TypedFetchResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: TypedFetchConfig,
  ): Promise<TypedFetchResponse<T>> {
    const body = data ? JSON.stringify(data) : undefined;
    return this.makeRequest<T>(url, { ...config, method: 'PATCH', body });
  }
}

export { BaseFetchClient };
export type { FetchClient };

