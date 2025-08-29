"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { knowledgeBaseService } from "@/services";
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectStatus,
  ProjectAnalytics,
} from "@/interfaces/Project";

export interface UseKnowledgeBaseReturn {
  // State
  projects: Project[];
  filteredProjects: Project[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  itemsPerPage: number;
  searchTerm: string;
  selectedTab: string;

  // Tab counts
  tabCounts: {
    all: number;
    active: number;
    inactive: number;
  };

  loadKnowledgeBases: (page?: number, forceRefresh?: boolean) => Promise<void>;

  // CRUD Operations
  createKnowledgeBase: (data: CreateProjectInput) => Promise<Project>;
  updateKnowledgeBase: (
    id: string,
    data: UpdateProjectInput,
  ) => Promise<Project>;
  deleteKnowledgeBase: (id: string) => Promise<void>;
  getKnowledgeBase: (id: string) => Promise<Project | null>;

  getKnowledgeBaseIDs: () => Promise<string[]>;

  // Batch Operations
  batchUpdate: (
    ids: string[],
    updates: Partial<UpdateProjectInput>,
  ) => Promise<Project[]>;
  batchDelete: (ids: string[]) => Promise<void>;

  // Search and Filter
  searchKnowledgeBases: (query: string) => Promise<void>;
  filterByStatus: (status: ProjectStatus) => Promise<Project[]>;

  // Tab and Pagination Handlers
  handleTabChange: (tab: string) => void;
  handlePageChange: (page: number) => void;
  handleKnowledgeBaseClick: (id: string) => void;
  handleKnowledgeBaseDelete: (id: string) => void;
  setSearchTerm: (term: string) => void;
  setItemsPerPage: (items: number) => void;

  // Analytics
  getAnalytics: (id: string) => Promise<ProjectAnalytics>;

  // Utility Functions
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useKnowledgeBase = (): UseKnowledgeBaseReturn => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10); // 3x3 grid for cards

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("All");

  // Calculate pagination indices
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Calculate tab counts from all projects (not filtered)
  // For now, we'll use totalItems for 'all' and estimate others
  // TODO: Get accurate counts from API for each tab
  const tabCountsData = {
    all: totalItems, // Use totalItems from API instead of projects.length
    active: Math.floor(totalItems * 0.7), // Estimate - should be from API
    inactive: Math.floor(totalItems * 0.3), // Estimate - should be from API
  };

  // Update filtered projects when filters change
  useEffect(() => {
    // For API-based pagination, we don't need to filter on frontend
    // The filtering should be done on the backend
    setFilteredProjects(projects);
  }, [projects]);

