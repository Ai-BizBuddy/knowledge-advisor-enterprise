'use client';

import { documentsData, type Document } from '@/data/documentsData';
import { filterDocuments } from '@/utils/documentsUtils';
import { useCallback, useEffect, useState } from 'react';

export const useDocumentsManagement = () => {
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<keyof Document>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  // Local sorting function for mock data
  const sortDocuments = useCallback(
    (documents: Document[]) => {
      return [...documents].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'date':
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
            break;
          case 'size':
            // Convert size string to number for comparison (e.g., "2.5 MB" -> 2.5)
            aValue = parseFloat(a.size.replace(/[^\d.]/g, ''));
            bValue = parseFloat(b.size.replace(/[^\d.]/g, ''));
            break;
          case 'type':
            aValue = a.type.toLowerCase();
            bValue = b.type.toLowerCase();
            break;
          case 'uploadedBy':
            aValue = a.uploadedBy.toLowerCase();
            bValue = b.uploadedBy.toLowerCase();
            break;
          case 'status':
            aValue = a.status.toLowerCase();
            bValue = b.status.toLowerCase();
            break;
          case 'lastUpdated':
            aValue = new Date(a.lastUpdated || a.date).getTime();
            bValue = new Date(b.lastUpdated || b.date).getTime();
            break;
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    },
    [sortBy, sortOrder],
  );

  // Sorting handlers
  const handleSort = (field: keyof Document) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSortOrderToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  // Get filtered and sorted documents
  const filteredDocuments = sortDocuments(
    filterDocuments(documentsData, searchTerm, activeTab),
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

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
        case 'retry_failed':
          break;
        case 'refresh':
          setSelectedDocuments([]);
          setCurrentPage(1);
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
      (_: Document, index: number) => startIndex + index,
    );
    if (
      selectedDocuments.length === currentPageIndices.length &&
      currentPageIndices.every((index: number) =>
        selectedDocuments.includes(index),
      )
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
    (_: Document, index: number) => startIndex + index,
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
      if (event.ctrlKey && event.key === 'a') {
        event.preventDefault();
        handleSelectAll();
      }
      if (event.key === 'Escape') {
        setSelectedDocuments([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    setSelectedDocuments,
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
