/**
 * Langflow Search Service
 *
 * This service handles semantic search requests using the Langflow API
 * for intelligent document content search across knowledge bases.
 * Uses fetch API instead of Axios following project standards.
 */

import { BaseFetchClient } from "@/utils/fetchClient";
import { createClient } from "@/utils/supabase/client";
import type { Document } from "@/interfaces/Project";

/**
 * Langflow search request interface
 */
export interface LangflowSearchRequest {
  input_value: string;
  output_type: "chat";
  input_type: "chat";
}

/**
 * Langflow search response interface
 */
export interface LangflowSearchResponse {
  outputs: Array<{
    outputs: Array<{
      results: {
        message: {
          text: string;
        };
      };
    }>;
  }>;
}

/**
 * Search result interface
 */
export interface SearchResult {
  content: string;
  relevanceScore: number;
  source?: string;
  page?: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Parsed Langflow chat response interface
 */
export interface ParsedLangflowResponse {
  documentIds: string[];
  pages: string[];
  content: string[];
}

/**
 * Enhanced search response interface
 */
export interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalResults: number;
  searchTime: number;
  sessionId?: string;
  documentIds?: string[];
}

/**
 * Langflow Search Service Configuration
 */
interface LangflowSearchServiceConfig {
  baseUrl?: string;
  searchPath?: string;
  timeout?: number;
  retryAttempts?: number;
  useMockData?: boolean;
}

/**
 * Langflow Search Service Class
 *
 * Provides semantic search functionality using the Langflow API
 * for intelligent content discovery across knowledge bases.
 */
class LangflowSearchService {
  private client: BaseFetchClient;
  private readonly serviceName = "LangflowSearch";
  private readonly useMockData: boolean;

