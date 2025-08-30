/**
 * Services Index - Main Service Exports
 * 
 * This file provides singleton instances of all services and clean imports
 * following the project's service architecture standards.
 */

import { DocumentIngestionService } from './DocumentIngestionService';
import { KnowledgeBaseService } from './KnowledgeBaseService';
import DocumentService from './DocumentService';
import { DocumentSearchService } from './DocumentSearchService';
import { LangflowChatService } from './LangflowChatService';
import { LangflowSearchService } from './LangflowSearchService';
import { AdkChatService } from './AdkChatService';
import SortingService from './SortingService';
import { dashboardService } from './DashboardService';
import { statisticsService } from './StatisticsService';

/**
 * Service Configuration
 * 
 * Central configuration for all services with environment-based settings
 */
const serviceConfig = {
  useMockData: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
  timeout: 30000,
  retryAttempts: 2
};

/**
 * Document Ingestion Service Instance
 * 
 * Handles document processing and ingestion operations
 */
export const documentIngestionService = new DocumentIngestionService({
  baseURL: process.env.NEXT_PUBLIC_INGRESS_SERVICE || 'https://localhost:5001/api',
  timeout: serviceConfig.timeout,
  retryAttempts: serviceConfig.retryAttempts
});

/**
 * Knowledge Base Service Instance
 * 
 * Manages knowledge base CRUD operations using Supabase
 */
export const knowledgeBaseService = new KnowledgeBaseService();

/**
 * Document Service Instance
 * 
 * Manages document CRUD operations using Supabase with pagination support
 */
export const documentService = new DocumentService();

/**
 * Document Search Service Instance
 * 
 * Provides intelligent document search using Langflow AI integration
 */
export const documentSearchService = new DocumentSearchService({
  langflowUrl: process.env.NEXT_PUBLIC_LANGFLOW_URL,
  langflowSearchPath: process.env.NEXT_PUBLIC_LANGFLOW_SEARCH_PATH,
  timeout: serviceConfig.timeout,
  useMockData: serviceConfig.useMockData
});

/**
 * Langflow Chat Service Instance
 * 
 * Handles conversational AI interactions
 */
export const langflowChatService = new LangflowChatService({
  baseUrl: process.env.NEXT_PUBLIC_LANGFLOW_URL,
  chatPath: process.env.NEXT_PUBLIC_LANGFLOW_CHAT_PATH,
  timeout: 120000, // 2 minutes for chat responses
  retryAttempts: serviceConfig.retryAttempts,
  useMockData: serviceConfig.useMockData
});

/**
 * Langflow Search Service Instance
 * 
 * Provides semantic search functionality
 */
export const langflowSearchService = new LangflowSearchService({
  baseUrl: process.env.NEXT_PUBLIC_LANGFLOW_URL,
  searchPath: process.env.NEXT_PUBLIC_LANGFLOW_SEARCH_PATH,
  timeout: serviceConfig.timeout,
  retryAttempts: serviceConfig.retryAttempts,
  useMockData: serviceConfig.useMockData
});

/**
 * ADK Chat Service Instance
 * 
 * Handles conversational AI interactions using ADK with session management and SSE streaming
 */
export const adkChatService = new AdkChatService({
  baseUrl: process.env.NEXT_PUBLIC_ADK_BASE_URL,
  timeout: 120000, // 2 minutes for chat responses
  retryAttempts: serviceConfig.retryAttempts,
  useMockData: serviceConfig.useMockData
});

/**
 * Sorting Service Instance
 * 
 * Handles all sorting operations for documents and other data
 */
export const sortingService = new SortingService();

/**
 * Dashboard Service Instance
 * 
 * Provides centralized dashboard data aggregation
 */
export { dashboardService };

/**
 * Statistics Service Instance
 * 
 * Handles dashboard statistics and metrics
 */
export { statisticsService };

/**
 * Service Health Check
 * 
 * Utility function to check the health of all services
 */
export const checkAllServicesHealth = async () => {
  const healthChecks = await Promise.allSettled([
    documentIngestionService.checkHealth(),
    langflowChatService.checkHealth(),
    langflowSearchService.checkHealth(),
    adkChatService.checkHealth()
  ]);

  return {
    documentIngestion: healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : false,
    langflowChat: healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : false,
    langflowSearch: healthChecks[2].status === 'fulfilled' ? healthChecks[2].value : false,
    adkChat: healthChecks[3].status === 'fulfilled' ? healthChecks[3].value : false,
    timestamp: new Date().toISOString()
  };
};

/**
 * Legacy Export Compatibility
 * 
 * Export individual service classes for backwards compatibility
 */
export {
  DocumentIngestionService,
  KnowledgeBaseService,
  DocumentSearchService,
  LangflowChatService,
  LangflowSearchService,
  AdkChatService
};

/**
 * Service Type Exports
 * 
 * Export service configuration types for TypeScript support
 */
export type { DocumentIngestionService as DocumentIngestionServiceType } from './DocumentIngestionService';
export type { KnowledgeBaseService as KnowledgeBaseServiceType } from './KnowledgeBaseService';
export type { DocumentSearchService as DocumentSearchServiceType } from './DocumentSearchService';
export type { LangflowChatService as LangflowChatServiceType } from './LangflowChatService';
export type { LangflowSearchService as LangflowSearchServiceType } from './LangflowSearchService';
export type { AdkChatService as AdkChatServiceType } from './AdkChatService';

/**
 * Default Exports for Clean Imports
 * 
 * Aliases for the most commonly used services
 */
const services = {
  documentIngestion: documentIngestionService,
  knowledgeBase: knowledgeBaseService,
  documentSearch: documentSearchService,
  langflowChat: langflowChatService,
  langflowSearch: langflowSearchService,
  adkChat: adkChatService,
  sorting: sortingService,
  dashboard: dashboardService,
  statistics: statisticsService,
  checkHealth: checkAllServicesHealth
};

export default services;
