'use client';

import type { ChatSession } from '@/hooks/useChatHistory';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useCallback, useEffect, useRef } from 'react';
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
  const { sessions, loading, loadingMore, hasMore, loadHistory, loadMore } =
    useChatHistory();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isInitialLoadDone = useRef(false);

  // Load first page when panel opens
  useEffect(() => {
    if (isOpen && !isInitialLoadDone.current) {
      isInitialLoadDone.current = true;
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  // Infinite scroll via IntersectionObserver on sentinel element
  useEffect(() => {
    if (!isOpen || loading || loadingMore || !hasMore || sessions.length === 0)
      return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, hasMore, loadingMore, loading, loadMore]);

  const SkeletonCards = useCallback(
    ({ count }: { count: number }) => (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className='animate-pulse rounded-lg bg-white p-4 shadow-md dark:bg-gray-900'
          >
            <div className='mb-2 h-3 w-3/4 rounded bg-gray-300 dark:bg-gray-700' />
            <div className='mb-3 h-2 w-1/2 rounded bg-gray-200 dark:bg-gray-600' />
            <div className='h-5 w-20 rounded-full bg-blue-200 dark:bg-blue-900/40' />
          </div>
        ))}
      </>
    ),
    [],
  );

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 overscroll-contain bg-black/50 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='flex h-full w-full flex-col gap-4 overflow-y-auto border-r border-gray-700/50 bg-gray-200 p-4 pt-4 shadow-2xl backdrop-blur-xl sm:w-1/2 lg:w-1/3 xl:w-1/5 dark:bg-gray-800 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-neutral-700'
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className='flex cursor-pointer items-center justify-end'
          onClick={onClose}
        >
          <span>
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

        {loading ? (
          <SkeletonCards count={5} />
        ) : (
          <>
            {sessions.map((h) => (
              <ChatHistoryCard
                key={h.id}
                title={h.title}
                dateTime={new Date(h.started_at).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                messageCount={h.messageCount || 0}
                onClick={() => onLoadSession?.(h)}
              />
            ))}
            {sessions.length === 0 && (
              <div className='mt-10 text-center text-gray-500 dark:text-gray-400'>
                ไม่มีประวัติการสนทนา
              </div>
            )}

            {/* Loading more indicator */}
            {loadingMore && <SkeletonCards count={3} />}

            {/* Sentinel element for infinite scroll */}
            {hasMore && <div ref={sentinelRef} className='h-4 shrink-0' />}
          </>
        )}
      </div>
    </div>
  );
}
