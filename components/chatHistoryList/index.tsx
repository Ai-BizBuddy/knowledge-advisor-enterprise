"use client";

import ChatHistoryCard from "../chatHistoryCard";

const histories = [
    {
        title: "มาตรฐานสินค้าทางการเกษตร",
        dateTime: "7 ก.ค. 2568 22:48",
        messageCount: 4,
        size: "1 KB",
        tags: [
            "ประกาศคำสั่งแต่งตั้งคณะกรรมการวิชาการ",
            "มาตรฐานสินค้าทางการเกษตร",
        ],
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overscroll-contain" onClick={onClose}>

            <div className="pt-4  h-full flex flex-col gap-4 p-4 w-96 dark:bg-gray-800 bg-gray-200 backdrop-blur-xl border-r border-gray-700/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>

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
        </div >
    );
}
