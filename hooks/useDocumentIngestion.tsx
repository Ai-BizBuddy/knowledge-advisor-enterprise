"use client";

import { useState, useEffect, useCallback } from 'react';
import documentProcessingApi from '@/services/DocumentProcessing';
import type {
  DocumentSyncRequest,
  DocumentSyncResponse,
  DocumentStatusResponse,
  JobStatusResponse
} from '@/interfaces/Project';
import type {
  PendingDocumentsResponse,
  FailedJobsResponse
} from '@/interfaces/DocumentIngestion';

export interface UseDocumentIngestionReturn {
  // Service availability
  isServiceAvailable: boolean;
  checkingHealth: boolean;
  
  // Sync operations
  syncDocuments: (request: DocumentSyncRequest) => Promise<DocumentSyncResponse>;
  syncSingleDocument: (documentId: string) => Promise<void>;
  syncAllDocuments: () => Promise<DocumentSyncResponse>;
  
  // Status monitoring
  getDocumentStatus: (documentId: string) => Promise<DocumentStatusResponse>;
  getMultipleStatuses: (documentIds: string[]) => Promise<DocumentStatusResponse[]>;
  
  // Job management
  getJobStatus: (jobId: string) => Promise<JobStatusResponse>;
  monitorJob: (jobId: string, onProgress?: (status: JobStatusResponse) => void) => Promise<JobStatusResponse>;
  retryJob: (jobId: string) => Promise<void>;
  
  // Queue management
  getPendingDocuments: () => Promise<PendingDocumentsResponse>;
  getFailedJobs: () => Promise<FailedJobsResponse>;
  
  // Utility functions
  checkHealth: () => Promise<boolean>;
  
  // State
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useDocumentIngestion = (): UseDocumentIngestionReturn => {
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check service health on mount and periodically
  const checkServiceHealth = useCallback(async () => {
    try {
      setCheckingHealth(true);
      const isAvailable = await documentProcessingApi.healthCheck();
      setIsServiceAvailable(isAvailable);
      
      if (!isAvailable && !error) {
        setError('Document processing service is not available. Please ensure the service is running on localhost:5001');
      } else if (isAvailable && error?.includes('not available')) {
        setError(null);
      }
    } catch (err) {
      console.warn('Health check failed:', err);
      setIsServiceAvailable(false);
    } finally {
      setCheckingHealth(false);
    }
  }, [error]);

  useEffect(() => {
    checkServiceHealth();
    
    // Check health every 30 seconds
    const healthInterval = setInterval(checkServiceHealth, 30000);
    
    return () => clearInterval(healthInterval);
  }, [checkServiceHealth]);

  const handleError = useCallback((err: unknown) => {
    const error = err as Error | { message?: string };
    const errorMessage = error?.message || 'An unknown error occurred';
    console.error('[DocumentIngestion Hook]:', errorMessage);
    setError(errorMessage);
    throw err;
  }, []);

  const syncDocuments = useCallback(async (request: DocumentSyncRequest): Promise<DocumentSyncResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await documentProcessingApi.syncDocuments(request);
      return response;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const syncSingleDocument = useCallback(async (documentId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await documentProcessingApi.processDocument(documentId);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const syncAllDocuments = useCallback(async (): Promise<DocumentSyncResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await documentProcessingApi.syncAllDocuments();
      return response;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getDocumentStatus = useCallback(async (documentId: string): Promise<DocumentStatusResponse> => {
    try {
      setError(null);
      return await documentProcessingApi.getDocumentStatus(documentId);
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const getMultipleStatuses = useCallback(async (documentIds: string[]): Promise<DocumentStatusResponse[]> => {
    try {
      setError(null);
      // Use Promise.all to get multiple document statuses
      return await Promise.all(
        documentIds.map(id => documentProcessingApi.getDocumentStatus(id))
      );
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const getJobStatus = useCallback(async (jobId: string): Promise<JobStatusResponse> => {
    try {
      setError(null);
      return await documentProcessingApi.getJobStatus(jobId);
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const monitorJob = useCallback(async (
    jobId: string, 
    onProgress?: (status: JobStatusResponse) => void
  ): Promise<JobStatusResponse> => {
    try {
      setError(null);
      return await documentProcessingApi.monitorJob(jobId, { onProgress });
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const retryJob = useCallback(async (jobId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await documentProcessingApi.retryJob(jobId);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getPendingDocuments = useCallback(async (): Promise<PendingDocumentsResponse> => {
    try {
      setError(null);
      const result = await documentProcessingApi.getPendingDocuments();
      // Adapt the response to match our interface
      return {
        documents: Array.isArray(result) ? result : [],
        total: Array.isArray(result) ? result.length : 0
      };
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const getFailedJobs = useCallback(async (): Promise<FailedJobsResponse> => {
    try {
      setError(null);
      const result = await documentProcessingApi.getFailedJobs();
      // Adapt the response to match our interface
      return {
        jobs: Array.isArray(result) ? result : [],
        total: Array.isArray(result) ? result.length : 0
      };
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const isAvailable = await documentProcessingApi.healthCheck();
      setIsServiceAvailable(isAvailable);
      return isAvailable;
    } catch (err) {
      console.warn('Manual health check failed:', err);
      setIsServiceAvailable(false);
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Service availability
    isServiceAvailable,
    checkingHealth,
    
    // Sync operations
    syncDocuments,
    syncSingleDocument,
    syncAllDocuments,
    
    // Status monitoring
    getDocumentStatus,
    getMultipleStatuses,
    
    // Job management
    getJobStatus,
    monitorJob,
    retryJob,
    
    // Queue management
    getPendingDocuments,
    getFailedJobs,
    
    // Utility functions
    checkHealth,
    
    // State
    loading,
    error,
    clearError
  };
};
