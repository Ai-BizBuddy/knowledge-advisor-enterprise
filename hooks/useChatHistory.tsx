import { useCallback } from "react";
import { ChatMessage } from "@/hooks/useChat";

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
      const sessions = localStorage.getItem('chatSessions');
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  }, []);

  const saveChatSession = useCallback((messages: ChatMessage[], title: string, knowledgeBases: string[]) => {
    const sessions = getChatSessions();
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title,
      messages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      knowledgeBases
    };
    
    const updatedSessions = [newSession, ...sessions];
    localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
    return newSession;
  }, [getChatSessions]);

  const deleteChatSession = useCallback((sessionId: string) => {
    const sessions = getChatSessions();
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
  }, [getChatSessions]);
  const exportChatSession = useCallback((session: ChatSession) => {
    const chatText = session.messages
      .map(msg => `${msg.type === 'user' ? 'คุณ' : 'AI'}: ${msg.content}`)
      .join('\n\n');
    
    const exportData = `แชทเซสชัน: ${session.title}\nสร้างเมื่อ: ${new Date(session.createdAt).toLocaleString('th-TH')}\nKnowledge Base: ${session.knowledgeBases.join(', ')}\n\n${chatText}`;
    
    const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${session.title}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return {
    saveChatSession,
    getChatSessions,
    deleteChatSession,
    exportChatSession
  };
};
