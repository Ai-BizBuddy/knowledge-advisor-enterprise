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
  }, [setLoading]);
  const hadleTabChange = (vale: string) => {
    setActiveTab(vale);
  };
  return (
    <div>
      {/* Head */}
      <div className="mb-6 flex items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            Knowledge Base
          </h1>
          {/* subtitle */}
          <p className="text-xs text-gray-500 sm:text-base dark:text-gray-400">
            Manage your enterprise knowledge repositories
          </p>
        </div>
        {/* New */}
        <button
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          onClick={() => setOpenModal(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-medium">New</span>
        </button>
      </div>
      <div className="mb-6 flex rounded-2xl border-gray-700/50 bg-gray-100 p-4 shadow dark:bg-gray-900">
        <Tabs
          currentTab={activeTab}
          tabList={tabList}
          onTabChange={(value) => hadleTabChange(value)}
        />
      </div>

      <KnowledgeBaseCard
        title="KB Not Found"
        detail="KB Not Found"
        updated="KB Not Found"
        onDelete={() => {}}
        onDetail={() => {}}
      />
      {/* KB Not Found to status */}

      {/* <div className="shadow flex flex-col gap-4 items-center bg-gray-100 dark:bg-gray-900 border-gray-700/50 rounded-2xl p-6">
                <div>
                    <svg className="w-12 h-12 text-gray-500 dark:text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M6 2a2 2 0 0 0-2 2v15a3 3 0 0 0 3 3h12a1 1 0 1 0 0-2h-2v-2h2a1 1 0 0 0 1-1V4a2 2 0 0 0-2-2h-8v16h5v2H7a1 1 0 1 1 0-2h1V2H6Z" clipRule="evenodd" />
                    </svg>
                </div>
                <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">Knowledge Base Not Found</h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">{activeTab === "All" ? "No Knowledge Base found." : `No Knowledge Base with status "${activeTab}" found.`}</p>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md" onClick={() => setOpenModal(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">
                        Create Knowledge Base
                    </span>
                </button>

            </div> */}
      <CreateKnowledgeBaseModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={(data) => {
          console.log("Knowledge base created:", data);
          setOpenModal(false);
        }}
      />
    </div>
  );
}
