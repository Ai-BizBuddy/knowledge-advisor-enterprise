/**
 * Dashboard Service - Real-time Dashboard Data Management
 * 
 * This service aggregates data from multiple sources to provide
 * comprehensive dashboard information including statistics,
 * recent activities, chat sessions, and knowledge base information.
 */

import { statisticsService } from '@/services/StatisticsService';
import { createClientTable } from "@/utils/supabase/client";
import { getAuthSession } from "@/utils/supabase/authUtils";
import type { DashboardStatistics } from '@/interfaces/Statistics';
import type { Project } from '@/interfaces/Project';

export interface ChatSession {
    id: string;
    user_id: string;
    knowledge_base_id: string;
    title: string;
    started_at: string;
    ended_at?: string;
    is_active: boolean;
    session_metadata?: Record<string, unknown>;
}

export interface ChatMessage {
    id: string;
    session_id: string;
    message: string;
    timestamp: string;
    sender: string;
    user_id: string;
    message_type: string;
    metadata?: Record<string, unknown>;
    is_edited: boolean;
    edited_at?: string;
}

export interface DashboardOverview {
    statistics: DashboardStatistics;
    recentKnowledgeBases: Project[];
    recommendedKnowledgeBases: Project[];
    recentActivities: ActivityItem[];
    activeChatSessions: ChatSession[];
    recentChatMessages: ChatMessage[];
}

export interface ActivityItem {
    id: string;
    type: "upload" | "query" | "knowledgebase" | "chat" | "processing" | "error";
    title: string;
    description?: string;
    timestamp: string;
    status: "success" | "error" | "info" | "warning";
    projectId?: string;
    documentId?: string;
    sessionId?: string;
}

/**
 * Dashboard Service Class
 * 
 * Provides centralized access to all dashboard-related data
 */
class DashboardService {
    private readonly serviceName = 'DashboardService';

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
     * Get complete dashboard overview data
     */
    async getDashboardOverview(): Promise<DashboardOverview> {
        try {
            console.log(`[${this.serviceName}] Fetching dashboard overview...`);

            // Fetch all data in parallel for better performance
            const [
                statistics,
                recentKnowledgeBases,
                recommendedKnowledgeBases,
                recentActivities,
                activeChatSessions,
                recentChatMessages
            ] = await Promise.all([
                this.getStatistics(),
                this.getRecentKnowledgeBases(),
                this.getRecommendedKnowledgeBases(),
                this.getRecentActivities(),
                this.getActiveChatSessions(),
                this.getRecentChatMessages()
            ]);

            return {
                statistics,
                recentKnowledgeBases,
                recommendedKnowledgeBases,
                recentActivities,
                activeChatSessions,
                recentChatMessages
            };
        } catch (error) {
            console.error(`[${this.serviceName}] Error fetching dashboard overview:`, error);
            throw error;
        }
    }

    /**
     * Get dashboard statistics with fallback
     */
    async getStatistics(): Promise<DashboardStatistics> {
        try {
            return await statisticsService.getDashboardStatistics();
        } catch (error) {
            console.error(`[${this.serviceName}] Error fetching statistics:`, error);
            // Return fallback data if API fails
            return {
                totalKnowledgeBases: 0,
                activeDocuments: 0,
                totalQueries: 0,
                avgResponseTimeMs: 0,
                avgResponseTime: "0ms",
                lastUpdated: new Date().toISOString()
            };
        }
    }

    /**
     * Get recent knowledge bases (last 5 created or updated)
     */
    async getRecentKnowledgeBases(): Promise<Project[]> {
        try {
            const user = await this.getCurrentUser();
            const supabaseTable = createClientTable();

            const { data, error } = await supabaseTable
                .from('knowledge_base')
                .select('*')
                .eq('created_by', user.id)
                .eq('is_active', true)
                .order('updated_at', { ascending: false })
                .limit(5);

            if (error) {
                console.error(`[${this.serviceName}] Error fetching recent knowledge bases:`, error);
                throw error;
            }

            return data as Project[];
        } catch (error) {
            console.error(`[${this.serviceName}] Error getting recent knowledge bases:`, error);
            return [];
        }
    }

