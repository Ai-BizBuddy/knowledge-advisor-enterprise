/**
 * Document Search Service
 *
 * This service integrates Langflow AI search with Supabase document retrieval
 * to provide intelligent document search functionality using fetch API.
 * Follows the project's strict TypeScript standards.
 */

import type { Document } from '@/interfaces/Project';
import { BaseFetchClient } from '@/utils/fetchClient';
import { createClientTable } from '@/utils/supabase/client';

/**
 * Langflow search request interface
 */
export interface LangflowDocumentSearchRequest {
  input_value: string;
  output_type?: 'chat';
  input_type?: 'chat';
}

/**
 * Langflow response interface based on the API specification
 */
export interface LangflowDocumentSearchResponse {
  session_id: string;
  outputs: Array<{
    inputs: {
      input_value: string;
    };
    outputs: Array<{
      results: {
        message: {
          text_key: string;
          data: {
            timestamp: string;
            sender: string;
            sender_name: string;
            session_id: string;
            text: string;
            files: unknown[];
            error: boolean;
            edit: boolean;
            properties: Record<string, unknown>;
            category: string;
            content_blocks: unknown[];
            id: string;
            flow_id: string;
            duration: number | null;
          };
          default_value: string;
          text: string;
          sender: string;
          sender_name: string;
          files: unknown[];
          session_id: string;
          timestamp: string;
          flow_id: string;
          error: boolean;
          edit: boolean;
          properties: Record<string, unknown>;
          category: string;
          content_blocks: unknown[];
          duration: number | null;
        };
      };
      artifacts: {
        message: string;
        sender: string;
        sender_name: string;
        files: unknown[];
        type: string;
      };
      outputs: {
        message: {
          message: string;
          type: string;
        };
      };
      logs: {
        message: unknown[];
      };
      messages: Array<{
        message: string;
        sender: string;
        sender_name: string;
        session_id: string;
        stream_url: string | null;
        component_id: string;
        files: unknown[];
        type: string;
      }>;
      timedelta: number | null;
      duration: number | null;
      component_display_name: string;
      component_id: string;
      used_frozen_result: boolean;
    }>;
  }>;
}

/**
 * Document search result interface (individual document)
 */
export interface DocumentSearchResultItem {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  documentType: string;
  lastModified: string;
  projectId: string;
  projectName: string;
  matchedChunks?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Document search response interface (for hooks compatibility)
 */
export interface DocumentSearchResult {
  success: boolean;
  documents: DocumentSearchResultItem[];
  documentIds: string[];
  totalFound: number;
  searchQuery: string;
  sessionId?: string;
  error?: string;
}

/**
 * Search filters interface
 */
export interface DocumentSearchFilters {
  projectId?: string;
  documentType?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  minRelevanceScore?: number;
}

/**
 * Search response interface
 */
export interface DocumentSearchResponse {
  results: DocumentSearchResultItem[];
  totalCount: number;
  searchTime: number;
  query: string;
  filters?: DocumentSearchFilters;
}

/**
 * Document Search Service Configuration
 */
interface DocumentSearchServiceConfig {
  langflowUrl?: string;
  langflowSearchPath?: string;
  timeout?: number;
  useMockData?: boolean;
}

/**
 * Document Search Service Class
 *
 * Provides intelligent document search functionality by combining
 * Langflow AI search capabilities with Supabase document storage.
 */
class DocumentSearchService {
  private client: BaseFetchClient;
  private readonly serviceName = 'DocumentSearch';
  private readonly useMockData: boolean;

