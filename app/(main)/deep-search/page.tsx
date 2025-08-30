"use client";
import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layouts";
import { useLoading } from "@/contexts/LoadingContext";
import { DocumentSearchResult } from "@/interfaces/DeepSearchTypes";
import { DeepSearchLayout } from "@/components/deepSearch";

const DeepSearchPage = () => {
  const { setLoading } = useLoading();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for testing - Multiple file types
  const mockSearchResults: DocumentSearchResult[] = [
    {
      id: "doc-1",
      title: "AI Implementation Guidelines.pdf",
      content:
        "This document provides comprehensive guidelines for implementing artificial intelligence solutions in enterprise environments. It covers best practices, security considerations, and performance optimization strategies that teams should follow when deploying AI systems.",
      fileType: "pdf",
      fileSize: "2.4 MB",
      uploadDate: "2024-08-15T10:30:00Z",
      knowledgeName: "AI Technology Base",
      fileUrl:
        "https://person.tu.ac.th/hrtuweb/uploads/form/form_17_02_2023_09_52_39.pdf",
    },
    {
      id: "doc-2",
      title: "Project Architecture Documentation.docx",
      content:
        "Detailed architectural documentation outlining the system design, component relationships, and technical specifications for the current project. Includes database schemas, API documentation, and deployment configurations.",
      fileType: "docx",
      fileSize: "1.8 MB",
      uploadDate: "2024-08-20T14:15:00Z",
      knowledgeName: "Technical Documentation",
      fileUrl:
        "https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_DOC_2M.doc",
    },
    {
      id: "doc-3",
      title: "Legacy System Requirements.doc",
      content:
        "Legacy system requirements and specifications document containing detailed functional and non-functional requirements for the existing system. Includes user stories, acceptance criteria, and system constraints.",
      fileType: "doc",
      fileSize: "980 KB",
      uploadDate: "2024-07-10T11:20:00Z",
      knowledgeName: "Legacy Systems",
      fileUrl:
        "https://docs.google.com/document/d/1ZkTBPQtEl-uBcDNEMVmmNuyt6KN--FnEJcyXjBcCS6c/edit?usp=sharing",
    },
    {
      id: "doc-4",
      title: "Setup Instructions.txt",
      content:
        "Step-by-step setup instructions for development environment configuration. Includes installation guides, environment variables setup, database configuration, and common troubleshooting steps for new developers.",
      fileType: "txt",
      fileSize: "45 KB",
      uploadDate: "2024-08-28T16:45:00Z",
      knowledgeName: "Developer Resources",
      fileUrl:
        "https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/02/file_example_TXT_1KB.txt",
    },
    {
      id: "doc-5",
      title: "API Documentation.md",
      content:
        "Comprehensive API documentation written in Markdown format. Contains endpoint descriptions, request/response examples, authentication methods, error codes, and usage guidelines for all available APIs.",
      fileType: "md",
      fileSize: "125 KB",
      uploadDate: "2024-08-22T13:30:00Z",
      knowledgeName: "API Documentation",
      fileUrl:
        "https://raw.githubusercontent.com/microsoft/vscode/main/README.md",
    },
    {
      id: "doc-6",
      title: "Financial Report 2024.xlsx",
      content:
        "Annual financial report containing budget analysis, expense tracking, revenue projections, and key performance indicators. Includes detailed charts, pivot tables, and financial metrics for stakeholder review.",
      fileType: "xlsx",
      fileSize: "3.2 MB",
      uploadDate: "2024-08-18T09:15:00Z",
      knowledgeName: "Financial Reports",
      fileUrl:
        "https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_XLS_1000.xls",
    },
    {
      id: "doc-7",
      title: "Employee Data.xls",
      content:
        "Employee database containing staff information, roles, departments, contact details, and employment history. Used for HR management, reporting, and organizational planning purposes.",
      fileType: "xls",
      fileSize: "875 KB",
      uploadDate: "2024-08-12T14:20:00Z",
      knowledgeName: "HR Database",
      fileUrl:
        "https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_XLS_100.xls",
    },
  ];

  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isNoResults, setIsNoResults] = useState(false);
  const [loading, setLoadingState] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoadingState(true);
    setIsSearching(true);
    setIsNoResults(false);

    try {
      console.log("Searching for:", searchQuery);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Use mock data for testing
      const filteredResults = mockSearchResults.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.knowledgeName?.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      setSearchResults(filteredResults);
      setIsNoResults(filteredResults.length === 0);

      console.log("Search results:", filteredResults);

      // Original API code (commented out for testing)
      /*
      const kbId = await getKnowledgeBaseIDs().then((ids) => ids);
      const results: DeepSearchRes[] = await executeSearch({
        query: searchQuery,
        // knowledge_ids: kbId,
      });

      if (!results || results.length === 0) {
        console.log("No results found");
        setIsNoResults(true);
        return;
      }

      const documentIds = await Promise.all(
        results.map(async (res: DeepSearchRes) => res.metadata.document_id),
      );
      const KBIds = await Promise.all(
        results.map(async (res: DeepSearchRes) => res.metadata.knowledge_id),
      );
      const docRes = await getDocumentById(documentIds);
      const kbRes = await getKnowledgeBaseByIDs(KBIds);

      console.log("Raw search results:", docRes);
      console.log("Knowledge Base results:", kbRes);
      */
    } catch (error) {
      console.error("Search error:", error);
      setIsNoResults(true);
    } finally {
      setIsSearching(false);
      setLoadingState(false);
    }
  };

  const handleResultClick = (result: DocumentSearchResult) => {
    console.log("Document clicked:", result);
    // In real implementation, this would open the document or navigate to document detail
  };

  return (
    <PageLayout
      title="Deep Search"
      subtitle="Search through your documents with AI-powered intelligence"
    >
      {/* Search Section */}
      <div className="card mb-6">
        <div className="space-y-4 p-4">
          {/* Main Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
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
              value={searchQuery}
              disabled={isSearching}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search through documents... (e.g., 'AI guidelines', 'implementation', 'best practices')"
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pr-20 pl-12 text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="absolute inset-y-0 right-0 flex items-center rounded-r-lg bg-blue-600 px-4 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSearching ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <DeepSearchLayout
        searchQuery={searchQuery}
        searchResults={searchResults}
        loading={loading}
        isSearching={isSearching}
        isNoResults={isNoResults}
        onResultClick={handleResultClick}
      />
    </PageLayout>
  );
};

export default DeepSearchPage;
