'use client';

import { ChatMessage } from '@/hooks/useChat';
import { useCallback } from 'react';
import { secureStorage } from '@/utils/secureStorage';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  knowledgeBases: string[];
}

export const useChatHistory = () => {
  const getChatSessions = useCallback((): ChatSession[] => {
    if (typeof window === 'undefined') return [];

    try {
      // Use secure storage with encryption and 24-hour expiration
      const sessions = secureStorage.getItem<ChatSession[]>('chatSessions', {
        encrypt: true,
        expiration: 24 * 60 * 60 * 1000, // 24 hours
      });
      return sessions || [];
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  }, []);

  const saveChatSession = useCallback(
    (messages: ChatMessage[], title: string, knowledgeBases: string[]) => {
      const sessions = getChatSessions();
      const newSession: ChatSession = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More secure ID
        title: title.trim().substring(0, 100), // Limit title length
        messages: messages.map((msg) => ({
          ...msg,
          content: msg.content.trim(), // Sanitize content
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        knowledgeBases: knowledgeBases.filter((kb) => kb.trim()), // Remove empty KB IDs
      };

      // Limit to last 50 sessions to prevent storage bloat
      const updatedSessions = [newSession, ...sessions.slice(0, 49)];

      secureStorage.setItem('chatSessions', updatedSessions, {
        encrypt: true,
        expiration: 24 * 60 * 60 * 1000, // 24 hours
      });

      return newSession;
    },
    [getChatSessions],
  );

  const deleteChatSession = useCallback(
    (sessionId: string) => {
      // Validate session ID format
      if (!sessionId || typeof sessionId !== 'string') return;

      const sessions = getChatSessions();
      const updatedSessions = sessions.filter(
        (session) => session.id !== sessionId,
      );

      secureStorage.setItem('chatSessions', updatedSessions, {
        encrypt: true,
        expiration: 24 * 60 * 60 * 1000, // 24 hours
      });
    },
    [getChatSessions],
  );

  const exportChatSession = useCallback((session: ChatSession) => {
    // Validate session object
    if (!session || !session.messages || !Array.isArray(session.messages)) {
      console.error('Invalid session data for export');
      return;
    }

    // Sanitize data for export
    const sanitizedTitle = session.title.replace(/[<>:"/\\|?*]/g, '-');
    const chatText = session.messages
      .filter((msg) => msg && msg.content) // Filter out invalid messages
      .map((msg) => {
        const role = msg.type === 'user' ? 'คุณ' : 'AI';
        const content = msg.content.replace(/[<>]/g, ''); // Basic XSS prevention
        return `${role}: ${content}`;
      })
      .join('\n\n');

    const exportData = [
      `แชทเซสชัน: ${sanitizedTitle}`,
      `สร้างเมื่อ: ${new Date(session.createdAt).toLocaleString('th-TH')}`,
      `Knowledge Base: ${session.knowledgeBases.join(', ')}`,
      '',
      chatText,
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

      // Security: Append to body, click, and remove immediately
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Failed to export chat session:', error);
    }
  }, []);

  const clearAllSessions = useCallback(() => {
    secureStorage.removeItem('chatSessions');
  }, []);

  const getSessionById = useCallback(
    (sessionId: string): ChatSession | null => {
      if (!sessionId || typeof sessionId !== 'string') return null;

      const sessions = getChatSessions();
      return sessions.find((session) => session.id === sessionId) || null;
    },
    [getChatSessions],
  );

  const updateSession = useCallback(
    (sessionId: string, updates: Partial<ChatSession>) => {
      if (!sessionId || typeof sessionId !== 'string') return false;

      const sessions = getChatSessions();
      const sessionIndex = sessions.findIndex(
        (session) => session.id === sessionId,
      );

      if (sessionIndex === -1) return false;

      const updatedSession = {
        ...sessions[sessionIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      sessions[sessionIndex] = updatedSession;

      secureStorage.setItem('chatSessions', sessions, {
        encrypt: true,
        expiration: 24 * 60 * 60 * 1000, // 24 hours
      });

      return true;
    },
    [getChatSessions],
  );

  return {
    saveChatSession,
    getChatSessions,
    deleteChatSession,
    exportChatSession,
    clearAllSessions,
    getSessionById,
    updateSession,
  };
};
