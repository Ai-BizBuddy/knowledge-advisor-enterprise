"use client";

import ChatHistoryCard from "../chatHistoryCard";

const histories = [
  {
    title: "มาตรฐานสินค้าทางการเกษตร",
    dateTime: "7 ก.ค. 2568 22:48",
    messageCount: 4,
    size: "1 KB",
    tags: ["ประกาศคำสั่งแต่งตั้งคณะกรรมการวิชาการ", "มาตรฐานสินค้าทางการเกษตร"],
  },
  {
    title: "AI ในภาคอุตสาหกรรม",
    dateTime: "2 ก.ค. 2568 10:15",
    messageCount: 7,
    size: "2.5 KB",
    tags: ["AI usage", "ความปลอดภัย"],
  },
  {
    title: "นโยบายด้านข้อมูลในสถานศึกษา",
    dateTime: "28 มิ.ย. 2568 09:00",
    messageCount: 3,
    size: "890 B",
    tags: ["GDPR", "นโยบายการเข้าถึง"],
  },
];

interface Props {
  onClose: () => void;
}

export default function ChatHistoryList({ onClose }: Props) {
  return (
    // <div className="w-full absolute  mx-auto space-y-4 text-white">
    <div
      className="fixed inset-0 z-50 overscroll-contain bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col gap-4 border-r border-gray-700/50 bg-gray-200 p-4 pt-4 shadow-2xl backdrop-blur-xl sm:w-1/2 lg:w-1/3 xl:w-1/5 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex cursor-pointer items-center justify-end"
          onClick={onClose}
        >
          <span>
            {/* x icon */}
            <svg
              className="h-4 w-4 text-gray-900 hover:text-red-500 sm:hidden dark:text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 6L6 18M6 6l12 12"
              />
            </svg>
          </span>
        </div>
        {histories.map((h, i) => (
          <ChatHistoryCard
            key={i}
            title={h.title}
            dateTime={h.dateTime}
            messageCount={h.messageCount}
            size={h.size}
            tags={h.tags}
          />
        ))}
        {/*  */}
      </div>
    </div>
  );
}
