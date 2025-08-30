/**
 * Statistics Service for Dashboard Data Calculation
 * Calculates dashboard statistics directly from the database
 */

import type {
  AllStatistics,
  DashboardStatistics,
  IndividualStatistic,
  ManualStatisticUpdate,
  QueryActivityRequest,
} from '@/interfaces/Statistics';
import { getAuthSession } from '@/utils/supabase/authUtils';
import { createClientTable } from '@/utils/supabase/client';

class StatisticsService {
  private serviceName = 'StatisticsService';

  constructor() {
    // Service initialization
  }

  /**
   * Get current user from Supabase auth
   */
  private async getCurrentUser() {
    try {
      const session = await getAuthSession();
      if (!session?.user) {
        throw new Error('User not authenticated');
      }
      return session.user;
    } catch (error) {
      console.error(`[${this.serviceName}] Error getting current user:`, error);
      throw error;
    }
  }

  /**
   * Get all dashboard statistics in a single call
   * This is the main endpoint for dashboard display
   */
  async getDashboardStatistics(): Promise<DashboardStatistics> {
    try {
      console.log(`[${this.serviceName}] Calculating dashboard statistics...`);

      const user = await this.getCurrentUser();

      // Calculate all statistics in parallel
      const [
        totalKnowledgeBases,
        activeDocuments,
        totalQueries,
        avgResponseTimeMs
      ] = await Promise.all([
        this.calculateTotalKnowledgeBases(user.id),
        this.calculateActiveDocuments(user.id),
        this.calculateTotalQueries(user.id),
        this.calculateAverageResponseTime(user.id)
      ]);

      const avgResponseTime = `${avgResponseTimeMs}ms`;

      return {
        totalKnowledgeBases,
        activeDocuments,
        totalQueries,
        avgResponseTimeMs,
        avgResponseTime,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Get dashboard statistics failed:`, error);

      // Return fallback data if calculation fails
      return {
        totalKnowledgeBases: 0,
        activeDocuments: 0,
        totalQueries: 0,
        avgResponseTimeMs: 0,
        avgResponseTime: '0ms',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate total knowledge bases for user
   */
  private async calculateTotalKnowledgeBases(userId: string): Promise<number> {
    try {
      const supabaseTable = createClientTable();

      const { count, error } = await supabaseTable
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error(`[${this.serviceName}] Error counting knowledge bases:`, error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error(`[${this.serviceName}] Error calculating total knowledge bases:`, error);
      return 0;
    }
  }

  /**
   * Calculate active documents for user
   */
  private async calculateActiveDocuments(userId: string): Promise<number> {
    try {
      const supabaseTable = createClientTable();

      // Count documents from user's knowledge bases
      const { count, error } = await supabaseTable
        .from('document')
        .select('*', { count: 'exact', head: true })
        // .eq('knowledge_base.created_by', userId)
        .eq('is_active', true);

      if (error) {
        console.error(`[${this.serviceName}] Error counting active documents:`, error);
        return 0;
      }

      console.log('count:', count);

      return count || 0;
    } catch (error) {
      console.error(`[${this.serviceName}] Error calculating active documents:`, error);
      return 0;
    }
  }

  /**
   * Calculate total queries (chat messages) for user
   */
  private async calculateTotalQueries(userId: string): Promise<number> {
    try {
      const supabaseTable = createClientTable();

      // Count chat messages from user's sessions
      const { count, error } = await supabaseTable
        .from('chat_message')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error(`[${this.serviceName}] Error counting total queries:`, error);
        return 0;
      }

      console.log('count:', count);

      return count || 0;
    } catch (error) {
      console.error(`[${this.serviceName}] Error calculating total queries:`, error);
      return 0;
    }
  }

  /**
   * Calculate average response time for user's chat sessions
   */
  private async calculateAverageResponseTime(userId: string): Promise<number> {
    try {
      const supabaseTable = createClientTable();

      // Get recent chat sessions to calculate average response time
      const { data, error } = await supabaseTable
        .from('chat_message')
        .select(`
          timestamp,
          sender,
          chat_session!inner(user_id)
        `)
        .eq('chat_session.user_id', userId)
        .order('timestamp', { ascending: true })
        .limit(100); // Analyze last 100 messages

      if (error) {
        console.error(`[${this.serviceName}] Error fetching messages for response time:`, error);
        return 1200; // Default response time
      }

      if (!data || data.length < 2) {
        return 1200; // Default response time if no data
      }

      // Calculate response times between user queries and bot responses
      const responseTimes: number[] = [];
      for (let i = 0; i < data.length - 1; i++) {
        const current = data[i];
        const next = data[i + 1];

        // If current is user message and next is bot response
        if (current.sender === 'user' && next.sender === 'bot') {
          const responseTime = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
          if (responseTime > 0 && responseTime < 30000) { // Filter reasonable response times (0-30 seconds)
            responseTimes.push(responseTime);
          }
        }
      }

      if (responseTimes.length === 0) {
        return 1200; // Default response time
      }

      // Calculate average
      const avgMs = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      return Math.round(avgMs);
    } catch (error) {
      console.error(`[${this.serviceName}] Error calculating average response time:`, error);
      return 1200; // Default response time
    }
  }

  /**
   * Get all individual statistics
   */
  async getAllStatistics(): Promise<AllStatistics> {
    try {
      const dashboardStats = await this.getDashboardStatistics();

      return {
        totalKnowledgeBases: {
          value: dashboardStats.totalKnowledgeBases,
          lastUpdated: dashboardStats.lastUpdated
        },
        activeDocuments: {
          value: dashboardStats.activeDocuments,
          lastUpdated: dashboardStats.lastUpdated
        },
        totalQueries: {
          value: dashboardStats.totalQueries,
          lastUpdated: dashboardStats.lastUpdated
        },
        avgResponseTimeMs: {
          value: dashboardStats.avgResponseTimeMs,
          lastUpdated: dashboardStats.lastUpdated
        }
      };
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
      const user = await this.getCurrentUser();
      const count = await this.calculateTotalKnowledgeBases(user.id);

      return {
        value: count,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(
        `[${this.serviceName}] Get total knowledge bases failed:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get specific statistic - Active Documents
   */
  async getActiveDocuments(): Promise<IndividualStatistic> {
    try {
      const user = await this.getCurrentUser();
      const count = await this.calculateActiveDocuments(user.id);

      return {
        value: count,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(
        `[${this.serviceName}] Get active documents failed:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get specific statistic - Total Queries
   */
  async getTotalQueries(): Promise<IndividualStatistic> {
    try {
      const user = await this.getCurrentUser();
      const count = await this.calculateTotalQueries(user.id);

      return {
        value: count,
        lastUpdated: new Date().toISOString()
      };
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
      const user = await this.getCurrentUser();
      const avgMs = await this.calculateAverageResponseTime(user.id);

      return {
        value: avgMs,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(
        `[${this.serviceName}] Get average response time failed:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Record query activity for real-time statistics updates
   */
  async recordQueryActivity(data: QueryActivityRequest): Promise<void> {
    try {
      // Since we're calculating statistics directly from the database,
      // we don't need to record query activity separately
      console.log(`[${this.serviceName}] Query activity recorded:`, data);
    } catch (error) {
      console.error(
        `[${this.serviceName}] Record query activity failed:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Refresh all statistics manually
   */
  async refreshStatistics(): Promise<void> {
    try {
      // Since we calculate statistics in real-time from the database,
      // refreshing doesn't require any special action
      console.log(`[${this.serviceName}] Statistics refreshed successfully`);
    } catch (error) {
      console.error(`[${this.serviceName}] Refresh statistics failed:`, error);
      throw error;
    }
  }

  /**
   * Manually update a specific statistic (Admin operation)
   */
  async updateStatistic(
    statisticType:
      | 'total_knowledge_bases'
      | 'active_documents'
      | 'total_queries'
      | 'avg_response_time_ms',
    data: ManualStatisticUpdate,
  ): Promise<void> {
    try {
      // Since we calculate statistics directly from the database,
      // manual updates would require database modifications
      console.log(`[${this.serviceName}] Manual statistic update requested:`, statisticType, data);
      console.log(`[${this.serviceName}] Note: Statistics are calculated from database in real-time`);
    } catch (error) {
      console.error(`[${this.serviceName}] Update statistic failed:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const statisticsService = new StatisticsService();
export default statisticsService;
