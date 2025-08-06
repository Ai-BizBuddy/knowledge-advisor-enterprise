/**
 * Example Usage of Document Processing API Integration
 * 
 * This file demonstrates how to use the new document processing API
 * integrated into the Knowledge Advisor application.
 */

import documentProcessingApi from '@/services/DocumentProcessing';
import { syncDocumentToRAG, bulkSyncDocumentsToRAG } from '@/services/Project/supabase';

/**
 * Example 1: Check API Health
 */
export async function checkApiHealth() {
  try {
    const isHealthy = await documentProcessingApi.healthCheck();
    console.log('Document processing API status:', isHealthy ? 'Available' : 'Unavailable');
    return isHealthy;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

/**
 * Example 2: Sync a single document
 */
export async function syncSingleDocument(projectId: string, documentId: string) {
  try {
    console.log(`Syncing document ${documentId} for project ${projectId}`);
    
    // This function now uses the new API internally
    await syncDocumentToRAG(projectId, documentId);
    
    console.log('Document sync completed successfully');
  } catch (error) {
    console.error('Document sync failed:', error);
    throw error;
  }
}

/**
 * Example 3: Bulk sync multiple documents
 */
export async function bulkSyncDocuments(projectId: string, documentIds: string[]) {
  try {
    console.log(`Bulk syncing ${documentIds.length} documents for project ${projectId}`);
    
    // This function now uses the new API internally
    const result = await bulkSyncDocumentsToRAG(projectId, documentIds);
    
    console.log('Bulk sync completed:', result);
    return result;
  } catch (error) {
    console.error('Bulk sync failed:', error);
    throw error;
  }
}

/**
 * Example 4: Monitor document processing status
 */
export async function monitorDocumentProcessing(documentId: string) {
  try {
    console.log(`Monitoring processing status for document ${documentId}`);
    
    // Poll document status until completion
    const finalStatus = await documentProcessingApi.pollDocumentStatus(
      documentId,
      {
        timeout: 300000, // 5 minutes
        interval: 2000,  // Check every 2 seconds
        onProgress: (status) => {
          console.log(`Document ${documentId} progress: ${status.progress}% - ${status.status}`);
        }
      }
    );
    
    console.log('Final status:', finalStatus);
    return finalStatus;
  } catch (error) {
    console.error('Status monitoring failed:', error);
    throw error;
  }
}

/**
 * Example 5: Get pending documents
 */
export async function viewPendingDocuments() {
  try {
    console.log('Fetching pending documents...');
    
    const pendingDocs = await documentProcessingApi.getPendingDocuments();
    console.log('Pending documents:', pendingDocs);
    
    return pendingDocs;
  } catch (error) {
    console.error('Failed to fetch pending documents:', error);
    throw error;
  }
}

/**
 * Example 6: Handle failed jobs
 */
export async function handleFailedJobs() {
  try {
    console.log('Fetching failed jobs...');
    
    const failedJobs = await documentProcessingApi.getFailedJobs();
    console.log('Failed jobs:', failedJobs);
    
    // Retry failed jobs
    if (Array.isArray(failedJobs) && failedJobs.length > 0) {
      for (const job of failedJobs) {
        try {
          console.log(`Retrying job ${job.id}...`);
          await documentProcessingApi.retryJob(job.id);
          console.log(`Job ${job.id} retry initiated`);
        } catch (retryError) {
          console.error(`Failed to retry job ${job.id}:`, retryError);
        }
      }
    }
    
    return failedJobs;
  } catch (error) {
    console.error('Failed to handle failed jobs:', error);
    throw error;
  }
}

/**
 * Example 7: Comprehensive document processing workflow
 */
export async function completeDocumentWorkflow(projectId: string, documentIds: string[]) {
  try {
    // Step 1: Check API availability
    const isApiAvailable = await checkApiHealth();
    if (!isApiAvailable) {
      throw new Error('Document processing API is not available');
    }
    
    // Step 2: Start bulk sync
    console.log('Starting document processing workflow...');
    const syncResult = await bulkSyncDocuments(projectId, documentIds);
    
    // Step 3: Monitor job progress if jobId is available
    if (syncResult.jobId) {
      const jobStatus = await documentProcessingApi.monitorJob(
        syncResult.jobId,
        {
          timeout: 600000, // 10 minutes
          interval: 3000,  // Check every 3 seconds
          onProgress: (status) => {
            console.log(`Job progress: ${status.status} - ${status.progress || 0}%`);
          }
        }
      );
      
      console.log('Job completed with status:', jobStatus.status);
      
      if (jobStatus.status === 'failed') {
        throw new Error(`Job failed: ${jobStatus.errorMessage}`);
      }
    }
    
    // Step 4: Verify document statuses
    console.log('Verifying document processing statuses...');
    const documentStatuses = await Promise.all(
      documentIds.map(id => documentProcessingApi.getDocumentStatus(id))
    );
    
    console.log('Document statuses:', documentStatuses);
    
    return {
      syncResult,
      documentStatuses
    };
    
  } catch (error) {
    console.error('Document workflow failed:', error);
    throw error;
  }
}

// Export usage examples
export const DocumentProcessingExamples = {
  checkApiHealth,
  syncSingleDocument,
  bulkSyncDocuments,
  monitorDocumentProcessing,
  viewPendingDocuments,
  handleFailedJobs,
  completeDocumentWorkflow
};
