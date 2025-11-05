'use client';

import {
  BotTypingBubble,
  ChatCard,
  ChatHistoryList,
  PageHeader,
} from '@/components';
import { useAdkChat } from '@/hooks';
import { ChatMessage } from '@/hooks/useAdkChat';
import { useChatHistory } from '@/hooks/useChatHistory';
import { Project } from '@/interfaces/Project';
import type { ChatSession } from '@/services/DashboardService';
import { Button } from 'flowbite-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';



const createWelcomeMessage = (knowledgeBaseName?: string): ChatMessage => ({
  id: Date.now().toString(),
  type: 'assistant',
  content: knowledgeBaseName
    ? `สวัสดีครับ! ผมเป็น AI Assistant ที่จะช่วยคุณในการค้นหาข้อมูลจาก Knowledge Base "${knowledgeBaseName}"\n\nคุณสามารถถามคำถามเกี่ยวกับเอกสารและข้อมูลใน Knowledge Base นี้ได้เลยครับ!`
    : 'สวัสดีครับ! ผมเป็น AI Assistant ที่จะช่วยคุณในการค้นหาข้อมูลจาก Knowledge Base ของคุณ\n\nคุณสามารถถามคำถามได้เลยครับ!',
});

interface ChatTabProps {
  // Knowledge base info for context
  knowledgeBase: Project | null;
  knowledgeBaseId: string;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  knowledgeBase,
  knowledgeBaseId,
}) => {
  const [isOnline] = useState(false);
  const [message, setMessage] = useState('');
  const [openHistory, setOpenHistory] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isTyping,
    addWelcomeMessage,
    sendMessage,
    createNewChat,
    setMessages,
  } = useAdkChat();

  const { getChatSessions } = useChatHistory();

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addWelcomeMessage();
    }
  }, [messages.length, addWelcomeMessage]);

  const handleLoadChatSession = useCallback(
    async (session: ChatSession) => {
      const sessionMessages = await getChatSessions(session.id);
      const welcomeMsg = createWelcomeMessage(knowledgeBase?.name);
      setMessages([
        welcomeMsg,
        ...sessionMessages.filter((msg) =>
          msg.content.includes('video_metadata=None') ||
          msg.content.includes('image_metadata=None') ||
          msg.content.includes('text_metadata=None')
            ? false
            : true,
        ),
      ]);
      setOpenHistory(false);
    },
    [getChatSessions, setMessages, knowledgeBase?.name],
  );

  const handleCloseHistory = useCallback(() => {
    setOpenHistory(false);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) return;

    // Use current knowledge base directly
    const selectedKBs = knowledgeBase && knowledgeBaseId ? [
      {
        id: knowledgeBaseId,
        name: knowledgeBase.name,
        selected: true,
        documentCount: knowledgeBase.document_count || 0,
      }
    ] : [];
    
    const messageContent = message;
    setMessage('');
    await sendMessage(messageContent, selectedKBs, isOnline);
  }, [message, sendMessage, isOnline, knowledgeBase, knowledgeBaseId]);

  // Auto-scroll optimization with debouncing
  const scrollToBottom = useCallback(() => {
    if (chatMessagesRef.current) {
      requestAnimationFrame(() => {
        const element = chatMessagesRef.current;
        if (element) {
          element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth',
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timeoutId);
  }, [messages, isTyping, scrollToBottom]);

  return (
    <>
      <ChatHistoryList
        isOpen={openHistory}
        onClose={handleCloseHistory}
        onLoadSession={handleLoadChatSession}
      />

      <div className='min-h-full'>
        {/* Main Container with consistent responsive padding */}
        <div className='space-y-3 sm:space-y-3'>
          {/* Page Header - Outside the card */}
          <PageHeader
            title='AI Chat Assistant'
            subtitle={
              knowledgeBase
                ? `Chatting with ${knowledgeBase.name}`
                : 'Knowledge Base Chat Assistant'
            }
          />

          {/* Control Section */}
          <div className='rounded-lg border border-gray-200 bg-white px-3 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
            <div className='flex justify-end gap-3 border-b border-gray-200 pb-3 dark:border-gray-700'>
              {/* Action Buttons */}
              <Button
                type='button'
                color='light'
                onClick={() => createNewChat()}
                className='flex items-center justify-center gap-2'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={2}
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 4v16m8-8H4'
                  />
                </svg>
                <span className='text-sm font-medium'>New Chat</span>
              </Button>

              <Button
                type='button'
                color='light'
                onClick={() => setOpenHistory(!openHistory)}
                className='flex items-center justify-center gap-2'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={2}
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <span className='text-sm font-medium'>History</span>
              </Button>
            </div>
            {/* Chat Messages Area */}
            <div
              ref={chatMessagesRef}
              className='h-[50vh] space-y-4 overflow-y-auto p-4 sm:h-[60vh] sm:p-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-neutral-700'
            >
              {messages.map((message, index) => {
                if (message.type === 'user') {
                  return (
                    <ChatCard
                      key={index}
                      avatar=''
                      name='User'
                      time={message.timestamp}
                      isUser
                      message={message.content}
                      status=''
                    />
                  );
                }
                if (
                  message.type === 'assistant' &&
                  message.content.trim() !== ''
                ) {
                  return (
                    <ChatCard
                      key={index}
                      avatar='/assets/logo-ka.svg'
                      name='Knowledge Assistant'
                      time={message.timestamp}
                      message={message.content}
                      status=''
                    />
                  );
                }
              })}

              {isTyping && <BotTypingBubble />}
            </div>

            {/* Message Input */}
            <div className='border-t border-gray-200 p-2 sm:p-2 lg:p-3 dark:border-gray-600'>
              {/* Mobile Layout */}
              <div className='block sm:hidden'>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!message.trim()) return;
                    await handleSendMessage();
                  }}
                  className='space-y-3'
                >
                  {/* Status and Input Row */}
                  <div className='flex items-center gap-2'>
                    <div className='flex-1'>
                      <textarea
                        ref={(textarea) => {
                          if (textarea) {
                            textarea.style.height = 'auto';
                            textarea.style.height =
                              Math.min(textarea.scrollHeight, 120) + 'px';
                          }
                        }}
                        placeholder='พิมพ์ข้อความของคุณที่นี่...'
                        className='auto-resize-textarea focus:ring-opacity-25 block max-h-[120px] min-h-[44px] w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400'
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          // Auto-resize textarea
                          e.target.style.height = 'auto';
                          e.target.style.height =
                            Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (message.trim()) {
                              handleSendMessage();
                            }
                          }
                        }}
                        rows={1}
                      />
                    </div>
                    <button
                      type='submit'
                      className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600'
                      disabled={!message.trim() || isTyping}
                      aria-label='ส่งข้อความ'
                    >
                      {isTyping ? (
                        <svg
                          className='h-5 w-5 animate-spin'
                          fill='none'
                          viewBox='0 0 24 24'
                        >
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                          />
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                          />
                        </svg>
                      ) : (
                        <svg
                          className='h-5 w-5'
                          fill='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Status Text */}
                  <div className='flex items-center justify-center'>
                    <div className='flex items-center gap-2'>
                      <div
                        className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
                      ></div>
                      <span className='text-xs text-gray-500 dark:text-gray-400'>
                        {isOnline ? 'Online Mode' : 'Offline Mode'}
                      </span>
                    </div>
                  </div>
                </form>
                <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
                  กด Enter เพื่อส่งข้อความ, Shift + Enter เพื่อขึ้นบรรทัดใหม่
                </p>
              </div>

              {/* Desktop Layout */}
              <div className='hidden sm:block'>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!message.trim()) return;
                    await handleSendMessage();
                  }}
                  className='flex items-center gap-3'
                >
                  <div className='flex-1'>
                    <textarea
                      ref={(textarea) => {
                        if (textarea) {
                          textarea.style.height = 'auto';
                          textarea.style.height =
                            Math.min(textarea.scrollHeight, 120) + 'px';
                        }
                      }}
                      placeholder='พิมพ์ข้อความของคุณที่นี่...'
                      className='auto-resize-textarea focus:ring-opacity-25 block max-h-[120px] min-h-[44px] w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400'
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        // Auto-resize textarea
                        e.target.style.height = 'auto';
                        e.target.style.height =
                          Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (message.trim()) {
                            handleSendMessage();
                          }
                        }
                      }}
                      rows={1}
                    />
                  </div>
                  <button
                    type='submit'
                    className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600'
                    disabled={!message.trim() || isTyping}
                    aria-label='ส่งข้อความ'
                  >
                    {isTyping ? (
                      <svg
                        className='h-5 w-5 animate-spin'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        />
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        />
                      </svg>
                    ) : (
                      <svg
                        className='h-5 w-5'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' />
                      </svg>
                    )}
                  </button>
                </form>
                <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
                  กด Enter เพื่อส่งข้อความ, Shift + Enter เพื่อขึ้นบรรทัดใหม่
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatTab;
