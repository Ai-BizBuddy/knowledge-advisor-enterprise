import { ChatHistoryProps } from '@/interfaces/ChatHistoryProps';

export default function ChatHistoryCard({
  title,
  dateTime,
  messageCount,
  onClick,
}: ChatHistoryProps) {
  return (
    <div
      className='cursor-pointer rounded-lg bg-white p-4 text-white shadow transition-all hover:shadow-lg dark:bg-gray-900/95'
      onClick={onClick}
    >
      <div className='flex items-start justify-between'>
        <div className='w-[80%]'>
          <h3 className='mb-1 text-sm font-semibold text-gray-900 dark:text-white truncate '>
            {title}
          </h3>
          <p className='mb-3 text-xs text-gray-400'>{dateTime}</p>

          <div className='mb-3 flex items-center space-x-2'>
            <span className='rounded-full bg-blue-600 px-2 py-0.5 text-xs'>
              {messageCount} ข้อความ
            </span>
            {/* <span className='rounded-full bg-green-600 px-2 py-0.5 text-xs'>
              {size}
            </span> */}
          </div>
        </div>
      </div>
    </div>
  );
}
