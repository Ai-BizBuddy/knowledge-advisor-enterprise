import { createClientTable } from '@/utils/supabase/client';
import { ChatSession } from '../DashboardService';




class ChatHistoryService {

    async loadHistory(): Promise<ChatSession[]> {
        const supabaseTable = createClientTable();
        
        // Join tables: sessions <- session_events <- memories
        // sessions.id = session_events.session_id
        // session_events.id = memories.id
        // check data output is memories not null
        const { data, error } = await supabaseTable
            .from('sessions')
            .select(`
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
            `)
            .not('session_events.memories', 'is', null);

            console.log('Supabase loadHistory data:', data);

        if (error) {
            console.error('Error loading chat history:', error);
            alert('Error loading chat history. Please check console for details.');
            return [];
        }

        const sessionsEventsLog: ChatSession[] = data.map((session) => {
                try {
                    // Get the first event to extract title information
                    const firstEvent = session.session_events[0];
                    let title = 'ไม่มีชื่อเรื่อง';
                    // let knowledgeBaseId = null;

                    if (firstEvent) {
                        // knowledgeBaseId = firstEvent.knowledge_base_id || null;
                        
                        // Extract title from event_data content
                        if (firstEvent.event_data) {
                            const contentText = JSON.parse(firstEvent.event_data).content.parts[0].text;
                            console.log('Content Text:', contentText);
                            title = contentText.split('\n')[0] || 'ไม่มีชื่อเรื่อง';
                        }
                    }

                    return {
                        id: session.id,
                        user_id: session.user_id,
                        // knowledge_base_id: knowledgeBaseId,
                        title: title,
                        messageCount: session.session_events.filter((e) => e.memories !== null).length || 0,
                        started_at: session.created_at || '',
                        ended_at: session.updated_at || undefined,
                    };
                } catch (parseError) {
                    
                    console.error('Error parsing event data:', parseError);
                    return {
                        id: session.id,
                        user_id: session.user_id,
                        // knowledge_base_id: null,
                        messageCount: session.session_events.filter((e) => e.memories !== null).length || 0,
                        title: 'ไม่มีชื่อเรื่อง',
                        started_at: session.created_at || '',
                        ended_at: session.updated_at || undefined,
                    };
                }
            });

        return sessionsEventsLog;
    }

    async deleteSession(sessionId: string) {
        const supabaseTable = createClientTable();
        const { error } = await supabaseTable.from('sessions').delete().eq('id', sessionId);
        const { error: eventError } = await supabaseTable.from('session_events').delete().eq('session_id', sessionId);
        if (error || eventError) {
            console.error('Error deleting chat session:', error || eventError);
            return false;
        }
        return true;
    }
}

export default ChatHistoryService;