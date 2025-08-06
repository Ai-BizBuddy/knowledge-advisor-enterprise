/**
 * Statistics Service for Dashboard API Integration
 * Handles fetching dashboard statistics from the Knowledge Base Statistics API
 */

import { BaseFetchClient } from '@/utils/fetchClient';
import type { 
  DashboardStatistics, 
  AllStatistics, 
  IndividualStatistic,
  QueryActivityRequest,
  ManualStatisticUpdate
} from '@/interfaces/Statistics';
import type { TypedFetchResponse } from '@/interfaces/FetchTypes';

class StatisticsService {
  private client: BaseFetchClient;
  private serviceName = 'StatisticsService';

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_INGRESS_SERVICE || 'http://localhost:5000';
    this.client = new BaseFetchClient({
      baseURL,
      timeout: 10000,
      retryAttempts: 2,
      retryDelay: 1000
    });
  }

  /**
   * Get all dashboard statistics in a single call
   * This is the main endpoint for dashboard display
   */
  async getDashboardStatistics(): Promise<DashboardStatistics> {
    try {
      const response: TypedFetchResponse<DashboardStatistics> = await this.client.get(
        '/api/statistics/dashboard'
      );
      return response.data;
    } catch (error) {
      console.error(`[${this.serviceName}] Get dashboard statistics failed:`, error);
      throw error;
    }
  }

  /**
   * Get all individual statistics
   */
  async getAllStatistics(): Promise<AllStatistics> {
    try {
      const response: TypedFetchResponse<AllStatistics> = await this.client.get(
        '/api/statistics'
      );
      return response.data;
    } catch (error) {
      console.error(`[${this.serviceName}] Get all statistics failed:`, error);
      throw error;
    }
  }

  /**
   * Get specific statistic - Total Knowledge Bases
   */
  async getTotalKnowledgeBases(): Promise<IndividualStatistic> {
    try {
      const response: TypedFetchResponse<IndividualStatistic> = await this.client.get(
        '/api/statistics/total_knowledge_bases'
      );
      return response.data;
    } catch (error) {
      console.error(`[${this.serviceName}] Get total knowledge bases failed:`, error);
      throw error;
    }
  }

  /**
   * Get specific statistic - Active Documents
   */
  async getActiveDocuments(): Promise<IndividualStatistic> {
    try {
      const response: TypedFetchResponse<IndividualStatistic> = await this.client.get(
        '/api/statistics/active_documents'
      );
      return response.data;
    } catch (error) {
      console.error(`[${this.serviceName}] Get active documents failed:`, error);
      throw error;
    }
  }

  /**
   * Get specific statistic - Total Queries
   */
  async getTotalQueries(): Promise<IndividualStatistic> {
    try {
      const response: TypedFetchResponse<IndividualStatistic> = await this.client.get(
        '/api/statistics/total_queries'
      );
      return response.data;
    } catch (error) {
      console.error(`[${this.serviceName}] Get total queries failed:`, error);
      throw error;
    }
  }

  /**
   * Get specific statistic - Average Response Time
   */
  async getAverageResponseTime(): Promise<IndividualStatistic> {
    try {
      const response: TypedFetchResponse<IndividualStatistic> = await this.client.get(
        '/api/statistics/avg_response_time_ms'
      );
      return response.data;
    } catch (error) {
      console.error(`[${this.serviceName}] Get average response time failed:`, error);
      throw error;
    }
  }

  /**
   * Record query activity for real-time statistics updates
   */
  async recordQueryActivity(data: QueryActivityRequest): Promise<void> {
    try {
      await this.client.post('/api/statistics/query-activity', data);
    } catch (error) {
      console.error(`[${this.serviceName}] Record query activity failed:`, error);
      throw error;
    }
  }

  /**
   * Refresh all statistics manually
   */
  async refreshStatistics(): Promise<void> {
    try {
      await this.client.post('/api/statistics/refresh');
    } catch (error) {
      console.error(`[${this.serviceName}] Refresh statistics failed:`, error);
      throw error;
    }
  }

  /**
   * Manually update a specific statistic (Admin operation)
   */
  async updateStatistic(
    statisticType: 'total_knowledge_bases' | 'active_documents' | 'total_queries' | 'avg_response_time_ms',
    data: ManualStatisticUpdate
  ): Promise<void> {
    try {
      await this.client.put(`/api/statistics/${statisticType}`, data);
    } catch (error) {
      console.error(`[${this.serviceName}] Update statistic failed:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const statisticsService = new StatisticsService();
export default statisticsService;
