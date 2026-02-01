import type {
    DocumentSection,
    DocumentSectionMetadata,
    DocumentWithSections,
} from '@/interfaces/DocumentSection';
import { createClientTable } from '@/utils/supabase/client';

class DocumentSectionService {
  constructor() {
    // Service initialization
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
   * Groups sections by document
   */
  async getDocumentsWithSections(
    knowledgeBaseId?: string,
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

      const { data: sections, error } = await query
        .order('metadata->>document_id', { ascending: true })
        .order('metadata->>page', { ascending: true })
        .order('metadata->>chunk_index', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch document sections: ${error.message}`);
      }

      // Group sections by document_id
      const documentMap = new Map<string, DocumentWithSections>();

      for (const section of (sections || []) as DocumentSection[]) {
        const metadata = section.metadata as DocumentSectionMetadata | null;
        if (!metadata?.document_id) continue;

        const docId = metadata.document_id;

        if (!documentMap.has(docId)) {
          documentMap.set(docId, {
            id: docId,
            name: metadata.file_name || 'Untitled',
            file_type: this.getFileTypeFromName(metadata.file_name || ''),
            status: 'ready',
            sections: [],
            pageCount: 0,
          });
        }

        const doc = documentMap.get(docId)!;
        doc.sections.push(section);

        // Track max page number
        if (metadata.page > doc.pageCount) {
          doc.pageCount = metadata.page;
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
}

// Export singleton instance
const documentSectionService = new DocumentSectionService();
export default documentSectionService;
