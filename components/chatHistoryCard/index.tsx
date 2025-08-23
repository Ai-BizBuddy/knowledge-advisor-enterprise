import { ChatHistoryProps } from "@/interfaces/ChatHistoryProps";

export default function ChatHistoryCard({
  title,
  dateTime,
  messageCount,
  size,
  tags,
  onDelete,
  onExport,
}: ChatHistoryProps) {
  return (
    <div className="cursor-pointer rounded-lg bg-white p-4 text-white shadow transition-all hover:shadow-lg dark:bg-gray-900/95">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mb-3 text-xs text-gray-400">{dateTime}</p>

          <div className="mb-3 flex items-center space-x-2">
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs">
              {messageCount} ข้อความ
            </span>
            <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs">
              {size}
            </span>
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-1">
            <button
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-500/10 hover:text-blue-400"
              title="ส่งออก"
              onClick={onExport}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
            </button>
            <button
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
              title="ลบ"
              onClick={onDelete}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {tags.map((tag, i) => (
        <span
          key={i}
          className="mr-2 mb-1 inline-block rounded-md bg-gray-200 px-2 py-1 text-xs text-gray-900 dark:bg-gray-800 dark:text-gray-300"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
