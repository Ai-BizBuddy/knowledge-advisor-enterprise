'use client';

import type {
  CreateProjectInput,
  Project,
  ProjectAnalytics,
  ProjectStatus,
  UpdateProjectInput,
} from '@/interfaces/Project';
import { knowledgeBaseService } from '@/services';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

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
    public: number;
    private: number;
    department: number;
    custom: number;
  };

  loadKnowledgeBases: (page?: number, forceRefresh?: boolean) => Promise<void>;
  initialLoad: () => void;

  // CRUD Operations
  createKnowledgeBase: (data: CreateProjectInput) => Promise<Project>;
  updateKnowledgeBase: (
    id: string,
    data: UpdateProjectInput,
  ) => Promise<Project>;
  deleteKnowledgeBase: (id: string) => Promise<void>;
  getKnowledgeBase: (id: string) => Promise<Project | null>;

  getKnowledgeBaseIDs: () => Promise<string[]>;

  getKnowledgeBaseByIDs: (ids: string[]) => Promise<Project[]>;

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

interface KnowledgeBaseState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  searchTerm: string;
  selectedTab: string;
  startIndex: number;
  endIndex: number;
}

export const useKnowledgeBase = (): UseKnowledgeBaseReturn => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Combined state object
  const [state, setState] = useState<KnowledgeBaseState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    searchTerm: '',
    selectedTab: 'All',
    startIndex: 1,
    endIndex: 0,
  });

  // Use ref to store latest state values
  const stateRef = useRef(state);
  stateRef.current = state;

  // Calculate pagination indices when state changes
  useEffect(() => {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage + 1;
    const endIndex = Math.min(
      state.currentPage * state.itemsPerPage,
      state.totalItems,
    );

    setState((prev) => ({
      ...prev,
      startIndex,
      endIndex,
    }));
  }, [state.currentPage, state.itemsPerPage, state.totalItems]);

  // Calculate tab counts from all projects (not filtered)
  // For now, we'll use totalItems for 'all' and estimate others
  // TODO: Get accurate counts from API for each tab
  const tabCountsData = {
    all: state.totalItems, // Use totalItems from API instead of projects.length
    public: Math.floor(state.totalItems * 0.4), // Estimate - should be from API
    private: Math.floor(state.totalItems * 0.3), // Estimate - should be from API
    department: Math.floor(state.totalItems * 0.2), // Estimate - should be from API
    custom: Math.floor(state.totalItems * 0.1), // Estimate - should be from API
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
      page?: number,
      forceRefresh = false,
      tab?: string,
      search?: string,
    ) => {
      try {
        setLoading(true);
        setError(null);

        // Use ref to get the latest state values
        const currentState = stateRef.current;
        const currentPageToUse = page ?? currentState.currentPage;
        const currentItemsPerPage = currentState.itemsPerPage;
        const currentSelectedTab = tab || currentState.selectedTab;
        const currentSearchTerm = search ?? currentState.searchTerm;

        // Calculate correct pagination for API
        const startIndex = (currentPageToUse - 1) * currentItemsPerPage;
        const endIndex = startIndex + currentItemsPerPage - 1;

        const paginationOptions = {
          currentPage: currentPageToUse,
          totalPages: 0, // Will be calculated from API response
          startIndex,
          endIndex,
          totalItems: 0, // Will be set from API response
        };

        // Prepare filters for API
        const filters = {
          status: currentSelectedTab.toLowerCase(),
          searchTerm: currentSearchTerm,
        };

        console.log('Sending pagination to API:', paginationOptions);
        console.log('Sending filters to API:', filters);

        const results = await knowledgeBaseService.getProjects(
          paginationOptions,
          filters,
        );

        setProjects(results.data);
        setState((prev) => ({
          ...prev,
          totalItems: results.count,
          totalPages: Math.ceil(results.count / currentItemsPerPage),
          currentPage: currentPageToUse,
        }));

        if (forceRefresh) {
          // When force refreshing, reset filters
          setState((prev) => ({
            ...prev,
            searchTerm: '',
            selectedTab: 'All',
            currentPage: 1,
          }));
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load knowledge bases';
        setError(errorMessage);
        console.error('Error loading knowledge bases:', err);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    },
    [], // Empty dependencies to prevent recreation on state changes
  );

  // Initial load function
  const initialLoad = useCallback(() => {
    loadKnowledgeBases(1);
  }, [loadKnowledgeBases]);

  // Create knowledge base
  const createKnowledgeBase = useCallback(
    async (data: CreateProjectInput): Promise<Project> => {
      try {
        setLoading(true);
        setError(null);
        const newProject = await knowledgeBaseService.createProject(data);

        // Add the new project to the beginning of the list
        setProjects((prev) => [newProject, ...prev]);

        // Update the state to reflect the new totals
        setState((prev) => ({
          ...prev,
          totalItems: prev.totalItems + 1,
          // Reset to first page to show the new item
          currentPage: 1,
        }));

        return newProject;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to create knowledge base';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getKnowledgeBaseByIDs = useCallback(
    async (ids: string[]): Promise<Project[]> => {
      try {
        const kbProjects = await knowledgeBaseService.getProjectsByIDs(ids);
        return kbProjects;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get knowledge bases';
        setError(errorMessage);
        throw err;
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
        err instanceof Error ? err.message : 'Failed to get knowledge base IDs';
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
            : 'Failed to update knowledge base';
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

      // Update state to reflect the deletion
      setState((prev) => ({
        ...prev,
        totalItems: prev.totalItems - 1,
        totalPages: Math.ceil((prev.totalItems - 1) / prev.itemsPerPage),
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete knowledge base';
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
          err instanceof Error ? err.message : 'Failed to get knowledge base';
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
            const updated = updatedProjects.find(
              (up: Project) => up.id === p.id,
            );
            return updated || p;
          }),
        );
        return updatedProjects;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update knowledge bases';
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
        err instanceof Error ? err.message : 'Failed to delete knowledge bases';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Search knowledge bases
  const searchKnowledgeBases = useCallback(
    (query: string): Promise<void> => {
      console.log('Searching knowledge bases with query:', query);
      setState((prev) => ({
        ...prev,
        searchTerm: query,
        currentPage: 1, // Reset to first page for search results
      }));
      return loadKnowledgeBases(1, false, undefined, query);
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
            : 'Failed to filter knowledge bases';
        setError(errorMessage);
        throw err;
      }
    },
    [projects],
  );

  // Tab change handler
  const handleTabChange = useCallback(
    (tab: string) => {
      setState((prev) => ({
        ...prev,
        selectedTab: tab,
        currentPage: 1,
      }));
      loadKnowledgeBases(1, false, tab);
    },
    [loadKnowledgeBases],
  );

  // Page change handler
  const handlePageChange = useCallback(
    (page: number) => {
      console.log('Page changed to:', page);
      // Update state immediately without triggering additional effects
      setState((prev) => ({
        ...prev,
        currentPage: page,
      }));
      // Call API with the new page
      loadKnowledgeBases(page);
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
        console.error('Error deleting knowledge base:', err);
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
          throw new Error('Project not found');
        }

        const mockAnalytics: ProjectAnalytics = {
          totalDocuments: project.document_count || 0,
          totalSyncedDocuments: project.document_count || 0,
          totalSize: 0,
          recentActivity: 0,
          averageChunkCount: 0,
          syncSuccessRate: 100,
          mostRecentSync: 'Recently',
        };

        return mockAnalytics;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get analytics';
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

  // Helper functions for updating state
  const setSearchTerm = useCallback((term: string) => {
    setState((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  const setItemsPerPage = useCallback((items: number) => {
    setState((prev) => ({ ...prev, itemsPerPage: items }));
  }, []);

  return {
    // State - ใช้ projects โดยตรงจาก API (แทนที่จะ slice อีกรอบ)
    projects: projects,
    filteredProjects,
    loading,
    error,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    startIndex: state.startIndex,
    endIndex: state.endIndex,
    totalItems: state.totalItems,
    itemsPerPage: state.itemsPerPage,
    searchTerm: state.searchTerm,
    selectedTab: state.selectedTab,

    // Tab counts
    tabCounts: tabCountsData,
    initialLoad,

    loadKnowledgeBases,
    getKnowledgeBaseIDs,
    getKnowledgeBaseByIDs,

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
