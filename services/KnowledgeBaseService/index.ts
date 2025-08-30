import type {
  CreateProjectInput,
  PaginationOptions,
  Project,
  UpdateProjectInput,
} from '@/interfaces/Project';
import { ProjectStatus } from '@/interfaces/Project';
import { getAuthSession } from '@/utils/supabase/authUtils';
import { createClientTable } from '@/utils/supabase/client';

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

  async getProjectsByIDs(ids: string[]): Promise<Project[]> {
    try {
      const supabaseTable = createClientTable();
      const { data, error } = await supabaseTable
        .from('knowledge_base')
        .select('*')
        .in('id', ids);

      if (error) {
        console.error(`[${this.serviceName}] Error fetching projects by IDs:`, error);
        throw new Error(`Failed to fetch projects by IDs: ${error.message}`);
      }

      return data as Project[];
    } catch (error) {
      console.error(`[${this.serviceName}] Error getting projects by IDs:`, error);
      throw error;
    }
  }

  async getKBIDs(): Promise<string[]> {
    const user = await this.getCurrentUser();
    const supabaseTable = createClientTable();

    const { data, error } = await supabaseTable
      .from('knowledge_base')
      .select('id')

    if (error) {
      console.error(`[${this.serviceName}] Error fetching KB IDs:`, error);
      throw new Error(`Failed to fetch KB IDs: ${error.message}`);
    }

    return data.map((row: { id: string }) => row.id);
  }

  async searchProject(
    query: string,
    paginationOptions: PaginationOptions,
  ): Promise<{ data: Project[]; count: number }> {
    console.log(
      `[${this.serviceName}] Searching knowledge bases with query:`,
      query,
    );

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
        console.error(
          `[${this.serviceName}] Error getting search count:`,
          countError,
        );
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
        console.log(
          `[${this.serviceName}] No knowledge bases found for query:`,
          query,
        );
        return { data: [], count: 0 };
      }

      console.log(
        `[${this.serviceName}] Found ${projects.length} knowledge bases for query: ${query} (Total: ${count})`,
      );

      // Transform Supabase rows to Project objects
      return { data: projects, count: count || 0 };
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error searching knowledge bases:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Fetch all knowledge bases for the current user with proper pagination
   */
  async getProjects(
    paginationOptions?: PaginationOptions,
    filters?: { status?: string; searchTerm?: string },
  ): Promise<{ data: Project[]; count: number }> {
    console.log(
      `[${this.serviceName}] Fetching knowledge bases with pagination:`,
      paginationOptions,
      'filters:',
      filters,
    );

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
        countQuery = countQuery.or(
          `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`,
        );
        dataQuery = dataQuery.or(
          `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`,
        );
      }

      // Get total count first
      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error(`[${this.serviceName}] Error getting count:`, countError);
      }

      // Get paginated data
      const { data: projects, error } = paginationOptions
        ? await dataQuery
            .order('created_at', { ascending: false })
            .range(paginationOptions.startIndex, paginationOptions.endIndex)
        : await dataQuery.order('created_at', { ascending: false });

      if (error) {
        console.error(`[${this.serviceName}] Supabase query error:`, error);
        throw new Error(`Failed to fetch knowledge bases: ${error.message}`);
      }

      if (!projects || projects.length === 0) {
        console.log(`[${this.serviceName}] No knowledge bases found for user`);
        return { data: [], count: 0 };
      }

      console.log(
        `[${this.serviceName}] Found ${projects.length} knowledge bases (Total: ${count})`,
      );

      // Transform Supabase rows to Project objects
      return { data: projects, count: count || 0 };
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error fetching knowledge bases:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get a specific knowledge base by ID
   */
  async getProject(id: string): Promise<Project | null> {
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
          return null;
        }
        console.error(
          `[${this.serviceName}] Error fetching knowledge base:`,
          error,
        );
        throw new Error(`Failed to fetch knowledge base: ${error.message}`);
      }

      // Get document count for this knowledge base
      const { count: documentCount } = await supabaseTable
        .from('document')
        .select('*', { count: 'exact', head: true })
        .eq('knowledge_base_id', id);

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        is_active: project.is_active,
        document_count: documentCount || 0,
        status: project.is_active ? 1 : 2,
        owner: project.created_by,
        created_at: project.created_at,
        updated_at: project.updated_at || project.created_at,
      } as Project;
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error fetching knowledge base:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create a new knowledge base
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Create project data according to the database schema
      const projectData = {
        name: input.name,
        description: input.description || '',
        created_by: user.id,
        is_active: input.status === ProjectStatus.ACTIVE,
        visibility: input.visibility,
        settings: {}, // Default empty settings object
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: project, error } = await supabaseTable
        .from('knowledge_base')
        .insert([projectData])
        .select()
        .single();

      if (error) {
        console.error(
          `[${this.serviceName}] Error creating knowledge base:`,
          error,
        );
        throw new Error(`Failed to create knowledge base: ${error.message}`);
      }

      return project as Project;
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error creating knowledge base:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update an existing knowledge base
   */
  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      const updateData = {
        ...input,
        updated_at: new Date().toISOString(),
      };

      const { data: project, error } = await supabaseTable
        .from('knowledge_base')
        .update(updateData)
        .eq('id', id)
        .eq('created_by', user.id)
        .select()
        .single();

      if (error) {
        console.error(
          `[${this.serviceName}] Error updating knowledge base:`,
          error,
        );
        throw new Error(`Failed to update knowledge base: ${error.message}`);
      }

      console.log(
        `[${this.serviceName}] Knowledge base updated successfully:`,
        id,
      );

      return {
        id: project.id,
        name: project.name,
        is_active: project.is_active,
        description: project.description || '',
        document_count: 0, // Not available in current schema
        status: project.is_active ? 1 : 2,
        owner: project.created_by,
        created_at: project.created_at,
        updated_at: project.updated_at || project.created_at,
      } as Project;
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error updating knowledge base:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete a knowledge base
   */
  async deleteProject(id: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      const { error } = await supabaseTable
        .from('knowledge_base')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id);

      if (error) {
        console.error(
          `[${this.serviceName}] Error deleting knowledge base:`,
          error,
        );
        throw new Error(`Failed to delete knowledge base: ${error.message}`);
      }
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error deleting knowledge base:`,
        error,
      );
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
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  }
}

export { KnowledgeBaseService };

