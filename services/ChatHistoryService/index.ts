import { ChatMessage } from '@/hooks/useAdkChat';
import { createClientTable } from '@/utils/supabase/client';
import { ChatSession } from '../DashboardService';

interface SessionMemory {
  id: string;
  user_id: string;
  app_name: string;
  content: string;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

// Type for the raw Supabase response
interface SupabaseSessionResponse {
  id: string;
  app_name: string;
  user_id: string;
  state: string;
  last_update_time: string;
  created_at: string;
  updated_at: string;
  session_events: {
    id: string;
    session_id: string;
    event_data: string;
    timestamp: string;
    author: 'user' | 'assistant';
    created_at: string;
    memories: SessionMemory;
  }[];
}

class ChatHistoryService {
  async loadHistory(): Promise<ChatSession[]> {
    const supabaseTable = createClientTable();

    // Join tables: sessions <- session_events <- memories
    // sessions.id = session_events.session_id
    // session_events.id = memories.id
    // check data output is memories not null
    const { data, error } = await supabaseTable
      .from('sessions')
      .select(
        `
                id,
                app_name,
                user_id,
                state,
                last_update_time,
                created_at,
                updated_at,
                session_events!inner (
                    id,
                    session_id,
                    event_data,
                    timestamp,
                    created_at,
                    memories:id (
                        id,
                        user_id,
                        app_name,
                        content,
                        timestamp,
                        created_at,
                        updated_at
                    )
                )
            `,
      )
      .not('session_events.memories', 'is', null);

    console.log('Supabase loadHistory data:', data);

    if (error) {
      console.error('Error loading chat history:', error);
      alert('Error loading chat history. Please check console for details.');
      return [];
    }

    if (!data) {
      console.warn('No chat history data found');
      return [];
    }

    // Type guard for the response data
    const sessionData = data as unknown as SupabaseSessionResponse[];

    const sessionsEventsLog: ChatSession[] = sessionData.map((session) => {
      try {
        // Get the first event to extract title information
        const firstEvent = session.session_events[0];
        let title = 'ไม่มีชื่อเรื่อง';
        // let knowledgeBaseId = null;

        if (firstEvent) {
          // knowledgeBaseId = firstEvent.knowledge_base_id || null;

          // Extract title from event_data content
          if (firstEvent.event_data) {
            const contentText = JSON.parse(firstEvent.event_data).content
              .parts[0].text;
            console.log('Content Text:', contentText);
            title = contentText.split('\n')[0] || 'ไม่มีชื่อเรื่อง';
          }
        }

        return {
          id: session.id,
          user_id: session.user_id,
          // knowledge_base_id: knowledgeBaseId,
          title: title,
          messageCount:
            session.session_events.filter((e) => e.memories !== null).length ||
            0,
          started_at: session.created_at || '',
          ended_at: session.updated_at || undefined,
        };
      } catch (parseError) {
        console.error('Error parsing event data:', parseError);
        return {
          id: session.id,
          user_id: session.user_id,
          // knowledge_base_id: null,
          messageCount:
            session.session_events.filter((e) => e.memories !== null).length ||
            0,
          title: 'ไม่มีชื่อเรื่อง',
          started_at: session.created_at || '',
          ended_at: session.updated_at || undefined,
        };
      }
    });

    return sessionsEventsLog;
  }

  async getOldChat(sessionId: string): Promise<ChatMessage[] | null> {
    const supabaseTable = createClientTable();
    const { data, error } = await supabaseTable
      .from('sessions')
      .select(
        `
                id,
                app_name,
                user_id,
                state,
                last_update_time,
                created_at,
                updated_at,
                session_events!inner (
                    id,
                    session_id,
                    event_data,
                    timestamp,
                    author,
                    created_at,
                    memories:id (
                        id,
                        user_id,
                        app_name,
                        content,
                        timestamp,
                        created_at,
                        updated_at
                    )
                )
            `,
      )
      .eq('id', sessionId)
      .not('session_events.memories', 'is', null);

    if (error) {
      console.error('Error loading old chat:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn('No session data found for sessionId:', sessionId);
      return null;
    }

    // Type guard to ensure data structure is correct
    const sessionData = data as unknown as SupabaseSessionResponse[];

    const messages: ChatMessage[] = sessionData[0].session_events.map(
      (event) => ({
        id: event.id,
        type: event.author === 'user' ? 'user' : 'assistant',
        content: event.memories.content,
        timestamp: event.timestamp,
        selectedKnowledgeBase: [],
        sessionId: sessionData[0].id,
      }),
    );

    return messages;
  }

  async deleteSession(sessionId: string) {
    const supabaseTable = createClientTable();
    const { error } = await supabaseTable
      .from('sessions')
      .delete()
      .eq('id', sessionId);
    const { error: eventError } = await supabaseTable
      .from('session_events')
      .delete()
      .eq('session_id', sessionId);
    if (error || eventError) {
      console.error('Error deleting chat session:', error || eventError);
      return false;
    }
    return true;
  }
}

export default ChatHistoryService;
