'use client';

import { ChatMessage } from '@/hooks/useAdkChat';
import ChatHistoryService from '@/services/ChatHistoryService';
import type { ChatSession } from '@/services/DashboardService';
import { useCallback, useState } from 'react';

const chatHistoryService = new ChatHistoryService();

export type { ChatSession };

export const useChatHistory = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const historyData = await chatHistoryService.loadHistory();
      setSessions(historyData);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getChatSessions = useCallback(async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      const messages = await chatHistoryService.getOldChat(sessionId);
      return messages ?? [];
    } catch {
      return [];
    }
  }, []);

  const deleteChatSession = useCallback(
    async (sessionId: string) => {
      if (!sessionId || typeof sessionId !== 'string') return;

      try {
        const success = await chatHistoryService.deleteSession(sessionId);
        if (success) {
          await loadHistory(); // Reload after deletion
        }
      } catch {
        // Handle deletion error silently
      }
    },
    [loadHistory],
  );

  const exportChatSession = useCallback((session: ChatSession) => {
    // Basic export functionality for the new ChatSession interface
    if (!session) {
      return;
    }

    const sanitizedTitle = session.title.replace(/[<>:"/\\|?*]/g, '-');
    const exportData = [
      `แชทเซสชัน: ${sanitizedTitle}`,
      `สร้างเมื่อ: ${new Date(session.started_at).toLocaleString('th-TH')}`,
      `Knowledge Base ID: ${session.knowledge_base_id || 'ไม่ระบุ'}`,
      '',
      '--- Chat Session Data ---',
      `Session ID: ${session.id}`,
      `User ID: ${session.user_id}`,
      session.ended_at ? `สิ้นสุดเมื่อ: ${new Date(session.ended_at).toLocaleString('th-TH')}` : 'ยังไม่สิ้นสุด',
      '',
      '--- End of Chat Session ---',
    ].join('\n');

    try {
      const blob = new Blob([exportData], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-${sanitizedTitle}-${new Date().toISOString().split('T')[0]}.txt`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      // Handle export error silently
    }
  }, []);

  const getSessionById = useCallback(
    (sessionId: string): ChatSession | null => {
      if (!sessionId || typeof sessionId !== 'string') return null;

      return sessions.find((session) => session.id === sessionId) || null;
    },
    [sessions],
  );

  return {
    sessions,
    loading,
    loadHistory,
    getChatSessions,
    deleteChatSession,
    exportChatSession,
    getSessionById,
  };
};
