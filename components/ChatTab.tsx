'use client';

import {
  BotTypingBubble,
  ChatCard,
  ChatHistoryList
} from '@/components';
import { useToast } from '@/components/toast';
import { useAdkChat } from '@/hooks';
import { Project } from '@/interfaces/Project';
import type { ChatSession } from '@/services/DashboardService';
import Image from 'next/image';
import React, { useRef, useState } from 'react';



interface ChatTabProps {
  // Knowledge base info for context
  knowledgeBase: Project | null;
  knowledgeBaseId: string;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  knowledgeBase,
  knowledgeBaseId,
}) => {
  const { showToast } = useToast();

  // Internal state management
  const [message, setMessage] = useState('');
  const [openHistory, setOpenHistory] = useState(false);

  // Chat scroll ref
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  // Chat hooks and handlers
  const {
    messages,
    isTyping,
    sendMessage,
    createNewChat,
  } = useAdkChat();

  const handleSendMessage = async () => {
    try {
      if (!message.trim()) return;

      const kbSelection = knowledgeBaseId
        ? [
            {
              id: knowledgeBaseId,
              name: knowledgeBase?.name || 'Unknown',
              selected: true,
              documentCount: 0, // This will be updated by the real-time table
            },
          ]
        : [];

      await sendMessage(message, kbSelection);
      setMessage('');

      // Small delay to ensure message is added to state, then scroll
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (err) {
      console.error('[ChatTab] Chat error:', err);
      showToast('Failed to send message. Please try again.', 'error', 4000);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLoadChatSession = (session: ChatSession) => {
    // ChatSession doesn't have messages property - need to fetch messages separately
    // For now, create a new chat session since we don't have the messages
    createNewChat();
    setOpenHistory(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleSendMessage();
    } catch (err) {
      console.error('[ChatTab] Chat error:', err);
      showToast('Failed to send message. Please try again.', 'error', 4000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit(e);
    }
  };

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* Chat Actions */}
      <div className='flex justify-end gap-2'>
        <button
          type='button'
          onClick={() => {
            createNewChat();
          }}
          className='flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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
          <span>New Chat</span>
        </button>

        <button
          type='button'
          onClick={() => setOpenHistory(!openHistory)}
          className='flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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
          <span>History</span>
        </button>
      </div>

      {/* Chat Interface */}
      <div className='flex h-[70vh] flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm dark:border-gray-700 dark:bg-gray-900'>
        {/* Chat Messages Area */}
        <div
          ref={chatMessagesRef}
          className='chat-scroll-container width-full flex-1 space-y-2 overflow-y-auto p-4'
        >
          {messages.length === 0 && (
            <div className='flex h-full flex-col items-center justify-center text-center'>
              <div className='mb-6 rounded-full bg-blue-100 p-6 dark:bg-blue-900'>
                <svg
                  className='h-12 w-12 text-blue-600 dark:text-blue-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                  />
                </svg>
              </div>
              <h3 className='mb-2 text-lg font-semibold text-gray-900 dark:text-white'>
                Welcome to Chat Assistant
              </h3>
              <p className='mb-4 max-w-md text-sm text-gray-600 dark:text-gray-400'>
                Ask questions about your knowledge base documents. I&apos;m here to help you find the information you need.
              </p>
              <div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
                <p className='text-xs text-blue-800 dark:text-blue-200'>
                  💡 Try asking: &ldquo;What topics are covered in my documents?&rdquo; or &ldquo;Summarize the main points&rdquo;
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, index) => {
            if (msg.type === 'user') {
              return (
                <div key={index} className='flex justify-end'>
                  <div className='max-w-[80%] rounded-lg bg-blue-600 px-4 py-2 text-white'>
                    <div className='whitespace-pre-wrap text-sm'>{msg.content}</div>
                    {msg.selectedKnowledgeBase && msg.selectedKnowledgeBase.length > 0 && (
                      <div className='mt-2 flex flex-wrap gap-1'>
                        {msg.selectedKnowledgeBase.map((kbName, kbIndex) => (
                          <span
                            key={kbIndex}
                            className='rounded-full bg-blue-500 px-2 py-1 text-xs text-white'
                          >
                            {kbName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            } else {
              return (
                <div key={index} className='flex items-start gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700'>
                    <Image
                      src='/robot.png'
                      alt='Assistant'
                      width={20}
                      height={20}
                      className='rounded-full'
                    />
                  </div>
                  <div className='max-w-[80%] rounded-lg bg-white px-4 py-2 shadow-sm dark:bg-gray-800'>
                    <ChatCard 
                      message={msg.content} 
                      name='Assistant'
                      avatar='/robot.png'
                      isUser={false}
                    />
                  </div>
                </div>
              );
            }
          })}

          {isTyping && <BotTypingBubble />}
        </div>

        {/* Message Input */}
        <div className='width-full border-t border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800'>
          <form
            onSubmit={handleFormSubmit}
            className='flex items-end gap-3'
          >
            <div className='flex-1'>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Type your message...'
                className='w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400'
                rows={3}
                disabled={isTyping}
              />
            </div>
            <button
              type='submit'
              disabled={!message.trim() || isTyping}
              className='flex items-center justify-center rounded-lg bg-blue-600 p-2 text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <svg
                className='h-5 w-5'
                fill='none'
                stroke='currentColor'
                strokeWidth={2}
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
                />
              </svg>
            </button>
          </form>
          <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
            กด Enter เพื่อส่งข้อความ, Shift + Enter เพื่อขึ้นบรรทัดใหม่
          </p>
        </div>
      </div>

      {/* Chat History Modal */}
      <ChatHistoryList
        isOpen={openHistory}
        onClose={() => setOpenHistory(false)}
        onLoadSession={handleLoadChatSession}
      />
    </div>
  );
};

export default ChatTab;