  constructor(config: LangflowSearchServiceConfig = {}) {
    const baseUrl =
      config.baseUrl ||
      process.env.NEXT_PUBLIC_LANGFLOW_URL ||
      "https://kann.zapto.org";
    const searchPath =
      config.searchPath ||
      process.env.NEXT_PUBLIC_LANGFLOW_SEARCH_PATH ||
      "/api/v1/run/30cee7c1-7393-47b9-8b09-cdbfec3f8431";

    this.client = new BaseFetchClient({
      baseURL: `${baseUrl}${searchPath}`,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 2,
      defaultHeaders: {
        "Content-Type": "application/json",
        Accept: "application/json",
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
      console.error(`[${this.serviceName}] Search error:`, error.message);
      return error;
    });
  }
  /**
   * Generate mock search results for development
   */
  private generateMockResults(query: string): {
    results: SearchResult[];
    documentIds: string[];
  } {
    const mockDocumentIds = [
      "a126781b-0f17-4731-bed5-497d74c5bb7d",
      "b234892c-1g28-5842-cfe6-598e85d6cc8e",
      "c345903d-2h39-6953-dfg7-609f96e7dd9f",
    ];

    const results: SearchResult[] = [
      {
        content: `This document provides comprehensive information about ${query}. It covers the fundamental concepts, best practices, and implementation details that are essential for understanding this topic.`,
        relevanceScore: 0.95,
        source: "Getting Started Guide",
        page: "17",
        documentId: mockDocumentIds[0],
        metadata: {
          documentType: "PDF",
          lastModified: "2024-03-15T10:30:00Z",
          projectId: "1",
          page: "17",
        },
      },
      {
        content: `Advanced techniques and troubleshooting tips for ${query}. This section includes real-world examples and common pitfalls to avoid when working with these concepts.`,
        relevanceScore: 0.87,
        source: "Advanced User Manual",
        page: "11",
        documentId: mockDocumentIds[1],
        metadata: {
          documentType: "Markdown",
          lastModified: "2024-03-14T16:45:00Z",
          projectId: "2",
          page: "11",
        },
      },
      {
        content: `Frequently asked questions about ${query}. Find quick answers to common issues and learn from the experiences of other users.`,
        relevanceScore: 0.76,
        source: "FAQ Collection",
        page: "5",
        documentId: mockDocumentIds[2],
        metadata: {
          documentType: "HTML",
          lastModified: "2024-03-13T09:20:00Z",
          projectId: "3",
          page: "5",
        },
      },
    ];

    return { results, documentIds: mockDocumentIds };
  } /**
   * Parse Langflow chat response to extract document IDs, pages, and content
   *
   * Expected format:
   * dacuments_ids:[ "id1", "id2", ... ]
   * pages:["17","11"],
   * content:["..."]
   */
  private parseLangflowChatResponse(
    responseText: string,
  ): ParsedLangflowResponse {
    const result: ParsedLangflowResponse = {
      documentIds: [],
      pages: [],
      content: [],
    };

    try {
      // Extract documents_ids array - note the typo "dacuments_ids" in the expected format
      const documentsIdsMatch = responseText.match(
        /dacuments_ids:\s*\[\s*([^\]]+)\s*\]/i,
      );
      if (documentsIdsMatch) {
        const idsString = documentsIdsMatch[1];
        result.documentIds = idsString
          .split(",")
          .map((id) => id.trim().replace(/["']/g, ""))
          .filter((id) => id.length > 0 && id !== "undefined" && id !== "null");
      }

      // Extract pages array
      const pagesMatch = responseText.match(/pages:\s*\[\s*([^\]]+)\s*\]/i);
      if (pagesMatch) {
        const pagesString = pagesMatch[1];
        result.pages = pagesString
          .split(",")
          .map((page) => page.trim().replace(/["']/g, ""))
          .filter(
            (page) =>
              page.length > 0 && page !== "undefined" && page !== "null",
          );
      } // Extract content array - handle multiline content with quotes
      const contentMatch = responseText.match(/content:\s*\[\s*([^\]]+)\s*\]/i);
      if (contentMatch) {
        const contentString = contentMatch[1];
        // Split by commas but preserve content within quotes
        const contentItems = [];
        let currentItem = "";
        let inQuotes = false;
        let quoteChar = "";

        for (let i = 0; i < contentString.length; i++) {
          const char = contentString[i];

          if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = "";
          } else if (char === "," && !inQuotes) {
            if (currentItem.trim()) {
              contentItems.push(currentItem.trim().replace(/^["']|["']$/g, ""));
            }
            currentItem = "";
            continue;
          }

          currentItem += char;
        }

        // Add the last item
        if (currentItem.trim()) {
          contentItems.push(currentItem.trim().replace(/^["']|["']$/g, ""));
        }

        result.content = contentItems.filter((content) => content.length > 0);
      }

      console.log("Processed search result:", {
        documentIds: result.documentIds,
        pages: result.pages,
        contentCount: result.content.length,
      });

      return result;
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error parsing Langflow response:`,
        error,
      );
      return result;
    }
  }

  /**
   * Extract search results from Langflow response
   */ private extractSearchResults(
    response: LangflowSearchResponse,
    query: string,
  ): { results: SearchResult[]; documentIds: string[] } {
    const results: SearchResult[] = [];
    let documentIds: string[] = [];

    try {
      const outputs = response.outputs?.[0]?.outputs;
      if (!outputs || outputs.length === 0) {
        console.warn(
          `[${this.serviceName}] No outputs found in Langflow response`,
        );
        return { results, documentIds };
      }

      // Get the first output message text
      const firstOutput = outputs[0];
      const messageText = firstOutput.results?.message?.text;

      if (!messageText) {
        console.warn(
          `[${this.serviceName}] No message text found in Langflow response`,
        );
        return { results, documentIds };
      }

      // Parse the chat response format
      const parsed = this.parseLangflowChatResponse(messageText);
      documentIds = parsed.documentIds;

      // Create search results from parsed data
      const maxResults = Math.max(
        parsed.documentIds.length,
        parsed.pages.length,
        parsed.content.length,
      );

      for (let i = 0; i < maxResults; i++) {
        const documentId = parsed.documentIds[i];
        const page = parsed.pages[i];
        const content = parsed.content[i];

        if (documentId || content) {
          results.push({
            content:
              content || `Relevant content found in document ${documentId}`,
            relevanceScore: Math.max(0.9 - i * 0.1, 0.1),
            source: `Document ${documentId}`,
            page: page,
            documentId: documentId,
            metadata: {
              searchQuery: query,
              resultIndex: i,
              timestamp: new Date().toISOString(),
              page: page,
            },
          });
        }
      }

      return { results, documentIds };
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error extracting search results:`,
        error,
      );
      return { results, documentIds };
    }
  } /**
   * Fetch documents from Supabase by document IDs
   * Queries the knowledge_advisor.documents table
   */
  private async fetchDocumentsByIds(
    documentIds: string[],
  ): Promise<Document[]> {
    if (documentIds.length === 0) {
      return [];
    }

    try {
      const supabase = createClient();

      const { data: documents, error } = await supabase
        .from("documents")
        .select(
          `
          id,
          name,
          type,
          status,
          project_id,
          chunk_count,
          file_size,
          mime_type,
          metadata,
          created_at,
          updated_at
        `,
        )
        .in("id", documentIds);

      if (error) {
        console.error(
          `[${this.serviceName}] Error fetching documents from Supabase:`,
          error,
        );
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      const orderedDocuments: Document[] = [];
      for (const id of documentIds) {
        const doc = documents?.find((d) => d.id === id);
        if (doc) {
          // Convert Supabase document to our Document interface
          const fullDoc: Document = {
            ...doc,
            path: "",
            url: "",
            rag_status: "synced" as const,
            last_rag_sync: doc.updated_at,
          };
          orderedDocuments.push(fullDoc);
        }
      }

      return orderedDocuments;
    } catch (error) {
      console.error(
        `[${this.serviceName}] Failed to fetch documents from Supabase:`,
        error,
      );
      return [];
    }
  }
  /**
   * Enhanced search that fetches actual documents from Supabase using Langflow document IDs
   */
  async searchWithDocuments(
    query: string,
  ): Promise<SearchResponse & { documents: Document[] }> {
    // First perform the regular search to get document IDs from Langflow
    const searchResponse = await this.search(query);

    // Fetch actual documents from Supabase using the document IDs returned by Langflow
    let documents: Document[] = [];
    if (searchResponse.documentIds && searchResponse.documentIds.length > 0) {
      documents = await this.fetchDocumentsByIds(searchResponse.documentIds);
      // Enhance search results with actual document information
      searchResponse.results = searchResponse.results.map((result) => {
        const document = documents.find((doc) => doc.id === result.documentId);
        if (document) {
          return {
            ...result,
            source: document.name,
            metadata: {
              ...result.metadata,
              documentName: document.name,
              documentType: document.type,
              projectId: document.project_id,
              projectName:
                (document.metadata?.project_name as string) ||
                "Unknown Project",
              uploadedAt: document.created_at,
              fileSize: document.file_size,
              chunkCount: document.chunk_count,
              mimeType: document.mime_type,
              documentStatus: document.status,
            },
          };
        } else {
          console.warn(
            `[${this.serviceName}] Document ${result.documentId} not found in Supabase`,
          );
        }
        return result;
      });
    } else {
    }

    return {
      ...searchResponse,
      documents,
    };
  }

  /**
   * Perform semantic search
   */
  async search(query: string): Promise<SearchResponse> {
    const startTime = Date.now();

    if (this.useMockData) {
      // Simulate network delay
      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 1000),
      );

      const { results: mockResults, documentIds: mockDocumentIds } =
        this.generateMockResults(query);
      return {
        results: mockResults,
        query,
        totalResults: mockResults.length,
        searchTime: Date.now() - startTime,
        sessionId: `mock-search-${Date.now()}`,
        documentIds: mockDocumentIds,
      };
    }

    try {
      const request: LangflowSearchRequest = {
        input_value: query,
        output_type: "chat",
        input_type: "chat",
      };

      console.log("Sending search request:", {
        query: query,
        body: request,
      });

      const response = await this.client.post<LangflowSearchResponse>(
        "?stream=false",
        request,
      );
      const { results, documentIds } = this.extractSearchResults(
        response.data,
        query,
      );
      const searchTime = Date.now() - startTime;

      const searchResponse: SearchResponse = {
        results,
        query,
        totalResults: results.length,
        searchTime,
        documentIds,
      };

      return searchResponse;
    } catch (error) {
      console.error(`[${this.serviceName}] Search failed:`, error);

      // Return empty results on error
      return {
        results: [],
        query,
        totalResults: 0,
        searchTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Search within specific documents
   */
  async searchInDocuments(
    query: string,
    documents: Document[],
  ): Promise<SearchResponse> {
    // For now, perform a regular search and filter results based on document context
    // In a real implementation, you might send document context to Langflow
    const searchResponse = await this.search(query); // Add document context to metadata
    searchResponse.results = searchResponse.results.map((result) => ({
      ...result,
      metadata: {
        ...result.metadata,
        contextDocuments: documents.map((doc) => doc.name),
        documentCount: documents.length,
      },
    }));

    return searchResponse;
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(partialQuery: string): Promise<string[]> {
    if (this.useMockData) {
      return [
        `${partialQuery} best practices`,
        `${partialQuery} getting started`,
        `${partialQuery} troubleshooting`,
        `${partialQuery} API reference`,
        `${partialQuery} examples and tutorials`,
      ];
    }

    // In a real implementation, this could use a separate suggestion endpoint
    // or analyze previous successful searches
    try {
      const searchResponse = await this.search(partialQuery);
      // Extract potential suggestions from search results
      const suggestions = searchResponse.results.slice(0, 5).map((result) => {
        // Extract first meaningful phrase from content
        const words = result.content.split(" ").slice(0, 3).join(" ");
        return `${partialQuery} ${words}`;
      });

      return suggestions;
    } catch (error) {
      console.error(`[${this.serviceName}] Failed to get suggestions:`, error);
      return [];
    }
  }

  /**
   * Check if the Langflow search service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.search("health check");
      return response.results.length >= 0; // Any response indicates health
    } catch (error) {
      console.warn(`[${this.serviceName}] Health check failed:`, error);
      return false;
    }
  }

  /**
   * Get service status information
   */
  async getServiceStatus(): Promise<{
    available: boolean;
    responseTime?: number;
    version?: string;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const isHealthy = await this.checkHealth();
      const responseTime = Date.now() - startTime;

      return {
        available: isHealthy,
        responseTime,
        version: "1.0.0",
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Batch search multiple queries
   */
  async batchSearch(queries: string[]): Promise<SearchResponse[]> {
    const results = await Promise.allSettled(
      queries.map((query) => this.search(query)),
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          results: [],
          query: queries[index],
          totalResults: 0,
          searchTime: 0,
        };
      }
    });
  }
}

export { LangflowSearchService };
export type { LangflowSearchServiceConfig };
