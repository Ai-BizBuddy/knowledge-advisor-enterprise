/**
 * Knowledge Base Service - Supabase Implementation
 * 
 * This service handles all CRUD operations for knowledge bases using Supabase
 * with fetch API instead of Axios. Follows the project's strict TypeScript standards.
 */

import { createClientTable } from "@/utils/supabase/client";
import { getAuthSession } from "@/utils/supabase/authUtils";
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  PaginationOptions
} from "@/interfaces/Project";
import { ProjectStatus } from "@/interfaces/Project";

// Supabase database row interface matching the knowledge_base table schema
interface SupabaseKnowledgeBaseRow {
  id: string;
  name: string;
  description?: string;
  department_id?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  visibility?: string;
  is_active?: boolean;
  settings?: Record<string, unknown>;
}

/**
 * Knowledge Base Service Class
 * 
 * Handles all knowledge base operations including CRUD, document management,
 * and processing status tracking.
 */
class KnowledgeBaseService {
  private readonly serviceName = 'KnowledgeBase';

  constructor() {
    // Service initialization
  }
  /**
   * Get current user from Supabase auth
   */
  private async getCurrentUser() {
    try {
      const session = await getAuthSession();

      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      console.log(`[${this.serviceName}] Current user ID:`, session.user.id);
      return session.user;
    } catch (error) {
      console.error(`[${this.serviceName}] Error getting current user:`, error);
      throw error;
    }
  }

