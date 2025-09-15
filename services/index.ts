/**
 * Services Index - Main Service Exports
 *
 * This file provides singleton instances of all services and clean imports
 * following the project's service architecture standards.
 */

import { AdkChatService } from './AdkChatService';
import { dashboardService } from './DashboardService';
import { DocumentIngestionService } from './DocumentIngestionService';
import { DocumentSearchService } from './DocumentSearchService';
import DocumentService from './DocumentService';
import { documentViewerService } from './DocumentViewerService';
import { KnowledgeBaseService } from './KnowledgeBaseService';
import { statisticsService } from './StatisticsService';

interface ServiceConfig {
  useMockData: boolean;
  timeout: number;
  retryAttempts: number;
}

const serviceConfig: Readonly<ServiceConfig> = {
  useMockData: false,
  timeout: 30000,
  retryAttempts: 2,
};

export const documentIngestionService = new DocumentIngestionService({
  baseURL: process.env.NEXT_PUBLIC_INGRESS_SERVICE || 'http://localhost:8000',
  timeout: serviceConfig.timeout,
  retryAttempts: serviceConfig.retryAttempts,
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
  useMockData: serviceConfig.useMockData,
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
  useMockData: serviceConfig.useMockData,
});

/**
 * Sorting Service Instance
 *
 * Centralized sorting utilities for documents
 */
// export const sortingService = new SortingService();

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
 * Document Viewer Service Instance
 * 
 * Handles document preview for chat links and file viewing
 */
  export { documentViewerService };

/**
 * Compatibility alias: some hooks import `langflowChatService` from services.
 * Route those calls to the ADK chat service for now.
 */
export const langflowChatService = adkChatService;

/**
 * Legacy Export Compatibility
 *
 * Export individual service classes for backwards compatibility
 */
export { default as DocumentService } from './DocumentService';
export {
  AdkChatService,
  DocumentIngestionService,
  DocumentSearchService,
  KnowledgeBaseService
};

/**
 * Service Type Exports
 *
 * Export service configuration types for TypeScript support
 */
  export type { AdkChatService as AdkChatServiceType } from './AdkChatService';
  export type { DocumentIngestionService as DocumentIngestionServiceType } from './DocumentIngestionService';
  export type { DocumentSearchService as DocumentSearchServiceType } from './DocumentSearchService';
  export type { KnowledgeBaseService as KnowledgeBaseServiceType } from './KnowledgeBaseService';
export type DocumentServiceType = InstanceType<typeof DocumentService>;

/**
 * Default Exports for Clean Imports
 *
 * Aliases for the most commonly used services
 */
export interface ServicesMap {
  documentIngestion: DocumentIngestionService;
  knowledgeBase: KnowledgeBaseService;
  documentSearch: DocumentSearchService;
  adkChat: AdkChatService;
  // document: DocumentService;
  dashboard: DocumentServiceType;
  statistics: typeof statisticsService;
}

const services: ServicesMap = {
  documentIngestion: documentIngestionService,
  knowledgeBase: knowledgeBaseService,
  documentSearch: documentSearchService,
  adkChat: adkChatService,
  dashboard: documentService,
  statistics: statisticsService,
};

export default services;
