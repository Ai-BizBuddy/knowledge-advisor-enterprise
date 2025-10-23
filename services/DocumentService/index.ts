import type {
  CreateDocumentInput,
  CreateDocumentsFromFilesInput,
  CreateMultipleDocumentsInput,
  Document,
  PaginationOptions,
  UpdateDocumentInput,
} from '@/interfaces/Project';
import { getAuthSession } from '@/utils/supabase/authUtils';
import { createClient, createClientTable } from '@/utils/supabase/client';

class DocumentService {
  constructor() {
    // Service initialization
  }

  private async getCurrentUser() {
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
   * Get documents for a specific knowledge base with pagination
   */
  async getDocumentsByKnowledgeBase(
    knowledgeBaseId: string,
    paginationOptions: PaginationOptions,
    filters?: { status?: string; searchTerm?: string; type?: string },
    sort?: { field: 'name' | 'updated_at' | 'created_at' | 'status' | 'file_type' | 'chunk_count'; order: 'asc' | 'desc' },
  ): Promise<{ data: Document[]; count: number }> {
    try {
      const supabaseTable = createClientTable();

      // Build base query
      let countQuery = supabaseTable
        .from('document_view')
        .select('*', { count: 'exact', head: true })
        .eq('knowledge_base_id', knowledgeBaseId);

      let dataQuery = supabaseTable
        .from('document_view')
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
      const { count } = await countQuery;

      // Apply sorting (default: updated_at desc then created_at desc as fallback)
      if (sort && sort.field) {
        dataQuery = dataQuery.order(sort.field, {
          ascending: sort.order === 'asc',
          nullsFirst: sort.order === 'asc',
        });
      } else {
        dataQuery = dataQuery.order('updated_at', { ascending: false, nullsFirst: false })
                             .order('created_at', { ascending: false });
      }

      // Get paginated data
      const { data: documents, error } = await dataQuery
        .range(paginationOptions.startIndex, paginationOptions.endIndex);

      if (error) {
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      return { data: documents || [], count: count || 0 };
    } catch (error) {
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
    try {
      const supabaseTable = createClientTable();

      // Get total count for search results
      const { count, error: countError } = await supabaseTable
        .from('document_view')
        .select('*', { count: 'exact', head: true })
        .eq('knowledge_base_id', knowledgeBaseId)
        .ilike('name', `%${query}%`);

      if (countError) {
      }

      // Get paginated search results
      const { data: documents, error } = await supabaseTable
        .from('document_view')
        .select('*')
        .eq('knowledge_base_id', knowledgeBaseId)
        .ilike('name', `%${query}%`)
        .order('uploaded_by', { ascending: false })
        .range(paginationOptions.startIndex, paginationOptions.endIndex);

      if (error) {
        throw new Error(`Failed to search documents: ${error.message}`);
      }

      return { data: documents || [], count: count || 0 };
    } catch (error) {
      throw error;
    }
  }

  async getDocumentById(id: string[]): Promise<Document[] | null> {
    try {
      const supabaseTable = createClientTable();

      const { data: document, error } = await supabaseTable
        .from('document_view')
        .select('*')
        .in('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch document: ${error.message}`);
      }

      return document;
    } catch (error) {
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
    try {
      const supabaseTable = createClientTable();

      let query = supabaseTable
        .from('document_view')
        .select('*,knowledge_base!inner(created_by)')
        .eq('id', id);

      if (knowledgeBaseId) {
        query = query.eq('knowledge_base_id', knowledgeBaseId);
      }

      const { data: document, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch document: ${error.message}`);
      }

      return document;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get latest document version by knowledge base ID and tag
   * Returns the highest version number found in documents with the specified tag
   * Returns 1 as default if tag is null or empty string
   */
  async getLatestVersionByTag(
    { knowledgeBaseId, id }: { knowledgeBaseId: string; id: string },
    tag: string,
  ): Promise<number> {
    try {
      if (!tag || tag.trim() === '') {
        return 1;
      }

      const supabaseTable = createClientTable();
      const { data, error } = await supabaseTable
        .from('document_view')
        .select('version')
        .eq('knowledge_base_id', knowledgeBaseId)
        .eq('tag', tag)
        .not('id', 'eq', id)
        .single();

      if (error) {
        return 0;
      }

      return data.version;
    } catch (error) {
      console.error('Error fetching latest version by tag:', error);
      return 0; // Return 0 on error as fallback
    }
  }

  /**
   * Create a new document
   */
  async createDocument(input: CreateDocumentInput): Promise<Document> {
    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

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
        throw new Error(`Failed to create document: ${error.message}`);
      }

      return document as Document;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create multiple documents in batch
   */
  async createMultipleDocuments(
    input: CreateMultipleDocumentsInput,
  ): Promise<Document[]> {
    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

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
        .from('document_view')
        .insert(documentsData)
        .select();

      if (error) {
        throw new Error(`Failed to create documents: ${error.message}`);
      }

      return documents as Document[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create multiple documents from File objects
   * This method handles file processing and uploads before creating document records
   */
  async createDocumentsFromFiles(
    input: CreateDocumentsFromFilesInput,
    onProgress?: (fileId: string, progress: number) => void,
  ): Promise<Document[]> {
    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();
      const supabaseClient = await import('@/utils/supabase/client').then((m) =>
        m.createClient(),
      );

      // Strict file validation - only allowed extensions
      const allowedExtensions = ['pdf', 'doc', 'docx', 'txt', 'md', 'xlsx', 'xls'];
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];

      // Validate input files
      if (!input.files || input.files.length === 0) {
        throw new Error('No files provided for upload');
      }

      // Validate each file before processing
      for (const file of input.files) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        
        if (!allowedExtensions.includes(fileExtension)) {
          throw new Error(
            `Invalid file type: ${file.name}. Only PDF, DOC, DOCX, TXT, MD, XLSX, XLS are allowed.`
          );
        }

        // Double check MIME type if available
        if (file.type && !allowedMimeTypes.includes(file.type)) {
          // Allow if extension is valid even if MIME type is generic
          if (!allowedExtensions.includes(fileExtension)) {
            throw new Error(
              `Invalid file type: ${file.name}. Only PDF, DOC, DOCX, TXT, MD, XLSX, XLS are allowed.`
            );
          }
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(
            `File ${file.name} exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`
          );
        }
      }

      // Get Supabase credentials for XHR upload
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not configured');
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

          // Upload file with real progress tracking using XMLHttpRequest
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const uploadUrl = `${supabaseUrl}/storage/v1/object/${input.knowledge_base_id}/${filePath}`;

            xhr.open('PUT', uploadUrl, true);

            // Required auth header
            xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
            // Tell Supabase we want to upsert
            xhr.setRequestHeader('x-upsert', 'true');
            // Content type
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            // Cache control
            xhr.setRequestHeader('Cache-Control', '3600');

            // Progress handler - real upload progress
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                if (onProgress) {
                  onProgress(documentId, percent);
                }
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                if (onProgress) {
                  onProgress(documentId, 100);
                }
                resolve();
              } else {
                reject(
                  new Error(
                    `Upload failed with status ${xhr.status}: ${xhr.responseText}`
                  )
                );
              }
            };

            xhr.onerror = () => {
              reject(new Error(`Upload error: ${xhr.statusText || 'Network error'}`));
            };

            xhr.ontimeout = () => {
              reject(new Error('Upload timeout'));
            };

            // Set timeout to 5 minutes
            xhr.timeout = 5 * 60 * 1000;

            // Send the raw file as the body
            xhr.send(file);
          });

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

          return document as Document;
        } catch (error) {
          throw new Error(
            `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      });

      // Wait for all uploads to complete
      const documents = await Promise.all(uploadPromises);

      return documents;
    } catch (error) {
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
        .select(
          '*,knowledge_base!inner(created_by)',
        )
        .single();

      if (error) {
        throw new Error(`Failed to update document: ${error.message}`);
      }

      return document as Document;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      const supabaseTable = createClientTable();

      // Delete with proper authorization check through knowledge_base relation
      const { error } = await supabaseTable
        .from('document')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete document: ${error.message}`);
      }
    } catch (error) {
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
    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Build base query for documents from knowledge bases owned by user
      let countQuery = supabaseTable
        .from('document_view')
        .select('*, knowledge_base!inner(created_by)', {
          count: 'exact',
          head: true,
        });

      let dataQuery = supabaseTable
        .from('document_view')
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
      }

      // Get paginated data
      const { data: documents, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(paginationOptions.startIndex, paginationOptions.endIndex);

      if (error) {
        throw new Error(`Failed to fetch user documents: ${error.message}`);
      }

      return { data: documents || [], count: count || 0 };
    } catch (error) {
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
    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Search query
      const searchTerm = query.trim();

      // Get total count for search results
      const { count, error: countError } = await supabaseTable
        .from('document_view')
        .select('*, knowledge_base!inner(created_by)', {
          count: 'exact',
          head: true,
        })
        .ilike('name', `%${searchTerm}%`);

      if (countError) {
      }

      // Get paginated search results
      const { data: documents, error } = await supabaseTable
        .from('document_view')
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
        throw new Error(`Failed to search user documents: ${error.message}`);
      }

      return { data: documents || [], count: count || 0 };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a user document by ID (ensures user owns the document through knowledge base)
   */
  async getUserDocument(id: string): Promise<Document | null> {
    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      const { data: document, error } = await supabaseTable
        .from('document_view')
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
          return null;
        }
        throw new Error(`Failed to fetch user document: ${error.message}`);
      }

      return document;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Legacy methods for backward compatibility
   */
  async getAllDocuments() {
    const { data, error } = await createClientTable()
      .from('document_view')
      .select('*');
    if (error) {
      throw error;
    }
    return data;
  }

  async getAllDocumentId(id: string) {
    const { data, error } = await createClientTable()
      .from('document_view')
      .select('*')
      .eq('knowledge_base_id', id);
    if (error) {
      throw error;
    }
    return data;
  }

  async createDocumentByKBId(
    knowledgeBaseId: string,
    document: Partial<Document>,
  ) {
    const { data, error } = await createClientTable()
      .from('document')
      .insert({
        ...document,
        knowledge_base_id: knowledgeBaseId,
      });
    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Subscribe to realtime document changes for a knowledge base
   * @param knowledgeBaseId - The knowledge base ID to subscribe to
   * @param callbacks - Callback functions for different events
   * @returns Cleanup function to unsubscribe
   */
  async subscribeToDocumentChanges(
    knowledgeBaseId: string,
    callbacks: {
      onInsert?: () => void;
      onUpdate?: (updatedDoc: Document) => void;
      onSoftDelete?: (deletedId: string) => void;
      onDelete?: (deletedId: string) => void;
      onStatusChange?: (status: string, error?: unknown) => void;
    }
  ): Promise<() => void> {
    const supabase = createClient();
    
    // Verify authentication before subscribing
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('[DocumentService] No active session for realtime subscription');
      throw new Error('Authentication required for realtime subscription');
    }
    
    // Set auth token for realtime connection
    await supabase.realtime.setAuth(session.access_token);
    console.log('[DocumentService] Realtime auth token set');
    
    const channelName = `document:kb:${knowledgeBaseId}`;
    console.log('[DocumentService] Subscribing to channel:', channelName);

    const channel = supabase
      .channel(channelName)
      // INSERT: Notify to reload data
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'knowledge',
          table: 'document',
          filter: `knowledge_base_id=eq.${knowledgeBaseId}`,
        },
        (payload) => {
          console.log('[DocumentService] INSERT payload received:', payload);
          const newDoc = (payload.new ?? null) as Partial<Document> | null;
          const isSoftDeleted = newDoc?.is_deleted === true || !!newDoc?.deleted_at;
          
          if (!isSoftDeleted && callbacks.onInsert) {
            callbacks.onInsert();
          }
        },
      )
      // UPDATE: Update document in state or handle soft delete
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'knowledge',
          table: 'document',
          filter: `knowledge_base_id=eq.${knowledgeBaseId}`,
        },
        (payload) => {
          console.log('[DocumentService] UPDATE payload received:', payload);
          const docNew = (payload.new ?? null) as Partial<Document> | null;
          const docId = docNew?.id;
          const isSoftDeleted = docNew?.is_deleted === true || !!docNew?.deleted_at;
          
          if (isSoftDeleted && docId && callbacks.onSoftDelete) {
            console.log('[DocumentService] Soft DELETE detected:', docId);
            callbacks.onSoftDelete(docId);
          } else if (docNew && docId && callbacks.onUpdate) {
            console.log('[DocumentService] UPDATE detected:', docId);
            callbacks.onUpdate(docNew as Document);
          }
        },
      )
      // DELETE: Handle hard delete
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'knowledge',
          table: 'document',
          filter: `knowledge_base_id=eq.${knowledgeBaseId}`,
        },
        (payload) => {
          console.log('[DocumentService] DELETE payload received:', payload);
          const oldDoc = (payload.old ?? null) as Partial<Document> | null;
          const deletedId = oldDoc?.id;
          
          if (deletedId && callbacks.onDelete) {
            console.log('[DocumentService] HARD DELETE detected:', deletedId);
            callbacks.onDelete(deletedId);
          }
        },
      )
      .subscribe(async (status, error) => {
        console.log('[DocumentService] Subscription status:', status, 'channel:', channelName);
        
        if (status === 'SUBSCRIBED') {
          console.log('[DocumentService] ✅ Successfully subscribed to realtime changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[DocumentService] ❌ Channel error:', error);
        } else if (status === 'TIMED_OUT') {
          console.error('[DocumentService] ⏱️ Subscription timed out');
        } else if (status === 'CLOSED') {
          console.warn('[DocumentService] ⚠️ Channel closed');
        }
        
        if (callbacks.onStatusChange) {
          callbacks.onStatusChange(status, error);
        }
      });

    // Return cleanup function
    return () => {
      console.log('[DocumentService] Unsubscribing from channel:', channelName);
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }
}

export default DocumentService;