    /**
     * Get recommended knowledge bases based on activity and popularity
     */
    async getRecommendedKnowledgeBases(): Promise<Project[]> {
        try {
            const user = await this.getCurrentUser();
            const supabaseTable = createClientTable();

            // Get knowledge bases from other users that are public/shared
            const { data, error } = await supabaseTable
                .from('knowledge_base')
                .select('*')
                .neq('created_by', user.id)
                .eq('is_active', true)
                .eq('visibility', 'public')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) {
                console.error(`[${this.serviceName}] Error fetching recommended knowledge bases:`, error);
                throw error;
            }

            return data as Project[];
        } catch (error) {
            console.error(`[${this.serviceName}] Error getting recommended knowledge bases:`, error);
            return [];
        }
    }

    /**
     * Get active chat sessions for the current user
     */
    async getActiveChatSessions(): Promise<ChatSession[]> {
        try {
            const user = await this.getCurrentUser();
            const supabaseTable = createClientTable();

            const { data, error } = await supabaseTable
                .from('chat_session')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('started_at', { ascending: false })
                .limit(5);

            if (error) {
                console.error(`[${this.serviceName}] Error fetching active chat sessions:`, error);
                throw error;
            }

            return data as ChatSession[];
        } catch (error) {
            console.error(`[${this.serviceName}] Error getting active chat sessions:`, error);
            return [];
        }
    }

    /**
     * Get recent chat messages
     */
    async getRecentChatMessages(): Promise<ChatMessage[]> {
        try {
            const user = await this.getCurrentUser();
            const supabaseTable = createClientTable();

            // Get recent messages from user's chat sessions
            const { data, error } = await supabaseTable
                .from('chat_message')
                .select(`
          *,
          chat_session!inner(user_id)
        `)
                .eq('chat_session.user_id', user.id)
                .order('timestamp', { ascending: false })
                .limit(10);

            if (error) {
                console.error(`[${this.serviceName}] Error fetching recent chat messages:`, error);
                throw error;
            }

            return data as ChatMessage[];
        } catch (error) {
            console.error(`[${this.serviceName}] Error getting recent chat messages:`, error);
            return [];
        }
    }

    /**
     * Get recent activities from various sources
     */
    async getRecentActivities(): Promise<ActivityItem[]> {
        try {
            const user = await this.getCurrentUser();
            const activities: ActivityItem[] = [];

            // Get recent knowledge base activities
            const kbActivities = await this.getKnowledgeBaseActivities(user.id);
            activities.push(...kbActivities);

            // Get recent document activities
            const docActivities = await this.getDocumentActivities(user.id);
            activities.push(...docActivities);

            // Get recent chat activities
            const chatActivities = await this.getChatActivities(user.id);
            activities.push(...chatActivities);

            // Sort by timestamp (most recent first)
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            return activities.slice(0, 10); // Return top 10 activities
        } catch (error) {
            console.error(`[${this.serviceName}] Error getting recent activities:`, error);
            return [];
        }
    }

    /**
     * Get knowledge base related activities
     */
    private async getKnowledgeBaseActivities(userId: string): Promise<ActivityItem[]> {
        try {
            const supabaseTable = createClientTable();

            const { data, error } = await supabaseTable
                .from('knowledge_base')
                .select('id, name, created_at, updated_at')
                .eq('created_by', userId)
                .order('updated_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            return data.map(kb => ({
                id: `kb-${kb.id}`,
                type: "knowledgebase" as const,
                title: `Updated knowledge base "${kb.name}"`,
                description: `Knowledge base was modified`,
                timestamp: kb.updated_at || kb.created_at,
                status: "success" as const,
                projectId: kb.id
            }));
        } catch (error) {
            console.error(`[${this.serviceName}] Error getting KB activities:`, error);
            return [];
        }
    }

    /**
     * Get document related activities
     */
    private async getDocumentActivities(userId: string): Promise<ActivityItem[]> {
        try {
            const supabaseTable = createClientTable();

            // Get recent documents from user's knowledge bases
            const { data, error } = await supabaseTable
                .from('documents')
                .select(`
          id, 
          name, 
          created_at, 
          updated_at,
          status,
          knowledge_base:knowledge_base_id(id, name, created_by)
        `)
                .eq('knowledge_base.created_by', userId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            return data.map(doc => {
                const kbId = doc.knowledge_base && typeof doc.knowledge_base === 'object' && 'id' in doc.knowledge_base
                    ? (doc.knowledge_base as { id: string }).id
                    : undefined;

                return {
                    id: `doc-${doc.id}`,
                    type: "upload" as const,
                    title: `Uploaded document "${doc.name}"`,
                    description: `Document added to knowledge base`,
                    timestamp: doc.created_at,
                    status: doc.status === 'processed' ? "success" as const : "info" as const,
                    documentId: doc.id,
                    projectId: kbId
                };
            });
        } catch (error) {
            console.error(`[${this.serviceName}] Error getting document activities:`, error);
            return [];
        }
    }

    /**
     * Get chat related activities
     */
    private async getChatActivities(userId: string): Promise<ActivityItem[]> {
        try {
            const supabaseTable = createClientTable();

            const { data, error } = await supabaseTable
                .from('chat_session')
                .select('id, title, started_at, knowledge_base_id')
                .eq('user_id', userId)
                .order('started_at', { ascending: false })
                .limit(3);

            if (error) throw error;

            return data.map(session => ({
                id: `chat-${session.id}`,
                type: "chat" as const,
                title: `Started chat session "${session.title || 'Untitled'}"`,
                description: `New conversation initiated`,
                timestamp: session.started_at,
                status: "info" as const,
                sessionId: session.id,
                projectId: session.knowledge_base_id
            }));
        } catch (error) {
            console.error(`[${this.serviceName}] Error getting chat activities:`, error);
            return [];
        }
    }

    /**
     * Refresh statistics manually
     */
    async refreshStatistics(): Promise<void> {
        try {
            await statisticsService.refreshStatistics();
        } catch (error) {
            console.error(`[${this.serviceName}] Error refreshing statistics:`, error);
            throw error;
        }
    }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;
