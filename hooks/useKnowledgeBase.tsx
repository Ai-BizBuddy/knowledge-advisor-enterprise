"use client";

import { useState, useEffect, useCallback } from 'react';
import { knowledgeBaseService } from '@/services';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectStatus,
  PaginationOptions,
  PaginatedResponse,
  ProjectAnalytics
} from '@/interfaces/Project';

export interface UseKnowledgeBaseReturn {
  // State
  projects: Project[];
  loading: boolean;
  error: string | null;
  
  // CRUD Operations
  createKnowledgeBase: (data: CreateProjectInput) => Promise<Project>;
  updateKnowledgeBase: (id: string, data: UpdateProjectInput) => Promise<Project>;
  deleteKnowledgeBase: (id: string) => Promise<void>;
  getKnowledgeBase: (id: string) => Promise<Project | null>;
  
  // Batch Operations
  batchUpdate: (ids: string[], updates: Partial<UpdateProjectInput>) => Promise<Project[]>;
  batchDelete: (ids: string[]) => Promise<void>;
  
  // Search and Filter
  searchKnowledgeBases: (query: string) => Promise<Project[]>;
  filterByStatus: (status: ProjectStatus) => Promise<Project[]>;
  
  // Pagination
  loadPage: (options: PaginationOptions) => Promise<PaginatedResponse<Project>>;
  
  // Analytics
  getAnalytics: (id: string) => Promise<ProjectAnalytics>;
  
  // Utility Functions
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useKnowledgeBase = (): UseKnowledgeBaseReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all knowledge bases
  const loadKnowledgeBases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await knowledgeBaseService.getProjects();
      setProjects(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load knowledge bases';
      setError(errorMessage);
      console.error('Error loading knowledge bases:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadKnowledgeBases();
  }, [loadKnowledgeBases]);

  // Create knowledge base
  const createKnowledgeBase = useCallback(async (data: CreateProjectInput): Promise<Project> => {
    try {
      setError(null);
      const newProject = await knowledgeBaseService.createProject(data);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create knowledge base';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update knowledge base
  const updateKnowledgeBase = useCallback(async (id: string, data: UpdateProjectInput): Promise<Project> => {
    try {
      setError(null);
      const updatedProject = await knowledgeBaseService.updateProject(id, data);
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update knowledge base';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Delete knowledge base
  const deleteKnowledgeBase = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await knowledgeBaseService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete knowledge base';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Get single knowledge base
  const getKnowledgeBase = useCallback(async (id: string): Promise<Project | null> => {
    try {
      setError(null);
      return await knowledgeBaseService.getProject(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get knowledge base';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Batch update - TODO: Implement in KnowledgeBaseService
  const batchUpdate = useCallback(async (
    ids: string[], 
    updates: Partial<UpdateProjectInput>
  ): Promise<Project[]> => {
    try {
      setError(null);
      // For now, update individually since batch update is not implemented
      const updatePromises = ids.map(id => knowledgeBaseService.updateProject(id, updates));
      const updatedProjects = await Promise.all(updatePromises);
      setProjects(prev => 
        prev.map(p => {
          const updated = updatedProjects.find(up => up.id === p.id);
          return updated || p;
        })
      );
      return updatedProjects;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update knowledge bases';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Batch delete - TODO: Implement in KnowledgeBaseService
  const batchDelete = useCallback(async (ids: string[]): Promise<void> => {
    try {
      setError(null);
      // For now, delete individually since batch delete is not implemented
      await Promise.all(ids.map(id => knowledgeBaseService.deleteProject(id)));
      setProjects(prev => prev.filter(p => !ids.includes(p.id)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete knowledge bases';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Search knowledge bases - TODO: Implement in KnowledgeBaseService
  const searchKnowledgeBases = useCallback(async (query: string): Promise<Project[]> => {
    try {
      setError(null);
      // For now, filter locally since search is not implemented
      const allProjects = await knowledgeBaseService.getProjects();
      return allProjects.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search knowledge bases';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Filter by status - TODO: Implement in KnowledgeBaseService
  const filterByStatus = useCallback(async (status: ProjectStatus): Promise<Project[]> => {
    try {
      setError(null);
      // For now, filter locally since status filtering is not implemented
      const allProjects = await knowledgeBaseService.getProjects();
      return allProjects.filter(p => p.status === status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter knowledge bases';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Load page with pagination - TODO: Implement in KnowledgeBaseService
  const loadPage = useCallback(async (options: PaginationOptions): Promise<PaginatedResponse<Project>> => {
    try {
      setError(null);
      // For now, return a mock paginated response
      const allProjects = await knowledgeBaseService.getProjects();
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedProjects = allProjects.slice(startIndex, endIndex);
      
      return {
        data: paginatedProjects,
        total: allProjects.length,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(allProjects.length / options.limit)
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load page';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Get analytics - TODO: Implement in KnowledgeBaseService
  const getAnalytics = useCallback(async (id: string): Promise<ProjectAnalytics> => {
    try {
      setError(null);
      // For now, return mock analytics data
      const project = await knowledgeBaseService.getProject(id);
      if (!project) {
        throw new Error('Project not found');
      }
      
      const mockAnalytics: ProjectAnalytics = {
        totalDocuments: project.document_count || 0,
        totalSyncedDocuments: project.document_count || 0,
        totalSize: 0, // Would come from actual analytics
        recentActivity: 0, // Would come from actual analytics
        averageChunkCount: 0, // Would come from actual analytics
        syncSuccessRate: 100,
        mostRecentSync: 'Recently'
      };
      
      return mockAnalytics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get analytics';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Refresh data
  const refresh = useCallback(async (): Promise<void> => {
    await loadKnowledgeBases();
  }, [loadKnowledgeBases]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    projects,
    loading,
    error,
    
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
    
    // Pagination
    loadPage,
    
    // Analytics
    getAnalytics,
    
    // Utility Functions
    refresh,
    clearError
  };
};
