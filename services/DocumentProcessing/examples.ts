/**
 * Example Usage of Document Processing API Integration
 *
 * This file demonstrates how to use the new document processing API
 * integrated into the Knowledge Advisor application.
 */

import documentProcessingApi from '@/services/DocumentProcessing';
import {
  syncDocumentToRAG,
  bulkSyncDocumentsToRAG,
} from '@/services/Project/supabase';

/**
 * Example 1: Check API Health
 */
export async function checkApiHealth() {
  try {
    const isHealthy = await documentProcessingApi.healthCheck();
    return isHealthy;
  } catch (error) {
        return false;
  }
}

/**
 * Example 2: Sync a single document
 */
export async function syncSingleDocument(
  projectId: string,
  documentId: string,
) {
  try {
    // This function now uses the new API internally
    await syncDocumentToRAG(projectId, documentId);
  } catch (error) {
        throw error;
  }
}

/**
 * Example 3: Bulk sync multiple documents
 */
export async function bulkSyncDocuments(
  projectId: string,
  documentIds: string[],
) {
  try {
    // This function now uses the new API internally
    const result = await bulkSyncDocumentsToRAG(projectId, documentIds);

    return result;
  } catch (error) {
        throw error;
  }
}

/**
 * Example 4: Monitor document processing status
 */
export async function monitorDocumentProcessing(documentId: string) {
  try {
    // Poll document status until completion
    const finalStatus = await documentProcessingApi.pollDocumentStatus(
      documentId,
      {
        timeout: 300000, // 5 minutes
        interval: 2000, // Check every 2 seconds
        onProgress: (status) => {},
      },
    );

    return finalStatus;
  } catch (error) {
        throw error;
  }
}

/**
 * Example 5: Get pending documents
 */
export async function viewPendingDocuments() {
  try {
    const pendingDocs = await documentProcessingApi.getPendingDocuments();

    return pendingDocs;
  } catch (error) {
        throw error;
  }
}

/**
 * Example 6: Handle failed jobs
 */
export async function handleFailedJobs() {
  try {
    const failedJobs = await documentProcessingApi.getFailedJobs();

    // Retry failed jobs
    if (Array.isArray(failedJobs) && failedJobs.length > 0) {
      for (const job of failedJobs) {
        try {
          await documentProcessingApi.retryJob(job.id);
        } catch (retryError) {
                  }
      }
    }

    return failedJobs;
  } catch (error) {
        throw error;
  }
}

/**
 * Example 7: Comprehensive document processing workflow
 */
export async function completeDocumentWorkflow(
  projectId: string,
  documentIds: string[],
) {
  try {
    // Step 1: Check API availability
    const isApiAvailable = await checkApiHealth();
    if (!isApiAvailable) {
      throw new Error('Document processing API is not available');
    }

    // Step 2: Start bulk sync
    const syncResult = await bulkSyncDocuments(projectId, documentIds);

    // Step 3: Monitor job progress if jobId is available
    if (syncResult.jobId) {
      const jobStatus = await documentProcessingApi.monitorJob(
        syncResult.jobId,
        {
          timeout: 600000, // 10 minutes
          interval: 3000, // Check every 3 seconds
          onProgress: (status) => {},
        },
      );

      if (jobStatus.status === 'failed') {
        throw new Error(`Job failed: ${jobStatus.errorMessage}`);
      }
    }

    // Step 4: Verify document statuses
    const documentStatuses = await Promise.all(
      documentIds.map((id) => documentProcessingApi.getDocumentStatus(id)),
    );

    return {
      syncResult,
      documentStatuses,
    };
  } catch (error) {
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
  completeDocumentWorkflow,
};
