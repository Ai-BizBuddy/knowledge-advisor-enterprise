import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  knowledgeBaseData,
  KnowledgeBaseData,
  getKnowledgeBasesByStatus,
} from "@/data/knowledgeBaseData";
import { ProjectStatus } from "@/interfaces/Project";

export interface UseKnowledgeBaseManagementReturn {
  // State
  searchTerm: string;
  currentPage: number;
  selectedTab: string;
  itemsPerPage: number;

  // Data
  knowledgeBases: KnowledgeBaseData[];
  filteredKnowledgeBases: KnowledgeBaseData[];
  paginatedKnowledgeBases: KnowledgeBaseData[];
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;

  // Tab counts
  tabCounts: {
    all: number;
    active: number;
    paused: number;
    draft: number;
  };

  // Handlers
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setSelectedTab: (tab: string) => void;
  setItemsPerPage: (items: number) => void;
  handlePageChange: (page: number) => void;
  handleTabChange: (tab: string) => void;
  handleKnowledgeBaseClick: (id: string) => void;
  handleKnowledgeBaseDelete: (id: string) => void;
}

export const useKnowledgeBaseManagement =
  (): UseKnowledgeBaseManagementReturn => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTab, setSelectedTab] = useState("All");
    const [itemsPerPage, setItemsPerPage] = useState(9); // 3x3 grid for cards
    const router = useRouter();

    // Calculate tab counts
    const tabCounts = useMemo(() => {
      return {
        all: knowledgeBaseData.length,
        active: getKnowledgeBasesByStatus(ProjectStatus.ACTIVE).length,
        paused: getKnowledgeBasesByStatus(ProjectStatus.PAUSED).length,
        draft: getKnowledgeBasesByStatus(ProjectStatus.DRAFT).length,
      };
    }, []);

    // Filter knowledge bases by selected tab
    const knowledgeBasesByTab = useMemo(() => {
      switch (selectedTab.toLowerCase()) {
        case "active":
          return getKnowledgeBasesByStatus(ProjectStatus.ACTIVE);
        case "paused":
          return getKnowledgeBasesByStatus(ProjectStatus.PAUSED);
        case "draft":
          return getKnowledgeBasesByStatus(ProjectStatus.DRAFT);
        default:
          return knowledgeBaseData;
      }
    }, [selectedTab]);

    // Filter knowledge bases by search term
    const filteredKnowledgeBases = useMemo(() => {
      if (!searchTerm) return knowledgeBasesByTab;

      const lowercaseSearch = searchTerm.toLowerCase();
      return knowledgeBasesByTab.filter(
        (kb) =>
          kb.name.toLowerCase().includes(lowercaseSearch) ||
          kb.description.toLowerCase().includes(lowercaseSearch) ||
          kb.category?.toLowerCase().includes(lowercaseSearch) ||
          kb.tags?.some((tag) => tag.toLowerCase().includes(lowercaseSearch)),
      );
    }, [knowledgeBasesByTab, searchTerm]);

    // Calculate pagination
    const totalItems = filteredKnowledgeBases.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

    // Get paginated knowledge bases
    const paginatedKnowledgeBases = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredKnowledgeBases.slice(start, end);
    }, [filteredKnowledgeBases, currentPage, itemsPerPage]);

    // Reset to first page when filters change
    useEffect(() => {
      setCurrentPage(1);
    }, [searchTerm, selectedTab]);

    // Handlers
    const handlePageChange = (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    };

    const handleTabChange = (tab: string) => {
      setSelectedTab(tab);
    };

    const handleKnowledgeBaseClick = (id: string) => {
      // Navigate to knowledge base detail page
      router.push(`/knowledge-base/${id}`);
    };

    const handleKnowledgeBaseDelete = (id: string) => {
      // Handle knowledge base deletion
      console.log(`Delete knowledge base: ${id}`);
      // In a real app, this would make an API call to delete the knowledge base
      // For now, we'll just log it
    };

    return {
      // State
      searchTerm,
      currentPage,
      selectedTab,
      itemsPerPage,

      // Data
      knowledgeBases: knowledgeBaseData,
      filteredKnowledgeBases,
      paginatedKnowledgeBases,
      totalPages,
      startIndex,
      endIndex,
      totalItems,

      // Tab counts
      tabCounts,

      // Handlers
      setSearchTerm,
      setCurrentPage,
      setSelectedTab,
      setItemsPerPage,
      handlePageChange,
      handleTabChange,
      handleKnowledgeBaseClick,
      handleKnowledgeBaseDelete,
    };
  };
