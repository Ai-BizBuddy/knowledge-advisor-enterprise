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
  PaginationOptions,
  PaginatedResponse,
  ProjectFilters
} from "@/interfaces/Project";
import { ProjectStatus } from "@/interfaces/Project";
import type { SupabaseProjectRow } from "@/interfaces/AxiosTypes";

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

  /**
   * Fetch all knowledge bases for the current user
   */
  async getProjects(): Promise<Project[]> {
    console.log(`[${this.serviceName}] Fetching knowledge bases...`);

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      console.log(`[${this.serviceName}] Querying Supabase for user:`, user.id);

      const { data: projects, error } = await supabaseTable
        .from('knowledge_base')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`[${this.serviceName}] Supabase query error:`, error);
        throw new Error(`Failed to fetch knowledge bases: ${error.message}`);
      }

      if (!projects || projects.length === 0) {
        console.log(`[${this.serviceName}] No knowledge bases found for user`);
        return [];
      }

      console.log(`[${this.serviceName}] Found ${projects.length} knowledge bases`);
      // Transform Supabase rows to Project objects
      return projects.map((row: SupabaseProjectRow) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        document_count: row.document_count || 0,
        status: (row.status as ProjectStatus) || ProjectStatus.ACTIVE,
        owner: row.owner,
        created_at: row.created_at,
        updated_at: row.updated_at,
        lastSync: this.formatLastSync(row.updated_at),
        queries: 0, // Default value - not available in current schema
        accuracy: 0 // Default value - not available in current schema
      }));

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
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`[${this.serviceName}] Knowledge base not found:`, id);
          return null;
        }
        console.error(`[${this.serviceName}] Error fetching knowledge base:`, error);
        throw new Error(`Failed to fetch knowledge base: ${error.message}`);
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        document_count: project.document_count || 0,
        status: (project.status as ProjectStatus) || ProjectStatus.ACTIVE,
        owner: project.owner,
        created_at: project.created_at,
        updated_at: project.updated_at,
        lastSync: this.formatLastSync(project.updated_at),
        queries: project.queries || 0,
        accuracy: project.accuracy || 0
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

      // status is stored as smallint in the DB, so we use ProjectStatus.ACTIVE (number)
      const projectData = {
        name: input.name,
        description: input.description || '',
        owner: user.id,
        status: ProjectStatus.ACTIVE,
        document_count: 0,
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

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        document_count: project.document_count || 0,
        status: (project.status as ProjectStatus) || ProjectStatus.ACTIVE,
        owner: project.owner,
        created_at: project.created_at,
        updated_at: project.updated_at,
        lastSync: this.formatLastSync(project.updated_at),
        queries: 0, // Not in schema
        accuracy: 0 // Not in schema
      };

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
        document_count: project.document_count || 0,
        status: (project.status as ProjectStatus) || ProjectStatus.ACTIVE,
        owner: project.owner,
        created_at: project.created_at,
        updated_at: project.updated_at,
        lastSync: this.formatLastSync(project.updated_at),
        queries: project.queries || 0,
        accuracy: project.accuracy || 0
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
