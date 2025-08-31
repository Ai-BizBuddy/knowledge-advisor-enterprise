'use client';

import type { ChatSession } from '@/hooks/useChatHistory';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useCallback, useEffect } from 'react';
import ChatHistoryCard from '../chatHistoryCard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession?: (session: ChatSession) => void;
}

export default function ChatHistoryList({
  isOpen,
  onClose,
  onLoadSession,
}: Props) {
  const { 
    sessions, 
    loadHistory, 
    deleteChatSession, 
    exportChatSession 
  } = useChatHistory();

  const handleLoadSessions = useCallback(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  useEffect(() => {
    handleLoadSessions();
  }, [handleLoadSessions]);

  return isOpen ? (
    <div
      className='fixed inset-0 z-50 overscroll-contain bg-black/50 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='overflow-auto flex h-full w-full flex-col gap-4 border-r border-gray-700/50 bg-gray-200 p-4 pt-4 shadow-2xl backdrop-blur-xl sm:w-1/2 lg:w-1/3 xl:w-1/5 dark:bg-gray-800'
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className='flex cursor-pointer items-center justify-end'
          onClick={onClose}
        >
          <span>
            {/* x icon */}
            <svg
              className='h-4 w-4 text-gray-900 hover:text-red-500 sm:hidden dark:text-white'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M18 6L6 18M6 6l12 12'
              />
            </svg>
          </span>
        </div>
        {sessions.map((h, i) => (
          <ChatHistoryCard
            key={i}
            title={h.title}
            dateTime={new Date(h.started_at).toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
            messageCount={h.messageCount || 0} // No message count available in new interface
            // size={''}
            tags={h.knowledge_base_id ? [h.knowledge_base_id] : []}
            onClick={() => onLoadSession?.(h)}
            onDelete={async () => {
              await deleteChatSession(h.id);
              await loadHistory(); // Reload after deletion
            }}
            onExport={() => {
              exportChatSession(h);
            }}
          />
        ))}
        {sessions.length === 0 && (
          <div className='mt-10 text-center text-gray-500 dark:text-gray-400'>
            ไม่มีประวัติการสนทนา
          </div>
        )}
        {/*  */}
      </div>
    </div>
  ) : null;
}
