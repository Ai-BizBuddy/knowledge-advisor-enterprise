"use client";

import { useEffect, useState } from "react";
import { Button, Badge } from "flowbite-react";
import {
  ChatCard,
  ChatHistoryList,
  KnowledgeSelect,
  BotTypingBubble,
} from "@/components";
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
  }, [setLoading]);

  const handleCloseHistory = () => {
    setOpenHistory(false);
  };

  return (
    <>
      {openHistory && <ChatHistoryList onClose={handleCloseHistory} />}

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Main Container with consistent responsive padding */}
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <div className="space-y-6 sm:space-y-8">
            {/* Header Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                    AI Chat
                  </h1>
                  <p className="text-sm font-medium text-gray-600 sm:text-base dark:text-gray-300">
                    {selectedKB && selectedKB.length !== 0
                      ? `กำลังค้นหาข้อมูลจาก ${selectedKB.length} Knowledge Base`
                      : "กรุณาเลือก Knowledge Base"}
                  </p>
                </div>

                {/* Action Buttons - Responsive layout */}
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  {/* Status Badge */}
                  <Badge
                    color={isOnline ? "success" : "failure"}
                    className="justify-center sm:justify-start"
                  >
                    <span className="flex items-center gap-2">
                      {isOnline ? (
                        <svg
                          className="h-4 w-4 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <circle cx="10" cy="10" r="8" />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4 text-red-600"
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
                      )}
                      <span className="font-medium">
                        {isOnline ? "Online" : "Offline"}
                      </span>
                    </span>
                  </Badge>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      color="primary"
                      onClick={() => alert("Start new chat!")}
                      className="flex-1 sm:flex-initial"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span className="font-medium">New Chat</span>
                    </Button>

                    <Button
                      type="button"
                      color="primary"
                      onClick={() => setOpenHistory(!openHistory)}
                      className="flex-1 sm:flex-initial"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium">History</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Knowledge Base Selection */}
              <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center dark:border-gray-600">
                <label
                  htmlFor="knowledge"
                  className="font-medium whitespace-nowrap text-gray-700 dark:text-gray-200"
                >
                  Knowledge Base:
                </label>
                <div className="flex-1">
                  <KnowledgeSelect
                    options={knowledgeBases}
                    onChange={handleSelectKB}
                  />
                </div>
              </div>
            </div>

            {/* Chat Container */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              {/* Chat Messages Area */}
              <div className="h-[50vh] space-y-4 overflow-y-auto p-4 sm:h-[60vh] sm:p-6">
                <div>
                  <ChatCard
                    avatar="https://images.ctfassets.net/h6goo9gw1hh6/2sNZtFAWOdP1lmQ33VwRN3/24e953b920a9cd0ff2e1d587742a2472/1-intro-photo-final.jpg"
                    name="Bonnie Green"
                    time="11:46"
                    message="That's awesome. I think our users will really appreciate the improvements."
                    status=""
                  />
                </div>
                <div className="flex justify-end">
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

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4 sm:p-6 dark:border-gray-600">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!message.trim()) return;
                    alert(`ส่งข้อความ: ${message}`);
                    setMessage("");
                  }}
                  className="flex gap-3"
                >
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="flex-shrink-0 rounded-lg bg-blue-600 p-3 text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!message.trim()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
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
          </div>
        </div>
      </div>
    </>
  );
}
