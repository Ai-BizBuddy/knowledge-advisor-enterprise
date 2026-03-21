import type {
  DocumentSection,
  DocumentSectionMetadata,
  DocumentWithSections,
} from '@/interfaces/DocumentSection';
import { createClientTable } from '@/utils/supabase/client';

type DocumentSectionMetadataFlexible = DocumentSectionMetadata &
  Partial<{
    documentId: string;
    fileName: string;
  }>;

class DocumentSectionService {
  constructor() {
    // Service initialization
  }

  private toMetadataFlexible(
    metadata: DocumentSectionMetadata | null,
  ): DocumentSectionMetadataFlexible | null {
    return metadata as DocumentSectionMetadataFlexible | null;
  }

  /**
   * Get all document sections for a specific document
   */
  async getDocumentSectionsByDocumentId(
    documentId: string,
  ): Promise<DocumentSection[]> {
    try {
      const supabase = createClientTable();

      const { data, error } = await supabase
        .from('document_section')
        .select('id, content, metadata, knowledge_id')
        .eq('metadata->>document_id', documentId)
        .order('metadata->>page', { ascending: true })
        .order('metadata->>chunk_index', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch document sections: ${error.message}`);
      }

      return (data || []) as DocumentSection[];
    } catch (error) {
      console.error('Error fetching document sections:', error);
      throw error;
    }
  }

  /**
   * Get a specific document section by ID
   */
  async getDocumentSectionById(sectionId: string): Promise<DocumentSection | null> {
    try {
      const supabase = createClientTable();

      const { data, error } = await supabase
        .from('document_section')
        .select('id, content, metadata, knowledge_id')
        .eq('id', sectionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch document section: ${error.message}`);
      }

      return data as DocumentSection;
    } catch (error) {
      console.error('Error fetching document section:', error);
      throw error;
    }
  }

  /**
   * Get all document sections for a knowledge base
   */
  async getDocumentSectionsByKnowledgeBase(
    knowledgeBaseId: string,
  ): Promise<DocumentSection[]> {
    try {
      const supabase = createClientTable();

      const { data, error } = await supabase
        .from('document_section')
        .select('id, content, metadata, knowledge_id')
        .eq('knowledge_id', knowledgeBaseId)
        .order('metadata->>document_id', { ascending: true })
        .order('metadata->>page', { ascending: true })
        .order('metadata->>chunk_index', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch document sections: ${error.message}`);
      }

      return (data || []) as DocumentSection[];
    } catch (error) {
      console.error('Error fetching document sections:', error);
      throw error;
    }
  }

  /**
   * Get documents with their sections for the OCR viewer sidebar
   * Groups sections by document.
   * If `documentId` is provided, only sections for that document are returned.
   * When `documentId` is provided and no sections exist, falls back to creating a
   * document entry from the `documents` table so the viewer still shows the document.
   */
  async getDocumentsWithSections(
    knowledgeBaseId?: string,
    documentId?: string,
  ): Promise<DocumentWithSections[]> {
    try {
      const supabase = createClientTable();

      // First, get the sections
      let query = supabase
        .from('document_section')
        .select('id, content, metadata, knowledge_id');

      if (knowledgeBaseId) {
        query = query.eq('knowledge_id', knowledgeBaseId);
      }

      if (documentId) {
        query = query.eq('metadata->>document_id', documentId);
      }

      const { data: sections, error } = await query
        .order('metadata->>document_id', { ascending: true })
        .order('metadata->>page', { ascending: true })
        .order('metadata->>chunk_index', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch document sections: ${error.message}`);
      }

      // Group sections by document_id
      const documentMap = new Map<string, DocumentWithSections>();

      const sectionList = (sections || []) as DocumentSection[];
      
      // Safety check: Log if we found sections but they might be filtered out
      if (sectionList.length > 0) {
        // Check the first section to see keys structure for debugging
        const sampleMeta = this.toMetadataFlexible(sectionList[0].metadata);
        if (sampleMeta && !sampleMeta.document_id && !sampleMeta.documentId) {
          console.warn(
            'DocumentSectionService: First section metadata is missing document_id or documentId',
            sampleMeta,
          );
        }
      }

      for (const section of sectionList) {
        const metadata = this.toMetadataFlexible(section.metadata);
        if (!metadata) continue;

        // Support both snake_case (standard) and camelCase (legacy/alternative) keys
        const docId = metadata.document_id || metadata.documentId;
        
        if (!docId) {
           // Skip sections without valid grouping ID
           continue; 
        }

        const fileName = metadata.file_name || metadata.fileName || 'Untitled';
        const page = metadata.page || 1;

        if (!documentMap.has(docId)) {
          documentMap.set(docId, {
            id: docId,
            name: fileName,
            file_type: this.getFileTypeFromName(fileName),
            status: 'ready',
            sections: [],
            pageCount: 0,
          });
        }

        const doc = documentMap.get(docId)!;
        doc.sections.push(section);

        // Track max page number
        if (page > doc.pageCount) {
          doc.pageCount = page;
        }
      }

      // Fallback: when a specific documentId was requested but no sections were found,
      // fetch the document record directly so the viewer still shows the document.
      if (documentId && !documentMap.has(documentId)) {
        try {
          const { data: docRow } = await supabase
            .from('document')
            .select('id, name, file_type, status')
            .eq('id', documentId)
            .single();
          if (docRow) {
            const row = docRow as { id: string; name: string; file_type: string; status: string };
            documentMap.set(documentId, {
              id: row.id,
              name: row.name,
              file_type: this.getFileTypeFromName(row.name),
              status: row.status || 'ready',
              sections: [],
              pageCount: 0,
            });
          }
        } catch {
          // Fallback failed silently — caller will see empty list
        }
      }

      return Array.from(documentMap.values());
    } catch (error) {
      console.error('Error fetching documents with sections:', error);
      throw error;
    }
  }

  /**
   * Search document sections by content
   */
  async searchDocumentSections(
    query: string,
    knowledgeBaseId?: string,
    limit: number = 50,
  ): Promise<DocumentSection[]> {
    try {
      const supabase = createClientTable();

      let searchQuery = supabase
        .from('document_section')
        .select('id, content, metadata, knowledge_id')
        .ilike('content', `%${query}%`)
        .limit(limit);

      if (knowledgeBaseId) {
        searchQuery = searchQuery.eq('knowledge_id', knowledgeBaseId);
      }

      const { data, error } = await searchQuery;

      if (error) {
        throw new Error(`Failed to search document sections: ${error.message}`);
      }

      return (data || []) as DocumentSection[];
    } catch (error) {
      console.error('Error searching document sections:', error);
      throw error;
    }
  }

  /**
   * Get sections grouped by page for a specific document
   */
  async getSectionsByPage(documentId: string): Promise<Map<number, DocumentSection[]>> {
    try {
      const sections = await this.getDocumentSectionsByDocumentId(documentId);
      const pageMap = new Map<number, DocumentSection[]>();

      for (const section of sections) {
        const metadata = section.metadata as DocumentSectionMetadata | null;
        const page = metadata?.page || 1;

        if (!pageMap.has(page)) {
          pageMap.set(page, []);
        }
        pageMap.get(page)!.push(section);
      }

      return pageMap;
    } catch (error) {
      console.error('Error getting sections by page:', error);
      throw error;
    }
  }

  /**
   * Helper to extract file type from filename
   */
  private getFileTypeFromName(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const typeMap: Record<string, string> = {
      pdf: 'pdf',
      doc: 'word',
      docx: 'word',
      txt: 'text',
      md: 'markdown',
      csv: 'csv',
      xlsx: 'excel',
      xls: 'excel',
      ppt: 'powerpoint',
      pptx: 'powerpoint',
      png: 'image',
      jpg: 'image',
      jpeg: 'image',
    };
    return typeMap[ext] || 'document';
  }

  /**
   * Update the content of a document section
   */
  async updateDocumentSectionContent(sectionId: string, content: string): Promise<void> {
    try {
      const supabase = createClientTable();

      const { data, error } = await supabase
        .from('document_section')
        .update({ content })
        .eq('id', sectionId)
        .select('id');

      if (error) {
        throw new Error(`Failed to update document section content: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error(
          'No rows updated — the section may not exist or database RLS policies are blocking the write. ' +
          'Ensure UPDATE policies are configured for the document_section table.',
        );
      }
    } catch (error) {
      console.error('Error updating document section content:', error);
      throw error;
    }
  }

  /**
   * Update the full metadata object of a document section (e.g. to persist bbox changes)
   */
  async updateSectionMetadata(sectionId: string, metadata: DocumentSectionMetadata): Promise<void> {
    try {
      const supabase = createClientTable();

      const { data, error } = await supabase
        .from('document_section')
        .update({ metadata })
        .eq('id', sectionId)
        .select('id');

      if (error) {
        throw new Error(`Failed to update document section metadata: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error(
          'No rows updated — the section may not exist or database RLS policies are blocking the write. ' +
          'Ensure UPDATE policies are configured for the document_section table.',
        );
      }
    } catch (error) {
      console.error('Error updating document section metadata:', error);
      throw error;
    }
  }
}

// Export singleton instance
const documentSectionService = new DocumentSectionService();
export default documentSectionService;
