import { UI_CONSTANTS } from '@/constants';
import { IChatCardProps } from '@/interfaces/ChatCard';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

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
  const containerClasses = `flex items-start gap-3 mb-4 chat-message  ${
    isUser
      ? 'justify-end chat-message-user'
      : 'justify-start chat-message-assistant'
  }`;

  const messageClasses = `flex flex-col message-bubble overflow-x-auto p-4 ${
    isUser
      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md '
      : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl rounded-tl-md  shadow-sm'
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
        <div
          className={`${messageClasses} text-sm leading-relaxed break-words whitespace-pre-wrap`}
        >
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1 className='text-3xl font-bold text-blue-600' {...props} />
              ),
              a: ({ node, ...props }) => (
                <a
                  className='text-red-500 underline'
                  target='_blank'
                  {...props}
                />
              ),
              code: ({ node, ...props }) => {
                // @ts-expect-error: 'inline' is provided as a positional argument by ReactMarkdown
                const { inline } = props;
                return (
                  <code
                    className={`rounded  dark:bg-dark-700 bg-dark-900 px-1 ${inline ? 'text-pink-600' : 'block p-2'}`}
                    {...props}
                  />
                );
              },
              br: ({ node, ...props }) => <br {...props} />,
              p: ({ node, ...props }) => <p className='mb-2' {...props} />,
              table: ({ node, ...props }) => (
                <table className='border-collapse border border-gray-300 dark:border-gray-600 mb-2' {...props} />
              ),
              th: ({ node, ...props }) => (
                <th className='border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 font-semibold p-2' {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className='border border-gray-300 dark:border-gray-600 p-2' {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className='list-disc list-inside mb-2' {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className='list-decimal list-inside mb-2' {...props} />
              ),
              li: ({ node, ...props }) => <li className='mb-1' {...props} />,
              pre: ({ node, ...props }) => (
                <pre
                  className='mb-2 overflow-x-auto rounded bg-gray-100 p-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  {...props}
                />
              ),
            }}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {message.replace(/<br\s*>/g, '<br/>')}
          </ReactMarkdown>
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