  // Load all knowledge bases
  const loadKnowledgeBases = useCallback(
    async (
      page: number = currentPage,
      forceRefresh = false,
      tab?: string,
      search?: string,
    ) => {
      try {
        setLoading(true);
        setError(null);

        // Calculate correct pagination for API
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;

        const paginationOptions = {
          currentPage: page,
          totalPages: 0, // Will be calculated from API response
          startIndex,
          endIndex,
          totalItems: 0, // Will be set from API response
        };

        // Prepare filters for API
        const filters = {
          status: tab?.toLowerCase() || selectedTab.toLowerCase(),
          searchTerm: search,
        };

        console.log("Sending pagination to API:", paginationOptions);
        console.log("Sending filters to API:", filters);

        const results = await knowledgeBaseService.getProjects(
          paginationOptions,
          filters,
        );

        console.log("API response:", {
          dataLength: results.data.length,
          totalCount: results.count,
          startIndex,
          endIndex,
        });

        setProjects(results.data);
        setTotalItems(results.count);
        setTotalPages(Math.ceil(results.count / itemsPerPage));

        if (forceRefresh) {
          // When force refreshing, reset filters
          setSearchTerm("");
          setSelectedTab("All");
          setCurrentPage(1);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load knowledge bases";
        setError(errorMessage);
        console.error("Error loading knowledge bases:", err);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, itemsPerPage, selectedTab, searchTerm],
  );

  // Initial load
  // useEffect(() => {
  //   loadKnowledgeBases(1);
  // }, [loadKnowledgeBases]);

  // Create knowledge base
  const createKnowledgeBase = useCallback(
    async (data: CreateProjectInput): Promise<Project> => {
      try {
        setLoading(true);
        setError(null);
        const newProject = await knowledgeBaseService.createProject(data);
        setProjects((prev) => [newProject, ...prev.slice(0, -1)]); // del last
        return newProject;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create knowledge base";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getKnowledgeBaseIDs = useCallback(async (): Promise<string[]> => {
    try {
      const kbIds = await knowledgeBaseService.getKBIDs();
      return kbIds;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get knowledge base IDs";
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update knowledge base
  const updateKnowledgeBase = useCallback(
    async (id: string, data: UpdateProjectInput): Promise<Project> => {
      try {
        setError(null);
        const updatedProject = await knowledgeBaseService.updateProject(
          id,
          data,
        );
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? updatedProject : p)),
        );
        return updatedProject;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update knowledge base";
        setError(errorMessage);
        throw err;
      }
    },
    [],
  );

  // Delete knowledge base
  const deleteKnowledgeBase = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await knowledgeBaseService.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete knowledge base";
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Get single knowledge base
  const getKnowledgeBase = useCallback(
    async (id: string): Promise<Project | null> => {
      try {
        setError(null);
        return await knowledgeBaseService.getProject(id);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get knowledge base";
        setError(errorMessage);
        throw err;
      }
    },
    [],
  );

  // Batch update
  const batchUpdate = useCallback(
    async (
      ids: string[],
      updates: Partial<UpdateProjectInput>,
    ): Promise<Project[]> => {
      try {
        setError(null);
        const updatePromises = ids.map((id) =>
          knowledgeBaseService.updateProject(id, updates),
        );
        const updatedProjects = await Promise.all(updatePromises);
        setProjects((prev) =>
          prev.map((p) => {
            const updated = updatedProjects.find((up) => up.id === p.id);
            return updated || p;
          }),
        );
        return updatedProjects;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update knowledge bases";
        setError(errorMessage);
        throw err;
      }
    },
    [],
  );

  // Batch delete
  const batchDelete = useCallback(async (ids: string[]): Promise<void> => {
    try {
      setError(null);
      await Promise.all(
        ids.map((id) => knowledgeBaseService.deleteProject(id)),
      );
      setProjects((prev) => prev.filter((p) => !ids.includes(p.id)));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete knowledge bases";
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Search knowledge bases
  const searchKnowledgeBases = useCallback(
    async (query: string): Promise<void> => {
      try {
        console.log("Searching knowledge bases with query:", query);
        setSearchTerm(query);
        setCurrentPage(1); // Reset to first page for search results
        await loadKnowledgeBases(1, false, undefined, query);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to search knowledge bases";
        setError(errorMessage);
        throw err;
      }
    },
    [loadKnowledgeBases],
  );

  // Filter by status
  const filterByStatus = useCallback(
    async (status: ProjectStatus): Promise<Project[]> => {
      try {
        setError(null);
        // Just filter from existing projects
        return projects.filter((p) => p.status === status);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to filter knowledge bases";
        setError(errorMessage);
        throw err;
      }
    },
    [projects],
  );

  // Tab change handler
  const handleTabChange = useCallback(
    async (tab: string) => {
      setSelectedTab(tab);
      setCurrentPage(1);
      await loadKnowledgeBases(1, false, tab);
    },
    [loadKnowledgeBases],
  );

  // Page change handler
  const handlePageChange = useCallback(
    async (page: number) => {
      console.log("Page changed to:", page);
      setCurrentPage(page);
      await loadKnowledgeBases(page);
    },
    [loadKnowledgeBases],
  );

  // Knowledge base click handler
  const handleKnowledgeBaseClick = useCallback(
    (id: string) => {
      router.push(`/knowledge-base/${id}`);
    },
    [router],
  );

  // Knowledge base delete handler
  const handleKnowledgeBaseDelete = useCallback(
    async (id: string) => {
      try {
        await deleteKnowledgeBase(id);
      } catch (err) {
        console.error("Error deleting knowledge base:", err);
      }
    },
    [deleteKnowledgeBase],
  );

  // Get analytics
  const getAnalytics = useCallback(
    async (id: string): Promise<ProjectAnalytics> => {
      try {
        setError(null);
        const project = await knowledgeBaseService.getProject(id);
        if (!project) {
          throw new Error("Project not found");
        }

        const mockAnalytics: ProjectAnalytics = {
          totalDocuments: project.document_count || 0,
          totalSyncedDocuments: project.document_count || 0,
          totalSize: 0,
          recentActivity: 0,
          averageChunkCount: 0,
          syncSuccessRate: 100,
          mostRecentSync: "Recently",
        };

        return mockAnalytics;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get analytics";
        setError(errorMessage);
        throw err;
      }
    },
    [],
  );

  // Refresh data
  const refresh = useCallback(async (): Promise<void> => {
    await loadKnowledgeBases(1, true);
  }, [loadKnowledgeBases]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State - ใช้ projects โดยตรงจาก API (แทนที่จะ slice อีกรอบ)
    projects: projects,
    filteredProjects,
    loading,
    error,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
    itemsPerPage,
    searchTerm,
    selectedTab,

    // Tab counts
    tabCounts: tabCountsData,

    loadKnowledgeBases,
    getKnowledgeBaseIDs,

    // CRUD Operations
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    getKnowledgeBase,

    // Batch Operations
    batchUpdate,
    batchDelete,

    // Search and Filter
    searchKnowledgeBases,
    filterByStatus,

    // Tab and Pagination Handlers
    handleTabChange,
    handlePageChange,
    handleKnowledgeBaseClick,
    handleKnowledgeBaseDelete,
    setSearchTerm,
    setItemsPerPage,

    // Analytics
    getAnalytics,

    // Utility Functions
    refresh,
    clearError,
  };
};
