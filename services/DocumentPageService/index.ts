import { createClient, createClientTable } from '@/utils/supabase/client';
import type { TypedResponse } from '../../interfaces/ApiTypes';
import type { DocumentPage, DocumentPageListResult, DocumentPageMapResult, DocumentPageSummary } from '../../interfaces/DocumentPage';
import type { BBoxEntry } from '../../interfaces/DocumentSection';

const PAGE_SIZE = 10;

export const DocumentPageService = {
  /**
   * Lightweight paginated list — fetches only id, document_id, page_number, page_count, created_at, knowledge_base_id.
   * Does NOT include the heavy `content` column. Use this for sidebar listings.
   */
  async getPageListByDocumentId(
    documentId: string,
    page = 1,
    pageSize = PAGE_SIZE,
  ): Promise<TypedResponse<DocumentPageListResult>> {
    const supabase = createClientTable();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('document_page')
      .select('id, document_id, page_number, page_count, created_at, knowledge_base_id', { count: 'exact' })
      .eq('document_id', documentId)
      .order('page_number', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error fetching document page list:', error);
      return { success: false, error: error.message };
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      success: true,
      data: {
        pages: data as DocumentPageSummary[],
        total,
        totalPages,
        currentPage: page,
      },
    };
  },

  /**
   * Bulk-load lightweight page lists for ALL documents in a knowledge base.
   * Returns a Map keyed by document_id for easy lookup.
   * Fetches up to PAGE_SIZE rows per document on the first page.
   */
  async getPageListByKnowledgeBaseId(
    knowledgeBaseId: string,
    page = 1,
    pageSize = PAGE_SIZE,
  ): Promise<TypedResponse<Map<string, DocumentPageSummary[]>>> {
    const supabase = createClientTable();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('document_page')
      .select('id, document_id, page_number, page_count, created_at, knowledge_base_id')
      .eq('knowledge_base_id', knowledgeBaseId)
      .order('page_number', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error fetching pages by knowledge base:', error);
      return { success: false, error: error.message };
    }

    const pagesByDoc = new Map<string, DocumentPageSummary[]>();
    for (const row of (data || []) as DocumentPageSummary[]) {
      const list = pagesByDoc.get(row.document_id) || [];
      list.push(row);
      pagesByDoc.set(row.document_id, list);
    }

    return { success: true, data: pagesByDoc };
  },

  /**
   * Lightweight paginated list for a specific document within a knowledge base.
   * Returns pages map AND pagination metadata for the specified document.
   * Use this when you want to load exactly 10 pages for ONE document.
   */
  async getPageListByKnowledgeBaseIdAndDocumentId(
    knowledgeBaseId: string,
    documentId: string,
    page = 1,
    pageSize = PAGE_SIZE,
  ): Promise<TypedResponse<DocumentPageMapResult>> {
    const supabase = createClientTable();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('document_page')
      .select('id, document_id, page_number, page_count, created_at, knowledge_base_id', { count: 'exact' })
      .eq('knowledge_base_id', knowledgeBaseId)
      .eq('document_id', documentId)
      .order('page_number', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error fetching pages by knowledge base and document:', error);
      return { success: false, error: error.message };
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const pagesByDoc = new Map<string, DocumentPageSummary[]>();
    const paginationMap = new Map<string, { total: number; totalPages: number; currentPage: number }>();

    const list: DocumentPageSummary[] = [];
    for (const row of (data || []) as DocumentPageSummary[]) {
      list.push(row);
    }
    pagesByDoc.set(documentId, list);
    paginationMap.set(documentId, { total, totalPages, currentPage: page });

    return { success: true, data: { pages: pagesByDoc, pagination: paginationMap } };
  },

  /**
   * Full fetch — includes `content` (base64 image data). Use when a page is selected.
   */
  async getPagesByDocumentId(documentId: string): Promise<TypedResponse<DocumentPage[]>> {
    const supabase = createClientTable();
    const { data, error } = await supabase
      .from('document_page')
      .select('*')
      .eq('document_id', documentId)
      .order('page_number', { ascending: true })
      .limit(5000);

    if (error) {
      console.error('Error fetching document pages:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as DocumentPage[] };
  },

  async getPage(documentId: string, pageNumber: number): Promise<TypedResponse<DocumentPage>> {
    const supabase = createClientTable();
    const { data, error } = await supabase
      .from('document_page')
      .select('*')
      .eq('document_id', documentId)
      .eq('page_number', pageNumber)
      .single();

    if (error) {
      console.error('Error fetching document page:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as DocumentPage };
  },

  async updatePageContent(pageId: string, content: string): Promise<TypedResponse<void>> {
    const supabase = createClientTable();
    const { data, error } = await supabase
      .from('document_page')
      .update({ content })
      .eq('id', pageId)
      .select('id');

    if (error) {
      console.error('Error updating document page content:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Update failed: row not found or access denied' };
    }

    return { success: true };
  },

  /** Update the page-level bounding boxes stored in `document_page.bbox`. */
  async updatePageBBox(pageId: string, bbox: BBoxEntry[]): Promise<TypedResponse<void>> {
    const supabase = createClientTable();
    const { data, error } = await supabase
      .from('document_page')
      .update({ bbox })
      .eq('id', pageId)
      .select('id');

    if (error) {
      console.error('Error updating document page bbox:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      console.error('Page bbox update matched 0 rows — likely blocked by RLS policy');
      return { success: false, error: 'Update failed: row not found or access denied' };
    }

    return { success: true };
  },

  getPageImageUrl(knowledgeBaseId: string, documentId: string, pageNumber: number): string {
    const supabase = createClient();
    // Path format: [document_id]/pages/[page_number].png
    // The bucket is the knowledge_base_id
    const path = `${documentId}/pages/${pageNumber}.png`;
    const { data } = supabase.storage.from(knowledgeBaseId).getPublicUrl(path);
    return data.publicUrl;
  }
};
