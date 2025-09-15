import { DocumentPreview } from '@/components/deepSearch/DocumentPreview';
import { UI_CONSTANTS } from '@/constants';
import { useDocumentViewer } from '@/hooks';
import { IChatCardProps } from '@/interfaces/ChatCard';
import { documentViewerService } from '@/services';
import Image from 'next/image';
import React from 'react';
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
  const {
    isViewerOpen,
    viewerDocument,
    error,
    openDocumentViewer,
    closeDocumentViewer,
  } = useDocumentViewer();

  // Track individual loading states for specific document links
  const [loadingStates, setLoadingStates] = React.useState<
    Record<string, boolean>
  >({});

  // Helper functions for individual loading states
  const setDocumentLoading = React.useCallback(
    (docId: string, loading: boolean) => {
      setLoadingStates((prev) => ({
        ...prev,
        [docId]: loading,
      }));
    },
    [],
  );

  const isDocumentLoading = React.useCallback(
    (docId: string) => {
      return loadingStates[docId] || false;
    },
    [loadingStates],
  );

  // Enhanced document viewer opener with individual loading
  const handleOpenDocumentViewer = React.useCallback(
    async (url: string, pageNumber?: number) => {
      const docId = documentViewerService.isDocumentLink(url)
        ? url
        : `url-${Date.now()}`;

      setDocumentLoading(docId, true);

      try {
        await openDocumentViewer(url, pageNumber);
      } finally {
        setDocumentLoading(docId, false);
      }
    },
    [openDocumentViewer, setDocumentLoading],
  );

  // Ensure message is always a string to prevent [object Object] rendering
  const safeMessage = (() => {
    if (typeof message === 'string') return message;
    if (message === null || message === undefined) return '';

    // Log warning for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('ChatCard received non-string message:', {
        type: typeof message,
        value: message,
        name: name,
      });
    }

    // Type assertion to handle cases where message might not be a string despite the interface
    const anyMessage = message as unknown;

    if (typeof anyMessage === 'object' && anyMessage !== null) {
      // Handle array or object cases
      if (Array.isArray(anyMessage)) {
        return anyMessage.join(' ');
      }
      // For objects, try to extract meaningful content
      const obj = anyMessage as Record<string, unknown>;
      if ('content' in obj && typeof obj.content === 'string') {
        return obj.content;
      }
      if ('text' in obj && typeof obj.text === 'string') {
        return obj.text;
      }
      // Last resort: JSON stringify but with better formatting
      return JSON.stringify(anyMessage, null, 2);
    }
    return String(anyMessage);
  })();
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
              h1: ({ ...props }) => (
                <h1 className='text-3xl font-bold text-blue-600' {...props} />
              ),
              a: ({ href, children, ...props }) => {
                const url = href || '';

                // Check if this is a document link that should open in viewer
                if (documentViewerService.isDocumentLink(url)) {
                  const isThisDocLoading = isDocumentLoading(url);

                  return (
                    <button
                      type='button'
                      className='font-inherit cursor-pointer border-none bg-transparent p-0 text-blue-500 underline hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        handleOpenDocumentViewer(url);
                      }}
                      disabled={isThisDocLoading}
                    >
                      {children}
                      {isThisDocLoading && (
                        <span className='ml-1 inline-flex items-center'>
                          <svg
                            className='h-3 w-3 animate-spin'
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
                        </span>
                      )}
                    </button>
                  );
                }

                // Regular external link
                return (
                  <a
                    className='text-red-500 underline'
                    href={href}
                    target='_blank'
                    rel='noopener noreferrer'
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              // Custom component to handle document references
              p: ({ children, ...props }) => {
                // Convert children to string safely, handling arrays and objects
                const getTextContent = (node: React.ReactNode): string => {
                  if (node === null || node === undefined) return '';
                  if (typeof node === 'string') return node;
                  if (typeof node === 'number') return node.toString();
                  if (typeof node === 'boolean') return '';
                  if (Array.isArray(node))
                    return node.map(getTextContent).join('');
                  if (typeof node === 'object' && 'props' in node) {
                    const element = node as {
                      props?: { children?: React.ReactNode };
                    };
                    if (element.props?.children) {
                      return getTextContent(element.props.children);
                    }
                  }
                  return String(node);
                };

                const content = getTextContent(children);

                // Check if this paragraph contains document references
                const documentRefPattern =
                  /\[📄 Document: ([^,]+), Page: (\d+), DocumentId: ([a-f0-9-]+)\]/g;

                if (documentRefPattern.test(content)) {
                  // Parse document references and create clickable links
                  const parts = content.split(documentRefPattern);
                  const elements: React.ReactNode[] = [];

                  for (let i = 0; i < parts.length; i += 4) {
                    // Add text before the match
                    if (parts[i]) {
                      elements.push(parts[i]);
                    }

                    // Add clickable document link if we have a match
                    if (parts[i + 1] && parts[i + 2] && parts[i + 3]) {
                      const fileName = parts[i + 1];
                      const pageNum = parts[i + 2];
                      const docId = parts[i + 3];

                      const isThisDocLoading = isDocumentLoading(docId);

                      elements.push(
                        <button
                          key={`doc-${docId}-${i}`}
                          type='button'
                          className='font-inherit inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-blue-600 underline hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50'
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            const page = parseInt(pageNum, 10);
                            handleOpenDocumentViewer(docId, page);
                          }}
                          disabled={isThisDocLoading}
                        >
                          <span className='text-sm'>📄</span>
                          <span>
                            {fileName} (Page {pageNum})
                          </span>
                          {isThisDocLoading && (
                            <svg
                              className='ml-1 h-3 w-3 animate-spin'
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
                          )}
                        </button>,
                      );
                    }
                  }

                  return (
                    <p className='mb-2' {...props}>
                      {elements}
                    </p>
                  );
                }

                // Regular paragraph
                return (
                  <p className='mb-2' {...props}>
                    {children}
                  </p>
                );
              },
              code: ({ ...props }) => {
                // @ts-expect-error: 'inline' is provided as a positional argument by ReactMarkdown
                const { inline } = props;
                return (
                  <code
                    className={`dark:bg-dark-700 bg-dark-900 rounded px-1 ${inline ? 'text-pink-600' : 'block p-2'}`}
                    {...props}
                  />
                );
              },
              br: ({ ...props }) => <br {...props} />,
              table: ({ ...props }) => (
                <table
                  className='mb-2 border-collapse border border-gray-300 dark:border-gray-600'
                  {...props}
                />
              ),
              th: ({ ...props }) => (
                <th
                  className='border border-gray-300 bg-gray-100 p-2 font-semibold dark:border-gray-600 dark:bg-gray-700'
                  {...props}
                />
              ),
              td: ({ ...props }) => (
                <td
                  className='border border-gray-300 p-2 dark:border-gray-600'
                  {...props}
                />
              ),
              ul: ({ ...props }) => (
                <ul className='mb-2 list-inside list-disc' {...props} />
              ),
              ol: ({ ...props }) => (
                <ol className='mb-2 list-inside list-decimal' {...props} />
              ),
              li: ({ ...props }) => <li className='mb-1' {...props} />,
              pre: ({ ...props }) => (
                <pre
                  className='mb-2 overflow-x-auto rounded bg-gray-100 p-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  {...props}
                />
              ),
            }}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {safeMessage.replace(/<br\s*>/g, '<br/>')}
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

      {/* Document Viewer Modal */}
      {isViewerOpen && viewerDocument && (
        <DocumentPreview
          document={viewerDocument}
          isOpen={isViewerOpen}
          onClose={closeDocumentViewer}
          isFullScale={true}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className='fixed right-4 bottom-4 z-50 max-w-sm rounded-lg bg-red-100 p-4 text-red-800 shadow-lg dark:bg-red-900 dark:text-red-200'>
          <div className='flex items-center'>
            <svg
              className='mr-2 h-5 w-5'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
            <span className='text-sm'>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
