
/**
 * Document Service - Supabase Implementation
 * 
 * This service handles all CRUD operations for documents using Supabase
 * with fetch API instead of Axios. Follows the project's strict TypeScript standards.
 */

import { createClientTable } from "@/utils/supabase/client";
import { getAuthSession } from "@/utils/supabase/authUtils";
import type {
    Document,
    CreateDocumentInput,
    CreateMultipleDocumentsInput,
    CreateDocumentsFromFilesInput,
    UpdateDocumentInput,
    PaginationOptions
} from "@/interfaces/Project";

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
        filters?: { status?: string; searchTerm?: string; type?: string }
    ): Promise<{ data: Document[], count: number }> {
        console.log(`[${this.serviceName}] Fetching documents for KB:`, knowledgeBaseId, 'with pagination:', paginationOptions);

        try {
            const user = await this.getCurrentUser();
            const supabaseTable = createClientTable();

            // First verify the knowledge base belongs to the user
            const { data: kbData } = await supabaseTable
                .from('knowledge_base')
                .select('id')
                .eq('id', knowledgeBaseId)
                .eq('created_by', user.id)
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
                countQuery = countQuery.eq('type', filters.type);
                dataQuery = dataQuery.eq('type', filters.type);
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

            console.log(`[${this.serviceName}] Found ${documents?.length || 0} documents (Total: ${count})`);

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
        paginationOptions: PaginationOptions
    ): Promise<{ data: Document[], count: number }> {
        console.log(`[${this.serviceName}] Searching documents in KB:`, knowledgeBaseId, 'with query:', query);

        try {
            const user = await this.getCurrentUser();
            const supabaseTable = createClientTable();

            // Verify access to knowledge base
            const { data: kbData } = await supabaseTable
                .from('knowledge_base')
                .select('id')
                .eq('id', knowledgeBaseId)
                .eq('uploaded_by', user.id)
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
                console.error(`[${this.serviceName}] Error getting search count:`, countError);
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

            console.log(`[${this.serviceName}] Found ${documents?.length || 0} documents for query: ${query} (Total: ${count})`);

            return { data: documents || [], count: count || 0 };

        } catch (error) {
            console.error(`[${this.serviceName}] Error searching documents:`, error);
            throw error;
        }
    }

    /**
     * Get a specific document by ID
     */
    async getDocument(id: string, knowledgeBaseId?: string): Promise<Document | null> {
        console.log(`[${this.serviceName}] Fetching document:`, id);

        try {
            const user = await this.getCurrentUser();
            const supabaseTable = createClientTable();

            let query = supabaseTable
                .from('document')
                .select(`
                    *,
                    knowledge_base!inner(created_by)
                `)
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
                .eq('uploaded_by', user.id)
                .single();

            if (!kbData) {
                throw new Error('Knowledge base not found or access denied');
            }

            const documentData = {
                ...input,
                status: input.status || 'uploaded',
                chunk_count: 0,
                rag_status: 'not_synced' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
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

            console.log(`[${this.serviceName}] Document created successfully:`, document.id);

            return document as Document;

        } catch (error) {
            console.error(`[${this.serviceName}] Error creating document:`, error);
            throw error;
        }
    }

    /**
     * Create multiple documents in batch
     */
    async createMultipleDocuments(input: CreateMultipleDocumentsInput): Promise<Document[]> {
        console.log(`[${this.serviceName}] Creating ${input.documents.length} documents for KB:`, input.knowledge_base_id);

        try {
            const user = await this.getCurrentUser();
            const supabaseTable = createClientTable();

            // Verify the knowledge base belongs to the user
            const { data: kbData } = await supabaseTable
                .from('knowledge_base')
                .select('id')
                .eq('id', input.knowledge_base_id)
                .eq('uploaded_by', user.id)
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
                if (!doc.name || !doc.type || !doc.path || !doc.url) {
                    throw new Error(`Document at index ${index} is missing required fields (name, type, path, url)`);
                }

                return {
                    ...doc,
                    knowledge_base_id: input.knowledge_base_id,
                    status: doc.status || 'uploaded',
                    chunk_count: 0,
                    rag_status: 'not_synced' as const,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
            });

            // Insert all documents in batch
            const { data: documents, error } = await supabaseTable
                .from('document')
                .insert(documentsData)
                .select();

            if (error) {
                console.error(`[${this.serviceName}] Error creating multiple documents:`, error);
                throw new Error(`Failed to create documents: ${error.message}`);
            }

            console.log(`[${this.serviceName}] ${documents.length} documents created successfully`);

            return documents as Document[];

        } catch (error) {
            console.error(`[${this.serviceName}] Error creating multiple documents:`, error);
            throw error;
        }
    }

    /**
     * Create multiple documents from File objects
     * This method handles file processing and uploads before creating document records
     */
    async createDocumentsFromFiles(input: CreateDocumentsFromFilesInput): Promise<Document[]> {
        console.log(`[${this.serviceName}] Creating documents from ${input.files.length} files for KB:`, input.knowledge_base_id);

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

            // Validate input files
            if (!input.files || input.files.length === 0) {
                throw new Error('No files provided for upload');
            }

            // Process each file and prepare document data
            const documentsData = input.files.map((file, index) => {
                if (!file.name || !file.type) {
                    throw new Error(`File at index ${index} is missing required properties`);
                }

                // Extract file extension from name
                const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

                // Generate file path and URL (these would typically be generated after actual file upload)
                const timestamp = Date.now();
                const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const filePath = `/uploads/${input.knowledge_base_id}/${timestamp}_${sanitizedFileName}`;
                const fileUrl = `${process.env.NEXT_PUBLIC_STORAGE_URL || '/storage'}${filePath}`;

                return {
                    name: file.name,
                    file_type: fileExtension,
                    knowledge_base_id: input.knowledge_base_id,
                    // status: 'uploading',
                    file_size: file.size,
                    mime_type: file.type,
                    file_path: filePath,
                    url: fileUrl,
                    chunk_count: 0,
                    // rag_status: 'not_synced' as const,
                    metadata: {
                        originalFileName: file.name,
                        uploadedAt: new Date().toISOString(),
                        ...input.metadata
                    },
                    uploaded_by: user.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
            });

            // Insert all documents in batch
            const { data: documents, error } = await supabaseTable
                .from('document')
                .insert(documentsData)
                .select();

            if (error) {
                console.error(`[${this.serviceName}] Error creating documents from files:`, error);
                throw new Error(`Failed to create documents from files: ${error.message}`);
            }

            console.log(`[${this.serviceName}] ${documents.length} documents created from files successfully`);

            return documents as Document[];

        } catch (error) {
            console.error(`[${this.serviceName}] Error creating documents from files:`, error);
            throw error;
        }
    }

    /**
     * Update an existing document
     */
    async updateDocument(id: string, input: UpdateDocumentInput): Promise<Document> {
        console.log(`[${this.serviceName}] Updating document:`, id);

        try {
            const user = await this.getCurrentUser();
            const supabaseTable = createClientTable();

            const updateData = {
                ...input,
                updated_at: new Date().toISOString()
            };

            const { data: document, error } = await supabaseTable
                .from('document')
                .update(updateData)
                .eq('id', id)
                .eq('knowledge_base.created_by', user.id)
                .select(`
                    *,
                    knowledge_base!inner(created_by)
                `)
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
     * Get all documents for the current user without requiring knowledgeBaseId
     */
    async getAllUserDocuments(
        paginationOptions: PaginationOptions,
        filters?: { status?: string; searchTerm?: string; type?: string }
    ): Promise<{ data: Document[], count: number }> {
        console.log(`[${this.serviceName}] Fetching all user documents with pagination:`, paginationOptions);

        try {
            const user = await this.getCurrentUser();
            const supabaseTable = createClientTable();

            // Build base query for count - join with knowledge_base to ensure user owns the data
            let countQuery = supabaseTable
                .from('document')
                .select(`
                    *,
                    knowledge_base!inner(
                        id,
                        created_by
                    )
                `, { count: 'exact', head: true })
                .eq('knowledge_base.created_by', user.id);

            // Build base query for data - join with knowledge_base to ensure user owns the data
            let dataQuery = supabaseTable
                .from('document')
                .select(`
                    *,
                    knowledge_base!inner(
                        id,
                        name,
                        created_by
                    )
                `)
                .eq('knowledge_base.created_by', user.id);

            // Apply filters
            if (filters?.status && filters.status !== 'all') {
                countQuery = countQuery.eq('status', filters.status);
                dataQuery = dataQuery.eq('status', filters.status);
            }

            if (filters?.type && filters.type !== 'all') {
                countQuery = countQuery.eq('type', filters.type);
                dataQuery = dataQuery.eq('type', filters.type);
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
                throw new Error(`Failed to fetch user documents: ${error.message}`);
            }

            console.log(`[${this.serviceName}] Found ${documents?.length || 0} user documents (Total: ${count})`);

            return { data: documents || [], count: count || 0 };

        } catch (error) {
            console.error(`[${this.serviceName}] Error fetching user documents:`, error);
            throw error;
        }
    }

    /**
     * Search all user documents without requiring knowledgeBaseId
     */
    async searchAllUserDocuments(
        query: string,
        paginationOptions: PaginationOptions
    ): Promise<{ data: Document[], count: number }> {
        console.log(`[${this.serviceName}] Searching all user documents with query:`, query);

        try {
            const user = await this.getCurrentUser();
            const supabaseTable = createClientTable();

            // Get total count for search results
            const { count, error: countError } = await supabaseTable
                .from('document')
                .select(`
                    *,
                    knowledge_base!inner(
                        id,
                        created_by
                    )
                `, { count: 'exact', head: true })
                .eq('knowledge_base.created_by', user.id)
                .or(`name.ilike.%${query}%,content.ilike.%${query}%`);

            if (countError) {
                console.error(`[${this.serviceName}] Error getting search count:`, countError);
            }

            // Get paginated search results
            const { data: documents, error } = await supabaseTable
                .from('document')
                .select(`
                    *,
                    knowledge_base!inner(
                        id,
                        name,
                        created_by
                    )
                `)
                .eq('knowledge_base.created_by', user.id)
                .or(`name.ilike.%${query}%,content.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .range(paginationOptions.startIndex, paginationOptions.endIndex);

            if (error) {
                console.error(`[${this.serviceName}] Supabase search error:`, error);
                throw new Error(`Failed to search user documents: ${error.message}`);
            }

            console.log(`[${this.serviceName}] Found ${documents?.length || 0} search results (Total: ${count})`);

            return { data: documents || [], count: count || 0 };

        } catch (error) {
            console.error(`[${this.serviceName}] Error searching user documents:`, error);
            throw error;
        }
    }

    /**
     * Get document by ID (user must own the document through knowledge base)
     */
    async getUserDocument(documentId: string): Promise<Document | null> {
        console.log(`[${this.serviceName}] Fetching user document:`, documentId);

        try {
            const user = await this.getCurrentUser();
            const supabaseTable = createClientTable();

            const { data: document, error } = await supabaseTable
                .from('document')
                .select(`
                    *,
                    knowledge_base!inner(
                        id,
                        name,
                        created_by
                    )
                `)
                .eq('id', documentId)
                .eq('knowledge_base.created_by', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned
                    return null;
                }
                console.error(`[${this.serviceName}] Error fetching user document:`, error);
                throw new Error(`Failed to fetch document: ${error.message}`);
            }

            console.log(`[${this.serviceName}] Successfully fetched user document:`, document?.name);
            return document;

        } catch (error) {
            console.error(`[${this.serviceName}] Error fetching user document:`, error);
            throw error;
        }
    }

    /**
     * Legacy methods for backward compatibility
     */
    async getAllDocuments() {
        console.warn(`[${this.serviceName}] getAllDocuments is deprecated. Use getDocumentsByKnowledgeBase or getAllUserDocuments instead.`);
        const { data, error } = await createClientTable().from('document').select('*');
        if (error) {
            console.error(`[${this.serviceName}] Error fetching all documents:`, error);
            throw error;
        }
        return data;
    }

    async getAllDocumentId(id: string) {
        console.warn(`[${this.serviceName}] getAllDocumentId is deprecated. Use getDocumentsByKnowledgeBase instead.`);
        const { data, error } = await createClientTable().from('document').select('*').eq('knowledge_base_id', id);
        if (error) {
            console.error(`[${this.serviceName}] Error fetching all documents:`, error);
            throw error;
        }
        return data;
    }

    async createDocumentByKBId(knowledgeBaseId: string, document: Partial<Document>) {
        console.warn(`[${this.serviceName}] createDocumentByKBId is deprecated. Use createDocument instead.`);
        const { data, error } = await createClientTable().from('document').insert({
            ...document,
            knowledge_base_id: knowledgeBaseId
        });
        if (error) {
            console.error(`[${this.serviceName}] Error creating document by KB ID:`, error);
            throw error;
        }
        return data;
    }

}

export default DocumentService;
