import { IChatCardProps } from "@/interfaces/ChatCard";
import Image from "next/image";
import { UI_CONSTANTS } from "@/constants";

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
  const containerClasses = `flex items-start gap-2.5 ${
    isUser ? "justify-end flex-row-reverse" : ""
  }`;

  const messageClasses = `flex flex-col bg-gray-200 dark:bg-gray-700 p-3 rounded-xl w-full max-w-[320px] leading-1.5 ${
    isUser ? "items-end text-right" : ""
  }`;

  const headerClasses = `flex items-center space-x-2 rtl:space-x-reverse ${
    isUser ? "flex-row-reverse space-x-reverse" : ""
  }`;

  return (
    <div className={containerClasses}>
      {/* Only show avatar for non-user messages */}
      {!isUser && (
        <Image
          className="h-8 w-8 rounded-full"
          src={avatar || "/assets/logo-ka.svg"}
          width={UI_CONSTANTS.AVATAR_SIZE}
          height={UI_CONSTANTS.AVATAR_SIZE}
          alt={`${name} avatar`}
        />
      )}

      <div className={messageClasses}>
        <div className={headerClasses}>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {name}
          </span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {time}
          </span>
        </div>
        <p className="py-2 text-sm font-normal text-gray-900 dark:text-white">
          {message}
        </p>
        {status && (
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
