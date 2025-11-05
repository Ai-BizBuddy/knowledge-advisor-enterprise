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
   * Validate UUID v1-v5 format
   */
  private isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    );
  }
  /**
   * Get current user from Supabase auth
   */
  private async getCurrentUser() {
    try {
      const session = await getAuthSession();

      console.log(session?.user);
      // 👀 check what’s inside user

      console.log(session); 
      // values under app_metadata

      console.log(session); 
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      return session.user;
    } catch (error) {
      throw error;
    }
  }

  async getKnowledgeBaseByIDs(ids: string[]): Promise<Project[]> {
    try {
      // Guard against undefined/invalid IDs to avoid Postgres 22P02 errors
      const uniqueValidIds = Array.from(
        new Set(
          (ids || []).filter(
            (id): id is string =>
              typeof id === 'string' && this.isValidUUID(id),
          ),
        ),
      );

      if (uniqueValidIds.length === 0) {
        console.warn(
          `[${this.serviceName}] getKnowledgeBaseByIDs called with no valid UUIDs; skipping query`,
          { receivedCount: ids?.length || 0 },
        );
        return [];
      }

      const supabaseTable = createClientTable();
      const { data, error } = await supabaseTable
        .from('knowledge_base_view')
        .select('*')
        .in('id', uniqueValidIds);

      if (error) {
        throw new Error(
          `Failed to fetch knowledge bases by IDs: ${error.message}`,
        );
      }

      return data as Project[];
    } catch (error) {
      throw error;
    }
  }

  async getKBIDs(): Promise<string[]> {
    // Ensure user is authenticated (RLS), but we don't need the value here
    await this.getCurrentUser();
    const supabaseTable = createClientTable();

    const { data, error } = await supabaseTable
      .from('knowledge_base_view')
      .select('id');

    if (error) {
      throw new Error(`Failed to fetch KB IDs: ${error.message}`);
    }

    return data
      .map((row: { id: string }) => row.id)
      .filter((id: string) => this.isValidUUID(id));
  }

  async searchKnowledgeBase(
    query: string,
    paginationOptions: PaginationOptions,
  ): Promise<{ data: Project[]; count: number }> {
    try {
      const supabaseTable = createClientTable();

      // Get total count for search results
      const { count, error: countError } = await supabaseTable
        .from('knowledge_base_view')
        .select('*', { count: 'exact', head: true })
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

      if (countError) {
        throw new Error(
          `Failed to count knowledge bases: ${countError.message}`,
        );
      }

      // Get paginated search results
      const { data: projects, error } = await supabaseTable
        .from('knowledge_base_view')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .range(paginationOptions.startIndex, paginationOptions.endIndex);

      if (error) {
        throw new Error(`Failed to search knowledge bases: ${error.message}`);
      }

      if (!projects || projects.length === 0) {
        return { data: [], count: 0 };
      }

      // Transform Supabase rows to Project objects
      return { data: projects, count: count || 0 };
    } catch (error) {
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
    try {
      const supabaseTable = createClientTable();

      // Build base query
      let countQuery = supabaseTable
        .from('knowledge_base_view')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabaseTable.from('knowledge_base_view').select('*');

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        const statusValue = filters.status;
        countQuery = countQuery.eq('visibility', statusValue);
        dataQuery = dataQuery.eq('visibility', statusValue);
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
      }

      // Get paginated data
      const { data: projects, error } = paginationOptions
        ? await dataQuery
            .order('created_at', { ascending: false })
            .range(paginationOptions.startIndex, paginationOptions.endIndex)
        : await dataQuery.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch knowledge bases: ${error.message}`);
      }

      if (!projects || projects.length === 0) {
        return { data: [], count: 0 };
      }

      // Transform Supabase rows to Project objects
      return { data: projects, count: count || 0 };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific knowledge base by ID
   */
  async getProject(id: string): Promise<Project | null> {
    try {
      const supabaseTable = createClientTable();

      const { data: project, error } = await supabaseTable
        .from('knowledge_base_view')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch knowledge base: ${error.message}`);
      }

      // Get document count for this knowledge base
      const { count: documentCount } = await supabaseTable
        .from('document_view')
        .select('*', { count: 'exact', head: true })
        .eq('knowledge_base_id', id);

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        visibility: project.visibility,
        department_id: project.department_id,
        document_count: documentCount || 0,
        status: project.is_active ? 1 : 2, // Convert is_active to status number
        owner: project.created_by,
        is_active: project.is_active,
      } as Project;
    } catch (error) {
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
      console.log('user.user_metadata=>>>>', user);
      // Create project data according to the database schema
      const projectData = {
        name: input.name,
        description: input.description || '',
        created_by: user.id,
        is_active: input.status === ProjectStatus.ACTIVE,
        visibility: input.visibility,
        department_id: input.visibility === 'department' ? 
          user.user_metadata?.department_id : null,
        settings: {},
      };

      const { data: project, error } = await supabaseTable
        .from('knowledge_base')
        .insert([projectData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create knowledge base: ${error.message}`);
      }

      return project as Project;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing knowledge base
   */
  async updateProject(id: string, input: UpdateProjectInput): Promise<void> {
    try {
      const supabaseTable = createClientTable();

      const updateData = {
        ...input,
        is_active: input.is_active === 1 ? true : input.is_active === 2 ? false : undefined,
        updated_at: new Date().toISOString(),
      };

      const { data: project, error } = await supabaseTable
        .from('knowledge_base')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to update knowledge base: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update knowledge base context field
   */
  async updateContext(id: string, context: string): Promise<void> {
    try {
      const supabaseTable = createClientTable();

      const { error } = await supabaseTable
        .from('knowledge_base')
        .update({ 
          context,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .is('is_deleted', false);

      if (error) {
        throw new Error(`Failed to update context: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get ONLY the context field for a knowledge base
   * Avoids selecting all columns to reduce payload and comply with least-privilege reads.
   */
  async getContext(id: string): Promise<string | null> {
    try {
      const supabaseTable = createClientTable();
      const { data, error } = await supabaseTable
        .from('knowledge_base')
        .select('context')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch context: ${error.message}`);
      }

      // data may be null if not found or context can be null
      return (data as { context: string | null } | null)?.context ?? null;
    } catch (error) {
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

      // Soft delete: Update deleted_at timestamp instead of hard delete
      const { error } = await supabaseTable
        .from('knowledge_base')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString(), 
          deleted_by: user.id 
        })
        .eq('id', id)
        .is('deleted_at', null);

      if (error) {
        throw new Error(`Failed to delete knowledge base: ${error.message}`);
      }
    } catch (error) {
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
