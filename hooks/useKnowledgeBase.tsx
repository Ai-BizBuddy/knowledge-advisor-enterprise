"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { knowledgeBaseService } from "@/services";
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectStatus,
  PaginationOptions,
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

  // CRUD Operations
  createKnowledgeBase: (data: CreateProjectInput) => Promise<Project>;
  updateKnowledgeBase: (
    id: string,
    data: UpdateProjectInput,
  ) => Promise<Project>;
  deleteKnowledgeBase: (id: string) => Promise<void>;
  getKnowledgeBase: (id: string) => Promise<Project | null>;

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

  // Calculate tab counts
  const tabCounts = {
    all: projects.length,
    active: projects.filter((p) => p.status === 1).length, // Active = 1
    inactive: projects.filter((p) => p.status !== 1).length, // Not active
  };

  // Build pagination options for API calls
  const buildPaginationOptions = useCallback((): PaginationOptions => {
    return {
      currentPage,
      totalPages,
      startIndex: (currentPage - 1) * itemsPerPage,
      endIndex: currentPage * itemsPerPage - 1,
      totalItems,
    };
  }, [currentPage, totalPages, itemsPerPage, totalItems]);

  // Filter projects by tab
  const filterProjectsByTab = useCallback(
    (projectsToFilter: Project[]) => {
      switch (selectedTab.toLowerCase()) {
        case "active":
          return projectsToFilter.filter((p) => p.status === 1);
        case "inactive":
          return projectsToFilter.filter((p) => p.status !== 1);
        default:
          return projectsToFilter;
      }
    },
    [selectedTab],
  );

  // Apply search filter
  const applySearchFilter = useCallback(
    (projectsToFilter: Project[]) => {
      if (!searchTerm.trim()) return projectsToFilter;

      const lowercaseSearch = searchTerm.toLowerCase();
      return projectsToFilter.filter(
        (project) =>
          project.name.toLowerCase().includes(lowercaseSearch) ||
          project.description.toLowerCase().includes(lowercaseSearch),
      );
    },
    [searchTerm],
  );

  // Update filtered projects when filters change
  useEffect(() => {
    let filtered = filterProjectsByTab(projects);
    filtered = applySearchFilter(filtered);
    setFilteredProjects(filtered);
    // setTotalItems(filtered.length);
    // setTotalPages(Math.ceil(filtered.length / itemsPerPage));

    // Reset to first page if current page is out of range
    if (
      currentPage > Math.ceil(filtered.length / itemsPerPage) &&
      filtered.length > 0
    ) {
      setCurrentPage(1);
    }
  }, [
    projects,
    selectedTab,
    searchTerm,
    itemsPerPage,
    currentPage,
    filterProjectsByTab,
    applySearchFilter,
  ]);

  // Load all knowledge bases
  const loadKnowledgeBases = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        setError(null);

        const paginationOptions = buildPaginationOptions();
        const results =
          await knowledgeBaseService.getProjects(paginationOptions);

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
    [buildPaginationOptions],
  );

  // Initial load
  useEffect(() => {
    loadKnowledgeBases();
  }, [loadKnowledgeBases]);

  // Create knowledge base
  const createKnowledgeBase = useCallback(
    async (data: CreateProjectInput): Promise<Project> => {
      try {
        setError(null);
        const newProject = await knowledgeBaseService.createProject(data);
        setProjects((prev) => [newProject, ...prev]);
        return newProject;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create knowledge base";
        setError(errorMessage);
        throw err;
      }
    },
    [],
  );

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
        setLoading(true);
        setError(null);
        setSearchTerm(query);

        if (!query.trim()) {
          // If empty search, reload all projects
          await loadKnowledgeBases();
          return;
        }

        const paginationOptions = buildPaginationOptions();
        const results = await knowledgeBaseService.searchProject(
          query,
          paginationOptions,
        );
        setProjects(results.data);
        // setTotalItems(results.count);
        // setTotalPages(Math.ceil(results.count / itemsPerPage));
        setCurrentPage(1); // Reset to first page for search results
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to search knowledge bases";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [buildPaginationOptions, loadKnowledgeBases],
  );

  // Filter by status
  const filterByStatus = useCallback(
    async (status: ProjectStatus): Promise<Project[]> => {
      try {
        setError(null);
        const allProjects = await knowledgeBaseService.getProjects(
          buildPaginationOptions(),
        );
        setTotalItems(allProjects.count);
        setTotalPages(Math.ceil(allProjects.count / itemsPerPage));
        return allProjects.data.filter((p) => p.status === status);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to filter knowledge bases";
        setError(errorMessage);
        throw err;
      }
    },
    [buildPaginationOptions],
  );

  // Tab change handler
  const handleTabChange = useCallback((tab: string) => {
    setSelectedTab(tab);
    setCurrentPage(1); // Reset to first page when tab changes
  }, []);

  // Page change handler
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [totalPages],
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
    await loadKnowledgeBases(true);
  }, [loadKnowledgeBases]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    projects: filteredProjects.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    ),
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
    tabCounts,

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
