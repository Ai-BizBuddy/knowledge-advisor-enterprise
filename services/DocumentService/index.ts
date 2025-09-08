/**
 * Document Service - Supabase Implementation
 *
 * This service handles all CRUD operations for documents using Supabase
 * with fetch API instead of Axios. Follows the project's strict TypeScript standards.
 */

import type {
  CreateDocumentInput,
  CreateDocumentsFromFilesInput,
  CreateMultipleDocumentsInput,
  Document,
  PaginationOptions,
  UpdateDocumentInput,
} from '@/interfaces/Project';
import { getAuthSession } from '@/utils/supabase/authUtils';
import { createClientTable } from '@/utils/supabase/client';

class DocumentService {
  private readonly serviceName = 'Document';

  constructor() {
    // Service initialization
  }

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
   * Get documents for a specific knowledge base with pagination
   */
  async getDocumentsByKnowledgeBase(
    knowledgeBaseId: string,
    paginationOptions: PaginationOptions,
    filters?: { status?: string; searchTerm?: string; type?: string },
  ): Promise<{ data: Document[]; count: number }> {
    console.log(
      `[${this.serviceName}] Fetching documents for KB:`,
      knowledgeBaseId,
      'with pagination:',
      paginationOptions,
    );

    try {
      const supabaseTable = createClientTable();

      // First verify the knowledge base belongs to the user
      const { data: kbData } = await supabaseTable
        .from('knowledge_base')
        .select('id')
        .eq('id', knowledgeBaseId)
        .single();

      if (!kbData) {
        throw new Error('Knowledge base not found or access denied');
      }

      // Build base query
      let countQuery = supabaseTable
        .from('document')
        .select('*', { count: 'exact', head: true })
        .eq('knowledge_base_id', knowledgeBaseId);

      let dataQuery = supabaseTable
        .from('document')
        .select('*')
        .eq('knowledge_base_id', knowledgeBaseId);

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        countQuery = countQuery.eq('status', filters.status);
        dataQuery = dataQuery.eq('status', filters.status);
      }

      if (filters?.type && filters.type !== 'all') {
        countQuery = countQuery.eq('file_type', filters.type);
        dataQuery = dataQuery.eq('file_type', filters.type);
      }

      if (filters?.searchTerm && filters.searchTerm.trim()) {
        const searchTerm = filters.searchTerm.trim();
        countQuery = countQuery.ilike('name', `%${searchTerm}%`);
        dataQuery = dataQuery.ilike('name', `%${searchTerm}%`);
      }

      // Get total count first
      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error(`[${this.serviceName}] Error getting count:`, countError);
      }

      // Get paginated data
      const { data: documents, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(paginationOptions.startIndex, paginationOptions.endIndex);

      if (error) {
        console.error(`[${this.serviceName}] Supabase query error:`, error);
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      console.log(
        `[${this.serviceName}] Found ${documents?.length || 0} documents (Total: ${count})`,
      );

      return { data: documents || [], count: count || 0 };
    } catch (error) {
      console.error(`[${this.serviceName}] Error fetching documents:`, error);
      throw error;
    }
  }

  /**
   * Search documents within a knowledge base
   */
  async searchDocuments(
    knowledgeBaseId: string,
    query: string,
    paginationOptions: PaginationOptions,
  ): Promise<{ data: Document[]; count: number }> {
    console.log(
      `[${this.serviceName}] Searching documents in KB:`,
      knowledgeBaseId,
      'with query:',
      query,
    );

    try {
      const supabaseTable = createClientTable();

      // Verify access to knowledge base
      const { data: kbData } = await supabaseTable
        .from('knowledge_base')
        .select('id')
        .eq('id', knowledgeBaseId)
        .single();

      if (!kbData) {
        throw new Error('Knowledge base not found or access denied');
      }

      // Get total count for search results
      const { count, error: countError } = await supabaseTable
        .from('document')
        .select('*', { count: 'exact', head: true })
        .eq('knowledge_base_id', knowledgeBaseId)
        .ilike('name', `%${query}%`);

      if (countError) {
        console.error(
          `[${this.serviceName}] Error getting search count:`,
          countError,
        );
      }

      // Get paginated search results
      const { data: documents, error } = await supabaseTable
        .from('document')
        .select('*')
        .eq('knowledge_base_id', knowledgeBaseId)
        .ilike('name', `%${query}%`)
        .order('uploaded_by', { ascending: false })
        .range(paginationOptions.startIndex, paginationOptions.endIndex);

      if (error) {
        console.error(`[${this.serviceName}] Supabase query error:`, error);
        throw new Error(`Failed to search documents: ${error.message}`);
      }

      console.log(
        `[${this.serviceName}] Found ${documents?.length || 0} documents for query: ${query} (Total: ${count})`,
      );

            return { data: documents || [], count: count || 0 };

        } catch (error) {
            console.error(`[${this.serviceName}] Error searching documents:`, error);
            throw error;
        }
    }