  constructor(config: DocumentSearchServiceConfig = {}) {
    const langflowUrl =
      config.langflowUrl ||
      process.env.NEXT_PUBLIC_LANGFLOW_URL ||
      'https://kann.zapto.org';
    const langflowSearchPath =
      config.langflowSearchPath ||
      process.env.NEXT_PUBLIC_LANGFLOW_SEARCH_PATH ||
      '/api/v1/run/30cee7c1-7393-47b9-8b09-cdbfec3f8431';

    this.client = new BaseFetchClient({
      baseURL: `${langflowUrl}${langflowSearchPath}`,
      timeout: config.timeout || 30000,
      defaultHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.useMockData = config.useMockData || false;
    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors for logging
   */
  private setupInterceptors(): void {
    this.client.addRequestInterceptor((config) => {
      return config;
    });

    this.client.addResponseInterceptor((response) => {
      return response;
    });

    this.client.addErrorInterceptor((error) => {
            return error;
    });
  }
  
  /**
   * Perform semantic search using Langflow
   */
  private async performLangflowSearch(
    query: string,
  ): Promise<LangflowDocumentSearchResponse> {
    const request: LangflowDocumentSearchRequest = {
      input_value: query,
      output_type: 'chat',
      input_type: 'chat',
    };

    try {
      const response = await this.client.post<LangflowDocumentSearchResponse>(
        '?stream=false',
        request,
      );
      return response.data;
    } catch (error) {
            throw new Error('Failed to perform AI search');
    }
  }

  /**
   * Get documents from Supabase for context
   */
  private async getDocumentsFromSupabase(
    projectIds?: string[],
  ): Promise<Document[]> {
    try {
      const supabaseTable = createClientTable();
      let query = supabaseTable.from('documents').select('*');

      if (projectIds && projectIds.length > 0) {
        query = query.in('project_id', projectIds);
      }

      const { data: documents, error } = await query;

      if (error) {
                throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      return documents || [];
    } catch (error) {
            throw error;
    }
  }
  /**
   * Transform Langflow response to search results
   */
  private transformLangflowResponse(
    langflowResponse: LangflowDocumentSearchResponse,
    query: string,
    documents: Document[],
  ): DocumentSearchResultItem[] {
    const results: DocumentSearchResultItem[] = [];

    try {
      // Extract the main response text
      const output = langflowResponse.outputs?.[0]?.outputs?.[0];
      if (!output) {
                return [];
      }

      const responseText = output.results?.message?.text || '';

      // For now, create a single result based on the AI response
      // In a real implementation, you would parse the response to match specific documents
      if (responseText && documents.length > 0) {
        const matchedDocument = documents[0]; // Simplified matching

        results.push({
          id: matchedDocument.id,
          title: matchedDocument.name,
          content: responseText,
          relevanceScore: 0.9, // This would be calculated based on the AI response
          documentType: matchedDocument.file_type,
          lastModified: matchedDocument.updated_at,
          projectId: matchedDocument.knowledge_base_id,
          projectName: 'Project', // Would need to join with projects table
          matchedChunks: [responseText.substring(0, 200) + '...'],
          metadata: {
            aiGenerated: true,
            sessionId: langflowResponse.session_id,
          },
        });
      }

      return results;
    } catch (error) {
            return [];
    }
  }

  /**
   * Search documents using AI-powered semantic search
   */
  async searchDocuments(
    query: string,
    filters?: DocumentSearchFilters,
  ): Promise<DocumentSearchResponse> {
    const startTime = Date.now();

    try {
      // Get documents from Supabase for context
      const projectIds = filters?.projectId ? [filters.projectId] : undefined;
      const documents = await this.getDocumentsFromSupabase(projectIds);

      if (documents.length === 0) {
        return {
          results: [],
          totalCount: 0,
          searchTime: Date.now() - startTime,
          query,
          filters,
        };
      }

      // Perform AI search using Langflow
      const langflowResponse = await this.performLangflowSearch(query);

      // Transform and combine results
      const results = this.transformLangflowResponse(
        langflowResponse,
        query,
        documents,
      );

      // Apply additional filters
      let filteredResults = results;
      if (filters?.minRelevanceScore) {
        filteredResults = results.filter(
          (r) => r.relevanceScore >= filters.minRelevanceScore!,
        );
      }

      return {
        results: filteredResults,
        totalCount: filteredResults.length,
        searchTime: Date.now() - startTime,
        query,
        filters,
      };
    } catch (error) {
            throw error;
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(partialQuery: string): Promise<string[]> {
    if (this.useMockData) {
      return [
        `${partialQuery} getting started`,
        `${partialQuery} best practices`,
        `${partialQuery} troubleshooting`,
        `${partialQuery} API reference`,
        `${partialQuery} examples`,
      ];
    }

    // In a real implementation, this could use a separate endpoint
    // or analyze existing document titles/content
    try {
      const documents = await this.getDocumentsFromSupabase();
      const suggestions = documents
        .filter((doc) =>
          doc.name.toLowerCase().includes(partialQuery.toLowerCase()),
        )
        .map((doc) => doc.name)
        .slice(0, 5);

      return suggestions;
    } catch (error) {
            return [];
    }
  }
  /**
   * Get recent searches (could be stored locally or in database)
   */
  async getRecentSearches(): Promise<string[]> {
    // This would typically be stored in localStorage or user preferences
    const recentSearches = [
      'API documentation',
      'user authentication',
      'data export',
    ];
    return recentSearches;
  }

  /**
   * Search documents and return in hook-compatible format
   */
  async searchDocumentsForHook(
    query: string,
    projectId?: string,
  ): Promise<DocumentSearchResult> {
    try {
      const filters: DocumentSearchFilters = projectId ? { projectId } : {};
      const response = await this.searchDocuments(query, filters);

      return {
        success: true,
        documents: response.results,
        documentIds: response.results.map((r) => r.id),
        totalFound: response.totalCount,
        searchQuery: query,
        sessionId: `search-${Date.now()}`, // Generate a session ID
      };
    } catch (error) {
            const errorMessage =
        error instanceof Error ? error.message : 'Search failed';

      return {
        success: false,
        documents: [],
        documentIds: [],
        totalFound: 0,
        searchQuery: query,
        error: errorMessage,
      };
    }
  }
}

export { DocumentSearchService };
export type { DocumentSearchServiceConfig };

