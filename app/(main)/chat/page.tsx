"use client";

import { useEffect, useState } from "react";
import { Button } from "flowbite-react";
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
  const [isOnline, setIsOnline] = useState(true); // Removed setter as it's not used
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
      {openHistory && <ChatHistoryList onClose={handleCloseHistory} />}

      <div className="min-h-full">
        {/* Main Container with consistent responsive padding */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="space-y-3 sm:space-y-3">
            {/* Page Header - Outside the card */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Chat Assistant
                </h1>
              </div>
              <p className="text-sm font-medium text-gray-600 sm:text-base dark:text-gray-400">
                {selectedKB && selectedKB.length !== 0
                  ? `กำลังค้นหาข้อมูลจาก ${selectedKB.length} Knowledge Base`
                  : "กรุณาเลือก Knowledge Base เพื่อเริ่มการสนทนา"}
              </p>
            </div>

            {/* Control Section */}
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="flex flex-col gap-4 border-b border-gray-200 pb-3 sm:gap-6 lg:flex-row lg:items-center lg:justify-between dark:border-gray-700">
                {/* Knowledge Base Selection */}
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                  <label
                    htmlFor="knowledge"
                    className="text-sm font-semibold whitespace-nowrap text-gray-700 dark:text-gray-200"
                  >
                    Knowledge Base:
                  </label>
                  <div className="w-full flex-1">
                    <KnowledgeSelect
                      options={knowledgeBases}
                      onChange={handleSelectKB}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 sm:items-center">
                  <Button
                    type="button"
                    color="light"
                    onClick={() => alert("Start new chat!")}
                    className="flex w-1/2 items-center justify-center gap-2 sm:w-auto"
                  >
                    <svg
                      className="h-4 w-4"
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
                    <span className="text-sm font-medium">New Chat</span>
                  </Button>

                  <Button
                    type="button"
                    color="light"
                    onClick={() => setOpenHistory(!openHistory)}
                    className="flex w-1/2 items-center justify-center gap-2 sm:w-auto"
                  >
                    <svg
                      className="h-4 w-4"
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
                    <span className="text-sm font-medium">History</span>
                  </Button>
                </div>
              </div>
              {/* Chat Messages Area */}
              <div className="h-[50vh] space-y-4 overflow-y-auto p-4 sm:h-[60vh] sm:p-6">
                <div>
                  <ChatCard
                    avatar="/assets/logo-ka.svg"
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
              <div className="border-t border-gray-200 p-3 sm:p-4 lg:p-6 dark:border-gray-600">
                {/* Mobile Layout */}
                <div className="block sm:hidden">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!message.trim()) return;
                      alert(`ส่งข้อความ: ${message}`);
                      setMessage("");
                    }}
                    className="space-y-3"
                  >
                    {/* Status and Input Row */}
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-shrink-0 cursor-pointer"
                        onClick={() => setIsOnline(!isOnline)}
                        title={isOnline ? "Online Mode" : "Offline Mode"}
                      >
                        {isOnline ? (
                          <svg
                            stroke="currentColor"
                            fill="none"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6 text-blue-400 hover:text-blue-600"
                            height="1em"
                            width="1em"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              stroke="none"
                              d="M0 0h24v24H0z"
                              fill="none"
                            ></path>
                            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
                            <path d="M3.6 9h16.8"></path>
                            <path d="M3.6 15h16.8"></path>
                            <path d="M11.5 3a17 17 0 0 0 0 18"></path>
                            <path d="M12.5 3a17 17 0 0 1 0 18"></path>
                          </svg>
                        ) : (
                          <svg
                            stroke="currentColor"
                            fill="none"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6 text-gray-400 hover:text-gray-600"
                            height="1em"
                            width="1em"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              stroke="none"
                              d="M0 0h24v24H0z"
                              fill="none"
                            ></path>
                            <path d="M5.657 5.615a9 9 0 1 0 12.717 12.739m1.672 -2.322a9 9 0 0 0 -12.066 -12.084"></path>
                            <path d="M3.6 9h5.4m4 0h7.4"></path>
                            <path d="M3.6 15h11.4m4 0h1.4"></path>
                            <path d="M11.5 3a17.001 17.001 0 0 0 -1.493 3.022m-.847 3.145c-.68 4.027 .1 8.244 2.34 11.833"></path>
                            <path d="M12.5 3a16.982 16.982 0 0 1 2.549 8.005m-.207 3.818a16.979 16.979 0 0 1 -2.342 6.177"></path>
                            <path d="M3 3l18 18"></path>
                          </svg>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="flex-shrink-0 rounded-lg bg-blue-600 p-2.5 text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!message.trim()}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    </div>
                    {/* Status Text */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                        ></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {isOnline ? "Online Mode" : "Offline Mode"}
                        </span>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:block">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!message.trim()) return;
                      alert(`ส่งข้อความ: ${message}`);
                      setMessage("");
                    }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex items-center gap-2">
                      {/* svg internet */}
                      <div
                        className="cursor-pointer"
                        onClick={() => setIsOnline(!isOnline)}
                        title={
                          isOnline
                            ? "Switch to Offline Mode"
                            : "Switch to Online Mode"
                        }
                      >
                        {isOnline ? (
                          <svg
                            stroke="currentColor"
                            fill="none"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-7 w-7 text-blue-400 hover:text-blue-600 sm:h-8 sm:w-8"
                            height="1em"
                            width="1em"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              stroke="none"
                              d="M0 0h24v24H0z"
                              fill="none"
                            ></path>
                            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
                            <path d="M3.6 9h16.8"></path>
                            <path d="M3.6 15h16.8"></path>
                            <path d="M11.5 3a17 17 0 0 0 0 18"></path>
                            <path d="M12.5 3a17 17 0 0 1 0 18"></path>
                          </svg>
                        ) : (
                          <svg
                            stroke="currentColor"
                            fill="none"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-7 w-7 text-gray-400 hover:text-gray-600 sm:h-8 sm:w-8"
                            height="1em"
                            width="1em"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              stroke="none"
                              d="M0 0h24v24H0z"
                              fill="none"
                            ></path>
                            <path d="M5.657 5.615a9 9 0 1 0 12.717 12.739m1.672 -2.322a9 9 0 0 0 -12.066 -12.084"></path>
                            <path d="M3.6 9h5.4m4 0h7.4"></path>
                            <path d="M3.6 15h11.4m4 0h1.4"></path>
                            <path d="M11.5 3a17.001 17.001 0 0 0 -1.493 3.022m-.847 3.145c-.68 4.027 .1 8.244 2.34 11.833"></path>
                            <path d="M12.5 3a16.982 16.982 0 0 1 2.549 8.005m-.207 3.818a16.979 16.979 0 0 1 -2.342 6.177"></path>
                            <path d="M3 3l18 18"></path>
                          </svg>
                        )}
                      </div>
                      {/* Status indicator - hidden on smaller screens, visible on medium+ */}
                      <div className="hidden items-center gap-2 md:flex">
                        <div
                          className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                        ></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none sm:py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="flex-shrink-0 rounded-lg bg-blue-600 p-2.5 text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:p-3"
                      disabled={!message.trim()}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5"
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
      </div>
    </>
  );
}
