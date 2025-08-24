import { IChatCardProps } from '@/interfaces/ChatCard';
import Image from 'next/image';
import { UI_CONSTANTS } from '@/constants';

/**
 * ChatCard component displays a chat message with avatar, name, time, and message content
 */
export default function ChatCard({
  avatar,
  name,
  time,
  message,
  status,
  isUser = false,
}: IChatCardProps) {
  const containerClasses = `flex items-start gap-3 mb-4 chat-message ${
    isUser
      ? 'justify-end chat-message-user'
      : 'justify-start chat-message-assistant'
  }`;

  const messageClasses = `flex flex-col max-w-xs lg:max-w-md xl:max-w-lg message-bubble ${
    isUser
      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md px-4 py-3'
      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm'
  }`;

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className={containerClasses}>
      {/* Avatar for assistant only */}
      {!isUser && (
        <div className='flex-shrink-0'>
          <Image
            className='h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-700'
            src={avatar || '/assets/logo-ka.svg'}
            width={UI_CONSTANTS.AVATAR_SIZE}
            height={UI_CONSTANTS.AVATAR_SIZE}
            alt={`${name} avatar`}
          />
        </div>
      )}

      <div className='flex flex-col space-y-1'>
        {/* Message bubble */}
        <div className={messageClasses}>
          <p className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
            {message}
          </p>
        </div>

        {/* Time and status */}
        <div
          className={`flex items-center gap-2 px-2 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          {time && (
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              {formatTime(time)}
            </span>
          )}
          {status && (
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