  async searchProject(query: string, paginationOptions: PaginationOptions): Promise<{ data: Project[], count: number }> {
    console.log(`[${this.serviceName}] Searching knowledge bases with query:`, query);

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Get total count for search results
      const { count, error: countError } = await supabaseTable
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

      if (countError) {
        console.error(`[${this.serviceName}] Error getting search count:`, countError);
      }

      // Get paginated search results
      const { data: projects, error } = await supabaseTable
        .from('knowledge_base')
        .select('*')
        .eq('created_by', user.id)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .range(paginationOptions.startIndex, paginationOptions.endIndex);

      if (error) {
        console.error(`[${this.serviceName}] Supabase query error:`, error);
        throw new Error(`Failed to search knowledge bases: ${error.message}`);
      }

      if (!projects || projects.length === 0) {
        console.log(`[${this.serviceName}] No knowledge bases found for query:`, query);
        return { data: [], count: 0 };
      }

      console.log(`[${this.serviceName}] Found ${projects.length} knowledge bases for query: ${query} (Total: ${count})`);

      // Transform Supabase rows to Project objects
      return { data: projects, count: count || 0 }

    } catch (error) {
      console.error(`[${this.serviceName}] Error searching knowledge bases:`, error);
      throw error;
    }
  }

  /**
   * Fetch all knowledge bases for the current user with proper pagination
   */
  async getProjects(
    paginationOptions: PaginationOptions,
    filters?: { status?: string; searchTerm?: string }
  ): Promise<{ data: Project[], count: number }> {
    console.log(`[${this.serviceName}] Fetching knowledge bases with pagination:`, paginationOptions, 'filters:', filters);

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      console.log(`[${this.serviceName}] Querying Supabase for user:`, user.id);

      // Build base query
      let countQuery = supabaseTable
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      let dataQuery = supabaseTable
        .from('knowledge_base')
        .select('*')
        .eq('created_by', user.id);

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        const statusValue = filters.status === 'active' ? true : false;
        countQuery = countQuery.eq('is_active', statusValue);
        dataQuery = dataQuery.eq('is_active', statusValue);
      }

      if (filters?.searchTerm && filters.searchTerm.trim()) {
        const searchTerm = filters.searchTerm.trim();
        countQuery = countQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        dataQuery = dataQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Get total count first
      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error(`[${this.serviceName}] Error getting count:`, countError);
      }

      // Get paginated data
      const { data: projects, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(paginationOptions.startIndex, paginationOptions.endIndex);

      if (error) {
        console.error(`[${this.serviceName}] Supabase query error:`, error);
        throw new Error(`Failed to fetch knowledge bases: ${error.message}`);
      }

      if (!projects || projects.length === 0) {
        console.log(`[${this.serviceName}] No knowledge bases found for user`);
        return { data: [], count: 0 };
      }

      console.log(`[${this.serviceName}] Found ${projects.length} knowledge bases (Total: ${count})`);

      // Transform Supabase rows to Project objects
      return { data: projects, count: count || 0 };

    } catch (error) {
      console.error(`[${this.serviceName}] Error fetching knowledge bases:`, error);
      throw error;
    }
  }

  /**
   * Get a specific knowledge base by ID
   */
  async getProject(id: string): Promise<Project | null> {
    console.log(`[${this.serviceName}] Fetching knowledge base:`, id);

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      const { data: project, error } = await supabaseTable
        .from('knowledge_base')
        .select('*')
        .eq('id', id)
        .eq('created_by', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`[${this.serviceName}] Knowledge base not found:`, id);
          return null;
        }
        console.error(`[${this.serviceName}] Error fetching knowledge base:`, error);
        throw new Error(`Failed to fetch knowledge base: ${error.message}`);
      }

      // Get document count for this knowledge base
      const { count: documentCount } = await supabaseTable
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id);

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        document_count: documentCount || 0,
        status: project.is_active ? ProjectStatus.ACTIVE : ProjectStatus.PAUSED,
        owner: project.created_by,
        created_at: project.created_at,
        updated_at: project.updated_at || project.created_at,
        lastSync: this.formatLastSync(project.updated_at || project.created_at),
        queries: 0,
        accuracy: 0
      };

    } catch (error) {
      console.error(`[${this.serviceName}] Error fetching knowledge base:`, error);
      throw error;
    }
  }

  /**
   * Create a new knowledge base
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    console.log(`[${this.serviceName}] Creating knowledge base:`, input.name);

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Create project data according to the database schema
      const projectData = {
        name: input.name,
        description: input.description || '',
        created_by: user.id,
        is_active: input.status === ProjectStatus.ACTIVE,
        visibility: input.visibility === 2 ? 'private' : 'public', // Default visibility
        settings: {}, // Default empty settings object
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: project, error } = await supabaseTable
        .from('knowledge_base')
        .insert([projectData])
        .select()
        .single();

      if (error) {
        console.error(`[${this.serviceName}] Error creating knowledge base:`, error);
        throw new Error(`Failed to create knowledge base: ${error.message}`);
      }

      console.log(`[${this.serviceName}] Knowledge base created successfully:`, project.id);

      return project as Project;

    } catch (error) {
      console.error(`[${this.serviceName}] Error creating knowledge base:`, error);
      throw error;
    }
  }

  /**
   * Update an existing knowledge base
   */
  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    console.log(`[${this.serviceName}] Updating knowledge base:`, id);

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      const updateData = {
        ...input,
        updated_at: new Date().toISOString()
      };

      const { data: project, error } = await supabaseTable
        .from('knowledge_base')
        .update(updateData)
        .eq('id', id)
        .eq('created_by', user.id)
        .select()
        .single();

      if (error) {
        console.error(`[${this.serviceName}] Error updating knowledge base:`, error);
        throw new Error(`Failed to update knowledge base: ${error.message}`);
      }

      console.log(`[${this.serviceName}] Knowledge base updated successfully:`, id);

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        document_count: 0, // Not available in current schema
        status: project.is_active ? ProjectStatus.ACTIVE : ProjectStatus.PAUSED,
        owner: project.created_by,
        created_at: project.created_at,
        updated_at: project.updated_at || project.created_at,
        lastSync: this.formatLastSync(project.updated_at || project.created_at),
        queries: 0,
        accuracy: 0
      };

    } catch (error) {
      console.error(`[${this.serviceName}] Error updating knowledge base:`, error);
      throw error;
    }
  }

  /**
   * Delete a knowledge base
   */
  async deleteProject(id: string): Promise<void> {
    console.log(`[${this.serviceName}] Deleting knowledge base:`, id);

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      const { error } = await supabaseTable
        .from('knowledge_base')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id)

      if (error) {
        console.error(`[${this.serviceName}] Error deleting knowledge base:`, error);
        throw new Error(`Failed to delete knowledge base: ${error.message}`);
      }

      console.log(`[${this.serviceName}] Knowledge base deleted successfully:`, id);

    } catch (error) {
      console.error(`[${this.serviceName}] Error deleting knowledge base:`, error);
      throw error;
    }
  }


  /**
   * Format last sync time for display
   */
  private formatLastSync(updated_at: string): string {
    const updatedDate = new Date(updated_at);
    const now = new Date();
    const diffMs = now.getTime() - updatedDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return "Just now";
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  }
}

export { KnowledgeBaseService };
