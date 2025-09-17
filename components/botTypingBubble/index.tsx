import { UI_CONSTANTS } from '@/constants';
import Image from 'next/image';

/**
 * BotTypingBubble component shows a typing indicator for the chat bot
 */
export default function BotTypingBubble() {
  return (
    <div className='chat-message-assistant mb-4 flex items-end gap-3'>
      {/* Bot Avatar */}
      <div className='flex-shrink-0'>
        <Image
          className='h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-700'
          src='/assets/logo-ka.svg'
          width={UI_CONSTANTS.AVATAR_SIZE}
          height={UI_CONSTANTS.AVATAR_SIZE}
          alt='Bot avatar'
        />
      </div>

      {/* Typing bubble */}
      <div className='typing-indicator rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
        <div
          className='flex items-center space-x-1'
          role='status'
          aria-label='Bot is typing'
        >
          <span className='mr-2 text-sm text-gray-500 dark:text-gray-400'>
            กำลังพิมพ์
          </span>
          <span
            className='h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500'
            style={{ animationDelay: `${UI_CONSTANTS.ANIMATION_DELAY_1}ms` }}
          />
          <span
            className='h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500'
            style={{ animationDelay: `${UI_CONSTANTS.ANIMATION_DELAY_2}ms` }}
          />
          <span
            className='h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500'
            style={{ animationDelay: `${UI_CONSTANTS.ANIMATION_DELAY_3}ms` }}
          />
        </div>
      </div>
    </div>
  );
}
