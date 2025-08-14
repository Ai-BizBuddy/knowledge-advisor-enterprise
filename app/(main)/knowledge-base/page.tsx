"use client";
import {
  CreateKnowledgeBaseModal,
  KnowledgeBaseCard,
  Tabs,
} from "@/components";
import { useLoading } from "@/contexts/LoadingContext";
import { useEffect, useState } from "react";

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState("All");
  const [openModal, setOpenModal] = useState(false);
  const { setLoading } = useLoading();
  const tabList = ["All", "Active", "Paused", "Draft"];

  useEffect(() => {
    setLoading(false);
  }, []);
  const hadleTabChange = (vale: string) => {
    setActiveTab(vale);
  };
  return (
    <div className="min-h-screen">
      {/* Main Container with consistent responsive padding */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Knowledge Base
              </h1>
              <p className="text-sm text-gray-500 sm:text-base dark:text-gray-400">
                Manage your enterprise knowledge repositories
              </p>
            </div>

            {/* Create New Button */}
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-blue-700 sm:w-auto"
              onClick={() => setOpenModal(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5 flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium">New Knowledge Base</span>
            </button>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mb-6 sm:mb-8">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
            <Tabs
              currentTab={activeTab}
              tabList={tabList}
              onTabChange={(value) => hadleTabChange(value)}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-8 sm:w-full sm:space-y-6 xl:w-[300px]">
          <KnowledgeBaseCard
            title="KB Not Found"
            detail="KB Not Found"
            updated="KB Not Found"
            onDelete={() => {}}
            onDetail={() => {}}
          />
        </div>

        {/* Create Knowledge Base Modal */}
        <CreateKnowledgeBaseModal
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          onSubmit={(data) => console.log("Created:", data)}
        />
      </div>
    </div>
  );
}
