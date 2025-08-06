/**
 * Document Ingestion Service - KbIngestion.Api Client
 * 
 * This service handles communication with the document ingestion API
 * for processing and syncing documents using fetch API instead of Axios.
 * Follows the project's strict TypeScript standards.
 */

import { BaseFetchClient } from '@/utils/fetchClient';
import type {
  DocumentSyncRequest,
  DocumentSyncResponse,
  DocumentStatusResponse,
  JobStatusResponse,
  FailedJobsResponse,
  PendingDocumentsResponse,
  ApiError
} from '@/interfaces/DocumentIngestion';
import type { TypedFetchError } from '@/interfaces/FetchTypes';

/**
 * Document Ingestion Service Configuration
 */
interface DocumentIngestionConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Document Ingestion Service Class
 * 
 * Handles all document processing and ingestion operations
 * with comprehensive error handling and monitoring capabilities.
 */
class DocumentIngestionService {
  private client: BaseFetchClient;
  private readonly serviceName = 'DocumentIngestion';

  constructor(config: DocumentIngestionConfig = {}) {
    this.client = new BaseFetchClient({
      baseURL: config.baseURL || 'https://localhost:5001/api',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 2,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request logging interceptor
    this.client.addRequestInterceptor((config) => {
      console.log(`[${this.serviceName}] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Response logging interceptor
    this.client.addResponseInterceptor((response) => {
      console.log(`[${this.serviceName}] Response:`, response.status, response.data);
      return response;
    });

    // Error handling interceptor
    this.client.addErrorInterceptor((error) => {
      console.error(`[${this.serviceName}] Error:`, error.status, error.message);
      return this.transformToApiError(error);
    });
  }

  /**
   * Transform fetch errors to consistent API error format
   */
  private transformToApiError(error: TypedFetchError): TypedFetchError {
    const apiError: ApiError = {
      message: 'An unknown error occurred',
      timestamp: new Date().toISOString()
    };

    if (error.status) {
      // HTTP error response
      apiError.message = error.message || `HTTP ${error.status}: ${error.statusText}`;
      apiError.code = error.status.toString();
    } else if (error.isNetworkError) {
      // Network error
      apiError.message = 'No response from server. Please check if the ingestion service is running on localhost:5001';
      apiError.code = 'NETWORK_ERROR';
    } else if (error.isTimeoutError) {
      // Timeout error
      apiError.message = 'Request timeout. The ingestion service may be overloaded';
      apiError.code = 'TIMEOUT_ERROR';
    } else {
      // Unknown error
      apiError.message = error.message;
      apiError.code = 'UNKNOWN_ERROR';
    }

    // Attach the API error to the original error
    return {
      ...error,
      message: apiError.message,
      code: apiError.code
    };
  }

  /**
   * Check if the ingestion service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/Documents/pending');
      return response.status === 200;
    } catch (error) {
      console.warn(`[${this.serviceName}] Health check failed:`, error);
      return false;
    }
  }

  /**
   * Sync documents to the ingestion system
   * POST /api/Documents/sync
   */
  async syncDocuments(request: DocumentSyncRequest): Promise<DocumentSyncResponse> {
    try {
      const response = await this.client.post<DocumentSyncResponse>('/Documents/sync', request);
      return response.data;
    } catch (error) {
      console.error(`[${this.serviceName}] Sync documents failed:`, error);
      throw error;
    }
  }

  /**
   * Get document processing status
   * GET /api/Documents/{id}/status
   */
  async getDocumentStatus(documentId: string): Promise<DocumentStatusResponse> {
    try {
      const response = await this.client.get<DocumentStatusResponse>(`/Documents/${documentId}/status`);
      return response.data;
    } catch (error) {
      console.error(`[${this.serviceName}] Get document status failed:`, error);
      throw error;
    }
  }

  /**
   * Process a specific document
   * POST /api/Documents/{id}/process
   */
  async processDocument(documentId: string): Promise<void> {
    try {
      await this.client.post(`/Documents/${documentId}/process`);
    } catch (error) {
      console.error(`[${this.serviceName}] Process document failed:`, error);
      throw error;
    }
  }

  /**
   * Get pending documents
   * GET /api/Documents/pending
   */
  async getPendingDocuments(): Promise<PendingDocumentsResponse> {
    try {
      const response = await this.client.get<PendingDocumentsResponse | unknown[]>('/Documents/pending');
      const data = response.data;
      
      // Handle both array and object responses
      if (Array.isArray(data)) {
        return {
          documents: data.map(doc => ({
            documentId: (doc as Record<string, unknown>).id as string || (doc as Record<string, unknown>).documentId as string,
            name: (doc as Record<string, unknown>).name as string || 'Unknown',
            queuedAt: (doc as Record<string, unknown>).queuedAt as string || new Date().toISOString(),
            priority: (doc as Record<string, unknown>).priority as number || 1
          })),
          total: data.length
        };
      }
      
      return data as PendingDocumentsResponse;
    } catch (error) {
      console.error(`[${this.serviceName}] Get pending documents failed:`, error);
      throw error;
    }
  }

  /**
   * Get job status
   * GET /api/Jobs/{jobId}/status
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    try {
      const response = await this.client.get<JobStatusResponse>(`/Jobs/${jobId}/status`);
      return response.data;
    } catch (error) {
      console.error(`[${this.serviceName}] Get job status failed:`, error);
      throw error;
    }
  }

  /**
   * Get failed jobs
   * GET /api/Jobs/failed
   */
  async getFailedJobs(): Promise<FailedJobsResponse> {
    try {
      const response = await this.client.get<FailedJobsResponse | unknown[]>('/Jobs/failed');
      const data = response.data;      if (Array.isArray(data)) {
        return {
          jobs: data.map(job => ({
            jobId: (job as Record<string, unknown>).jobId as string || 'unknown',
            documentId: (job as Record<string, unknown>).documentId as string,
            errorMessage: (job as Record<string, unknown>).errorMessage as string || 'Unknown error',
            failedAt: (job as Record<string, unknown>).failedAt as string || new Date().toISOString(),
            retryCount: (job as Record<string, unknown>).retryCount as number || 0,
            maxRetries: (job as Record<string, unknown>).maxRetries as number || 3
          })),
          total: data.length
        };
      }
      
      return data as FailedJobsResponse;
    } catch (error) {
      console.error(`[${this.serviceName}] Get failed jobs failed:`, error);
      throw error;
    }
  }

  /**
   * Retry a failed job
   * POST /api/Jobs/{jobId}/retry
   */
  async retryJob(jobId: string): Promise<void> {
    try {
      await this.client.post(`/Jobs/${jobId}/retry`);
    } catch (error) {
      console.error(`[${this.serviceName}] Retry job failed:`, error);
      throw error;
    }
  }

  /**
   * Batch sync multiple documents
   */
  async batchSyncDocuments(documentIds: string[]): Promise<DocumentSyncResponse> {
    return this.syncDocuments({
      documentIds,
      syncAll: false
    });
  }

  /**
   * Sync all documents
   */
  async syncAllDocuments(): Promise<DocumentSyncResponse> {
    return this.syncDocuments({
      syncAll: true
    });
  }

  /**
   * Get multiple document statuses
   */
  async getMultipleDocumentStatuses(documentIds: string[]): Promise<DocumentStatusResponse[]> {
    try {
      const promises = documentIds.map(id => this.getDocumentStatus(id));
      const results = await Promise.allSettled(promises);
      
      return results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<DocumentStatusResponse>).value);
    } catch (error) {
      console.error(`[${this.serviceName}] Get multiple document statuses failed:`, error);
      throw error;
    }
  }

  /**
   * Monitor job progress with polling
   */
  async monitorJob(
    jobId: string, 
    onProgress?: (status: JobStatusResponse) => void,
    pollInterval: number = 2000
  ): Promise<JobStatusResponse> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getJobStatus(jobId);
          
          if (onProgress) {
            onProgress(status);
          }
          
          // Check if job is complete
          if (status.status === 'completed' || status.status === 'failed') {
            resolve(status);
            return;
          }
          
          // Continue polling
          setTimeout(poll, pollInterval);
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }
}

export { DocumentIngestionService };
export type { DocumentIngestionConfig };
