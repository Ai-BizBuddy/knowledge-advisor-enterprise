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
            throw error;
    }
  }

  /**
   * Get all dashboard statistics in a single call
   * This is the main endpoint for dashboard display
   */
  async getDashboardStatistics(): Promise<DashboardStatistics> {
    try {
      
  const user = await this.getCurrentUser();

      // Calculate all statistics in parallel
      const [
        totalKnowledgeBases,
        activeDocuments,
  totalDocuments,
  totals,
        totalQueries,
        avgResponseTimeMs
      ] = await Promise.all([
  this.calculateTotalKnowledgeBases(),
  this.calculateActiveDocuments(),
  this.calculateTotalDocuments(),
  this.calculateStorageAndChunks(),
  this.calculateTotalQueries(),
        this.calculateAverageResponseTime(user.id)
      ]);

      const avgResponseTime = `${avgResponseTimeMs}ms`;

      return {
        totalKnowledgeBases,
        activeDocuments,
        totalDocuments,
        totalStorageBytes: totals.totalStorageBytes,
        totalStorageFormatted: totals.totalStorageFormatted,
        totalChunks: totals.totalChunks,
        totalQueries,
        avgResponseTimeMs,
        avgResponseTime,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      
      // Return fallback data if calculation fails
      return {
        totalKnowledgeBases: 0,
        activeDocuments: 0,
        totalDocuments: 0,
        totalStorageBytes: 0,
        totalStorageFormatted: '0 B',
        totalChunks: 0,
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
  private async calculateTotalKnowledgeBases(): Promise<number> {
    try {
      const supabaseTable = createClientTable();

      const { count, error } = await supabaseTable
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })

      if (error) {
                return 0;
      }

      return count || 0;
    } catch (error) {
            return 0;
    }
  }

  /**
   * Calculate active documents for user
   */
  private async calculateActiveDocuments(): Promise<number> {
    try {
      const supabaseTable = createClientTable();

      // Count documents from user's knowledge bases
      const { count, error } = await supabaseTable
        .from('document')
        .select('*', { count: 'exact', head: true })
        // .eq('knowledge_base.created_by', userId)
        .eq('is_active', true);

      if (error) {
                return 0;
      }

      
      return count || 0;
    } catch (error) {
            return 0;
    }
  }

  /**
   * Calculate total documents for user
   */
  private async calculateTotalDocuments(): Promise<number> {
    try {
      const supabaseTable = createClientTable();

      const { count, error } = await supabaseTable
        .from('document')
        .select('*', { count: 'exact', head: true });

      if (error) {
                return 0;
      }

      return count || 0;
    } catch (error) {
            return 0;
    }
  }

  /**
   * Calculate total storage usage (bytes) and total chunks across user's documents
   */
  private async calculateStorageAndChunks(): Promise<{ totalStorageBytes: number; totalChunks: number; totalStorageFormatted: string; }> {
    try {
      const supabaseTable = createClientTable();

      // Select only fields needed; join with kb if user scoping needed later
      const { data, error } = await supabaseTable
        .from('document')
        .select('file_size, chunk_count')
        .limit(10000);

      if (error) {
                return { totalStorageBytes: 0, totalChunks: 0, totalStorageFormatted: '0 B' };
      }

      const totalStorageBytes = (data || []).reduce((sum, d) => sum + (typeof d.file_size === 'number' ? d.file_size : 0), 0);
      const totalChunks = (data || []).reduce((sum, d) => sum + (typeof d.chunk_count === 'number' ? d.chunk_count : 0), 0);

      const totalStorageFormatted = this.formatBytes(totalStorageBytes);

      return { totalStorageBytes, totalChunks, totalStorageFormatted };
    } catch (error) {
            return { totalStorageBytes: 0, totalChunks: 0, totalStorageFormatted: '0 B' };
    }
  }

  private formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
    return `${value} ${sizes[i]}`;
  }

  /**
   * Calculate total queries (chat messages) for user
   */
  private async calculateTotalQueries(): Promise<number> {
    try {
      const supabaseTable = createClientTable();

      // Count chat messages from user's sessions
      const { count, error } = await supabaseTable
        .from('chat_message')
        .select('*', { count: 'exact', head: true })

      if (error) {
                return 0;
      }

      
      return count || 0;
    } catch (error) {
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
            throw error;
    }
  }

  /**
   * Get specific statistic - Total Knowledge Bases
   */
  async getTotalKnowledgeBases(): Promise<IndividualStatistic> {
    try {
  await this.getCurrentUser();
  const count = await this.calculateTotalKnowledgeBases();

      return {
        value: count,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
            throw error;
    }
  }

  /**
   * Get specific statistic - Active Documents
   */
  async getActiveDocuments(): Promise<IndividualStatistic> {
    try {
  await this.getCurrentUser();
  const count = await this.calculateActiveDocuments();

      return {
        value: count,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
            throw error;
    }
  }

  /**
   * Get specific statistic - Total Queries
   */
  async getTotalQueries(): Promise<IndividualStatistic> {
    try {
  await this.getCurrentUser();
  const count = await this.calculateTotalQueries();

      return {
        value: count,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
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
          } catch (error) {
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
          } catch (error) {
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
                } catch (error) {
            throw error;
    }
  }
}

// Export singleton instance
export const statisticsService = new StatisticsService();
export default statisticsService;
