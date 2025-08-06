"use client";
import { DataTable, NoDocuments, SearchBar, Tabs, UploadDocument } from "@/components";
import { useLoading } from "@/contexts/LoadingContext";
import { useEffect, useState } from "react";



export default function DocumentsPage() {
  const { setLoading } = useLoading();
  const [activeTab, setActiveTab] = useState("All");
  const [openModal, setOpenModal] = useState(false);
  const [documents, setDocuments] = useState([]);
  const tabList = ["All", "Processed", "Processing", "Failed"];

  useEffect(() => {
    setLoading(false);
  }, []);

  const hadleTabChange = (vale: string) => {
    setActiveTab(vale);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 sm:gap-0">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            Documents
          </h1>
          <p className="text-xs text-gray-500 sm:text-base dark:text-gray-400">
            Search and manage your enterprise documents with AI-powered semantic
            search
          </p>
        </div>
        <div>
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
            <span className="text-sm font-medium">Add Document</span>
          </button>
        </div>
      </div>

      <div className="mb-6 flex w-full flex-col items-center justify-center gap-6">
        <div className="w-3/4 rounded-2xl border-gray-700/50 bg-gray-100 p-6 shadow dark:bg-gray-900">
          <SearchBar onSearch={(term) => alert(term)} />
        </div>

        <div className="flex w-3/4 items-center justify-between rounded-2xl border-gray-700/50 bg-gray-100 p-6 shadow dark:bg-gray-900">
          <Tabs
            currentTab={activeTab}
            tabList={tabList}
            onTabChange={(value) => hadleTabChange(value)}
          />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sort:{" "}
              <select className="ml-1 rounded-md border-gray-300 bg-white p-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <option value="name">Name</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="size">Size</option>
              </select>
            </p>
          </div>
        </div>

        {documents.length === 0 ? (
          <NoDocuments activeTab={activeTab} setOpenModal={setOpenModal} />
        ) : (
          <div>
            <DataTable
              columns={[
                { key: "name", label: "Document Name" },
                { key: "status", label: "Status" },
                { key: "size", label: "Size" },
                { key: "date", label: "Date Added" },
              ]}
              data={documents}
              pageSize={10}
            />
            </div>
        )}
      </div>

      <UploadDocument isOpen={openModal} onClose={() => setOpenModal(false)} />
    </div>
  );
}
