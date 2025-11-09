/**
 * Document Viewer Service - Handle document preview for chat links
 *
 * This service provides functionality to fetch document data and generate
 * signed URLs for secure document viewing in modals
 */

import type { DeepSearchData } from '@/interfaces/DeepSearchTypes';
import type { Document } from '@/interfaces/Project';
import DocumentService from '@/services/DocumentService';
import { createClient } from '@/utils/supabase/client';

class DocumentViewerService {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  /**
   * Extract document ID from various URL formats
   * Supports: /documents/[id], document-id-[uuid], or direct UUID
   */
  private extractDocumentId(url: string): string | null {
    // Try to extract UUID pattern (8-4-4-4-12 format)
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = url.match(uuidRegex);
    return match ? match[0] : null;
  }

  /**
   * Check if URL is a document link that should open in viewer
   */
  isDocumentLink(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    // Trim whitespace
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return false;
    
    // Check for common document patterns
    const documentPatterns = [
      // Path-based patterns
      /^\/documents\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,  // /documents/uuid (exact match)
      /document-id-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,     // document-id-uuid
      
      // UUID only (exact match) - this is the most common case for chat document links
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      
      // File extension based patterns
      /\.pdf$/i,                         // PDF files
      /\.docx?$/i,                       // Word documents
      /\.xlsx?$/i,                       // Excel files
      /\.txt$/i,                         // Text files
      /\.md$/i,                          // Markdown files
      /\.pptx?$/i,                       // PowerPoint files
    ];

    return documentPatterns.some(pattern => pattern.test(trimmedUrl));
  }

  /**
   * Fetch document data for viewer
   */
  async getDocumentForViewer(url: string, pageNumber?: number): Promise<DeepSearchData | null> {
    try {
      const documentId = this.extractDocumentId(url);
      if (!documentId) {
        // If no ID found, check if it's already a file URL
        if (this.isFileUrl(url)) {
          return this.createViewerDataFromUrl(url, pageNumber);
        }
        return null;
      }

      // Fetch document from database
      const document = await this.documentService.getUserDocument(documentId);
      if (!document) {
        return null;
      }

      // Convert to viewer format
      return this.convertDocumentToViewerData(document, pageNumber);
    } catch (error) {
      console.error('Error fetching document for viewer:', error);
      return null;
    }
  }

  /**
   * Check if URL is already a file URL (Supabase signed URL or similar)
   */
  private isFileUrl(url: string): boolean {
    return url.includes('supabase') || 
           url.includes('storage') || 
           url.startsWith('data:') ||
           url.includes('blob:');
  }

  /**
   * Create viewer data from direct file URL
   */
  private createViewerDataFromUrl(url: string, pageNumber?: number): DeepSearchData {
    // Extract filename from URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1] || 'document';
    const fileType = filename.split('.').pop()?.toLowerCase() || 'unknown';

    return {
      id: 'external-' + Date.now(),
      name: filename,
      content: '', // External files don't have content preview
      fileType: fileType,
      fileUrl: url,
      fileSize: 'Unknown',
      uploadDate: new Date().toLocaleDateString(),
      knowledgeName: 'External File',
      pageNumber,
    };
  }

  /**
   * Convert Document to DeepSearchData
   */
  private convertDocumentToViewerData(document: Document, pageNumber?: number): DeepSearchData {
    return {
      id: document.id,
      name: document.name,
      fileType: document.file_type,
      fileUrl: document.url,
      fileSize: document.file_size 
        ? `${(document.file_size / 1024 / 1024).toFixed(1)} MB`
        : 'Unknown',
      content: document.content || '', // Ensure content is never undefined
      knowledgeName: typeof document.metadata?.project_name === 'string' 
        ? document.metadata.project_name 
        : 'Knowledge Base',
      uploadDate: new Date(document.created_at).toLocaleDateString(),
      pageNumber,
    };
  }

  /**
   * Refresh signed URL if needed (for expired URLs)
   */
  async refreshSignedUrl(documentId: string, knowledgeBaseId: string): Promise<string | null> {
    try {
      const supabaseClient = createClient();
      
      // Get the document path from metadata or construct it
      const filePath = `documents/${documentId}`;
      
      const { data: urlData } = await supabaseClient.storage
        .from(knowledgeBaseId)
        .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours
      
      return urlData?.signedUrl || null;
    } catch (error) {
      console.error('Error refreshing signed URL:', error);
      return null;
    }
  }
}

// Export singleton instance
export const documentViewerService = new DocumentViewerService();
export default documentViewerService;
