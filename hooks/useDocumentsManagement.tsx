import { useState, useEffect, useCallback } from "react";
import { documentsData } from "@/data/documentsData";
import { sortDocuments, filterDocuments } from "@/utils/documentsUtils";

export const useDocumentsManagement = () => {
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [sortBy, setSortBy] = useState("Date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  // Get filtered and sorted documents
  const filteredDocuments = sortDocuments(
    filterDocuments(documentsData, searchTerm, activeTab),
    sortBy,
    sortOrder,
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Handle sort changes
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Handle sort order toggle
  const handleSortOrderToggle = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    setCurrentPage(1);
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedDocuments([]);
    setSelectedDocument(null); // Reset selected document when page changes
  };

  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedDocument(null); // Reset selected document when tab changes
  };

  // Handle tab actions
  const handleTabAction = (action: string) => {
    setLoading(true);

    setTimeout(() => {
      switch (action) {
        case "retry_failed":
          console.log("Retrying failed documents...");
          break;
        case "refresh":
          setSelectedDocuments([]);
          setCurrentPage(1);
          console.log("Refreshing documents...");
          break;
        default:
          break;
      }
      setLoading(false);
    }, 2000);
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedDocuments([]);
    setSelectedDocument(null); // Reset selected document when search or filter changes
  }, [searchTerm, activeTab]);

  // Multi-select functions
  const handleSelectAll = useCallback(() => {
    const currentPageIndices = paginatedDocuments.map(
      (_, index) => startIndex + index,
    );
    if (
      selectedDocuments.length === currentPageIndices.length &&
      currentPageIndices.every((index) => selectedDocuments.includes(index))
    ) {
      setSelectedDocuments((prev) =>
        prev.filter((index) => !currentPageIndices.includes(index)),
      );
    } else {
      setSelectedDocuments((prev) => [
        ...new Set([...prev, ...currentPageIndices]),
      ]);
    }
  }, [paginatedDocuments, startIndex, selectedDocuments]);

  const handleSelectDocument = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.stopPropagation();
    const actualIndex = startIndex + index;

    setSelectedDocuments((prev) => {
      if (prev.includes(actualIndex)) {
        return prev.filter((i) => i !== actualIndex);
      } else {
        return [...prev, actualIndex];
      }
    });
  };

  const handleDeleteDocuments = () => {
    setLoading(true);
    setTimeout(() => {
      setSelectedDocuments([]);
      setLoading(false);
    }, 1000);
  };

  const handleClearSelection = () => {
    setSelectedDocuments([]);
  };

  // Calculate selection states
  const currentPageIndices = paginatedDocuments.map(
    (_, index) => startIndex + index,
  );
  const selectedInCurrentPage = selectedDocuments.filter((index) =>
    currentPageIndices.includes(index),
  );

  const isAllSelected =
    currentPageIndices.length > 0 &&
    selectedInCurrentPage.length === currentPageIndices.length;
  const isIndeterminate =
    selectedInCurrentPage.length > 0 &&
    selectedInCurrentPage.length < currentPageIndices.length;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "a") {
        event.preventDefault();
        handleSelectAll();
      }
      if (event.key === "Escape") {
        setSelectedDocuments([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSelectAll]);

  return {
    // State
    selectedDocument,
    selectedDocuments,
    searchTerm,
    activeTab,
    sortBy,
    sortOrder,
    currentPage,
    loading,

    // Data
    documents: documentsData,
    filteredDocuments,
    paginatedDocuments,
    totalPages,
    startIndex,
    endIndex,
    itemsPerPage,

    // Selection states
    isAllSelected,
    isIndeterminate,

    // Handlers
    setSelectedDocument,
    setSearchTerm,
    handleSort,
    handleSortOrderToggle,
    handlePageChange,
    handleTabChange,
    handleTabAction,
    handleSelectAll,
    handleSelectDocument,
    handleDeleteDocuments,
    handleClearSelection,
    setLoading,
  };
};
