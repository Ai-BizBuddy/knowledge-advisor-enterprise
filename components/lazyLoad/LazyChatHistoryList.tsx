'use client';

import type { ChatSession } from '@/hooks/useChatHistory';
import dynamic from 'next/dynamic';
import React from 'react';

// Skeleton shown while ChatHistoryList JS chunk loads
function ChatHistoryListSkeleton() {
  return (
    <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm'>
      <div className='flex h-full w-full flex-col gap-4 border-r border-gray-700/50 bg-gray-200 p-4 shadow-2xl backdrop-blur-xl sm:w-1/2 lg:w-1/3 xl:w-1/5 dark:bg-gray-800'>
        {/* close button placeholder */}
        <div className='flex items-center justify-end'>
          <div className='h-4 w-4 rounded bg-gray-300 dark:bg-gray-700' />
        </div>
        {/* skeleton cards */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className='animate-pulse rounded-lg bg-white p-4 shadow-md dark:bg-gray-900'
          >
            <div className='mb-2 h-3 w-3/4 rounded bg-gray-300 dark:bg-gray-700' />
            <div className='mb-3 h-2 w-1/2 rounded bg-gray-200 dark:bg-gray-600' />
            <div className='h-5 w-20 rounded-full bg-blue-200 dark:bg-blue-900/40' />
          </div>
        ))}
      </div>
    </div>
  );
}

// Props mirror ChatHistoryList
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession?: (session: ChatSession) => void;
}

const ChatHistoryListDynamic = dynamic(
  () => import('@/components/chatHistoryList'),
  {
    ssr: false,
    loading: () => <ChatHistoryListSkeleton />,
  },
);

export const LazyChatHistoryList: React.FC<Props> = (props) => {
  // Don't mount the dynamic component until the panel is opened.
  // This prevents the chunk download and hook initialisation on page load.
  if (!props.isOpen) return null;

  return <ChatHistoryListDynamic {...props} />;
};
