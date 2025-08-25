'use client';
import { langflowChatService } from '@/services';
import { useCallback, useState } from 'react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  selectedKnowledgeBase?: string[];
  sessionId?: string;
  responseTime?: number;
}

export interface KnowledgeBaseSelection {
  id: string; // Changed to string to match project IDs
  name: string;
  selected: boolean;
  documentCount: number;
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'error' | 'timeout'
  >('connected');

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const addWelcomeMessage = useCallback(() => {
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content:
        'สวัสดีครับ! ผมเป็น AI Assistant ที่จะช่วยคุณในการค้นหาข้อมูลจาก Knowledge Base ของคุณ\n\nกรุณาเลือก Knowledge Base ที่ต้องการสอบถาม หรือเลือกทั้งหมดเพื่อค้นหาข้อมูลจากทุก Knowledge Base\n\nจากนั้นสามารถถามคำถามได้เลยครับ!',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setMessages([welcomeMessage]);
  }, []);
  const sendMessage = useCallback(
    async (content: string, selectedKBs: KnowledgeBaseSelection[]) => {
      if (!content.trim() || selectedKBs.length === 0) {
        if (selectedKBs.length === 0) {
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content:
              'กรุณาเลือก Knowledge Base อย่างน้อย 1 รายการก่อนที่จะถามคำถามครับ',
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
          addMessage(errorMessage);
        }
        return;
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        selectedKnowledgeBase: selectedKBs.map((kb) => kb.name),
      };
      addMessage(userMessage);

      // Start typing and set connecting status
      setIsTyping(true);
      setConnectionStatus('connecting');
      try {
        // Send message to Langflow Chat API
        const chatResult = await langflowChatService.sendMessage({
          question: content,
          filters: {
            project_id: selectedKBs.map((kb) => kb.id).join(','),
          },
        });

        // Update connection status based on result
        if (chatResult.success) {
          setConnectionStatus('connected');
        } else {
          if (
            chatResult.error?.includes('ใช้เวลานานเกินไป') ||
            chatResult.error?.includes('timeout')
          ) {
            setConnectionStatus('timeout');
          } else {
            setConnectionStatus('error');
          }
        }

        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: chatResult.success
            ? chatResult.content
            : chatResult.error || 'ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          sessionId: chatResult.sessionId,
          responseTime: chatResult.responseTime,
        };

        addMessage(aiResponse);
      } catch (error) {
        console.error('Chat error:', error);
        setConnectionStatus('error');

        const errorResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content:
            'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI Assistant กรุณาลองใหม่อีกครั้ง',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        addMessage(errorResponse);
      } finally {
        setIsTyping(false);
        // Reset connection status to connected after a delay if there was an error
        setTimeout(() => {
          setConnectionStatus('connected');
        }, 5000);
      }
    },
    [addMessage],
  );
  return {
    messages,
    isTyping,
    connectionStatus,
    addMessage,
    addWelcomeMessage,
    sendMessage,
    setMessages,
  };
};