    async getDocumentById(id: string[]): Promise<Document[] | null> {
        try {
            const user = await this.getCurrentUser();
            const supabaseTable = createClientTable();

            const { data: document, error } = await supabaseTable
                .from('document')
                .select('*')
                .in('id', id)



            if (error) {
                if (error.code === 'PGRST116') {
                    console.log(`[${this.serviceName}] Document not found:`, id);
                    return null;
                }
                console.error(`[${this.serviceName}] Error fetching document:`, error);
                throw new Error(`Failed to fetch document: ${error.message}`);
            }

            return document;

        } catch (error) {
            console.error(`[${this.serviceName}] Error fetching document:`, error);
            throw error;
        }
    }

  /**
   * Get a specific document by ID
   */
  async getDocument(
    id: string,
    knowledgeBaseId?: string,
  ): Promise<Document | null> {
    console.log(`[${this.serviceName}] Fetching document:`, id);

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      let query = supabaseTable
        .from('document')
        .select(
          `
                    *,
                    knowledge_base!inner(created_by)
                `,
        )
        .eq('id', id)
        .eq('knowledge_base.created_by', user.id);

      if (knowledgeBaseId) {
        query = query.eq('knowledge_base_id', knowledgeBaseId);
      }

      const { data: document, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`[${this.serviceName}] Document not found:`, id);
          return null;
        }
        console.error(`[${this.serviceName}] Error fetching document:`, error);
        throw new Error(`Failed to fetch document: ${error.message}`);
      }

      return document;
    } catch (error) {
      console.error(`[${this.serviceName}] Error fetching document:`, error);
      throw error;
    }
  }

  /**
   * Create a new document
   */
  async createDocument(input: CreateDocumentInput): Promise<Document> {
    console.log(`[${this.serviceName}] Creating document:`, input.name);

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Verify the knowledge base belongs to the user
      const { data: kbData } = await supabaseTable
        .from('knowledge_base')
        .select('id')
        .eq('id', input.knowledge_base_id)
        .single();

      if (!kbData) {
        throw new Error('Knowledge base not found or access denied');
      }

      const documentData = {
        ...input,
        status: input.status || 'uploaded',
        uploaded_by: user.id,
        chunk_count: 0,
        rag_status: 'not_synced' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: document, error } = await supabaseTable
        .from('document')
        .insert([documentData])
        .select()
        .single();

      if (error) {
        console.error(`[${this.serviceName}] Error creating document:`, error);
        throw new Error(`Failed to create document: ${error.message}`);
      }

      console.log(
        `[${this.serviceName}] Document created successfully:`,
        document.id,
      );

      return document as Document;
    } catch (error) {
      console.error(`[${this.serviceName}] Error creating document:`, error);
      throw error;
    }
  }

  /**
   * Create multiple documents in batch
   */
  async createMultipleDocuments(
    input: CreateMultipleDocumentsInput,
  ): Promise<Document[]> {
    console.log(
      `[${this.serviceName}] Creating ${input.documents.length} documents for KB:`,
      input.knowledge_base_id,
    );

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Verify the knowledge base belongs to the user
      const { data: kbData } = await supabaseTable
        .from('knowledge_base')
        .select('id')
        .eq('id', input.knowledge_base_id)
        .single();

      if (!kbData) {
        throw new Error('Knowledge base not found or access denied');
      }

      // Validate input documents
      if (!input.documents || input.documents.length === 0) {
        throw new Error('No documents provided for creation');
      }

      // Prepare documents data with enhanced validation
      const documentsData = input.documents.map((doc, index) => {
        if (!doc.name || !doc.type || !doc.url) {
          throw new Error(
            `Document at index ${index} is missing required fields (name, type, url)`,
          );
        }

        return {
          ...doc,
          knowledge_base_id: input.knowledge_base_id,
          status: doc.status || 'uploaded',
          uploaded_by: user.id,
          chunk_count: 0,
          rag_status: 'not_synced' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      // Insert all documents in batch
      const { data: documents, error } = await supabaseTable
        .from('document')
        .insert(documentsData)
        .select();

      if (error) {
        console.error(
          `[${this.serviceName}] Error creating multiple documents:`,
          error,
        );
        throw new Error(`Failed to create documents: ${error.message}`);
      }

      console.log(
        `[${this.serviceName}] ${documents.length} documents created successfully`,
      );

      return documents as Document[];
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error creating multiple documents:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create multiple documents from File objects
   * This method handles file processing and uploads before creating document records
   */
  async createDocumentsFromFiles(
    input: CreateDocumentsFromFilesInput,
  ): Promise<Document[]> {
    console.log(
      `[${this.serviceName}] Creating documents from ${input.files.length} files for KB:`,
      input.knowledge_base_id,
    );

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();
      const supabaseClient = await import('@/utils/supabase/client').then((m) =>
        m.createClient(),
      );

      // Verify the knowledge base belongs to the user
      const { data: kbData } = await supabaseTable
        .from('knowledge_base')
        .select('id')
        .eq('id', input.knowledge_base_id)
        .single();

      if (!kbData) {
        throw new Error('Knowledge base not found or access denied');
      }

      // Validate input files
      if (!input.files || input.files.length === 0) {
        throw new Error('No files provided for upload');
      }

      // Upload each file to Supabase Storage and create document records
      const uploadPromises = input.files.map(async (file, index) => {
        if (!file.name || !file.type) {
          throw new Error(
            `File at index ${index} is missing required properties`,
          );
        }

        try {
          // Generate document ID first to use in storage path
          const documentId = crypto.randomUUID();
          
          // Extract file extension from original filename
          const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
          
          // Create file path using document ID instead of filename
          const filePath = `documents/${documentId}`;

          // Check if storage bucket exists for this knowledge base, create if not
          const { data: buckets } = await supabaseClient.storage.listBuckets();
          const bucketExists = buckets?.some(
            (b) => b.name === input.knowledge_base_id,
          );

          if (!bucketExists) {
            const { error: createError } =
              await supabaseClient.storage.createBucket(
                input.knowledge_base_id,
                {
                  public: false,
                  fileSizeLimit: 10485760, // 10MB
                },
              );
            if (
              createError &&
              !createError.message.includes('already exists')
            ) {
              throw new Error(
                `Failed to create storage bucket: ${createError.message}`,
              );
            }
          }

          // Upload file to Supabase Storage using document ID in path
          const { error: uploadError } = await supabaseClient.storage
            .from(input.knowledge_base_id)
            .upload(filePath, file, {
              upsert: true,
              cacheControl: '3600',
            });

          if (uploadError) {
            throw new Error(`Failed to upload file: ${uploadError.message}`);
          }

          // Get signed URL for the uploaded file
          const { data: urlData } = await supabaseClient.storage
            .from(input.knowledge_base_id)
            .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

          // Create document record in database using the 'document' table schema
          const documentData = {
            id: documentId, // Use the generated document ID
            name: file.name, 
            file_type: fileExtension, // Database uses 'file_type'
            knowledge_base_id: input.knowledge_base_id,
            status: 'uploaded',
            uploaded_by: user.id, // Required field for database constraint
            file_size: file.size,
            mime_type: file.type,
            url: urlData?.signedUrl || '',
            chunk_count: 0,
            metadata: {
              originalFileName: file.name, // Keep original filename in metadata
              uploadedAt: new Date().toISOString(),
              uploadSource: 'upload_modal',
              filePath: filePath, // Store path in metadata instead
              ...input.metadata,
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Insert document record
          const { data: document, error: insertError } = await supabaseTable
            .from('document')
            .insert([documentData])
            .select()
            .single();

          if (insertError) {
            throw new Error(
              `Failed to create document record: ${insertError.message}`,
            );
          }

          console.log(
            `[${this.serviceName}] Document ${documentId} (${file.name}) uploaded successfully`,
          );

          return document as Document;
        } catch (error) {
          console.error(
            `[${this.serviceName}] Error uploading file ${file.name}:`,
            error,
          );
          throw new Error(
            `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      });

      // Wait for all uploads to complete
      const documents = await Promise.all(uploadPromises);

      console.log(
        `[${this.serviceName}] ${documents.length} documents created from files successfully`,
      );

      return documents;
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error creating documents from files:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(
    id: string,
    input: UpdateDocumentInput,
  ): Promise<Document> {
    console.log(`[${this.serviceName}] Updating document:`, id);

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      const updateData = {
        ...input,
        updated_at: new Date().toISOString(),
      };

      const { data: document, error } = await supabaseTable
        .from('document')
        .update(updateData)
        .eq('id', id)
        .eq('knowledge_base.created_by', user.id)
        .select(
          `
                    *,
                    knowledge_base!inner(created_by)
                `,
        )
        .single();

      if (error) {
        console.error(`[${this.serviceName}] Error updating document:`, error);
        throw new Error(`Failed to update document: ${error.message}`);
      }

      console.log(`[${this.serviceName}] Document updated successfully:`, id);

      return document as Document;
    } catch (error) {
      console.error(`[${this.serviceName}] Error updating document:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<void> {
    console.log(`[${this.serviceName}] Deleting document:`, id);

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Delete with proper authorization check through knowledge_base relation
      const { error } = await supabaseTable
        .from('document')
        .delete()
        .eq('id', id)
        .eq('knowledge_base.uploaded_by', user.id);

      if (error) {
        console.error(`[${this.serviceName}] Error deleting document:`, error);
        throw new Error(`Failed to delete document: ${error.message}`);
      }

      console.log(`[${this.serviceName}] Document deleted successfully:`, id);
    } catch (error) {
      console.error(`[${this.serviceName}] Error deleting document:`, error);
      throw error;
    }
  }

  /**
   * Get all documents for the current user across all their knowledge bases
   */
  async getAllUserDocuments(
    paginationOptions: PaginationOptions,
    filters?: { status?: string; searchTerm?: string; type?: string },
  ): Promise<{ data: Document[]; count: number }> {
    console.log(
      `[${this.serviceName}] Fetching all user documents with pagination:`,
      paginationOptions,
      'and filters:',
      filters,
    );

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Build base query for documents from knowledge bases owned by user
      let countQuery = supabaseTable
        .from('document')
        .select('*, knowledge_base!inner(created_by)', {
          count: 'exact',
          head: true,
        })
        .eq('knowledge_base.created_by', user.id);

      let dataQuery = supabaseTable
        .from('document')
        .select(
          `
          *,
          knowledge_base!inner(id, name, created_by)
        `,
        )
        .eq('knowledge_base.created_by', user.id);

      // Apply status filters
      if (filters?.status && filters.status !== 'all') {
        const statusFilter = filters.status;

        if (statusFilter === 'uploaded') {
          countQuery = countQuery.or(
            'status.eq.uploaded,rag_status.eq.not_synced',
          );
          dataQuery = dataQuery.or(
            'status.eq.uploaded,rag_status.eq.not_synced',
          );
        } else if (statusFilter === 'processing') {
          countQuery = countQuery.or(
            'status.eq.processing,rag_status.eq.syncing',
          );
          dataQuery = dataQuery.or(
            'status.eq.processing,rag_status.eq.syncing',
          );
        } else if (statusFilter === 'synced') {
          countQuery = countQuery.eq('rag_status', 'synced');
          dataQuery = dataQuery.eq('rag_status', 'synced');
        } else if (statusFilter === 'error') {
          countQuery = countQuery.or('status.eq.error,rag_status.eq.error');
          dataQuery = dataQuery.or('status.eq.error,rag_status.eq.error');
        } else {
          countQuery = countQuery.eq('status', statusFilter);
          dataQuery = dataQuery.eq('status', statusFilter);
        }
      }

      // Apply type filter
      if (filters?.type && filters.type !== 'all') {
        countQuery = countQuery.eq('file_type', filters.type);
        dataQuery = dataQuery.eq('file_type', filters.type);
      }

      // Apply search filter
      if (filters?.searchTerm && filters.searchTerm.trim()) {
        const searchTerm = filters.searchTerm.trim();
        countQuery = countQuery.ilike('name', `%${searchTerm}%`);
        dataQuery = dataQuery.ilike('name', `%${searchTerm}%`);
      }

      // Get total count first
      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error(`[${this.serviceName}] Error getting count:`, countError);
      }

      // Get paginated data
      const { data: documents, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(paginationOptions.startIndex, paginationOptions.endIndex);

      if (error) {
        console.error(`[${this.serviceName}] Supabase query error:`, error);
        throw new Error(`Failed to fetch user documents: ${error.message}`);
      }

      console.log(
        `[${this.serviceName}] Found ${documents?.length || 0} user documents (Total: ${count})`,
      );

      return { data: documents || [], count: count || 0 };
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error fetching user documents:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Search all user documents across all their knowledge bases
   */
  async searchAllUserDocuments(
    query: string,
    paginationOptions: PaginationOptions,
  ): Promise<{ data: Document[]; count: number }> {
    console.log(
      `[${this.serviceName}] Searching all user documents with query:`,
      query,
      'and pagination:',
      paginationOptions,
    );

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Search query
      const searchTerm = query.trim();

      // Get total count for search results
      const { count, error: countError } = await supabaseTable
        .from('document')
        .select('*, knowledge_base!inner(created_by)', {
          count: 'exact',
          head: true,
        })
        .eq('knowledge_base.created_by', user.id)
        .ilike('name', `%${searchTerm}%`);

      if (countError) {
        console.error(
          `[${this.serviceName}] Error getting search count:`,
          countError,
        );
      }

      // Get paginated search results
      const { data: documents, error } = await supabaseTable
        .from('document')
        .select(
          `
          *,
          knowledge_base!inner(id, name, created_by)
        `,
        )
        .eq('knowledge_base.created_by', user.id)
        .ilike('name', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .range(paginationOptions.startIndex, paginationOptions.endIndex);

      if (error) {
        console.error(`[${this.serviceName}] Supabase query error:`, error);
        throw new Error(`Failed to search user documents: ${error.message}`);
      }

      console.log(
        `[${this.serviceName}] Found ${documents?.length || 0} documents for query: ${query} (Total: ${count})`,
      );

      return { data: documents || [], count: count || 0 };
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error searching user documents:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get a user document by ID (ensures user owns the document through knowledge base)
   */
  async getUserDocument(id: string): Promise<Document | null> {
    console.log(`[${this.serviceName}] Fetching user document:`, id);

    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      const { data: document, error } = await supabaseTable
        .from('document')
        .select(
          `
          *,
          knowledge_base!inner(id, name, created_by)
        `,
        )
        .eq('id', id)
        .eq('knowledge_base.created_by', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`[${this.serviceName}] User document not found:`, id);
          return null;
        }
        console.error(
          `[${this.serviceName}] Error fetching user document:`,
          error,
        );
        throw new Error(`Failed to fetch user document: ${error.message}`);
      }

      return document;
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error fetching user document:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Legacy methods for backward compatibility
   */
  async getAllDocuments() {
    console.warn(
      `[${this.serviceName}] getAllDocuments is deprecated. Use getDocumentsByKnowledgeBase instead.`,
    );
    const { data, error } = await createClientTable()
      .from('document')
      .select('*');
    if (error) {
      console.error(
        `[${this.serviceName}] Error fetching all documents:`,
        error,
      );
      throw error;
    }
    return data;
  }

  async getAllDocumentId(id: string) {
    console.warn(
      `[${this.serviceName}] getAllDocumentId is deprecated. Use getDocumentsByKnowledgeBase instead.`,
    );
    const { data, error } = await createClientTable()
      .from('document')
      .select('*')
      .eq('knowledge_base_id', id);
    if (error) {
      console.error(
        `[${this.serviceName}] Error fetching all documents:`,
        error,
      );
      throw error;
    }
    return data;
  }

  async createDocumentByKBId(
    knowledgeBaseId: string,
    document: Partial<Document>,
  ) {
    console.warn(
      `[${this.serviceName}] createDocumentByKBId is deprecated. Use createDocument instead.`,
    );
    const { data, error } = await createClientTable()
      .from('document')
      .insert({
        ...document,
        knowledge_base_id: knowledgeBaseId,
      });
    if (error) {
      console.error(
        `[${this.serviceName}] Error creating document by KB ID:`,
        error,
      );
      throw error;
    }
    return data;
  }
}

export default DocumentService;
