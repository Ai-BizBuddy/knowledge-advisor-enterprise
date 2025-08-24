import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { Axios } from 'axios';
import type {
  DocumentSyncRequest,
  DocumentSyncResponse,
  DocumentStatusResponse,
  JobStatusResponse,
  DocumentProcessingConfig,
  PendingDocumentsResponse,
  FailedJobsResponse,
} from '@/interfaces/Project';

/**
 * Document Processing API Client
 *
 * This service handles communication with the KbIngestion.Api service
 * running on localhost:5001 for document processing and synchronization.
 */
class DocumentProcessingApiClient {
  private client: Axios;
  private config: DocumentProcessingConfig;

  constructor(config?: Partial<DocumentProcessingConfig>) {
    this.config = {
      baseUrl:
        process.env.NEXT_PUBLIC_INGRESS_SERVICE || 'https://localhost:5001',
      timeout: 30000, // 30 seconds
      retryAttempts: 1,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add request/response interceptors for logging and error handling
    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        console.log('[DocumentProcessingAPI] Request:', {
          url: config.url,
          method: config.method,
          data: config.data,
          params: config.params,
        });
        return config;
      },
      (error: Error) => {
        console.error('[DocumentProcessingAPI] Request error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: Error & { response?: AxiosResponse; code?: string }) => {
        console.error('[DocumentProcessingAPI] Response error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
        return Promise.reject(this.handleApiError(error));
      },
    );
  }

  /**
   * Handle API errors and convert them to user-friendly messages
   */
  private handleApiError(
    error: Error & { response?: AxiosResponse; code?: string },
  ): Error {
    if (error.code === 'ECONNREFUSED') {
      return new Error(
        'Document processing service is not available. Please check if the service is running on localhost:5001',
      );
    }

    if (error.response) {
      const status = error.response.status;
      const message =
        (error.response.data as { message?: string })?.message ||
        error.response.statusText;

      switch (status) {
        case 400:
          return new Error(`Bad request: ${message}`);
        case 404:
          return new Error(`Resource not found: ${message}`);
        case 500:
          return new Error(`Server error: ${message}`);
        default:
          return new Error(`API error (${status}): ${message}`);
      }
    }

    return new Error(error.message || 'Unknown API error');
  }

  /**
   * Retry mechanism for failed requests
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    attempts: number = this.config.retryAttempts!,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempts <= 1) {
        throw error;
      }

      console.warn(
        `[DocumentProcessingAPI] Operation failed, retrying... (${attempts - 1} attempts left)`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return this.withRetry(operation, attempts - 1);
    }
  }

  /**
   * Sync documents to the processing pipeline
   */
  async syncDocuments(
    request: DocumentSyncRequest,
  ): Promise<DocumentSyncResponse> {
    return this.withRetry(async () => {
      const response: AxiosResponse<DocumentSyncResponse> =
        await this.client.post('/api/Documents/sync', request);
      return response.data;
    });
  }

  /**
   * Get the status of a specific document
   */
  async getDocumentStatus(documentId: string): Promise<DocumentStatusResponse> {
    return this.withRetry(async () => {
      const response: AxiosResponse<DocumentStatusResponse> =
        await this.client.get(`/api/Documents/${documentId}/status`);
      return response.data;
    });
  }

  /**
   * Trigger processing for a specific document
   */
  async processDocument(documentId: string): Promise<void> {
    return this.withRetry(async () => {
      await this.client.post(`/api/Documents/${documentId}/process`);
    });
  }

  /**
   * Get list of pending documents
   */
  async getPendingDocuments(): Promise<PendingDocumentsResponse> {
    return this.withRetry(async () => {
      const response = await this.client.get<PendingDocumentsResponse>(
        '/api/Documents/pending',
      );
      return response.data;
    });
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return this.withRetry(async () => {
      const response: AxiosResponse<JobStatusResponse> = await this.client.get(
        `/api/Jobs/${jobId}/status`,
      );
      return response.data;
    });
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(): Promise<FailedJobsResponse> {
    return this.withRetry(async () => {
      const response =
        await this.client.get<FailedJobsResponse>('/api/Jobs/failed');
      return response.data;
    });
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<void> {
    return this.withRetry(async () => {
      await this.client.post(`/api/Jobs/${jobId}/retry`);
    });
  }

  /**
   * Check if the API service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to get pending documents as a health check
      await this.client.get('/api/Documents/pending', { timeout: 5000 });
      return true;
    } catch (error) {
      console.warn('[DocumentProcessingAPI] Health check failed:', error);
      return false;
    }
  }

  /**
   * Batch sync multiple documents
   */
  async batchSyncDocuments(
    documentIds: string[],
  ): Promise<DocumentSyncResponse> {
    return this.syncDocuments({
      documentIds,
      syncAll: false,
    });
  }

  /**
   * Sync all documents in the system
   */
  async syncAllDocuments(): Promise<DocumentSyncResponse> {
    return this.syncDocuments({
      syncAll: true,
    });
  }

  /**
   * Poll document status until completion or timeout
   */
  async pollDocumentStatus(
    documentId: string,
    options: {
      timeout?: number; // milliseconds
      interval?: number; // milliseconds
      onProgress?: (status: DocumentStatusResponse) => void;
    } = {},
  ): Promise<DocumentStatusResponse> {
    const { timeout = 300000, interval = 2000, onProgress } = options; // 5 minutes default timeout
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const status = await this.getDocumentStatus(documentId);

        if (onProgress) {
          onProgress(status);
        }

        // Check if processing is complete
        if (
          status.status === 'completed' ||
          status.status === 'failed' ||
          status.progress >= 100
        ) {
          return status;
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (error) {
        console.warn(
          `[DocumentProcessingAPI] Polling error for document ${documentId}:`,
          error,
        );
        // Continue polling even if a single request fails
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    throw new Error(
      `Polling timeout for document ${documentId} after ${timeout}ms`,
    );
  }

  /**
   * Monitor job progress until completion
   */
  async monitorJob(
    jobId: string,
    options: {
      timeout?: number;
      interval?: number;
      onProgress?: (status: JobStatusResponse) => void;
    } = {},
  ): Promise<JobStatusResponse> {
    const { timeout = 300000, interval = 2000, onProgress } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const status = await this.getJobStatus(jobId);

        if (onProgress) {
          onProgress(status);
        }

        // Check if job is complete
        if (status.status === 'completed' || status.status === 'failed') {
          return status;
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (error) {
        console.warn(
          `[DocumentProcessingAPI] Job monitoring error for ${jobId}:`,
          error,
        );
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    throw new Error(`Job monitoring timeout for ${jobId} after ${timeout}ms`);
  }
}

// Create and export a singleton instance
const documentProcessingApi = new DocumentProcessingApiClient();

export default documentProcessingApi;

// Export the class for custom configurations
export { DocumentProcessingApiClient };

// Export utility functions
export const createDocumentProcessingClient = (
  config?: Partial<DocumentProcessingConfig>,
) => {
  return new DocumentProcessingApiClient(config);
};

// Export types
export type {
  DocumentSyncRequest,
  DocumentSyncResponse,
  DocumentStatusResponse,
  JobStatusResponse,
  DocumentProcessingConfig,
};
