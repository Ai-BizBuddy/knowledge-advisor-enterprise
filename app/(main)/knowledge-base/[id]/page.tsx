"use client";
import {
  DocumentsSearch,
  DocumentsTable,
  DocumentsPagination,
  UploadDocument,
  BotTypingBubble,
  ChatCard,
  ChatHistoryList,
} from "@/components";
import { Breadcrumb, BreadcrumbItem, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import { useDocuments, useKnowledgeBase } from "@/hooks";
import { useRouter, useParams } from "next/navigation";
import { useLoading } from "@/contexts/LoadingContext";
import { formatStatus } from "@/data/knowledgeBaseData";
import { Project, Document } from "@/interfaces/Project";

// Interface that matches what DocumentsTable expects (temporarily for compatibility)
interface DocumentTableItem {
  name: string;
  size: string;
  type: string;
  date: string;
  status: string;
  uploadedBy: string;
  avatar: string;
  project: string[];
  source: string;
  uploadDate: string;
  chunk?: number;
  syncStatus?: string;
  lastUpdated?: string;
}

// Adapter function to convert new Document interface to DocumentsTable-compatible format
const adaptDocumentToTableFormat = (doc: Document): DocumentTableItem => ({
  name: doc.name,
  size: doc.file_size
    ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
    : "Unknown",
  type: doc.file_type,
  date: new Date(doc.created_at).toLocaleDateString(),
  status: doc.status,
  uploadedBy: "User", // This field doesn't exist in new interface
  avatar: "/avatars/default.png", // Default avatar
  project: [], // This field doesn't exist in new interface
  source: doc.rag_status || "not_synced",
  uploadDate: new Date(doc.created_at).toLocaleDateString(),
  chunk: doc.chunk_count,
  syncStatus: doc.rag_status === "synced" ? "Synced" : "Not Synced",
  lastUpdated: new Date(doc.updated_at).toLocaleDateString(),
});

export default function KnowledgeBaseDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { setLoading } = useLoading();

  const [currentTab, setCurrentTabs] = useState("Documents");
  const [openHistory, setOpenHistory] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState<Project | null>(null);

  const { getKnowledgeBase } = useKnowledgeBase();

  const tabsList = ["Documents", "Chat Assistant"];

  // Additional state for document selection and UI
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState<number>(0);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Use the new useDocuments hook
  const {
    // State
    documents,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    searchTerm,
    totalItems,

    // Handlers
    handlePageChange,
    setSearchTerm,
    refresh,
  } = useDocuments({ knowledgeBaseId: id });

  // Transform documents to DocumentsTable-compatible format
  const adaptedDocuments = documents.map((doc) =>
    adaptDocumentToTableFormat(doc),
  );

  // Clear selection เมื่อ documents เปลี่ยน (เช่น search, filter)
  useEffect(() => {
    setSelectedDocuments([]);
  }, [documents.length, currentPage, searchTerm]);

  // Selection logic - แก้ไขให้ทำงานถูกต้องกับ pagination
  // DocumentsTable ส่ง actualIndex มาให้เรา (startIndex + pageIndex)
  const currentPageSelectedCount = selectedDocuments.filter(
    (index) => index >= startIndex && index < startIndex + documents.length,
  ).length;

  const isAllSelected =
    currentPageSelectedCount === documents.length && documents.length > 0;
  const isIndeterminate =
    currentPageSelectedCount > 0 && currentPageSelectedCount < documents.length;

  // Handle document selection by pageIndex (DocumentsTable ส่ง pageIndex มา)
  const handleSelectDocument = (pageIndex: number) => {
    // แปลง pageIndex เป็น actualIndex เพื่อให้ตรงกับสิ่งที่ DocumentsTable คาดหวัง
    const actualIndex = startIndex + pageIndex;
    console.log(
      "Toggling selection for pageIndex:",
      pageIndex,
      "actualIndex:",
      actualIndex,
    );
    setSelectedDocuments((prev) =>
      prev.includes(actualIndex)
        ? prev.filter((i) => i !== actualIndex)
        : [...prev, actualIndex],
    );
  };

  // Handle select all documents (แก้ไขให้ select เฉพาะในหน้าปัจจุบัน)
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDocuments([]);
    } else {
      // สร้าง actualIndex array สำหรับหน้าปัจจุบัน
      const currentPageIndices = documents.map(
        (_, pageIndex) => startIndex + pageIndex,
      );
      setSelectedDocuments(currentPageIndices);
    }
  };

  // Clear selection เมื่อเปลี่ยนหน้า
  const handlePageChangeWithClearSelection = (page: number) => {
    setSelectedDocuments([]); // Clear selection เมื่อเปลี่ยนหน้า
    handlePageChange(page);
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedDocuments([]);
  };

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Handle document click
  const handleDocumentTableClick = (index: number) => {
    setSelectedDocumentIndex(index);
    // You can add navigation logic here if needed
    // const documentId = documents[index]?.id;
    // if (documentId) {
    //   router.push(`/knowledge-base/${id}/documents/${documentId}`);
    // }
  };

  const handleBackButtonClick = () => {
    setLoading(true);
    router.push("/knowledge-base");
  };

  useEffect(() => {
    const fetchKnowledgeBase = async (kbId: string) => {
      const kb = await getKnowledgeBase(kbId);
      return kb;
    };

    const fetchData = async () => {
      if (id) {
        const kb = await fetchKnowledgeBase(id);
        if (!kb) {
          setKnowledgeBase(null);
          return;
        }
        setKnowledgeBase(kb);
      }
    };
    fetchData();
  }, [id, getKnowledgeBase]);

  if (!knowledgeBase) {
    return (
      <div className="min-h-screen p-3 sm:p-6 lg:p-8">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-800">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Knowledge Base Not Found
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            The knowledge base you&apos;re looking for doesn&apos;t exist or has
            been removed.
          </p>
          <button
            onClick={handleBackButtonClick}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to Knowledge Bases
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-4 sm:mb-6">
        <Breadcrumb
          aria-label="Breadcrumb"
          className="flex items-center gap-3 sm:gap-4"
        >
          <BreadcrumbItem href="/knowledge-base">Knowledge Base</BreadcrumbItem>
          <BreadcrumbItem>{knowledgeBase.name}</BreadcrumbItem>
        </Breadcrumb>
        <div className="flex items-center gap-3 pt-5 sm:gap-4">
          {/* Title Section */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                {knowledgeBase.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  knowledgeBase.status === 1
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : knowledgeBase.status === 2
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                }`}
              >
                {formatStatus(knowledgeBase.status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600 sm:text-base dark:text-gray-400">
              {knowledgeBase.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex justify-between overflow-hidden">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
            Select Tab:
          </span>
          {tabsList.map((tab) => (
            <div className="me-4 flex items-center" key={tab}>
              <input
                id={`inline-${tab}-radio`}
                type="radio"
                value={tab}
                checked={currentTab === tab}
                onChange={() => setCurrentTabs(tab)}
                name="inline-radio-group"
                className="h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
              />
              <label
                htmlFor={`inline-${tab}-radio`}
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                {tab}
              </label>
            </div>
          ))}
        </div>
        {currentTab === "Chat Assistant" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              color="light"
              onClick={() => alert("Start new chat!")}
              className="flex items-center justify-center gap-2"
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
              className="flex items-center justify-center gap-2"
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
        )}
      </div>
      {/* Documents Tab Content */}
      {currentTab === "Documents" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Search and Actions Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Section */}
            <div className="flex-1 sm:max-w-md">
              <DocumentsSearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </div>

            {/* Actions Section */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {selectedDocuments.length > 0 && (
                <>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {currentPageSelectedCount} of {documents.length} selected
                    (current page)
                  </span>
                  <button
                    onClick={handleClearSelection}
                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none dark:text-blue-400 dark:hover:bg-blue-900/20"
                    aria-label="Clear selection"
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
                        d="M18 6L6 18M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <button className="flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none sm:px-4">
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span className="hidden sm:inline">Sync to RAG</span>
                    <span className="sm:hidden">Sync</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:px-4"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="hidden sm:inline">Upload Documents</span>
                <span className="sm:hidden">Upload</span>
              </button>
            </div>
          </div>
          {/* Documents Table */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <DocumentsTable
              documents={adaptedDocuments}
              selectedDocuments={selectedDocuments}
              selectedDocument={selectedDocumentIndex}
              startIndex={startIndex}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onSelectAll={handleSelectAll}
              onSelectDocument={handleSelectDocument}
              onDocumentClick={handleDocumentTableClick}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
            />
          </div>

          {/* Pagination */}
          {documents.length > 0 && (
            <div>
              <DocumentsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                endIndex={endIndex}
                totalDocuments={totalItems}
                onPageChange={handlePageChangeWithClearSelection}
              />
            </div>
          )}
        </div>
      )}
      {/* Chat Assistant Tab Content */}
      {currentTab === "Chat Assistant" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Chat Actions Bar */}

          {/* Chat Interface */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {/* Chat Messages Area */}
            <div className="h-[40vh] space-y-4 overflow-y-auto p-3 sm:h-[50vh] sm:p-4 lg:h-[60vh] lg:p-6">
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!message.trim()) return;
                  alert(`ส่งข้อความ: ${message}`);
                  setMessage("");
                }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none sm:px-4 sm:py-2.5 sm:text-base dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
                  disabled={!message.trim()}
                  aria-label="Send message"
                >
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <UploadDocument
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          // Refresh documents list to show newly uploaded files
          refresh();
        }}
      />

      {openHistory && <ChatHistoryList onClose={() => setOpenHistory(false)} />}
    </div>
  );
}
