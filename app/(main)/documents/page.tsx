"use client";
import { DocumentDetail } from "@/components";
import { useLoading } from "@/contexts/LoadingContext";
import { useEffect, useState } from "react";

const documents = [
  {
    name: "Project Roadmap 2024",
    size: "2.5 MB",
    type: "PDF",
    date: "September 25, 2024",
    status: "Completed",
    uploadedBy: "James Lee",
    avatar: "/avatars/james.png",
    project: ["Apollo Core"],
    source: "Processed",
    uploadDate: "Thursday, 21st August",
  },
  {
    name: "Marketing Campaign Budget",
    size: "1.4 MB",
    type: "Excel Sheet",
    date: "September 18, 2024",
    status: "Completed",
    uploadedBy: "Ebubechukwu Agnes",
    avatar: "/avatars/agnes.png",
    project: ["Marketing"],
    source: "Processing",
    uploadDate: "Wednesday, 18th September",
  },
  {
    name: "Quarterly Sales Presentation",
    size: "7 MB",
    type: "PowerPoint",
    date: "September 12, 2024",
    status: "Completed",
    uploadedBy: "Laura Rodriguez",
    avatar: "/avatars/laura.png",
    project: ["Sales"],
    source: "Failed",
    uploadDate: "Thursday, 12th September",
  },
  {
    name: "Website Redesign Mockup",
    size: "9 MB",
    type: "PNG",
    date: "August 29, 2024",
    status: "Completed",
    uploadedBy: "Tom Baker",
    avatar: "/avatars/tom.png",
    project: ["Design"],
    source: "Failed",
    uploadDate: "Thursday, 29th August",
  },
  {
    name: "Team Meeting Notes",
    size: "3.5 MB",
    type: "Word Document",
    date: "July 22, 2024",
    status: "Completed",
    uploadedBy: "Emily Zhang",
    avatar: "/avatars/emily.png",
    project: ["Operations"],
    source: "Failed",
    uploadDate: "Monday, 22nd July",
  },
];

export default function DocumentsPage() {
  const [selectedDocument, setSelectedDocument] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [sortBy, setSortBy] = useState("Source Type");
  const [viewMode, setViewMode] = useState("list"); // list or grid
  const { setLoading } = useLoading();

  const tabs = ["All", "Processed", "Processing", "Failed"];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab =
      activeTab === "All" ||
      doc.source.toLowerCase() === activeTab.toLowerCase() ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && matchesTab;
  });

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "a") {
        event.preventDefault();
        // Handle select all inline
        if (selectedDocuments.length === filteredDocuments.length) {
          setSelectedDocuments([]);
        } else {
          setSelectedDocuments(filteredDocuments.map((_, index) => index));
        }
      }
      if (event.key === "Escape") {
        setSelectedDocuments([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDocuments, filteredDocuments]);

  const getFileIcon = (type: string) => {
    if (type === "PDF") return "📄";
    if (type === "Excel Sheet") return "📊";
    if (type === "PowerPoint") return "📊";
    if (type === "PNG") return "🖼️";
    if (type === "Word Document") return "📝";
    return "📄";
  };

  // Multi-select functions
  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      // If all are selected, deselect all
      setSelectedDocuments([]);
    } else {
      // Select all filtered documents
      setSelectedDocuments(filteredDocuments.map((_, index) => index));
    }
  };

  const handleSelectDocument = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.stopPropagation(); // Prevent row click

    setSelectedDocuments((prev) => {
      if (prev.includes(index)) {
        // Remove from selection
        return prev.filter((i) => i !== index);
      } else {
        // Add to selection
        return [...prev, index];
      }
    });
  };

  const isAllSelected =
    selectedDocuments.length === filteredDocuments.length &&
    filteredDocuments.length > 0;
  const isIndeterminate =
    selectedDocuments.length > 0 &&
    selectedDocuments.length < filteredDocuments.length;

  return (
    <div className="min-h-screen rounded-lg bg-gray-100 dark:bg-gray-900">
      <div className="p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Documents
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View documents shared with you.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="Source Type">Source Type</option>
                <option value="Date">Date</option>
                <option value="Name">Name</option>
              </select>
            </div>

            {/* Filters Button */}
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                />
              </svg>
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                      activeTab === tab
                        ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-400"
              />
            </div>

            {/* Selection Summary and Bulk Actions */}
            {selectedDocuments.length > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {selectedDocuments.length} document
                    {selectedDocuments.length !== 1 ? "s" : ""} selected
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    (Press Escape to clear)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download
                  </button>
                  <button className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    Share
                  </button>
                  <button className="flex items-center gap-1 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-600 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedDocuments([])}
                    className="rounded-md bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Keyboard shortcuts hint */}
            {selectedDocuments.length === 0 && (
              <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                <span>💡 Tip: Use </span>
                <kbd className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                  Ctrl+A
                </kbd>
                <span> to select all documents</span>
              </div>
            )}

            {/* Documents Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate;
                        }}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Date
                      <svg
                        className="ml-1 inline h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Uploaded By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {filteredDocuments.map((doc, index) => {
                    const isSelected = selectedDocuments.includes(index);
                    const isCurrentDocument = selectedDocument === index;

                    return (
                      <tr
                        key={index}
                        onClick={() => setSelectedDocument(index)}
                        className={`cursor-pointer transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isCurrentDocument
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : ""
                        } ${
                          isSelected
                            ? "bg-blue-25 border-l-4 border-blue-500 dark:border-blue-400 dark:bg-blue-900/10"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={isSelected}
                            onChange={(e) => handleSelectDocument(index, e)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="mr-3 text-2xl">
                              {getFileIcon(doc.type)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {doc.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {doc.size} • {doc.type}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {doc.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-700">
                              {doc.uploadedBy
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div className="ml-3 text-sm text-gray-900 dark:text-white">
                              {doc.uploadedBy}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Document Detail Panel */}
          <div className="w-80 flex-shrink-0">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
              {filteredDocuments[selectedDocument] && (
                <DocumentDetail {...filteredDocuments[selectedDocument]} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
