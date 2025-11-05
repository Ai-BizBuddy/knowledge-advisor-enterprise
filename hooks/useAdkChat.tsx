'use client';
import { adkChatService } from '@/services';
import { createClient } from '@/utils/supabase/client';
import { useCallback, useState } from 'react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  selectedKnowledgeBase?: string[];
  sessionId?: string;
  responseTime?: number;
  isStreaming?: boolean;
  onlineMode?: boolean;
}

export interface KnowledgeBaseSelection {
  id: string; // Changed to string to match project IDs
  name: string;
  selected: boolean;
  documentCount: number;
}

export const useAdkChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'error' | 'timeout'
  >('connected');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  // Get current user ID
  const getCurrentUserId = useCallback(async (): Promise<string | null> => {
    if (userId) return userId;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        setUserId(user.id);
        return user.id;
      }
    } catch {
      // Handle auth error silently
    }
    return null;
  }, [userId, supabase]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateMessage = useCallback(
    (messageId: string, content: string, isComplete = false) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content, isStreaming: !isComplete }
            : msg,
        ),
      );
    },
    [],
  );

  const addWelcomeMessage = useCallback(() => {
    setMessages([welcomeMessage]);
  }, []);

  const createNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setIsTyping(false);
    setConnectionStatus('connected');

    // Add welcome message for new chat

    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      selectedKBs: KnowledgeBaseSelection[],
      onlineMode: boolean = false,
    ) => {
      if (!content.trim() || selectedKBs.length === 0) {
        if (selectedKBs.length === 0) {
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content:
              'กรุณาเลือก Knowledge Base อย่างน้อย 1 รายการก่อนที่จะถามคำถามครับ',
            timestamp: new Date().toISOString(),
          };
          addMessage(errorMessage);
        }
        return;
      }

      // Get user ID
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'ไม่สามารถระบุตัวตนผู้ใช้ได้ กรุณาเข้าสู่ระบบใหม่',
          timestamp: new Date().toISOString(),
        };
        addMessage(errorMessage);
        return;
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content,
        timestamp: new Date().toISOString(),
        selectedKnowledgeBase: selectedKBs.map((kb) => kb.name),
        onlineMode,
      };
      addMessage(userMessage);

      // Start typing and set connecting status
      setIsTyping(true);
      setConnectionStatus('connecting');

      // Create AI response message for streaming
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        type: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };
      addMessage(aiMessage);

      try {
        // Send message with streaming to ADK
        const chatResult = await adkChatService.sendMessageWithStreaming(
          {
            question: content,
            userId: currentUserId,
            sessionId: currentSessionId, // Will be null for first call, then use returned sessionId
            filters: {
              project_id: selectedKBs.map((kb) => kb.id),
            },
            onlineMode: onlineMode,
          },
          // Stream data handler
          (streamData: string) => {
            updateMessage(aiMessageId, streamData, false);
          },
          // Complete handler
          (finalContent: string) => {
            updateMessage(aiMessageId, finalContent, true);
            setConnectionStatus('connected');
            setIsTyping(false);
          },
          // Error handler
          (error: string) => {
            updateMessage(
              aiMessageId,
              `ขออภัยครับ เกิดข้อผิดพลาด: ${error}`,
              true,
            );
            setConnectionStatus('error');
            setIsTyping(false);
          },
        );

        // Update session ID if we got it from API response
        if (chatResult.sessionId && !currentSessionId) {
          setCurrentSessionId(chatResult.sessionId);
        }
      } catch (error) {
        setConnectionStatus('error');
        setIsTyping(false);

        const errorMessage =
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
        updateMessage(
          aiMessageId,
          `ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อ: ${errorMessage}`,
          true,
        );

        // Reset connection status after a delay
        setTimeout(() => {
          setConnectionStatus('connected');
        }, 5000);
      }
    },
    [addMessage, updateMessage, getCurrentUserId, currentSessionId],
  );

  return {
    messages,
    isTyping,
    connectionStatus,
    currentSessionId,
    addMessage,
    addWelcomeMessage,
    sendMessage,
    createNewChat,
    setMessages,
  };
};

const welcomeMessage: ChatMessage = {
  id: Date.now().toString(),
  type: 'assistant',
  content:
    'สวัสดีครับ! ผมเป็น AI Assistant ที่จะช่วยคุณในการค้นหาข้อมูลจาก Knowledge Base ของคุณ\n\nกรุณาเลือก Knowledge Base ที่ต้องการสอบถาม หรือเลือกทั้งหมดเพื่อค้นหาข้อมูลจากทุก Knowledge Base\n\nจากนั้นสามารถถามคำถามได้เลยครับ!',
};
