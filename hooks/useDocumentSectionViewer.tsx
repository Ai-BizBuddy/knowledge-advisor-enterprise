'use client';

import type {
    DocumentSection,
    DocumentSectionMetadata,
    DocumentWithSections,
    OCRViewerState,
} from '@/interfaces/DocumentSection';
import documentSectionService from '@/services/DocumentSectionService';
import { useCallback, useEffect, useState } from 'react';

interface UseDocumentSectionViewerOptions {
  initialDocumentId?: string;
  initialSectionId?: string;
  knowledgeBaseId?: string;
}

interface UseDocumentSectionViewerReturn extends OCRViewerState {
  // Actions
  loadDocuments: () => Promise<void>;
  loadDocumentSections: (documentId: string) => Promise<void>;
  selectSection: (sectionId: string) => Promise<void>;
  toggleDocumentExpanded: (documentId: string) => void;
  clearSelection: () => void;
  // Computed
  currentMetadata: DocumentSectionMetadata | null;
  currentImages: { id: string; base64: string }[];
  currentPage: number;
  currentDocumentName: string;
}

export function useDocumentSectionViewer(
  options: UseDocumentSectionViewerOptions = {},
): UseDocumentSectionViewerReturn {
  const { initialDocumentId, initialSectionId, knowledgeBaseId } = options;

  const [documents, setDocuments] = useState<DocumentWithSections[]>([]);
  const [currentSection, setCurrentSection] = useState<DocumentSection | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
    initialDocumentId || null,
  );
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(
    new Set(initialDocumentId ? [initialDocumentId] : []),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all documents with sections
   */
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const docs = await documentSectionService.getDocumentsWithSections(knowledgeBaseId);
      setDocuments(docs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMessage);
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [knowledgeBaseId]);

  /**
   * Load sections for a specific document
   */
  const loadDocumentSections = useCallback(async (documentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const sections = await documentSectionService.getDocumentSectionsByDocumentId(documentId);
      
      // Update the document in our list with the fetched sections
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId
            ? { ...doc, sections }
            : doc,
        ),
      );

      // Expand the document in sidebar
      setExpandedDocuments((prev) => new Set([...prev, documentId]));
      setCurrentDocumentId(documentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document sections';
      setError(errorMessage);
      console.error('Error loading document sections:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Select a specific section
   */
  const selectSection = useCallback(async (sectionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const section = await documentSectionService.getDocumentSectionById(sectionId);
      
      if (section) {
        setCurrentSection(section);

        // Update current document ID from metadata
        const metadata = section.metadata as DocumentSectionMetadata | null;
        if (metadata?.document_id) {
          setCurrentDocumentId(metadata.document_id);
          setExpandedDocuments((prev) => new Set([...prev, metadata.document_id]));
        }
      } else {
        setError('Section not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load section';
      setError(errorMessage);
      console.error('Error loading section:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Toggle document expanded state in sidebar
   */
  const toggleDocumentExpanded = useCallback((documentId: string) => {
    setExpandedDocuments((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      return next;
    });
  }, []);

  /**
   * Clear current selection
   */
  const clearSelection = useCallback(() => {
    setCurrentSection(null);
    setCurrentDocumentId(null);
  }, []);

  // Computed values
  const currentMetadata = currentSection?.metadata as DocumentSectionMetadata | null;
  const currentImages = currentMetadata?.images || [];
  const currentPage = currentMetadata?.page || 0;
  const currentDocumentName = currentMetadata?.file_name || '';

  // Initial load
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Load initial section if provided
  useEffect(() => {
    if (initialSectionId) {
      selectSection(initialSectionId);
    }
  }, [initialSectionId, selectSection]);

  return {
    // State
    documents,
    currentSection,
    currentDocumentId,
    expandedDocuments,
    isLoading,
    error,
    // Actions
    loadDocuments,
    loadDocumentSections,
    selectSection,
    toggleDocumentExpanded,
    clearSelection,
    // Computed
    currentMetadata,
    currentImages,
    currentPage,
    currentDocumentName,
  };
}
