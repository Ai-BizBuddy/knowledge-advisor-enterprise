/**
 * Agent Development Kit (ADK) Chat Service
 * 
 * This service handles chat interactions using the ADK API
 * with session management and server-sent events (SSE) streaming.
 * Follows the project's strict TypeScript standards.
 */

import { BaseFetchClient } from "@/utils/fetchClient";
import { getAccessToken } from "@/utils/supabase/authUtils";

/**
 * ADK Session creation response interface
 */
export interface AdkSessionResponse {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, unknown>;
  events: unknown[];
  lastUpdateTime: number;
}

/**
 * ADK chat request interface
 */
export interface AdkChatRequest {
  userId: string;
  sessionId: string | null;
  knowledgeIds: string[];
  message: string;
  onlineMode: boolean;
}

/**
 * ADK streaming response interface
 * Updated to match the new API response format
 */
export interface AdkStreamingResponse {
  session: string;
  data: {
    content: {
      parts: Array<{ text: string }>;
      role: "model";
    };
    partial: boolean;
    invocationId: string;
    author: string;
    actions: {
      stateDelta: Record<string, unknown>;
      artifactDelta: Record<string, unknown>;
      requestedAuthConfigs: Record<string, unknown>;
    };
    id: string;
    timestamp: number;
  };
}

/**
 * Chat result interface for hook compatibility
 */
export interface AdkChatResult {
  success: boolean;
  content: string;
  error?: string;
  sessionId?: string | null;
  responseTime?: number;
}

/**
 * Chat input interface
 */
export interface AdkChatInput {
  question: string;
  userId: string;
  sessionId?: string | null;
  filters?: {
    project_id?: string[];
  };
  onlineMode?: boolean;
}

/**
 * ADK Chat Service Configuration
 */
interface AdkChatServiceConfig {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  useMockData?: boolean;
}

/**
 * ADK Chat Service Class
 * 
 * Handles conversational AI interactions using the ADK API
 * with session management and SSE streaming support.
 */
class AdkChatService {
  private client: BaseFetchClient;
  private readonly serviceName = 'AdkChat';
  private readonly useMockData: boolean;
  private readonly baseUrl: string;
  private readonly appName = 'knowledge_agent';

