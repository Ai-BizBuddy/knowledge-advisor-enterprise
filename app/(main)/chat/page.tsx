"use client";

import { useEffect, useState } from "react";
import { Button, Badge } from "flowbite-react";
import { ChatCard, ChatHistoryList, KnowledgeSelect, BotTypingBubble } from "@/components";
import { useLoading } from "@/contexts/LoadingContext";

const knowledgeBases = ["General AI", "Medical KB", "Finance KB", "Custom KB"];

export default function ChatPage() {
    const [selectedKB, setSelectedKB] = useState<string[]>();
    const [isOnline] = useState(true); // Removed setter as it's not used
    const [message, setMessage] = useState("");
    const [openHistory, setOpenHistory] = useState(false);
    const { setLoading } = useLoading();
    const handleSelectKB = (value: string[]) => {
        setSelectedKB(value);
    };

    useEffect(() => {
        setLoading(false);
    }, []);

    const handleCloseHistory = () => {
        setOpenHistory(false);
    };

    return (
        <>
            {openHistory &&
                <ChatHistoryList onClose={handleCloseHistory} />
            }
            <div className="p-3 h-full max-w-screen mx-auto">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="bg-gray-100 dark:bg-gray-900 rounded-xl shadow p-4">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-y-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Chat</h1>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    {selectedKB && selectedKB.length !== 0
                                        ? `กำลังค้นหาข้อมูลจาก ${selectedKB.length} Knowledge Base`
                                        : "กรุณาเลือก Knowledge Base"}
                                </label>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Status */}
                                <Badge color={isOnline ? "success" : "failure"}>
                                    <span className="flex items-center gap-1">
                                        {isOnline ? (
                                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <circle cx="10" cy="10" r="8" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        )}
                                        {isOnline ? "Online" : "Offline"}
                                    </span>
                                </Badge>

                                {/* New Chat */}
                                <Button type="button" className="px-0" color="primary" onClick={() => alert("Start new chat!")}>
                                    <svg className="w-5 h-5 mr-2 text-gray-900 dark:text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-gray-900 dark:text-white">New Chat</span>
                                </Button>

                                {/* History */}
                                <Button type="button" className="px-0" color="primary" onClick={() => setOpenHistory(!openHistory)}>
                                    <svg className="w-5 h-5 mr-2 text-gray-900 dark:text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-gray-900 dark:text-white">History</span>
                                </Button>
                            </div>
                        </div>

                        {/* Knowledge Base Selection */}
                        <div className="flex flex-wrap gap-4 items-center mt-4">
                            <label htmlFor="knowledge" className="text-gray-700 dark:text-gray-200 font-medium">
                                Knowledge Base:
                            </label>
                            <KnowledgeSelect options={knowledgeBases} onChange={handleSelectKB} />
                        </div>
                    </div>

                    {/* Chat Box */}
                    <div className="flex flex-col gap-4 bg-gray-100 dark:bg-inherit rounded-xl dark:rounded-none shadow dark:shadow-none p-4 h-[60vh] max-h-[60vh] overflow-y-auto">
                        <div>
                            <ChatCard
                                avatar="https://images.ctfassets.net/h6goo9gw1hh6/2sNZtFAWOdP1lmQ33VwRN3/24e953b920a9cd0ff2e1d587742a2472/1-intro-photo-final.jpg"
                                name="Bonnie Green"
                                time="11:46"
                                message="That's awesome. I think our users will really appreciate the improvements."
                                status=""
                            />
                        </div>
                        <div className="self-end">
                            <ChatCard
                                avatar="https://kolhapur-police.s3.amazonaws.com/a8f0c667-0c14-4894-a36d-5441b4c6e677.jpg"
                                name="Chris Brown"
                                time="11:59"
                                isUser
                                message="Umm, I'm sorry to hear that. Can you provide any more details about the issue?"
                                status=""
                            />
                        </div>
                        <div>
                            <BotTypingBubble />
                        </div>
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!message.trim()) return;
                            alert(`ส่งข้อความ: ${message}`);
                            setMessage("");
                        }}
                        className="mt-2 flex gap-2"
                    >
                        <input
                            type="text"
                            placeholder="Type your message..."
                            className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="cursor-pointer px-4 py-2 rounded-md transition"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-gray-900 dark:text-white"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>

        </>
    );
}
