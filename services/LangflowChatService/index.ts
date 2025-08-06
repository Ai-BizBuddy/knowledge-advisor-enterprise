/**
 * Langflow Chat Service
 * 
 * This service handles chat interactions using the Langflow API
 * for conversational AI responses with knowledge base integration.
 * Uses fetch API instead of Axios following project standards.
 */

import { BaseFetchClient } from '@/utils/fetchClient';

/**
 * Langflow chat request interface
 */
export interface LangflowChatRequest {
  input_value: string;
  output_type: "chat" | "text";
  input_type: "chat" | "text";
}

/**
 * Langflow chat response interface
 */
export interface LangflowChatResponse {
  session_id?: string;
  outputs: Array<{
    inputs: {
      input_value: string;
    };
    outputs: Array<{
      results: {
        message: {
          text: string;
          data?: {
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
        };
      };
      artifacts?: {
        message: string;
        sender: string;
        sender_name: string;
        files: unknown[];
        type: string;
      };
      messages?: Array<{
        message: string;
        sender: string;
        sender_name: string;
        session_id: string;
        stream_url: string | null;
        component_id: string;
        files: unknown[];
        type: string;
      }>;
      timedelta?: number | null;
      duration?: number | null;
      component_display_name?: string;
      component_id?: string;
      used_frozen_result?: boolean;
    }>;
  }>;
}

/**
 * Chat filters interface
 */
export interface ChatFilters {
  page?: string;
  file_path?: string;
  project_id?: string;
  document_id?: string;
}

/**
 * Chat input interface
 */
export interface ChatInput {
  question: string;
  filters?: ChatFilters;
}

/**
 * Chat result interface
 */
export interface ChatResult {
  success: boolean;
  content: string;
  error?: string;
  sessionId?: string;
  responseTime?: number;
}

/**
 * Langflow Chat Service Configuration
 */
interface LangflowChatServiceConfig {
  baseUrl?: string;
  chatPath?: string;
  timeout?: number;
  retryAttempts?: number;
  useMockData?: boolean;
}

/**
 * Langflow Chat Service Class
 * 
 * Handles conversational AI interactions using the Langflow API
 * with proper error handling and retry logic.
 */
class LangflowChatService {
  private client: BaseFetchClient;
  private readonly serviceName = 'LangflowChat';
  private readonly useMockData: boolean;

  constructor(config: LangflowChatServiceConfig = {}) {
    const baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_LANGFLOW_URL || 'http://first-boy.ddns.net:7860';
    const chatPath = config.chatPath || process.env.NEXT_PUBLIC_LANGFLOW_CHAT_PATH || '/api/v1/run/07abd158-91dd-4c2c-a1af-9f7b586c217a';
    
    this.client = new BaseFetchClient({
      baseURL: `${baseUrl}${chatPath}`,
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
      console.log(`[${this.serviceName}] Chat request:`, config.url);
      return config;
    });

    this.client.addResponseInterceptor((response) => {
      console.log(`[${this.serviceName}] Chat response received:`, response.status);
      return response;
    });

    this.client.addErrorInterceptor((error) => {
      console.error(`[${this.serviceName}] Chat error:`, error.message);
      return error;
    });
  }

  /**
   * Generate mock chat response for development
   */
  private generateMockResponse(question: string): ChatResult {
    const responses = [
      `Based on your question about "${question}", I can provide detailed information from the knowledge base. This feature helps users understand complex topics through conversational interaction.`,
      `I found relevant information about "${question}" in the documentation. Here are the key points you should know about this topic.`,
      `Great question about "${question}"! Let me walk you through the important aspects and best practices related to this topic.`,
      `Regarding "${question}", I can help explain the concepts and provide practical examples from the knowledge base.`
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      success: true,
      content: randomResponse,
      sessionId: `mock-session-${Date.now()}`,
      responseTime: Math.floor(Math.random() * 2000) + 500 // 500-2500ms
    };
  }

  /**
   * Extract response content from Langflow response
   */
  private extractResponseContent(response: LangflowChatResponse): string {
    try {
      // Try to extract the main message text from the response
      const output = response.outputs?.[0]?.outputs?.[0];
      const message = output?.results?.message;
      
      if (message?.text) {
        return message.text;
      }

      // Fallback to artifacts message if available
      if (output?.artifacts?.message) {
        return output.artifacts.message;
      }

      // Check messages array
      if (output?.messages && output.messages.length > 0) {
        return output.messages[0].message;
      }

      console.warn(`[${this.serviceName}] No valid message found in response`);
      return 'I apologize, but I received an unexpected response format. Please try your question again.';

    } catch (error) {
      console.error(`[${this.serviceName}] Error extracting response content:`, error);
      return 'I encountered an error processing the response. Please try again.';
    }
  }

  /**
   * Send a chat message and get AI response
   */
  async sendMessage(input: ChatInput): Promise<ChatResult> {
    console.log(`[${this.serviceName}] Sending message:`, input.question);
    const startTime = Date.now();

    if (this.useMockData) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
      return this.generateMockResponse(input.question);
    }

    try {
    const request: LangflowChatRequest = {
      input_value: JSON.stringify({
        question: input.question,
        filters: input.filters || {}
      }),
      output_type: "chat",
      input_type: "chat"
    };

      const response = await this.client.post<LangflowChatResponse>('?stream=false', request);
      const responseTime = Date.now() - startTime;

      const content = this.extractResponseContent(response.data);
      
      const result: ChatResult = {
        success: true,
        content,
        sessionId: response.data.session_id,
        responseTime
      };

      console.log(`[${this.serviceName}] Chat completed in ${responseTime}ms`);
      return result;

    } catch (error) {
      console.error(`[${this.serviceName}] Chat failed:`, error);
      
      const result: ChatResult = {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        responseTime: Date.now() - startTime
      };

      return result;
    }
  }

  /**
   * Send a simple question (convenience method)
   */
  async askQuestion(question: string, filters?: ChatFilters): Promise<ChatResult> {
    return this.sendMessage({ question, filters });
  }

  /**
   * Check if the Langflow service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Send a simple health check message
      const result = await this.askQuestion('Hello');
      return result.success;
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
        version: '1.0.0' // This could be retrieved from an actual endpoint
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Batch send multiple questions (useful for testing or bulk operations)
   */
  async sendMultipleMessages(inputs: ChatInput[]): Promise<ChatResult[]> {
    console.log(`[${this.serviceName}] Sending ${inputs.length} messages`);

    const results = await Promise.allSettled(
      inputs.map(input => this.sendMessage(input))
    );

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          content: '',
          error: result.reason instanceof Error ? result.reason.message : 'Failed to send message'
        };
      }
    });
  }
}

export { LangflowChatService };
export type { LangflowChatServiceConfig };