  constructor(config: AdkChatServiceConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_ADK_BASE_URL || 'https://matters-fed-layout-mice.trycloudflare.com';

    this.client = new BaseFetchClient({
      baseURL: this.baseUrl,
      timeout: config.timeout || 120000, // 2 minutes
      retryAttempts: config.retryAttempts || 2,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.useMockData = config.useMockData || false;
    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors for logging
   */
  private setupInterceptors(): void {
    this.client.addRequestInterceptor((config) => {
      console.log(`[${this.serviceName}] Request:`, config.url);
      return config;
    });

    this.client.addResponseInterceptor((response) => {
      console.log(`[${this.serviceName}] Response received:`, response.status);
      return response;
    });

    this.client.addErrorInterceptor((error) => {
      console.error(`[${this.serviceName}] Error:`, error.message);
      return error;
    });
  }

  /**
   * Generate mock responses for development
   */
  private generateMockResponse(question: string): AdkChatResult {
    const responses = [
      `ตามที่คุณถามเกี่ยวกับ "${question}" ผมสามารถให้ข้อมูลจาก Knowledge Base ได้ดังนี้:\n\n1. ข้อมูลหลักที่เกี่ยวข้อง\n2. แนวทางปฏิบัติที่แนะนำ\n3. ตัวอย่างการใช้งาน`,
      `เรื่อง "${question}" นั้นเป็นหัวข้อที่สำคัญ ผมได้รวบรวมข้อมูลจากเอกสารต่างๆ มาให้คุณแล้ว รวมถึงรายละเอียดและคำแนะนำที่เป็นประโยชน์`,
      `ผมได้ค้นหาข้อมูลเกี่ยวกับ "${question}" แล้ว พบข้อมูลที่น่าสนใจหลายประเด็น ให้ผมอธิบายรายละเอียดให้คุณฟัง`,
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      success: true,
      content: randomResponse,
      sessionId: `mock-session-${Date.now()}`,
      responseTime: Math.floor(Math.random() * 2000) + 500
    };
  }

  /**
   * Get authorization header for API requests
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const accessToken = await getAccessToken();

      if (accessToken) {
        return {
          'Authorization': `Bearer ${accessToken}`
        };
      }

      console.warn(`[${this.serviceName}] No access token available for request`);
      return {};
    } catch (error) {
      console.error(`[${this.serviceName}] Error getting access token:`, error);
      return {};
    }
  }

  /**
   * Send message with SSE streaming
   */
  async sendMessageWithStreaming(
    input: AdkChatInput,
    onStreamData: (data: string) => void,
    onComplete: (fullContent: string) => void,
    onError: (error: string) => void
  ): Promise<AdkChatResult> {
    console.log(`[${this.serviceName}] Sending message with streaming:`, { input });
    const startTime = Date.now();

    // Return mock data for development/testing
    if (this.useMockData) {
      return this.simulateStreaming(input.question, onStreamData, onComplete).then(() => {
        return {
          success: true,
          content: `Mock response to: "${input.question}"`,
          sessionId: '12345678-mock-session-id',
          responseTime: Date.now() - startTime
        };
      });
    }

    try {
      // Use sessionId from input if available, otherwise null for first call
      const sessionId = input.sessionId || null;

      const request: AdkChatRequest = {
        userId: input.userId,
        sessionId: sessionId, // Will be null for first call, then use returned sessionId
        knowledgeIds: input.filters?.project_id || [],
        message: input.question,
        onlineMode: input.onlineMode !== undefined ? input.onlineMode : true
      };

      // Get auth headers before making the request
      const authHeaders = await this.getAuthHeaders();

      // Use EventSource for SSE streaming
      const url = `${this.baseUrl}api/chat`;

      return new Promise<AdkChatResult>((resolve) => {
        let fullContent = '';
        let hasError = false;
        let responseSessionId: string | undefined;
        let lastProcessedId = ''; // Track last processed message ID to prevent duplicates
        let hasCompleted = false; // New flag to track if completion has already been called

        // Use fetch with streaming response
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            ...authHeaders // Include auth headers
          },
          body: JSON.stringify(request)
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('No response body reader available');
            }

            const decoder = new TextDecoder();

            const readStream = (): Promise<void> => {
              return reader.read().then(({ done, value }) => {
                if (done) {
                  // Stream is complete - only trigger completion if we haven't already completed
                  // and if we didn't receive a final non-partial chunk
                  if (!hasError && !hasCompleted) {
                    hasCompleted = true;
                    console.log(`[${this.serviceName}] Stream done (EOF), completing with final content length: ${fullContent.length}`);
                    onComplete(fullContent);
                    resolve({
                      success: true,
                      content: fullContent,
                      sessionId: responseSessionId || sessionId || undefined,
                      responseTime: Date.now() - startTime
                    });
                  }
                  return;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = line.slice(6).trim();

                      // Skip empty data
                      if (!data) continue;

                      // Handle [DONE] signal
                      if (data === '[DONE]') {
                        console.log(`[${this.serviceName}] Received [DONE] signal`);
                        if (!hasCompleted) {
                          hasCompleted = true;
                          onComplete(fullContent);
                          resolve({
                            success: true,
                            content: fullContent,
                            sessionId: responseSessionId || sessionId || undefined,
                            responseTime: Date.now() - startTime
                          });
                        }
                        return;
                      }

                      const parsed: AdkStreamingResponse = JSON.parse(data);

                      // Capture sessionId from response (for first call when sessionId was null)
                      if (parsed.session && !responseSessionId) {
                        responseSessionId = parsed.session;
                      }

                      // Process streaming content - each message has a unique ID and text chunk
                      if (parsed.data?.content?.parts?.[0]?.text && parsed.data?.id) {
                        const newText = parsed.data.content.parts[0].text;
                        const messageId = parsed.data.id;
                        const isPartial = parsed.data.partial;

                        // Debug logging for tracking
                        console.log(`[${this.serviceName}] Processing streaming chunk:`, {
                          messageId,
                          newText,
                          partial: isPartial,
                          currentLength: fullContent.length
                        });

                        // Skip if we already processed this message ID to prevent duplicates
                        if (messageId === lastProcessedId) {
                          console.log(`[${this.serviceName}] Skipping duplicate message ID: ${messageId}`);
                          continue;
                        }

                        // Update last processed ID
                        lastProcessedId = messageId;

                        // If this is the final chunk (partial=false), mark as complete
                        if (!isPartial && !hasCompleted) {
                          hasCompleted = true;
                          console.log(`[${this.serviceName}] Final chunk received, completing with total content length: ${newText.length}`);
                          onComplete(newText);
                          resolve({
                            success: true,
                            content: newText,
                            sessionId: responseSessionId || sessionId || undefined,
                            responseTime: Date.now() - startTime
                          });
                          return;
                        }

                        // Append new text chunk to full content (accumulate all chunks)
                        if (newText) {
                          fullContent += newText;
                          console.log(`[${this.serviceName}] Added chunk: "${newText}", Total length: ${fullContent.length}`);

                          // Update UI with current accumulated content after each chunk
                          onStreamData(fullContent);
                        }
                      }

                    } catch (parseError) {
                      console.warn(`[${this.serviceName}] Failed to parse SSE data:`, parseError, 'Raw line:', line.slice(6).trim());
                    }
                  }
                }

                return readStream();
              });
            }

            return readStream();
          })
          .catch(error => {
            console.error(`[${this.serviceName}] Streaming error:`, error);
            hasError = true;
            onError(error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
            resolve({
              success: false,
              content: '',
              error: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
              responseTime: Date.now() - startTime
            });
          });
      });

    } catch (error) {
      console.error(`[${this.serviceName}] Error in sendMessageWithStreaming:`, error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      onError(errorMessage);

      return {
        success: false,
        content: '',
        error: errorMessage,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Simulate streaming for mock data
   */
  private async simulateStreaming(
    question: string,
    onStreamData: (data: string) => void,
    onComplete: (fullContent: string) => void
  ): Promise<void> {
    const mockResponse = this.generateMockResponse(question);
    const words = mockResponse.content.split(' ');
    let currentContent = '';

    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? ' ' : '') + words[i];
      onStreamData(currentContent);
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }

    onComplete(currentContent);
  }

  /**
   * Send a simple message (convenience method)
   */
  async sendMessage(input: AdkChatInput): Promise<AdkChatResult> {
    return new Promise((resolve) => {
      this.sendMessageWithStreaming(
        input,
        () => {
          // Stream data handler - content is updated in real-time
        },
        (content) => {
          resolve({
            success: true,
            content,
            sessionId: input.sessionId || null,
            responseTime: 1000
          });
        },
        (error) => {
          resolve({
            success: false,
            content: '',
            error
          });
        }
      );
    });
  }

  /**
   * Check if the ADK service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...authHeaders
        }
      });
      return response.ok;
    } catch (error) {
      console.error(`[${this.serviceName}] Health check failed:`, error);
      return false;
    }
  }
}

export { AdkChatService };
export type { AdkChatServiceConfig };
