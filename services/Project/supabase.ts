import type {
  CreateProjectInput,
  Document,
  Project,
  UpdateProjectInput
} from '@/interfaces/Project';
import type {
  SupabaseProjectRow
} from '@/interfaces/Supabase';
import { getAuthSession } from '@/utils/supabase/authUtils';
import { createClient, createClientTable } from '@/utils/supabase/client';

/**
 * Get current user from Supabase auth
 */
async function getCurrentUser() {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    return session.user;
  } catch (error) {
        throw error;
  }
}

/**
 * Fetch all knowledge bases for the current user
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const supabase = createClientTable();
    const { data, error } = await supabase
      .from('knowledge_base')
      .select(
        `
        id,
        name,
        description,
        status,
        owner,
        is_deleted,
        deleted_at,
        deleted_by,
        created_at,
        updated_at
      `,
      )
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
            throw new Error(`Failed to fetch knowledge bases: ${error.message}`);
    }

    // Add computed fields for display
    const projectsWithCounts = await Promise.all(
      (data || []).map(async (project) => {
        const typedProject = project as SupabaseProjectRow;
        try {
          // Get document count for each project
          const supabase = createClientTable();
          const { count, error: countError } = await supabase
            .from('document_view')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', typedProject.id as string);

          if (countError) {
          }

          return {
            ...typedProject,
            document_count: count || 0,
          } as Project;
        } catch (err) {
          return {
            ...typedProject,
            document_count: 0,
          } as Project;
        }
      }),
    );

    return projectsWithCounts;
  } catch (error) {
        throw error;
  }
}

/**
 * Fetch a single knowledge base by ID
 */
export async function getProjectById(id: string): Promise<Project> {
  try {
    const supabase = createClientTable();
    const { data, error } = await supabase
      .from('knowledge_base')
      .select(
        `
        id,
        name,
        description,
        status,
        visibility,
        owner,
        created_at,
        updated_at
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Knowledge base with ID ${id} not found`);
      }
            throw new Error(`Failed to fetch knowledge base: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Knowledge base with ID ${id} not found`);
    }

    // Get document count
    const supabaseCount = createClientTable();
    const { count, error: countError } = await supabaseCount
      .from('document_view')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id);

    if (countError) {
          }

    const result = {
      ...data,
      document_count: count || 0,
      visibility: data.visibility,
    } as Project;

    return result;
  } catch (error) {
        throw error;
  }
}

/**
 * Create a new knowledge base
 */
export async function createProject(
  projectData: CreateProjectInput,
): Promise<Project> {
  const user = await getCurrentUser();

  const supabase = createClientTable();
  const { data, error } = await supabase
    .from('knowledge_base')
    .insert([
      {
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        visibility: projectData.visibility,
        department_id: projectData.department_id || null,
        owner: user.id,
        updated_at: new Date().toISOString(),
      },
    ])
    .select(
      `
      id,
      name,
      description,
      status,
      owner,
      created_at,
      updated_at
    `,
    )
    .single();

  if (error) {
        throw new Error(`Failed to create knowledge base: ${error.message}`);
  }

  return {
    ...data,
    document_count: 0,
  } as Project;
}

/**
 * Update an existing knowledge base
 */
export async function updateProject(
  id: string,
  updates: UpdateProjectInput,
): Promise<Project> {
  const supabase = createClientTable();
  const { data, error } = await supabase
    .from('knowledge_base')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      `
      id,
      name,
      description,
      status,
      owner,
      created_at,
      updated_at
    `,
    )
    .single();

  if (error) {
        throw new Error(`Failed to update knowledge base: ${error.message}`);
  }

  // Get document count
  const supabaseCount = createClientTable();
  const { count } = await supabaseCount
    .from('document_view')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id);

  return {
    ...data,
    document_count: count || 0,
  } as Project;
}

/**
 * Delete a knowledge base and all its documents
 */
export async function deleteProject(id: string): Promise<void> {
  const user = await getCurrentUser();

  // First, delete all documents associated with this project
  const supabaseDocuments = createClientTable();
  const { data: documents } = await supabaseDocuments
    .from('document_view')
    .select('id, url')
    .eq('project_id', id);

  if (documents && documents.length > 0) {
    // Delete files from storage and document records
    for (const doc of documents) {
      try {
        await deleteDocument(id, doc.id as string, doc.url as string);
      } catch (error) {
                // Continue with other deletions
      }
    }
  }

  // Soft delete the knowledge base
  const supabaseDelete = createClientTable();
  const { error } = await supabaseDelete
    .from('knowledge_base')
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString(),
      deleted_by: user.id 
    })
    .eq('id', id)
    .eq('is_deleted', false);

  if (error) {
        throw new Error(`Failed to delete knowledge base: ${error.message}`);
  }

  // Clean up storage bucket if it exists
  try {
    const supabaseStorage = createClient();
    await supabaseStorage.storage.deleteBucket(id);
  } catch (error) {
    // Non-critical error, don't throw
  }
}

/**
 * Fetch documents by knowledge base ID
 */
export async function getDocumentsByProjectId(
  projectId: string,
): Promise<Document[]> {
  try {
    const supabase = createClientTable();
    const { data, error } = await supabase
      .from('documents')
      .select(
        `
        id,
        name,
        type,
        status,
        project_id,
        uploaded_by,
        chunk_count,
        file_size,
        mime_type,
        created_at,
        updated_at,
        path,
        url,
        rag_status,
        last_rag_sync,
        metadata
      `,
      )
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
            throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return (
      (data?.map((doc) => ({
        id: doc.id,
        name: doc.name,
        file_type: doc.type,
        status: doc.status,
        knowledge_base_id: doc.project_id,
        uploaded_by: doc.uploaded_by,
        chunk_count: doc.chunk_count,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        path: doc.path,
        url: doc.url,
        rag_status: doc.rag_status,
        last_rag_sync: doc.last_rag_sync,
        metadata: doc.metadata,
      })) as Document[]) || []
    );
  } catch (error) {
        throw error;
  }
}

/**
 * Sanitize filename for Supabase Storage compatibility
 */
function sanitizeFileName(fileName: string): string {
  return (
    fileName
      // Replace Thai characters and special characters with safe alternatives
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\w\s.-]/g, '') // Keep only word characters, spaces, dots, and hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .toLowerCase()
  ); // Convert to lowercase for consistency
}

/**
 * Delete a document from storage and database
 */
export async function deleteDocument(
  projectId: string,
  documentId: string,
  url?: string,
) {
  // URL parameter is for backwards compatibility but not currently used
  void url;

  try {
    const user = await getCurrentUser();
    const supabaseTable = createClientTable();
    const supabaseClient = createClient();

    // Get document info to extract the storage path
    const { data: document, error: fetchError } = await supabaseTable
      .from('documents')
      .select('path, name')
      .eq('id', documentId)
      .single();

    if (fetchError)
      throw new Error(`Failed to fetch document: ${fetchError.message}`);

    // Delete from storage if path exists
    if (document?.path) {
      const { error: storageError } = await supabaseClient.storage
        .from(projectId)
        .remove([document.path as string]);

      if (storageError) {
                // Don't throw - continue with database deletion
      }
    }

    // Soft delete from database
    const { error: dbError } = await supabaseTable
      .from('documents')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString(),
        deleted_by: user.id 
      })
      .eq('id', documentId)
      .eq('is_deleted', false);

    if (dbError)
      throw new Error(`Failed to delete document record: ${dbError.message}`);

    return { success: true };
  } catch (error) {
    throw error;
  }
}
